// src/components/Layout.jsx
import { Link } from "react-router-dom";
import { useState } from "react";
import { useCart } from "../store/CartContext";
import ThemeToggle from "./ThemeToggle";
import Footer from "./Footer";
import CategoriesSheet from "./CategoriesSheet";
import SearchOverlay from "./SearchOverlay";

export default function Layout({ children }) {
  const { totalCount } = useCart();
  const [openCat, setOpenCat] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);

  return (
    <div className="layout"> {/* <- wrapper flex de página */}
      <header className="header">
        <div className="header-inner container header-app">
          {/* Izquierda: categorías */}
          <button
            className="btn light header-btn"
            onClick={() => setOpenCat(true)}
            aria-label="Abrir categorías"
            title="Categorías"
          >
            <span className="btn-ico">☰</span>
            <span className="btn-text">Categorías</span>
          </button>

          {/* Centro: marca */}
          <Link to="/" className="brand header-brand desktop-only" aria-label="Inicio">
            C&M CLOTHING FIT
          </Link>

          {/* Derecha: acciones */}
          <div className="header-right" style={{ display:"flex", gap:8, alignItems:"center" }}>
            <button
              className="btn light header-btn"
              onClick={() => setOpenSearch(true)}
              title="Buscar"
              aria-label="Buscar"
            >
              <span className="btn-ico">🔎</span>
              <span className="btn-text">Buscar</span>
            </button>

            <Link to="/carrito" className="btn header-btn" title="Carrito">
              <span className="btn-ico">🛒</span>
              <span className="btn-text">Carrito</span>
              {totalCount > 0 && <span className="cart-badge">{totalCount}</span>}
            </Link>

            <div className="header-btn">
              <ThemeToggle />
            </div>

           
          </div>
        </div>
      </header>

      {/* main ocupa el alto restante para empujar el footer */}
      <main className="container page-main">
        {children}
      </main>

      <Footer />

      {/* Overlays */}
      <CategoriesSheet open={openCat} onClose={() => setOpenCat(false)} />
      <SearchOverlay open={openSearch} onClose={() => setOpenSearch(false)} />
    </div>
  );
}
