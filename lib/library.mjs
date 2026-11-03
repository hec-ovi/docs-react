// Shared by the docs CLI and the Vite plugin: find the library, parse front matter, build the index.
// Node stdlib only.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseFrontMatter, asList, topicLabel, normTopic } from "./frontmatter.mjs";

export { parseFrontMatter, formatFrontMatter, slugify, topicLabel, normTopic } from "./frontmatter.mjs";

export const CHECKOUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const EXAMPLE_ROOT = path.join(CHECKOUT, "example");
export const DEFAULT_ROOT = path.join(CHECKOUT, "content");
export const INDEX_JSON = "index.json";
export const INDEX_MD = "INDEX.md";
export const CONFIG = "docs.config.json";

const SKIP_DIRS = new Set(["node_modules", ".git"]);
const SKIP_FILES = new Set([INDEX_MD.toLowerCase()]);

/** Library root: explicit value, else DOCS_ROOT, else <checkout>/content. */
export function resolveRoot(explicit) {
  const value = explicit || process.env.DOCS_ROOT;
  if (!value) return DEFAULT_ROOT;
  return path.resolve(value);
}

// ---------------------------------------------------------------- scan and index helpers

function firstHeading(body) {
  const m = /^#\s+(.+)$/m.exec(body);
  return m ? m[1].trim() : "";
}

