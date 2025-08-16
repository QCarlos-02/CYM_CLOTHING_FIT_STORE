import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

export default function SearchOverlay({ open, onClose }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  // cerrar con ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "Enter") {
        e.preventDefault();
        goToCatalog();
      }
    };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, q]);

  // focus al abrir
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQ("");
      setItems([]);
    }
  }, [open]);

  // debounce (300ms)
  const debouncedQ = useDebounce(q, 300);
  useEffect(() => {
    let alive = true;
    const run = async () => {
      if (!debouncedQ) { setItems([]); return; }
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("id,name,price,images,category")
        .eq("active", true)
        .ilike("name", `%${debouncedQ}%`)
        .order("created_at", { ascending: false })
        .limit(10);
      if (!alive) return;
      setItems(error ? [] : (data || []));
      setLoading(false);
    };
    run();
    return () => { alive = false; };
  }, [debouncedQ]);

  const goToCatalog = () => {
    const term = q.trim();
    onClose?.();
    navigate(term ? `/catalogo?q=${encodeURIComponent(term)}` : "/catalogo");
  };

  if (!open) return null;

  return (
    <div className="ovr" role="dialog" aria-modal="true">
      <div className="ovr-backdrop" onClick={onClose} />
      <div className="ovr-panel">
        <div className="ovr-header">
          <input
            ref={inputRef}
            className="ovr-input"
            placeholder="Buscar productos…"
            value={q}
            onChange={(e)=>setQ(e.target.value)}
          />
          <button className="btn light" onClick={goToCatalog}>Buscar</button>
        </div>

        <div className="ovr-results">
          {!q && <div className="ovr-hint">Escribe para buscar por nombre…</div>}
          {loading && <div className="ovr-hint">Buscando…</div>}
          {!loading && q && items.length === 0 && (
            <div className="ovr-hint">Sin coincidencias.</div>
          )}

          {items.map(p => (
            <Link
              key={p.id}
              to={`/producto/${p.id}`}
              className="ovr-item"
              onClick={onClose}
            >
              <img
                src={p.images?.front || p.images?.full || p.images?.back || ""}
                alt={p.name}
              />
              <div className="ovr-item-info">
                <div className="ovr-item-name">{p.name}</div>
                <small className="ovr-item-meta">
                  {p.category} · ${Number(p.price).toLocaleString("es-CO")}
                </small>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/* pequeño hook local */
function useDebounce(value, delay=300){
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return useMemo(() => v, [v]);
}
