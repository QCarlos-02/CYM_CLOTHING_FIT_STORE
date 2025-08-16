// src/components/admin/AdminMenu.jsx
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../supabase";

export default function AdminMenu() {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, up: false, width: 260 });
  const btnRef = useRef(null);
  const navigate = useNavigate();

  // Coloca el menú respecto al botón (posición fija sobre la ventana)
  const place = () => {
    const btn = btnRef.current;
    if (!btn) return;

    const r = btn.getBoundingClientRect();
    const gap = 8;                 // separación botón ↔ menú
    const estH = 320;              // altura estimada del menú (auto-flip si no hay)
    const spaceBelow = window.innerHeight - r.bottom;
    const up = spaceBelow < estH;

    setCoords({
      left: Math.round(r.left),                      // alineado al borde izq del botón
      top: Math.round(up ? r.top - gap : r.bottom + gap),
      up,
      width: Math.max(240, Math.min(320, r.width)),  // ancho acorde al botón, con límites
    });
  };

  // Recalcular posición cuando se abre + al hacer scroll/resize
  useLayoutEffect(() => {
    if (!open) return;
    place();

    const onScroll = () => place();
    const onResize = () => place();

    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Cerrar con click fuera o ESC
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (!btnRef.current) return;
      if (!btnRef.current.contains(e.target)) {
        // si clic fuera del botón y fuera del menú, cierra
        const menuEl = document.getElementById("admin-menu-portal");
        if (!menuEl || !menuEl.contains(e.target)) setOpen(false);
      }
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  };

  return (
    <>
      <button ref={btnRef} className="btn light" onClick={() => setOpen(v => !v)}>
        <span style={{ marginRight: 6 }}>☰</span>
        <span className="btn-text">Menú admin</span>
      </button>

      {open && createPortal(
        <div
          id="admin-menu-portal"
          className="dropdown-menu-fixed"
          style={{
            position: "fixed",
            left: coords.left,
            top: coords.up ? undefined : coords.top,
            bottom: coords.up ? (window.innerHeight - coords.top) : undefined,
            width: coords.width,
          }}
        >
          <Link to="/admin/dashboard" onClick={() => setOpen(false)}>📊 Dashboard</Link>
          <Link to="/admin/sales/new" onClick={() => setOpen(false)}>🧾 Registrar venta</Link>
          <Link to="/admin/products" onClick={() => setOpen(false)}>📦 Productos</Link>
          {/* <Link to="/admin/users" onClick={() => setOpen(false)}>👥 Usuarios admin</Link> */}
          <Link to="/admin/inventory" onClick={() => setOpen(false)}>📈 Inventario</Link>
          <Link to="/admin/categories" onClick={() => setOpen(false)}>🏷️ Categorías</Link>
          <Link to="/admin/reports" onClick={() => setOpen(false)}>📑 Reportes</Link>
          <hr />
          <button className="dropdown-item" onClick={() => { window.print(); setOpen(false); }}>
            🖨️ Imprimir / Guardar PDF
          </button>
          <button className="dropdown-item danger" onClick={logout}>⎋ Cerrar sesión</button>
        </div>,
        document.body
      )}
    </>
  );
}
