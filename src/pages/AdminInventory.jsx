import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase";

const fmtCOP = (n) => new Intl.NumberFormat("es-CO").format(Math.round(Number(n || 0)));

export default function AdminInventory(){
  const [products, setProducts] = useState([]);
  const [movs, setMovs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // formulario de movimiento
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("");
  const [type, setType] = useState("in"); // in = entrada, out = salida
  const [reason, setReason] = useState("");

  const selectedProduct = useMemo(
    () => products.find(p => p.id === productId) || null,
    [productId, products]
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const { data: prods, error: e1 } = await supabase
          .from("products")
          .select("id,name,price,stock,category,gender,images")
          .order("name", { ascending: true });
        if (e1) throw e1;

        const { data: lastMovs, error: e2 } = await supabase
          .from("inventory_movements")
          .select("id,product_id,qty,reason,created_at")
          .order("created_at", { ascending: false })
          .limit(30);
        if (e2) throw e2;

        if (!alive) return;
        setProducts(prods || []);
        setMovs(lastMovs || []);
      } catch (err) {
        console.error(err);
        setMsg(err.message || "Error al cargar inventario.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const submitMovement = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!productId) { setMsg("Selecciona un producto."); return; }
    if (!qty || isNaN(Number(qty))) { setMsg("Cantidad inválida."); return; }
    const q = Number(qty) * (type === "out" ? -1 : 1);
    setSaving(true);
    try {
      const { error } = await supabase
        .from("inventory_movements")
        .insert({
          product_id: productId,
          qty: q,
          reason: reason?.trim() || null,
        });
      if (error) throw error;

      // refrescar productos y movimientos
      const { data: prods } = await supabase
        .from("products")
        .select("id,name,price,stock,category,gender,images")
        .order("name", { ascending: true });
      setProducts(prods || []);

      const { data: lastMovs } = await supabase
        .from("inventory_movements")
        .select("id,product_id,qty,reason,created_at")
        .order("created_at", { ascending: false })
        .limit(30);
      setMovs(lastMovs || []);

      setProductId("");
      setQty("");
      setType("in");
      setReason("");
      setMsg("Movimiento registrado ✅");
    } catch (err) {
      console.error(err);
      setMsg(err.message || "No se pudo registrar el movimiento.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
        <h2 className="section-title" style={{margin:0}}>Inventario</h2>
      </div>

      {loading ? <div style={{opacity:.8}}>Cargando…</div> : (
        <>
          {/* Resumen rápido */}
          <div className="grid-cards" style={{marginTop:12}}>
            <KPI label="Productos" value={products.length} />
            <KPI label="Stock total" value={products.reduce((a,p)=>a+Number(p.stock||0),0)} />
            <KPI label="Valorización (precio x stock)" value={`$ ${fmtCOP(products.reduce((a,p)=>a+Number(p.price||0)*Number(p.stock||0),0))}`} />
          </div>

          {/* Formulario de movimiento */}
          <div className="card" style={{ padding:12, marginTop:16 }}>
            <div style={{ fontWeight:700, marginBottom:8 }}>Registrar entrada/salida</div>
            <form className="form-grid" onSubmit={submitMovement}>
              <div style={{ gridColumn: "1 / -1" }}>
                <select value={productId} onChange={e=>setProductId(e.target.value)}>
                  <option value="">Selecciona producto…</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — stock: {p.stock}
                    </option>
                  ))}
                </select>
              </div>

              <select value={type} onChange={e=>setType(e.target.value)}>
                <option value="in">Entrada (+)</option>
                <option value="out">Salida (-)</option>
              </select>

              <input
                type="number"
                placeholder="Cantidad"
                value={qty}
                onChange={e=>setQty(e.target.value)}
                min="1"
              />

              <input
                placeholder="Motivo (opcional)"
                value={reason}
                onChange={e=>setReason(e.target.value)}
              />

              <div style={{ gridColumn:"1 / -1", display:"flex", gap:8 }}>
                <button className="btn" disabled={saving}>
                  {saving ? "Guardando…" : "Registrar movimiento"}
                </button>
                {msg && <div style={{ alignSelf:"center", color: msg.includes("✅") ? "var(--primary)" : "crimson" }}>{msg}</div>}
              </div>
            </form>

            {selectedProduct ? (
              <div style={{ marginTop:12, color:"var(--muted)" }}>
                <b>Seleccionado:</b> {selectedProduct.name} — stock actual: {selectedProduct.stock}
              </div>
            ) : null}
          </div>

          {/* Tabla simple de productos */}
          <div className="card" style={{ padding:12, marginTop:16 }}>
            <div style={{ fontWeight:700, marginBottom:8 }}>Stock por producto</div>
            <div className="grid" style={{ gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))" }}>
              {products.map(p => (
                <div key={p.id} className="card" style={{ padding:10 }}>
                 <img
  src={p.images?.front || p.images?.full}
  alt={p.name}
  className="inv-thumb"
/>

                  <div style={{ fontWeight:700, marginTop:6 }}>{p.name}</div>
                  <small style={{ color:"var(--muted)" }}>{p.category} · {p.gender}</small>
                  <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
                    <span>Stock: <b>{p.stock}</b></span>
                    <span>Precio: <b>$ {fmtCOP(p.price)}</b></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Últimos movimientos */}
          <div className="card" style={{ padding:12, marginTop:16 }}>
            <div style={{ fontWeight:700, marginBottom:8 }}>Últimos movimientos</div>
            {!movs.length ? (
              <div style={{opacity:.7}}>Sin movimientos aún.</div>
            ) : (
              <div style={{ display:"grid", gap:8 }}>
                {movs.map(m => (
                  <div key={m.id} className="admin-row" style={{ gridTemplateColumns:"1fr auto auto" }}>
                    <div>
                      <div style={{ fontWeight:600 }}>
                        {products.find(p=>p.id===m.product_id)?.name || m.product_id}
                      </div>
                      <small style={{ color:"var(--muted)" }}>
                        {new Date(m.created_at).toLocaleString()} — {m.reason || "—"}
                      </small>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:14 }}>Cantidad</div>
                      <div style={{ fontWeight:700, color: m.qty>=0 ? "var(--primary)" : "var(--danger)" }}>
                        {m.qty>=0 ? `+${m.qty}` : m.qty}
                      </div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:14 }}>Stock post</div>
                      <div style={{ fontWeight:700 }}>
                        {/* No sabemos el stock post exacto sin consulta extra; mostramos “—” */}
                        —
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

function KPI({ label, value }) {
  return (
    <div className="card" style={{ padding: 12, borderRadius: 16 }}>
      <div style={{ fontSize: 12, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>{value}</div>
    </div>
  );
}
