// Front matter, slugs and topic labels: pure functions shared by the CLI, the Vite plugin and the viewer.

function parseScalar(raw) {
  const v = raw.trim();
  if (v === "") return "";
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1).replace(/\\"/g, '"');
  }
  if (v.startsWith("[") && v.endsWith("]")) return splitList(v.slice(1, -1));
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  if (v === "true" || v === "false") return v === "true";
  return v;
}

function splitList(inner) {
  const out = [];
  let cur = "";
  let quote = null;
  for (const ch of inner) {
    if (quote) {
      if (ch === quote) quote = null;
      else cur += ch;
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === ",") {
      if (cur.trim()) out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** Split a Markdown file into { meta, body }. Supports `key: value`, `key: [a, b]` and `- item` lists. */
export function parseFrontMatter(text) {
  const src = text.replace(/^\uFEFF/, "");
  const m = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(src);
  if (!m) return { meta: {}, body: src };
  const meta = {};
  let listKey = null;
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const item = /^\s+-\s+(.*)$/.exec(line);
    if (item && listKey) {
      meta[listKey].push(parseScalar(item[1]));
      continue;
    }
    const kv = /^([A-Za-z_][\w-]*)\s*:\s*(.*)$/.exec(line);
    if (!kv) continue;
    const [, key, value] = kv;
    if (value.trim() === "") {
      meta[key] = [];
      listKey = key;
    } else {
      meta[key] = parseScalar(value);
      listKey = null;
    }
  }
  return { meta, body: src.slice(m[0].length) };
}

export const asList = (v) => (v == null || v === "" ? [] : Array.isArray(v) ? v.map(String) : [String(v)]);

/** Front matter block for a new doc. */
export function formatFrontMatter(meta) {
  const q = (s) => (/[:#[\],]|^\s|\s$|^["']/.test(s) ? JSON.stringify(s) : s);
  const lines = ["---"];
  for (const [k, v] of Object.entries(meta)) {
    if (Array.isArray(v)) lines.push(`${k}: [${v.map(q).join(", ")}]`);
    else lines.push(`${k}: ${q(String(v))}`);
  }
  lines.push("---", "");
  return lines.join("\n");
}

export function slugify(s) {
  return String(s)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function topicLabel(topic, labels = {}) {
  if (labels[topic]) return labels[topic];
  const last = topic.split("/").pop();
  const words = last.replace(/[-_]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function normTopic(t) {
  return String(t)
    .split("/")
    .map((p) => slugify(p))
    .filter(Boolean)
    .join("/");
}
