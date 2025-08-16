import { useTheme } from "../store/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      className="btn ghost"
      onClick={toggle}
      title={theme === "light" ? "Cambiar a oscuro" : "Cambiar a claro"}
      aria-label="Cambiar tema"
      style={{ paddingInline: 12 }}
    >
      {theme === "light" ? "🌙 Oscuro" : "🔆 Claro"}
    </button>
  );
}
