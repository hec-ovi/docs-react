import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { makeTheme } from "./theme";
import { App } from "./App";

const stored = () => {
  try {
    const v = localStorage.getItem("darkMode");
    if (v === "true" || v === "false") return v === "true";
  } catch {
    /* storage blocked: follow the system */
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
};

function Root() {
  const [dark, setDark] = useState(stored);
  const theme = useMemo(() => makeTheme(dark ? "dark" : "light"), [dark]);
  useEffect(() => {
    try {
      localStorage.setItem("darkMode", String(dark));
    } catch {
      /* ignore */
    }
  }, [dark]);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App dark={dark} onToggleDark={() => setDark((d) => !d)} />
    </ThemeProvider>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
