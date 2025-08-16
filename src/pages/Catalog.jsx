import { useSearchParams } from "react-router-dom";
import { useCallback, useState } from "react";
import Layout from "../components/Layout";
import ProductGrid from "../components/ProductGrid";
import FilterBar from "../components/FilterBar";           // ← si quieres mantenerla en desktop
import FiltersSheet from "../components/FiltersSheet";     // ← nuevo

export default function Catalog() {
  const [params] = useSearchParams();
  const category = params.get("cat") || undefined;
  const gender = params.get("sexo") || undefined;

  const [filters, setFilters] = useState({});
  const [openFilters, setOpenFilters] = useState(false);

  const apply = useCallback((f) => setFilters(f), []);

  return (
    <Layout>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 }}>
        <h2 className="section-title" style={{ margin:0 }}>
          Catálogo {category ? `· ${category}` : ""}
        </h2>

        {/* Botón visible en móvil */}
        <button className="btn light" onClick={()=>setOpenFilters(true)}>
          <span className="btn-ico">⚙️</span>
          <span className="btn-text">Filtros</span>
        </button>
      </div>

      {/* Barra de filtros solo en >= 900px (opcional) */}
      <div style={{ display:"none" }} className="catalog-filters-desktop">
        <FilterBar onChange={apply} initial={filters} />
      </div>
      <style>{`
        @media (min-width: 900px){
          .catalog-filters-desktop{ display:block !important; }
        }
      `}</style>

      <ProductGrid
        category={category}
        gender={gender}
        q={filters.q}
        size={filters.size}
        color={filters.color}
        minPrice={filters.minPrice}
        maxPrice={filters.maxPrice}
      />

      {/* Sheet móvil */}
      <FiltersSheet
        open={openFilters}
        onClose={()=>setOpenFilters(false)}
        initial={filters}
        onApply={apply}
      />
    </Layout>
  );
}
