// src/components/admin/AdminShell.jsx
import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../supabase";
// ✅ ruta correcta desde src/components/admin/AdminShell.jsx
import ThemeToggle from "../ThemeToggle";



export default function AdminShell(){
  const navigate = useNavigate();
  const [open, setOpen] = useState(false); // mostrar/ocultar sidebar en móvil

  // cerrar sidebar con ESC en móvil
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login", { replace:true });
  };

  return (
    <div className={`admin-shell ${open ? "aside-open" : ""}`}>
      {/* Sidebar (no se imprime) */}
      <aside className="admin-aside no-print">
        <div className="admin-aside-brand">C&M CLOTHING FIT </div>

        <nav className="admin-nav">
          <NavItem to="/admin/dashboard"  icon="📊" label="Dashboard"        onClick={()=>setOpen(false)} />
          <NavItem to="/admin/sales/new"  icon="🧾" label="Registrar venta"  onClick={()=>setOpen(false)} />
          <NavItem to="/admin/products"   icon="📦" label="Productos"        onClick={()=>setOpen(false)} />
          {/* <NavItem to="/admin/users"    icon="👥" label="Usuarios admin"    onClick={()=>setOpen(false)} /> */}
          <NavItem to="/admin/inventory"  icon="📈" label="Inventario"       onClick={()=>setOpen(false)} />
          <NavItem to="/admin/categories" icon="🏷️" label="Categorías"       onClick={()=>setOpen(false)} />
          <NavItem to="/admin/reports"    icon="📈" label="Reportes"         onClick={()=>setOpen(false)} />
        </nav>

        <div className="admin-aside-footer">
          {/* Imprimir/Guardar PDF: oculta sidebar/header gracias a CSS @media print */}
        

          <button className="btn light" onClick={logout}>⎋ Cerrar sesión</button>
          <Link className="btn ghost" to="/" style={{marginTop:8}}>↩ Volver a tienda</Link>
        </div>
      </aside>

      {/* Header (no se imprime) + contenido */}
      <section className="admin-main">
  <header className="admin-header no-print">
    <button
      className="btn light only-mobile"
      onClick={() => setOpen(v => !v)}
      aria-label="Menú"
    >
      ☰
    </button>
    <h1 className="admin-title">Panel de administración</h1>

    {/* Botón de cambiar tema */}
    <div style={{ marginLeft: "auto" }}>
      <ThemeToggle />
    </div>
  </header>


        {/* Contenido imprimible */}
        <main className="admin-content print-area">
          <Outlet />
        </main>
      </section>

      {/* Backdrop para móvil */}
      {open && <div className="admin-backdrop" onClick={()=>setOpen(false)} />}
    </div>
  );
}

function NavItem({ to, icon, label, onClick }){
  return (
    <NavLink
      to={to}
      className={({isActive}) => `admin-nav-item ${isActive ? "active" : ""}`}
      onClick={onClick}
    >
      <span className="admin-nav-ico">{icon}</span>
      <span className="admin-nav-text">{label}</span>
    </NavLink>
  );
}
