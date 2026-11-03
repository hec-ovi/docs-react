import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Box, Collapse, IconButton, InputBase, List, ListItemButton, Tooltip, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ExpandMore from "@mui/icons-material/ExpandMore";
import ChevronRight from "@mui/icons-material/ChevronRight";
import DarkMode from "@mui/icons-material/DarkModeOutlined";
import LightMode from "@mui/icons-material/LightModeOutlined";
import Search from "@mui/icons-material/Search";
import MenuBook from "@mui/icons-material/MenuBookOutlined";
import { docHref } from "../data";

const contains = (node, id) => node.docs.includes(id) || node.children.some((c) => contains(c, id));

function TopicNode({ node, depth, byId, current, onPick }) {
  const [open, setOpen] = useState(() => depth === 0 || contains(node, current));
  useEffect(() => {
    if (current && contains(node, current)) setOpen(true);
  }, [current, node]);
  const pad = 1.5 + depth * 1.5;
  return (
    <>
      <ListItemButton onClick={() => setOpen((o) => !o)} sx={{ pl: pad, pr: 1, py: 0.6 }}>
        {open ? <ExpandMore fontSize="small" sx={{ mr: 0.5, opacity: 0.6 }} /> : <ChevronRight fontSize="small" sx={{ mr: 0.5, opacity: 0.6 }} />}
        <Typography sx={{ flex: 1, fontWeight: depth === 0 ? 600 : 500, fontSize: depth === 0 ? "0.95rem" : "0.9rem" }}>{node.label}</Typography>
        <Typography variant="caption" color="text.secondary">
          {node.count}
        </Typography>
      </ListItemButton>
      <Collapse in={open} timeout={120} unmountOnExit>
        <List disablePadding>
          {node.docs.map((id) => (
            <DocLink key={id} doc={byId.get(id)} pad={pad + 2.75} active={id === current} onPick={onPick} />
          ))}
          {node.children.map((c) => (
            <TopicNode key={c.topic} node={c} depth={depth + 1} byId={byId} current={current} onPick={onPick} />
          ))}
        </List>
      </Collapse>
    </>
  );
}

function DocLink({ doc, pad, active, onPick, sub }) {
  const theme = useTheme();
  if (!doc) return null;
  return (
    <ListItemButton
      component="a"
      href={docHref(doc.id)}
      onClick={onPick}
      selected={active}
      sx={{
        pl: pad,
        pr: 1.5,
        py: 0.45,
        borderLeft: `3px solid ${active ? theme.palette.primary.main : "transparent"}`,
        "&.Mui-selected": { bgcolor: theme.palette.action.selected },
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: "0.88rem", lineHeight: 1.35 }}>{doc.title}</Typography>
        {sub && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.3 }} noWrap>
            {sub}
          </Typography>
        )}
      </Box>
    </ListItemButton>
  );
}

/** Search box, topic tree and theme switch. Search runs over the index only: title, summary, tags, topics, id. */
export const Sidebar = memo(function Sidebar({ index, current, dark, onToggleDark, onPick }) {
  const [query, setQuery] = useState("");
  const input = useRef(null);
  const byId = useMemo(() => new Map(index.docs.map((d) => [d.id, d])), [index]);
  const haystack = useMemo(
    () => index.docs.map((d) => [d, `${d.title} ${d.summary} ${d.tags.join(" ")} ${d.topics.join(" ")} ${d.id}`.toLowerCase()]),
    [index],
  );
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const results = words.length ? haystack.filter(([, h]) => words.every((w) => h.includes(w))).map(([d]) => d) : null;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "/" && !/input|textarea/i.test(document.activeElement?.tagName || "")) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, pt: 1.5, pb: 1 }}>
        <MenuBook fontSize="small" />
        <Typography component="a" href="#/" onClick={onPick} sx={{ flex: 1, fontWeight: 700, color: "text.primary", textDecoration: "none" }} noWrap>
          {index.title}
        </Typography>
        <Tooltip title={dark ? "Light mode" : "Dark mode"}>
          <IconButton size="small" onClick={onToggleDark} aria-label="Toggle dark mode">
            {dark ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>
      <Box sx={{ mx: 1.5, mb: 1, px: 1, display: "flex", alignItems: "center", border: 1, borderColor: "divider" }}>
        <Search fontSize="small" sx={{ opacity: 0.6, mr: 0.5 }} />
        <InputBase
          inputRef={input}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && setQuery("")}
          placeholder={`Search ${index.count} docs  ( / )`}
          inputProps={{ "aria-label": "Search docs" }}
          sx={{ flex: 1, fontSize: "0.9rem", py: 0.4 }}
        />
      </Box>
      <Box sx={{ flex: 1, overflowY: "auto", pb: 2 }}>
        {results ? (
          <List disablePadding>
            {results.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1 }}>
                No doc matches.
              </Typography>
            )}
            {results.slice(0, 200).map((d) => (
              <DocLink key={d.id} doc={d} pad={2} active={d.id === current} onPick={onPick} sub={d.topics[0]} />
            ))}
          </List>
        ) : (
          <List disablePadding>
            {index.tree.map((n) => (
              <TopicNode key={n.topic} node={n} depth={0} byId={byId} current={current} onPick={onPick} />
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
});
