// src/components/CategoriesSheet.jsx
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../supabase";

// IMPORTA AMBOS LOGOS
import logoLight from "../assets/LOGO_TODO_NEGRO.svg";   // se ve bien en tema CLARO
import logoDark  from "../assets/LOGO2.png"; // se ve bien en tema OSCURO


import useThemeAttr from "../hooks/useThemeAttr"; // <-- el hook

export default function CategoriesSheet({ open, onClose }) {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const location = useLocation();

  // Lee el tema actual ('light' | 'dark') y reacciona cuando cambie.
  const theme = useThemeAttr();
  const brandLogo = theme === "dark" ? logoDark : logoLight;

  useEffect(() => {
    if (!open) return;
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("id, name, slug, active")
          .eq("active", true)
          .order("name");
        if (error) throw error;
        if (!alive) return;
        setCats(data || []);
      } catch (e) {
        if (!alive) return;
        setErr(e.message || "No se pudieron cargar las categorías.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [open]);

  if (!open) return null;

  const go = () => onClose?.();

  const baseSearch = new URLSearchParams(location.search);
  const Item = ({ to, children }) => (
    <Link to={to} onClick={go} className="sheet-item">
      {children}
    </Link>
  );

  const closeIfBackdrop = (e) => {
    if (e.target && e.target.classList && e.target.classList.contains("sheet")) {
      onClose?.();
    }
  };

  return (
    <div className="sheet sheet--left" onClick={closeIfBackdrop}>
      <div className="sheet-backdrop" />
      <aside className="sheet-panel">
        <div className="sheet-header">
          <h3 style={{ margin: 0 }}>Categorías</h3>
          <button className="btn light" onClick={onClose}>Cerrar</button>
        </div>

        <div className="sheet-list">
          <Item to="/">Inicio</Item>

          {loading && <div className="sheet-item">Cargando…</div>}
          {err && <div className="sheet-item" style={{ color: "crimson" }}>{err}</div>}

          {!loading && !err && cats.map(c => {
            const search = new URLSearchParams(baseSearch);
            search.set("cat", c.slug);
            return (
              <Item key={c.id} to={`/catalogo?${search.toString()}`}>
                {c.name.toUpperCase()}
              </Item>
            );
          })}
        </div>

        {/* Footer + logo como marca de agua */}
        <div className="sheet-footer">
          <div className="sheet-hint">
            Elige una categoría para filtrar el catálogo
          </div>

          <div className="sheet-logo">
            <img src={brandLogo} alt="C&M CLOTHING FIT" />
          </div>
        </div>
      </aside>
    </div>
  );
}
