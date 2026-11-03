import { useState } from "react";
import { Box, IconButton, Tooltip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ContentCopy from "@mui/icons-material/ContentCopy";
import Check from "@mui/icons-material/Check";
import SyntaxHighlighter from "react-syntax-highlighter/dist/esm/prism-light";
import oneDark from "react-syntax-highlighter/dist/esm/styles/prism/one-dark";
import oneLight from "react-syntax-highlighter/dist/esm/styles/prism/one-light";
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import css from "react-syntax-highlighter/dist/esm/languages/prism/css";
import diff from "react-syntax-highlighter/dist/esm/languages/prism/diff";
import http from "react-syntax-highlighter/dist/esm/languages/prism/http";
import ini from "react-syntax-highlighter/dist/esm/languages/prism/ini";
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import jsx from "react-syntax-highlighter/dist/esm/languages/prism/jsx";
import markdown from "react-syntax-highlighter/dist/esm/languages/prism/markdown";
import markup from "react-syntax-highlighter/dist/esm/languages/prism/markup";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import sql from "react-syntax-highlighter/dist/esm/languages/prism/sql";
import toml from "react-syntax-highlighter/dist/esm/languages/prism/toml";
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx";
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import yaml from "react-syntax-highlighter/dist/esm/languages/prism/yaml";

const languages = { bash, css, diff, http, ini, javascript, json, jsx, markdown, markup, python, sql, toml, tsx, typescript, yaml };
for (const [name, lang] of Object.entries(languages)) SyntaxHighlighter.registerLanguage(name, lang);
const ALIASES = { sh: "bash", shell: "bash", zsh: "bash", console: "bash", js: "javascript", mjs: "javascript", ts: "typescript", py: "python", yml: "yaml", md: "markdown", html: "markup", xml: "markup", svg: "markup", jsonc: "json", json5: "json", env: "ini" };

/** A fenced code block: highlighted when the language is known, always with a copy button. Loaded lazily. */
export default function CodeBlock({ language, code }) {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);
  const lang = ALIASES[language] || language;
  const known = Boolean(languages[lang]);
  const copy = () => {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  };
  return (
    <Box sx={{ position: "relative", my: 2, border: `1px solid ${theme.palette.snippet.border}`, bgcolor: theme.palette.snippet.background }}>
      <Tooltip title={copied ? "Copied" : "Copy"} placement="left">
        <IconButton size="small" onClick={copy} aria-label="Copy code" sx={{ position: "absolute", top: 4, right: 4, opacity: 0.7, "&:hover": { opacity: 1 } }}>
          {copied ? <Check fontSize="inherit" /> : <ContentCopy fontSize="inherit" />}
        </IconButton>
      </Tooltip>
      <SyntaxHighlighter
        language={known ? lang : "text"}
        style={theme.palette.mode === "dark" ? oneDark : oneLight}
        customStyle={{ margin: 0, padding: "14px 44px 14px 16px", background: "transparent", fontSize: "0.85rem", lineHeight: 1.55 }}
        codeTagProps={{ style: { fontFamily: 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace', background: "transparent" } }}
        wrapLongLines
      >
        {code}
      </SyntaxHighlighter>
    </Box>
  );
}
