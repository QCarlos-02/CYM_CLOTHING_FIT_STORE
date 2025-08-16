import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeCtx = createContext();
const KEY = "theme_pref"; // "light" | "dark"

function getSystemPref() {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem(KEY) || "");

  // si no hay preferencia guardada, usa la del sistema
  useEffect(() => {
    if (!theme) setTheme(getSystemPref());
  }, [theme]);

  useEffect(() => {
    if (!theme) return;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(KEY, theme);
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    setLight: () => setTheme("light"),
    setDark: () => setTheme("dark"),
    toggle: () => setTheme(t => (t === "light" ? "dark" : "light")),
  }), [theme]);

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
