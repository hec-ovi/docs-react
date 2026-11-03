import { createTheme } from "@mui/material/styles";

// The original docs-react greys and square corners, plus the tokens the Markdown body needs.
const palettes = {
  light: {
    mode: "light",
    primary: { main: "#555" },
    background: { default: "#ddd", paper: "#fff" },
    text: { primary: "#1d1d1f", secondary: "#5a5a5f" },
    divider: "#d0d0d0",
    snippet: { background: "#f6f6f6", text: "#333", border: "#d6d6d6" },
    table: { head: "#e4e4e4", text: "#111", border: "#c8c8c8", oddRow: "#f6f6f6", evenRow: "#fff" },
    quote: { border: "#999", background: "#f3f3f3" },
    link: "#2f5fa7",
  },
  dark: {
    mode: "dark",
    primary: { main: "#bbb" },
    background: { default: "#2b2b2b", paper: "#1f1f1f" },
    text: { primary: "#e8e8e8", secondary: "#a8a8ad" },
    divider: "#3a3a3a",
    snippet: { background: "#141414", text: "#eee", border: "#3a3a3a" },
    table: { head: "#333", text: "#eee", border: "#444", oddRow: "#262626", evenRow: "#1f1f1f" },
    quote: { border: "#777", background: "#262626" },
    link: "#8fb6ff",
  },
};

export const makeTheme = (mode) =>
  createTheme({
    palette: palettes[mode],
    shape: { borderRadius: 0 },
    typography: {
      fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      h1: { fontSize: "2rem", fontWeight: 600, lineHeight: 1.2 },
      body1: { lineHeight: 1.65 },
    },
  });
