import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function AdminProductTable({ onEdit }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending:false });
    if (!error) setRows(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!window.confirm("¿Eliminar producto?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) load();
  };

  if (loading) return <div>Cargando listado…</div>;

return (
  <div style={{ display: "grid", gap: 8 }}>
    {rows.map((r) => (
      <div key={r.id} className="admin-row">
        <img
          src={r.images?.front || r.images?.full}
          alt={r.name}
          style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8 }}
        />

        <div>
          <div style={{ fontWeight: 600 }}>{r.name}</div>
          <small>
            {r.category} · {r.gender} · $
            {Number(r.price).toLocaleString("es-CO")}
          </small>
        </div>

        <div className="admin-actions">
          <button className="btn light" onClick={() => onEdit(r)}>
            Editar
          </button>
          <button className="btn" onClick={() => remove(r.id)}>
            Eliminar
          </button>
        </div>
      </div>
    ))}
  </div>
);
};
