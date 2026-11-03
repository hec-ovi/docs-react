import { useEffect, useState, useSyncExternalStore } from "react";
import { parseFrontMatter, slugify, topicLabel } from "../lib/frontmatter.mjs";

export const CONTENT = "./content/";
const docCache = new Map();

async function loadIndex() {
  const res = await fetch(`${CONTENT}index.json`, { cache: "no-cache" });
  if (!res.ok) throw new Error(`index.json: HTTP ${res.status}`);
  return res.json();
}

// Start the index request while React boots; later reloads fetch again.
let early = loadIndex();
early.catch(() => {});

export function fetchIndex() {
  const p = early || loadIndex();
  early = null;
  return p;
}

export async function fetchDoc(path) {
  if (docCache.has(path)) return docCache.get(path);
  const res = await fetch(CONTENT + path.split("/").map(encodeURIComponent).join("/"), { cache: "no-cache" });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  const text = await res.text();
  const { meta, body } = parseFrontMatter(text);
  const doc = { text, meta, body };
  docCache.set(path, doc);
  return doc;
}

/** Load the index once; reload it (and drop cached docs) when the dev server reports a change. */
export function useIndex() {
  const [state, setState] = useState({ index: null, error: "" });
  useEffect(() => {
    let alive = true;
    const load = () =>
      fetchIndex()
        .then((index) => alive && setState({ index, error: "" }))
        .catch((e) => alive && setState({ index: null, error: e.message }));
    load();
    if (import.meta.hot) {
      import.meta.hot.on("docs:changed", ({ file }) => {
        docCache.delete(file);
        load();
      });
    }
    return () => {
      alive = false;
    };
  }, []);
  return state;
}

// ---------------------------------------------------------------- hash routing: #/<doc id>#<heading>

const subscribe = (fn) => {
  window.addEventListener("hashchange", fn);
  return () => window.removeEventListener("hashchange", fn);
};
const readHash = () => window.location.hash;

export function useRoute() {
  const hash = useSyncExternalStore(subscribe, readHash);
  const raw = decodeURIComponent(hash.replace(/^#\/?/, ""));
  const cut = raw.indexOf("#");
  return { id: cut === -1 ? raw : raw.slice(0, cut), anchor: cut === -1 ? "" : raw.slice(cut + 1) };
}

export const docHref = (id, anchor) => `#/${id}${anchor ? `#${anchor}` : ""}`;

// ---------------------------------------------------------------- helpers shared by the pages

export const headingId = (text) => slugify(text) || "section";

/** `##` and `###` headings outside code fences, for the "On this page" column. */
export function outline(body) {
  const out = [];
  let fence = false;
  for (const line of body.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence;
    if (fence) continue;
    const m = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (m) out.push({ depth: m[1].length, text: m[2].replace(/[*_`]/g, ""), id: headingId(m[2].replace(/[*_`]/g, "")) });
  }
  return out;
}

/** Resolve a relative link inside the doc at `fromPath` to a library path. */
export function resolvePath(fromPath, href) {
  const parts = fromPath.split("/").slice(0, -1);
  for (const seg of href.split("/")) {
    if (seg === "..") parts.pop();
    else if (seg && seg !== ".") parts.push(seg);
  }
  return parts.join("/");
}

export { topicLabel };
