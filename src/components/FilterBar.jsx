import { useEffect, useState } from "react";

export default function FilterBar({ onChange, initial = {} }) {
  const [q, setQ] = useState(initial.q || "");
  const [size, setSize] = useState(initial.size || "");
  const [color, setColor] = useState(initial.color || "");
  const [min, setMin] = useState(initial.min || "");
  const [max, setMax] = useState(initial.max || "");

  useEffect(()=>{ onChange({ q, size, color, min, max }); }, [q,size,color,min,max, onChange]);

  return (
    <div className="card" style={{ padding:12, borderRadius:16, margin:"8px 0", display:"grid", gap:12 }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr", gap:12 }}>
        <input placeholder="Buscar por nombre…" value={q} onChange={e=>setQ(e.target.value)} />
        <select value={size} onChange={e=>setSize(e.target.value)}>
          <option value="">Talla</option>
          {["XS","S","M","L","XL","XXL"].map(s=> <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={color} onChange={e=>setColor(e.target.value)}>
          <option value="">Color</option>
          {["negro","blanco","azul","rojo","verde","amarillo"].map(c=> <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="number" placeholder="Min $" value={min} onChange={e=>setMin(e.target.value)} />
        <input type="number" placeholder="Max $" value={max} onChange={e=>setMax(e.target.value)} />
      </div>
    </div>
  );
}