function firstParagraph(body) {
  for (const block of body.split(/\r?\n\s*\r?\n/)) {
    const t = block.trim();
    if (!t || /^(#|```|\||>|-|\*|\d+\.|!\[)/.test(t)) continue;
    return t.replace(/\s+/g, " ").replace(/[*_`]/g, "").slice(0, 160);
  }
  return "";
}

export function readConfig(root) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, CONFIG), "utf8"));
  } catch {
    return {};
  }
}

function walk(dir, rel = "", out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name.startsWith(".") || SKIP_DIRS.has(e.name)) continue;
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) walk(path.join(dir, e.name), r, out);
    else if (e.isFile() && e.name.toLowerCase().endsWith(".md") && !(rel === "" && SKIP_FILES.has(e.name.toLowerCase()))) out.push(r);
  }
  return out;
}

// ---------------------------------------------------------------- scan and index

/** Read every doc under root. Returns { docs, config }. Each doc carries its body for search and bundles. */
export function scan(root) {
  const config = readConfig(root);
  const docs = [];
  for (const rel of walk(root).sort()) {
    const abs = path.join(root, rel);
    const text = fs.readFileSync(abs, "utf8");
    const { meta, body } = parseFrontMatter(text);
    const id = rel.replace(/\.md$/i, "");
    const dir = path.posix.dirname(rel);
    let topics = asList(meta.topics ?? meta.topic).map(normTopic).filter(Boolean);
    if (!topics.length) topics = [dir === "." ? "general" : normTopic(dir)];
    const stat = fs.statSync(abs);
    docs.push({
      id,
      path: rel,
      slug: path.posix.basename(id),
      title: String(meta.title || firstHeading(body) || path.posix.basename(id).replace(/[-_]+/g, " ")),
      topics,
      tags: asList(meta.tags).map((t) => t.toLowerCase()),
      summary: String(meta.summary || firstParagraph(body)),
      updated: String(meta.updated || stat.mtime.toISOString().slice(0, 10)),
      order: typeof meta.order === "number" ? meta.order : null,
      words: body.split(/\s+/).filter(Boolean).length,
      meta,
      body,
    });
  }
  return { docs, config };
}

function topicRank(topic, order) {
  const top = topic.split("/")[0];
  const i = order.indexOf(topic);
  const j = order.indexOf(top);
  return [j === -1 ? order.length : j, i === -1 ? order.length : i];
}

export function sortDocs(docs, config = {}) {
  const order = config.topicOrder || [];
  return [...docs].sort((a, b) => {
    const [a1, a2] = topicRank(a.topics[0], order);
    const [b1, b2] = topicRank(b.topics[0], order);
    return (
      a1 - b1 ||
      a.topics[0].split("/")[0].localeCompare(b.topics[0].split("/")[0]) ||
      a2 - b2 ||
      a.topics[0].localeCompare(b.topics[0]) ||
      (a.order ?? 1e9) - (b.order ?? 1e9) ||
      a.title.localeCompare(b.title)
    );
  });
}

/** Navigation tree from each doc's primary (first) topic. */
export function buildTree(docs, config = {}) {
  const labels = config.topicLabels || {};
  const rootNode = { topic: "", label: "", docs: [], children: [] };
  const nodes = new Map([["", rootNode]]);
  const node = (topic) => {
    if (nodes.has(topic)) return nodes.get(topic);
    const parent = node(topic.includes("/") ? topic.slice(0, topic.lastIndexOf("/")) : "");
    const n = { topic, label: topicLabel(topic, labels), docs: [], children: [] };
    parent.children.push(n);
    nodes.set(topic, n);
    return n;
  };
  for (const d of sortDocs(docs, config)) node(d.topics[0]).docs.push(d.id);
  const count = (n) => (n.count = n.docs.length + n.children.reduce((s, c) => s + count(c), 0));
  count(rootNode);
  return rootNode.children;
}

export function allTopics(docs) {
  const counts = new Map();
  for (const d of docs) {
    const seen = new Set();
    for (const t of d.topics) {
      const parts = t.split("/");
      for (let i = 1; i <= parts.length; i++) seen.add(parts.slice(0, i).join("/"));
    }
    for (const t of seen) counts.set(t, (counts.get(t) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

/** True when the doc carries the topic (or a sub-topic of it). */
export function hasTopic(doc, topic) {
  const t = normTopic(topic);
  return doc.topics.some((x) => x === t || x.startsWith(t + "/"));
}

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}/;
const HOME_PATH = /(?:^|[\s(`'"=])\/(?:home|Users)\/[A-Za-z0-9_.-]+/;

/** Problems an agent should fix: missing fields, duplicates, and private data that must not be in a doc. */
export function lint(docs) {
  const warnings = [];
  const slugs = new Map();
  for (const d of docs) {
    if (!d.meta.title) warnings.push(`${d.path}: no title in front matter`);
    if (!d.meta.topics && !d.meta.topic) warnings.push(`${d.path}: no topics in front matter (filed under ${d.topics[0]})`);
    if (!d.meta.summary) warnings.push(`${d.path}: no summary in front matter`);
    else if (String(d.meta.summary).length > 200) warnings.push(`${d.path}: summary over 200 characters`);
    const text = d.body;
    const e = EMAIL.exec(text);
    if (e && !/example\.(com|org)$/i.test(e[0])) warnings.push(`${d.path}: holds an email address (${e[0]})`);
    if (HOME_PATH.test(text)) warnings.push(`${d.path}: holds a home-directory path`);
    slugs.set(d.slug, [...(slugs.get(d.slug) || []), d.path]);
  }
  for (const [slug, paths] of slugs) if (paths.length > 1) warnings.push(`slug "${slug}" is not unique: ${paths.join(", ")} (use the full id)`);
  return warnings;
}

/** Write index.json and INDEX.md into root. Returns { count, topics, warnings }. */
export function writeIndex(root) {
  const { docs, config } = scan(root);
  const sorted = sortDocs(docs, config);
  const title = config.title || "Docs";
  const generated = new Date().toISOString();
  const index = {
    title,
    generated,
    count: sorted.length,
    tree: buildTree(sorted, config),
    docs: sorted.map(({ id, path: p, title: t, topics, tags, summary, updated, words }) => ({
      id,
      path: p,
      title: t,
      topics,
      tags,
      summary,
      updated,
      words,
    })),
  };
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(path.join(root, INDEX_JSON), JSON.stringify(index) + "\n");

  const labels = config.topicLabels || {};
  const lines = [
    `# ${title}: index`,
    "",
    `${sorted.length} docs, generated ${generated.slice(0, 10)} by \`docs index\`. Each line: title, path, topics, summary.`,
    "Read one with `docs get <id>` (the id is the path without `.md`) or open the path under this folder.",
    "",
  ];
  let current = null;
  for (const d of sorted) {
    const t = d.topics[0];
    if (t !== current) {
      lines.push("", `## ${t} (${topicLabel(t, labels)})`, "");
      current = t;
    }
    const also = d.topics.slice(1);
    lines.push(`- **${d.title}** · \`${d.path}\`${also.length ? ` · also: ${also.join(", ")}` : ""} · ${d.summary || "(no summary)"}`);
  }
  fs.writeFileSync(path.join(root, INDEX_MD), lines.join("\n").replace(/\n{3,}/g, "\n\n") + "\n");
  return { count: sorted.length, topics: allTopics(sorted).length, warnings: lint(sorted) };
}
