#!/usr/bin/env node
// docs: read and write a Markdown documentation library from any agent shell. Node stdlib only.
import fs from "node:fs";
import path from "node:path";
import {
  resolveRoot,
  scan,
  sortDocs,
  writeIndex,
  allTopics,
  hasTopic,
  slugify,
  normTopic,
  formatFrontMatter,
  INDEX_JSON,
  INDEX_MD,
  CHECKOUT,
} from "../lib/library.mjs";

const VERSION = "0.2.0";
const HELP = `docs ${VERSION}: a Markdown documentation library for people and agents

usage: docs <command> [args] [--root DIR]

  info                              library folder, doc and topic counts
  list [topic] [--json]             one line per doc: id · title · topics · summary
  topics                            every topic with its doc count
  search <words...> [-n N]          docs holding all the words, best first, with the matching line
  get <id|path|slug> [--body]       print a doc (--body: without front matter)
  new <topic> <title> [options]     create a doc with front matter, print its path
        --tags a,b  --summary "..."  --slug name  --stdin (body from stdin)  --force
  index                             rebuild index.json and INDEX.md, warn about broken links and private data
  bundle <topic|id...> [-o FILE]    join docs into one Markdown file (for a web chat), stdout by default
        --title "..."

The library is DOCS_ROOT, else --root, else the checkout's content/ folder.
Exit codes: 0 ok · 1 invalid request · 2 not found · 4 nothing matched.`;

class CliError extends Error {
  constructor(message, code = 1, hint = "") {
    super(message);
    this.code = code;
    this.hint = hint;
  }
}

function parseArgs(argv) {
  const pos = [];
  const opt = {};
  const valued = new Set(["root", "tags", "summary", "slug", "title", "o", "out", "n", "limit"]);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--") {
      pos.push(...argv.slice(i + 1));
      break;
    }
    const m = /^--?([\w-]+)(?:=(.*))?$/.exec(a);
    if (m && !/^-\d/.test(a)) {
      const key = m[1];
      if (m[2] !== undefined) opt[key] = m[2];
      else if (valued.has(key)) {
        if (i + 1 >= argv.length) throw new CliError(`--${key} needs a value`);
        opt[key] = argv[++i];
      } else opt[key] = true;
    } else pos.push(a);
  }
  return { pos, opt };
}

function library(opt, { mustExist = true } = {}) {
  const root = resolveRoot(opt.root);
  if (mustExist && !fs.existsSync(root)) {
    throw new CliError(`no library at ${root}`, 2, 'create the first doc with: docs new <topic> "<title>" (or set DOCS_ROOT)');
  }
  return root;
}

function loadDocs(root) {
  const { docs, config } = scan(root);
  return { docs: sortDocs(docs, config), config };
}

function findDoc(docs, ref) {
  const r = ref.replace(/^\.\//, "").replace(/\\/g, "/");
  const id = r.replace(/\.md$/i, "");
  const exact = docs.find((d) => d.id === id || d.path === r);
  if (exact) return exact;
  const bySlug = docs.filter((d) => d.slug === slugify(id.split("/").pop()) && (id.includes("/") ? d.id.endsWith(id) : true));
  if (bySlug.length === 1) return bySlug[0];
  if (bySlug.length > 1) throw new CliError(`"${ref}" matches ${bySlug.length} docs`, 1, `use the full id: ${bySlug.map((d) => d.id).join(" · ")}`);
  const words = id.toLowerCase().split(/[\s/_-]+/).filter(Boolean);
  const close = docs
    .map((d) => [d, words.filter((w) => d.id.includes(w) || d.title.toLowerCase().includes(w)).length])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([d]) => d.id);
  throw new CliError(`no doc "${ref}"`, 2, close.length ? `close: ${close.join(" · ")}` : "docs list  (or docs search <words>)");
}

const line = (d) => `${d.id} · ${d.title} · [${d.topics.join(", ")}]${d.summary ? ` · ${d.summary}` : ""}`;

// ---------------------------------------------------------------- commands

