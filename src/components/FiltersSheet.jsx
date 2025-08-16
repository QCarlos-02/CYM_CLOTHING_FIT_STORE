import { useEffect, useState } from "react";

export default function FiltersSheet({ open, onClose, initial = {}, onApply }) {
  const [q, setQ] = useState(initial.q || "");
  const [size, setSize] = useState(initial.size || "");
  const [color, setColor] = useState(initial.color || "");
  const [min, setMin] = useState(initial.minPrice || "");
  const [max, setMax] = useState(initial.maxPrice || "");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setQ(initial.q || "");
      setSize(initial.size || "");
      setColor(initial.color || "");
      setMin(initial.minPrice || "");
      setMax(initial.maxPrice || "");
    }
  }, [open, initial]);

  if (!open) return null;

  const apply = () => {
    onApply?.({ q, size, color, minPrice: min, maxPrice: max });
    onClose?.();
  };

  return (
    <div className="sheet">
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet-panel" role="dialog" aria-modal="true">
        <div className="sheet-header">
          <strong>Filtros</strong>
          <button className="btn light" onClick={onClose}>Cerrar</button>
        </div>

        <div className="sheet-list" style={{ gap:12 }}>
          <input placeholder="Buscar por nombre…" value={q} onChange={e=>setQ(e.target.value)} />
          <select value={size} onChange={e=>setSize(e.target.value)}>
            <option value="">Talla</option>
            {["XS","S","M","L","XL","XXL"].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={color} onChange={e=>setColor(e.target.value)}>
            <option value="">Color</option>
            {["negro","blanco","azul","rojo","verde","amarillo"].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="number" placeholder="Precio mínimo" value={min} onChange={e=>setMin(e.target.value)} />
          <input type="number" placeholder="Precio máximo" value={max} onChange={e=>setMax(e.target.value)} />
        </div>

        <div className="sheet-footer" style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
          <button className="btn light" onClick={()=>{ setQ(""); setSize(""); setColor(""); setMin(""); setMax(""); }}>Limpiar</button>
          <button className="btn" onClick={apply}>Aplicar</button>
        </div>
      </div>
    </div>
  );
}
