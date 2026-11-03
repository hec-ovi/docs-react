import { lazy, memo, Suspense } from "react";
import { Box } from "@mui/material";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CONTENT, docHref, headingId, resolvePath } from "../data";

const CodeBlock = lazy(() => import("./CodeBlock"));
const EXTERNAL = /^([a-z][a-z0-9+.-]*:|\/\/)/i;

const textOf = (children) =>
  typeof children === "string" || typeof children === "number"
    ? String(children)
    : Array.isArray(children)
      ? children.map(textOf).join("")
      : children?.props
        ? textOf(children.props.children)
        : "";

const heading = (Tag) =>
  function Heading({ children }) {
    const id = headingId(textOf(children));
    return (
      <Tag id={id}>
        {children}
      </Tag>
    );
  };

function makeComponents(docId, docPath) {
  return {
    h1: heading("h2"), // the page title is the only h1
    h2: heading("h2"),
    h3: heading("h3"),
    h4: heading("h4"),
    a({ href = "", children }) {
      if (href.startsWith("#")) return <a href={docHref(docId, href.slice(1))}>{children}</a>;
      if (EXTERNAL.test(href)) return <a href={href} target="_blank" rel="noreferrer">{children}</a>;
      const [file, anchor] = href.split("#");
      const target = resolvePath(docPath, decodeURI(file));
      if (/\.md$/i.test(target)) return <a href={docHref(target.replace(/\.md$/i, ""), anchor)}>{children}</a>;
      return <a href={CONTENT + target} target="_blank" rel="noreferrer">{children}</a>;
    },
    img({ src = "", alt = "" }) {
      const url = EXTERNAL.test(src) || src.startsWith("data:") ? src : CONTENT + resolvePath(docPath, src);
      return <img src={url} alt={alt} loading="lazy" />;
    },
    pre({ children }) {
      const child = Array.isArray(children) ? children[0] : children;
      const className = child?.props?.className || "";
      const code = textOf(child?.props?.children).replace(/\n$/, "");
      const language = (/language-([\w+-]+)/.exec(className) || [])[1] || "text";
      return (
        <Suspense fallback={<pre className="code-fallback">{code}</pre>}>
          <CodeBlock language={language.toLowerCase()} code={code} />
        </Suspense>
      );
    },
    table({ children }) {
      return (
        <div className="table-wrap">
          <table>{children}</table>
        </div>
      );
    },
  };
}

const bodySx = (t) => ({
  color: "text.primary",
  fontSize: "1rem",
  lineHeight: 1.7,
  overflowWrap: "anywhere",
  "& h2, & h3, & h4": { scrollMarginTop: "72px", lineHeight: 1.3, fontWeight: 600 },
  "& h2": { fontSize: "1.45rem", mt: 5, mb: 1.5, pb: 0.75, borderBottom: `1px solid ${t.palette.divider}` },
  "& h3": { fontSize: "1.15rem", mt: 3.5, mb: 1 },
  "& h4": { fontSize: "1rem", mt: 3, mb: 1 },
  "& > :first-of-type": { mt: 0 },
  "& p, & ul, & ol": { my: 1.5 },
  "& li": { my: 0.4 },
  "& li > p": { my: 0.5 },
  "& ul.contains-task-list": { listStyle: "none", pl: 1 },
  "& a": { color: t.palette.link, textDecoration: "none", "&:hover": { textDecoration: "underline" } },
  "& :not(pre) > code": {
    fontFamily: 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace',
    fontSize: "0.86em",
    px: 0.6,
    py: 0.15,
    bgcolor: t.palette.snippet.background,
    border: `1px solid ${t.palette.snippet.border}`,
  },
  "& blockquote": {
    m: 0,
    my: 2,
    px: 2,
    py: 1,
    borderLeft: `4px solid ${t.palette.quote.border}`,
    bgcolor: t.palette.quote.background,
    color: "text.primary",
    "& p": { my: 0.75 },
  },
  "& .table-wrap": { overflowX: "auto", my: 2, border: `1px solid ${t.palette.table.border}` },
  "& table": { borderCollapse: "collapse", width: "100%", fontSize: "0.92rem" },
  "& th": { bgcolor: t.palette.table.head, color: t.palette.table.text, fontWeight: 600, textAlign: "left", whiteSpace: "nowrap" },
  "& th, & td": { border: `1px solid ${t.palette.table.border}`, px: 1.5, py: 0.9, verticalAlign: "top", overflowWrap: "normal", minWidth: "4.5em" },
  "& tbody tr:nth-of-type(odd)": { bgcolor: t.palette.table.evenRow },
  "& tbody tr:nth-of-type(even)": { bgcolor: t.palette.table.oddRow },
  "& hr": { border: 0, borderTop: `1px solid ${t.palette.divider}`, my: 4 },
  "& img": { maxWidth: "100%", height: "auto", display: "block", my: 2 },
  "& .code-fallback": { p: 2, my: 2, overflowX: "auto", bgcolor: t.palette.snippet.background, fontSize: "0.85rem" },
});

/** GitHub-flavoured Markdown with heading anchors, library-relative links and lazy code highlighting. */
export default memo(function Markdown({ body, docId, docPath }) {
  return (
    <Box sx={bodySx} className="markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={makeComponents(docId, docPath)}>
        {body}
      </ReactMarkdown>
    </Box>
  );
});