function cmdInfo(pos, opt) {
  const root = library(opt, { mustExist: false });
  if (!fs.existsSync(root)) {
    console.log(`library: ${root} (not created yet)\nhint: docs new <topic> "<title>"`);
    return 0;
  }
  const { docs, config } = loadDocs(root);
  const words = docs.reduce((s, d) => s + d.words, 0);
  const idx = path.join(root, INDEX_JSON);
  const built = fs.existsSync(idx) ? fs.statSync(idx).mtime.toISOString().slice(0, 16).replace("T", " ") : "never (run docs index)";
  console.log(
    [
      `library: ${root}`,
      `title: ${config.title || "Docs"}`,
      `docs: ${docs.length} · topics: ${allTopics(docs).length} · words: ${words}`,
      `index: ${INDEX_MD} and ${INDEX_JSON}, built ${built}`,
      `viewer: npm run dev (in ${CHECKOUT}), then open the printed address`,
    ].join("\n"),
  );
  return 0;
}

function cmdList(pos, opt) {
  const root = library(opt);
  let { docs } = loadDocs(root);
  if (pos[0]) docs = docs.filter((d) => hasTopic(d, pos[0]));
  if (!docs.length) throw new CliError(pos[0] ? `no docs under topic "${pos[0]}"` : "the library is empty", 4, "docs topics");
  if (opt.json) {
    console.log(JSON.stringify(docs.map(({ id, path: p, title, topics, tags, summary, updated }) => ({ id, path: p, title, topics, tags, summary, updated })), null, 1));
  } else for (const d of docs) console.log(line(d));
  return 0;
}

function cmdTopics(pos, opt) {
  const root = library(opt);
  const { docs } = loadDocs(root);
  const topics = allTopics(docs);
  if (!topics.length) throw new CliError("the library is empty", 4);
  for (const [t, n] of topics) console.log(`${"  ".repeat(t.split("/").length - 1)}${t} (${n})`);
  return 0;
}

function cmdSearch(pos, opt) {
  if (!pos.length) throw new CliError("search needs words", 1, "docs search install token");
  const root = library(opt);
  const { docs } = loadDocs(root);
  const words = pos.join(" ").toLowerCase().split(/\s+/).filter(Boolean);
  const limit = Number(opt.n || opt.limit || 10);
  const hits = [];
  for (const d of docs) {
    const title = d.title.toLowerCase();
    const tags = d.tags.join(" ");
    const topics = d.topics.join(" ");
    const summary = d.summary.toLowerCase();
    const body = d.body.toLowerCase();
    let score = 0;
    let all = true;
    for (const w of words) {
      const inBody = body.split(w).length - 1;
      const s = (title.includes(w) ? 8 : 0) + (tags.includes(w) ? 5 : 0) + (topics.includes(w) ? 4 : 0) + (summary.includes(w) ? 3 : 0) + Math.min(inBody, 20);
      if (!s) {
        all = false;
        break;
      }
      score += s;
    }
    if (!all) continue;
    const lines = d.body.split(/\r?\n/);
    const best = lines.find((l) => words.every((w) => l.toLowerCase().includes(w))) || lines.find((l) => words.some((w) => l.toLowerCase().includes(w))) || "";
    hits.push({ d, score, snippet: best.trim().replace(/\s+/g, " ").slice(0, 160) });
  }
  if (!hits.length) throw new CliError(`nothing holds all of: ${words.join(" ")}`, 4, "fewer words, or docs topics");
  hits.sort((a, b) => b.score - a.score);
  for (const h of hits.slice(0, limit)) {
    console.log(`${h.d.id} · ${h.d.title} · score ${h.score}`);
    if (h.snippet) console.log(`    ${h.snippet}`);
  }
  if (hits.length > limit) console.log(`(${hits.length - limit} more; -n ${hits.length} for all)`);
  return 0;
}

function cmdGet(pos, opt) {
  if (!pos.length) throw new CliError("get needs an id, path or slug", 1, "docs list");
  const root = library(opt);
  const { docs } = loadDocs(root);
  const out = [];
  for (const ref of pos) {
    const d = findDoc(docs, ref);
    out.push(opt.body ? `# ${d.title}\n\n${d.body.trim()}\n` : fs.readFileSync(path.join(root, d.path), "utf8"));
  }
  process.stdout.write(out.join("\n\n"));
  return 0;
}

