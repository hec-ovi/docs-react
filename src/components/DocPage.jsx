import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Box, Breadcrumbs, Chip, Link, Typography } from "@mui/material";
import { CONTENT, docHref, fetchDoc, outline, topicLabel } from "../data";
const Markdown = lazy(() => import("./Markdown"));

const stripTitle = (body, title) => body.replace(/^\s*#\s+(.+)\r?\n/, (m, h) => (h.trim() === title.trim() ? "" : m));

function Crumbs({ topic, labels }) {
  const parts = topic.split("/");
  return (
    <Breadcrumbs sx={{ fontSize: "0.8rem", mb: 1 }} separator="/">
      <Link href="#/" underline="hover" color="text.secondary">
        Index
      </Link>
      {parts.map((_, i) => (
        <Typography key={i} sx={{ fontSize: "0.8rem" }} color="text.secondary">
          {labels.get(parts.slice(0, i + 1).join("/")) || topicLabel(parts.slice(0, i + 1).join("/"))}
        </Typography>
      ))}
    </Breadcrumbs>
  );
}

export function Toc({ items, anchor, docId }) {
  if (items.length < 3) return null;
  return (
    <Box component="nav" aria-label="On this page" sx={{ position: "sticky", top: 24, maxHeight: "calc(100vh - 48px)", overflowY: "auto", fontSize: "0.82rem" }}>
      <Typography sx={{ fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "text.secondary", mb: 1 }}>On this page</Typography>
      {items.map((h, i) => (
        <Link
          key={`${h.id}-${i}`}
          href={docHref(docId, h.id)}
          underline="hover"
          sx={{ display: "block", pl: h.depth === 3 ? 1.5 : 0, py: 0.3, lineHeight: 1.35, color: h.id === anchor ? "text.primary" : "text.secondary", fontWeight: h.id === anchor ? 600 : 400 }}
        >
          {h.text}
        </Link>
      ))}
    </Box>
  );
}

/** One doc: breadcrumbs, title, summary, chips, the Markdown body. Reports its outline to the layout. */
export function DocPage({ entry, labels, anchor, onOutline }) {
  const [state, setState] = useState({ doc: null, error: "", path: "" });

  useEffect(() => {
    let alive = true;
    setState((s) => (s.path === entry.path ? s : { doc: null, error: "", path: entry.path }));
    fetchDoc(entry.path)
      .then((doc) => alive && setState({ doc, error: "", path: entry.path }))
      .catch((e) => alive && setState({ doc: null, error: e.message, path: entry.path }));
    return () => {
      alive = false;
    };
  }, [entry.path, entry]);

  const body = useMemo(() => (state.doc ? stripTitle(state.doc.body, entry.title) : ""), [state.doc, entry.title]);
  const items = useMemo(() => outline(body), [body]);
  useEffect(() => onOutline(items), [items, onOutline]);

  useEffect(() => {
    if (!state.doc) return;
    if (anchor) document.getElementById(anchor)?.scrollIntoView({ block: "start" });
    else window.scrollTo(0, 0);
  }, [state.doc, anchor]);

  const copy = () => state.doc && navigator.clipboard?.writeText(state.doc.text);

  return (
    <Box component="article">
      <Crumbs topic={entry.topics[0]} labels={labels} />
      <Typography variant="h1" component="h1">
        {entry.title}
      </Typography>
      {entry.summary && (
        <Typography color="text.secondary" sx={{ mt: 1, fontSize: "1.05rem" }}>
          {entry.summary}
        </Typography>
      )}
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.75, mt: 1.5, mb: 3, pb: 2, borderBottom: 1, borderColor: "divider" }}>
        {entry.topics.slice(1).map((t) => (
          <Chip key={t} size="small" variant="outlined" label={t} />
        ))}
        {entry.tags
          .filter((t) => !entry.topics.some((topic) => topic.split("/").includes(t)))
          .map((t) => (
            <Chip key={t} size="small" label={t} />
          ))}
        <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
          {entry.updated} · {entry.words} words ·{" "}
          <Link href={CONTENT + entry.path} target="_blank" rel="noreferrer" color="inherit">
            raw
          </Link>{" "}
          ·{" "}
          <Link component="button" onClick={copy} color="inherit" sx={{ verticalAlign: "baseline", fontSize: "inherit" }}>
            copy md
          </Link>
        </Typography>
      </Box>
      {state.error && <Typography color="error">Could not load {entry.path}: {state.error}</Typography>}
      {state.doc && state.path === entry.path && (
        <Suspense fallback={null}>
          <Markdown body={body} docId={entry.id} docPath={entry.path} />
        </Suspense>
      )}
    </Box>
  );
}
