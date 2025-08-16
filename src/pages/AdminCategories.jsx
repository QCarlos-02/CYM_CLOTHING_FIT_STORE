import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function AdminCategories() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    setMsg("");
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, active, created_at")
      .order("created_at", { ascending: true });
    if (error) setMsg(error.message);
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createCat = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!name.trim()) return;
    const { error } = await supabase
      .from("categories")
      .insert({ name: name.trim(), active: true });
    if (error) return setMsg(error.message);
    setName("");
    load();
  };

  const toggle = async (id, active) => {
    setMsg("");
    const { error } = await supabase
      .from("categories")
      .update({ active: !active })
      .eq("id", id);
    if (error) return setMsg(error.message);
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, active: !active } : r)));
  };

  const rename = async (id, prev) => {
    const nuevo = window.prompt("Nuevo nombre:", prev);
    if (!nuevo || nuevo.trim() === prev) return;
    const { error } = await supabase
      .from("categories")
      .update({ name: nuevo.trim() })
      .eq("id", id);
    if (error) return setMsg(error.message);
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, name: nuevo.trim() } : r)));
  };

  const remove = async (id) => {
    if (!window.confirm("¿Eliminar categoría? (no borra productos)")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return setMsg(error.message);
    setRows((rs) => rs.filter((r) => r.id !== id));
  };

  return (
    <>
      <h2 className="section-title">Categorías</h2>

      <form
        onSubmit={createCat}
        style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, maxWidth: 480, margin: "8px 0 16px" }}
      >
        <input
          placeholder="Nueva categoría (ej. Colonias)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn">Crear</button>
      </form>

      {msg && <div style={{ color: "crimson", marginBottom: 8 }}>{msg}</div>}

      {loading ? (
        <div>Cargando…</div>
      ) : rows.length ? (
        <div style={{ display: "grid", gap: 8 }}>
          {rows.map((r) => (
            <div key={r.id} className="admin-row" style={{ gridTemplateColumns: "1fr auto auto auto" }}>
              <div>
                <div style={{ fontWeight: 700 }}>{r.name}</div>
                <small style={{ color: "var(--muted)" }}>
                  {r.slug} · {new Date(r.created_at).toLocaleString()}
                </small>
              </div>

              <div className="admin-actions">
                <button className="btn light" onClick={() => rename(r.id, r.name)}>Renombrar</button>
              </div>

              <div className="admin-actions">
                <button className="btn" onClick={() => toggle(r.id, r.active)}>
                  {r.active ? "Desactivar" : "Activar"}
                </button>
              </div>

              <div className="admin-actions">
                <button className="btn light" onClick={() => remove(r.id)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>No hay categorías.</div>
      )}
    </>
  );
}