function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function cmdNew(pos, opt) {
  if (pos.length < 2) throw new CliError("new needs a topic and a title", 1, 'docs new guide "Release notes" --tags release --summary "..."');
  const root = library(opt, { mustExist: false });
  const topic = normTopic(pos[0]);
  if (!topic) throw new CliError(`bad topic "${pos[0]}"`, 1, "topics are words joined by /, e.g. reference/api");
  const title = pos.slice(1).join(" ").trim();
  const slug = slugify(opt.slug || title);
  if (!slug) throw new CliError(`the title "${title}" gives an empty file name`, 1, "pass --slug name");
  const rel = `${topic}/${slug}.md`;
  const abs = path.join(root, rel);
  if (fs.existsSync(abs) && !opt.force) throw new CliError(`${rel} already exists`, 1, `docs get ${topic}/${slug}  (or --force to overwrite, or --slug another-name)`);
  const tags = typeof opt.tags === "string" ? opt.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean) : [];
  const meta = {
    title,
    topics: [topic],
    tags,
    summary: typeof opt.summary === "string" ? opt.summary : "",
    updated: new Date().toISOString().slice(0, 10),
  };
  const body = opt.stdin ? readStdin().replace(/^\s+/, "") : "Lead paragraph: what this doc holds, in one to three lines.\n\n## First section\n\n";
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, formatFrontMatter(meta) + "\n" + body.trimEnd() + "\n");
  const { warnings } = writeIndex(root);
  console.log(abs);
  for (const w of warnings.filter((w) => w.startsWith(rel))) console.log(`warning: ${w}`);
  return 0;
}

function cmdIndex(pos, opt) {
  const root = library(opt);
  const { count, topics, warnings } = writeIndex(root);
  console.log(`indexed ${count} docs in ${topics} topics → ${path.join(root, INDEX_MD)} · ${INDEX_JSON}`);
  for (const w of warnings) console.log(`warning: ${w}`);
  return 0;
}

function cmdBundle(pos, opt) {
  if (!pos.length) throw new CliError("bundle needs topics or ids", 1, "docs bundle guide reference/api -o bundle.md");
  const root = library(opt);
  const { docs, config } = loadDocs(root);
  const picked = [];
  const seen = new Set();
  for (const ref of pos) {
    let matched = docs.filter((d) => hasTopic(d, ref));
    if (!matched.length) matched = [findDoc(docs, ref)];
    for (const d of matched) {
      if (seen.has(d.id)) continue;
      seen.add(d.id);
      picked.push(d);
    }
  }
  const title = typeof opt.title === "string" ? opt.title : `${config.title || "Docs"}: ${pos.join(", ")}`;
  const parts = [
    `# ${title}`,
    "",
    `${picked.length} documents, joined ${new Date().toISOString().slice(0, 10)}. Each one starts with a level-1 heading; its topics and summary follow the heading.`,
    "",
    "## Contents",
    "",
    ...picked.map((d, i) => `${i + 1}. ${d.title} (${d.topics.join(", ")})`),
  ];
  for (const d of picked) {
    const body = d.body.trim().replace(/^#\s+.+\r?\n+/, "");
    parts.push("", "---", "", `# ${d.title}`, "", `Topics: ${d.topics.join(", ")}${d.tags.length ? ` · tags: ${d.tags.join(", ")}` : ""}${d.summary ? `\n\n${d.summary}` : ""}`, "", body);
  }
  const text = parts.join("\n") + "\n";
  const out = opt.o || opt.out;
  if (typeof out === "string") {
    fs.writeFileSync(out, text);
    const words = text.split(/\s+/).filter(Boolean).length;
    console.log(`${out} · ${picked.length} docs · ${words} words · about ${Math.round((text.length / 4) / 1000)}k tokens`);
  } else process.stdout.write(text);
  return 0;
}

const COMMANDS = { info: cmdInfo, list: cmdList, ls: cmdList, topics: cmdTopics, search: cmdSearch, get: cmdGet, new: cmdNew, index: cmdIndex, bundle: cmdBundle };

function main(argv) {
  const [cmd, ...rest] = argv;
  if (!cmd || cmd === "help" || cmd === "-h" || cmd === "--help") {
    console.log(HELP);
    return 0;
  }
  if (cmd === "--version" || cmd === "version") {
    console.log(VERSION);
    return 0;
  }
  const fn = COMMANDS[cmd];
  try {
    if (!fn) throw new CliError(`unknown command "${cmd}"`, 1, "docs help");
    const { pos, opt } = parseArgs(rest);
    return fn(pos, opt);
  } catch (e) {
    if (!(e instanceof CliError)) throw e;
    console.error(`error: ${e.message}`);
    if (e.hint) console.error(`hint: ${e.hint}`);
    return e.code;
  }
}

process.exitCode = main(process.argv.slice(2));
