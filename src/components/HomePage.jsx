import { Fragment } from "react";
import { Box, Link, Typography } from "@mui/material";
import { CONTENT, docHref } from "../data";

function collect(node, out = []) {
  out.push(...node.docs.map((id) => [id, node]));
  for (const c of node.children) collect(c, out);
  return out;
}

/** The library index: every top-level topic with its docs, their summaries and sub-topics. */
export function HomePage({ index }) {
  const byId = new Map(index.docs.map((d) => [d.id, d]));
  return (
    <Box>
      <Typography variant="h1" component="h1" sx={{ mb: 1 }}>
        {index.title}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        {index.count} docs in {index.tree.length} topics · index built {index.generated.slice(0, 10)} ·{" "}
        <Link href={`${CONTENT}INDEX.md`} target="_blank" rel="noreferrer" color="inherit">
          INDEX.md
        </Link>{" "}
        ·{" "}
        <Link href={`${CONTENT}index.json`} target="_blank" rel="noreferrer" color="inherit">
          index.json
        </Link>
      </Typography>
      {index.tree.map((top) => {
        let last = null;
        return (
          <Box key={top.topic} component="section" sx={{ mb: 4 }}>
            <Typography component="h2" sx={{ fontSize: "1.3rem", fontWeight: 600, pb: 0.75, mb: 1, borderBottom: 1, borderColor: "divider" }}>
              {top.label}{" "}
              <Typography component="span" color="text.secondary" sx={{ fontSize: "0.9rem", fontWeight: 400 }}>
                {top.count}
              </Typography>
            </Typography>
            {collect(top).map(([id, node]) => {
              const d = byId.get(id);
              const showSub = node !== top && node !== last;
              last = node;
              return (
                <Fragment key={id}>
                  {showSub && (
                    <Typography sx={{ mt: 1.5, mb: 0.25, fontSize: "0.78rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "text.secondary" }}>
                      {node.topic.split("/").slice(1).join(" / ").replace(/-/g, " ")}
                    </Typography>
                  )}
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "minmax(180px, 30%) 1fr" }, columnGap: 2, py: 0.6 }}>
                    <Link href={docHref(d.id)} underline="hover" sx={{ fontWeight: 500, color: "link" }}>
                      {d.title}
                    </Link>
                    <Typography variant="body2" color="text.secondary">
                      {d.summary}
                    </Typography>
                  </Box>
                </Fragment>
              );
            })}
          </Box>
        );
      })}
    </Box>
  );
}
