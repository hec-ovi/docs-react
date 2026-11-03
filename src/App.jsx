import { useCallback, useEffect, useMemo, useState } from "react";
import { AppBar, Box, Drawer, IconButton, Toolbar, Typography, useMediaQuery } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useIndex, useRoute } from "./data";
import { Sidebar } from "./components/Sidebar";
import { HomePage } from "./components/HomePage";
import { DocPage, Toc } from "./components/DocPage";

const NAV = 290;

function labelsOf(tree, map = new Map()) {
  for (const n of tree) {
    map.set(n.topic, n.label);
    labelsOf(n.children, map);
  }
  return map;
}

export function App({ dark, onToggleDark }) {
  const { index, error } = useIndex();
  const { id, anchor } = useRoute();
  const wide = useMediaQuery("(min-width:900px)");
  const roomy = useMediaQuery("(min-width:1280px)");
  const [navOpen, setNavOpen] = useState(false);
  const [toc, setToc] = useState([]);
  const onOutline = useCallback((items) => setToc(items), []);
  const closeNav = useCallback(() => setNavOpen(false), []);

  const byId = useMemo(() => new Map((index?.docs || []).map((d) => [d.id, d])), [index]);
  const labels = useMemo(() => labelsOf(index?.tree || []), [index]);
  const entry = id ? byId.get(id) : null;

  useEffect(() => {
    if (!index) return;
    document.title = entry ? `${entry.title} · ${index.title}` : index.title;
    if (!entry) setToc([]);
  }, [index, entry]);

  if (error)
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h5">No library index</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          {error}. Run <code>docs index</code> (or <code>npm run dev</code>, which builds it) and reload.
        </Typography>
      </Box>
    );
  if (!index) return null;

  const nav = <Sidebar index={index} current={entry?.id || ""} dark={dark} onToggleDark={onToggleDark} onPick={wide ? undefined : closeNav} />;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      {wide ? (
        <Drawer variant="permanent" sx={{ width: NAV, flexShrink: 0, "& .MuiDrawer-paper": { width: NAV, boxSizing: "border-box" } }}>
          {nav}
        </Drawer>
      ) : (
        <>
          <AppBar position="fixed" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "background.paper" }}>
            <Toolbar variant="dense">
              <IconButton edge="start" onClick={() => setNavOpen(true)} aria-label="Open navigation">
                <MenuIcon />
              </IconButton>
              <Typography sx={{ ml: 1, fontWeight: 600 }} noWrap>
                {entry ? entry.title : index.title}
              </Typography>
            </Toolbar>
          </AppBar>
          <Drawer open={navOpen} onClose={closeNav} ModalProps={{ keepMounted: true }} sx={{ "& .MuiDrawer-paper": { width: Math.min(NAV, 320) } }}>
            {nav}
          </Drawer>
        </>
      )}
      <Box component="main" sx={{ flex: 1, minWidth: 0, display: "flex", justifyContent: "center", pt: wide ? 0.5 : 6.5, pb: 0.5, px: wide ? 0.5 : 0 }}>
        <Box sx={{ width: "100%", maxWidth: 900, minHeight: "100%", bgcolor: "background.paper", px: { xs: 2, sm: 5, md: 7 }, pt: 4, pb: 10 }}>
          {entry ? (
            <DocPage entry={entry} labels={labels} anchor={anchor} onOutline={onOutline} />
          ) : id ? (
            <Typography>
              No doc <code>{id}</code>. <a href="#/">Back to the index</a>.
            </Typography>
          ) : (
            <HomePage index={index} />
          )}
        </Box>
        {roomy && (
          <Box sx={{ width: 240, flexShrink: 0, pl: 3, pr: 2, pt: 4 }}>
            {entry && <Toc items={toc} anchor={anchor} docId={entry.id} />}
          </Box>
        )}
      </Box>
    </Box>
  );
}
