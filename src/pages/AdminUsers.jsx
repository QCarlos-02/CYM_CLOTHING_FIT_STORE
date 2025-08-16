import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function AdminUsers(){
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, role, email, created_at")
          .order("created_at", { ascending: true });
        if (error) throw error;
        if (!alive) return;
        setRows(data || []);
      } catch (err) {
        console.error(err);
        setMsg(err.message || "No se pudo cargar usuarios.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const setRole = async (id, role) => {
    setMsg("");
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", id);
      if (error) throw error;

      setRows(rs => rs.map(r => r.id === id ? { ...r, role } : r));
      setMsg("Actualizado ✅");
    } catch (err) {
      console.error(err);
      setMsg(err.message || "No se pudo actualizar el rol.");
    }
  };

  return (
    <>
      <div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
        <h2 className="section-title" style={{margin:0}}>Usuarios admin</h2>
      </div>

      {loading ? <div style={{opacity:.8}}>Cargando…</div> : (
        <div className="card" style={{ padding:12 }}>
          <div style={{ color:"var(--muted)", marginBottom:8 }}>
            Crea la cuenta por login/registro y aquí solo asigna el rol <b>admin</b>.
          </div>

          {!rows.length ? (
            <div style={{opacity:.8}}>No hay perfiles.</div>
          ) : (
            <div style={{ display:"grid", gap:8 }}>
              {rows.map(u => (
                <div key={u.id} className="admin-row" style={{ gridTemplateColumns:"1fr auto auto" }}>
                  <div>
                    <div style={{ fontWeight:700 }}>
                      {u.email || u.id}
                    </div>
                    <small style={{ color:"var(--muted)" }}>
                      {new Date(u.created_at).toLocaleString()}
                    </small>
                  </div>

                  <div style={{ textAlign:"right", alignSelf:"center" }}>
                    <span className="badge">rol: {u.role || "user"}</span>
                  </div>

                  <div className="admin-actions">
                    {u.role === "admin" ? (
                      <button className="btn light" onClick={() => setRole(u.id, "user")}>Quitar admin</button>
                    ) : (
                      <button className="btn" onClick={() => setRole(u.id, "admin")}>Hacer admin</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {msg && <div style={{ marginTop:8, color: msg.includes("✅") ? "var(--primary)" : "crimson" }}>{msg}</div>}
        </div>
      )}
    </>
  );
}
