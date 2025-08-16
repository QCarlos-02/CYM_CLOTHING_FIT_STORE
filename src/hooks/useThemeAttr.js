// src/hooks/useThemeAttr.js
import { useEffect, useState } from "react";

/**
 * Devuelve el valor de document.documentElement.dataset.theme
 * y se actualiza si cambia (via MutationObserver).
 * Espera 'light' o 'dark'.
 */
export default function useThemeAttr() {
  const getTheme = () =>
    document.documentElement.getAttribute("data-theme") || "light";

  const [theme, setTheme] = useState(getTheme);

  useEffect(() => {
    const el = document.documentElement;

    // Observa cambios en el atributo data-theme
    const obs = new MutationObserver(() => setTheme(getTheme()));
    obs.observe(el, { attributes: true, attributeFilter: ["data-theme"] });

    return () => obs.disconnect();
  }, []);

  return theme;
}
