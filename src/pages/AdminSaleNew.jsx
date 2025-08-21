// src/pages/AdminSaleNew.jsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";
import Logo2 from "../assets/LOGO2.png"; // logo para el ticket

/* ====== Config ====== */
const PAYMENT_METHODS = [
  { value: "efectivo",    label: "Efectivo" },
  { value: "tarjeta",     label: "Tarjeta" },
  { value: "Bancolombia", label: "Bancolombia" },
  { value: "nequi",       label: "Nequi" },
  { value: "daviplata",   label: "Daviplata" },
  { value: "otro",        label: "Otro" },
];

const fmtCOP = (n) =>
  new Intl.NumberFormat("es-CO").format(Math.round(Number(n || 0)));

/* ===== helper: precio efectivo con descuento en custom_attrs ===== */
function getEffectivePrice(product) {
  const attrs = Array.isArray(product.custom_attrs)
    ? product.custom_attrs
    : (product.custom_attrs || []);
  const disc = attrs.find(
    a => (a?.label || "").toLowerCase() === "precio con descuento"
  );
  const discPrice = Number(disc?.value);
  const base = Number(product.price || 0);
  if (!isNaN(discPrice) && discPrice > 0 && discPrice < base) {
    return discPrice;
  }
  return base;
}

/* ====== Subcomponentes ====== */

function ItemRow({ it, onQty, onPrice, onRemove }) {
  return (
    <div className="admin-row" style={{ gridTemplateColumns: "1fr auto auto auto" }}>
      <div>
        <div style={{ fontWeight: 600 }}>{it.name}</div>
        <small style={{ color: "var(--muted)" }}>ID: {it.product_id}</small>
      </div>

      <div style={{ textAlign: "right" }}>
        <label style={{ fontSize: 12, color: "var(--muted)" }}>Cantidad</label>
        <input
          type="number"
          min={1}
          value={it.qty}
          onChange={(e) => onQty?.(it.product_id, Math.max(1, Number(e.target.value || 1)))}
          style={{ width: 90, textAlign: "right" }}
        />
      </div>

      <div style={{ textAlign: "right" }}>
        <label style={{ fontSize: 12, color: "var(--muted)" }}>Precio (COP)</label>
        <input
          type="number"
          min={0}
          value={it.price}
          onChange={(e) => onPrice?.(it.product_id, Math.max(0, Number(e.target.value || 0)))}
          style={{ width: 120, textAlign: "right" }}
        />
      </div>

      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>Subtotal</div>
        <div style={{ fontWeight: 700 }}>$ {fmtCOP(it.qty * it.price)}</div>
        <button className="btn light" onClick={() => onRemove?.(it.product_id)} style={{ marginTop: 6 }}>
          Quitar
        </button>
      </div>
    </div>
  );
}

/* ===== Busca y agrega productos usando el precio efectivo (con descuento si aplica) ===== */
function ProductSearch({ onPick }) {
  const [q, setQ] = useState("");
  const [res, setRes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!q.trim()) {
        setRes([]);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, stock, images, custom_attrs") // <-- IMPORTANTE
        .eq("active", true)
        .ilike("name", `%${q.trim()}%`)
        .order("created_at", { ascending: false })
        .limit(10);
      setRes(error ? [] : (data || []));
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="card" style={{ padding: 12 }}>
      <div style={{ display: "grid", gap: 8 }}>
        <label>Buscar producto</label>
        <input
          placeholder="Escribe el nombre del producto…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        {loading && <div style={{ opacity: 0.8 }}>Buscando…</div>}

        {!loading && !!res.length && (
          <div style={{ display: "grid", gap: 8 }}>
            {res.map((p) => {
              const eff = getEffectivePrice(p);
              const hasDiscount = eff < Number(p.price || 0);
              return (
                <div
                  key={p.id}
                  className="admin-row"
                  style={{ gridTemplateColumns: "64px 1fr auto", cursor: "pointer" }}
                  onClick={() =>
                    onPick?.({
                      product_id: p.id,
                      name: p.name,
                      price: eff, // <-- usamos precio efectivo
                      qty: 1,
                      stock: Number(p.stock || 0),
                      image: p.images?.front || p.images?.full || p.images?.back || "",
                    })
                  }
                >
                  <img
                    src={p.images?.front || p.images?.full || p.images?.back || ""}
                    alt={p.name}
                    style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8 }}
                    loading="lazy"
                    decoding="async"
                  />
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <small style={{ color: "var(--muted)" }}>
                      Stock: {p.stock} ·{" "}
                      {hasDiscount ? (
                        <>
                          Precio: <s>$ {fmtCOP(p.price)}</s>{" "}
                          <strong>$ {fmtCOP(eff)}</strong>
                        </>
                      ) : (
                        <>Precio: $ {fmtCOP(p.price)}</>
                      )}
                    </small>
                  </div>
                  <div style={{ alignSelf: "center" }}>
                    <button className="btn">Agregar</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && q && res.length === 0 && (
          <div style={{ opacity: 0.8 }}>Sin resultados.</div>
        )}
      </div>
    </div>
  );
}

/* ====== helpers Ticket ====== */

// HTML del ticket (80mm aprox). Usa datos en memoria.
function receiptHtml({ logoUrl, saleNo, createdAt, customer, channel, method, items, total, notes }) {
  const rows = items.map(
    it => `
      <tr>
        <td>${it.name}${it.size ? ` · ${it.size}` : ""}${it.color ? ` · ${it.color}` : ""}</td>
        <td style="text-align:right">${it.qty}</td>
        <td style="text-align:right">$ ${fmtCOP(it.price)}</td>
        <td style="text-align:right">$ ${fmtCOP(it.qty * it.price)}</td>
      </tr>`
  ).join("");

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<title>Ticket ${saleNo}</title>
<style>
  :root{ --ink:#111; --muted:#666; --line:#e5e7eb; }
  @page{ size: 80mm auto; margin: 6mm; }
  body{ font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; color:var(--ink); }
  .header{ text-align:center; margin-bottom:8px; }
  .logo{ height: 120px; margin-bottom:4px; }
  .brand{ font-weight:800; }
  .muted{ color: var(--muted); font-size: 12px; }
  .hr{ border-top:1px dashed var(--line); margin:8px 0; }
  table{ width:100%; border-collapse:collapse; font-size:12px; }
  th, td{ padding:4px 0; }
  th{ text-align:left; border-bottom:1px solid var(--line); }
  tfoot td{ border-top:1px dashed var(--line); padding-top:8px; font-weight:800; }
  .foot{ text-align:center; margin-top:10px; font-size:12px; color:var(--muted); }
</style>
</head>
<body>
  <div class="header">
    ${logoUrl ? `<img class="logo" src="${logoUrl}" alt="logo" />` : ""}
    <div class="brand">C&M CLOTHING FIT</div>
    <div class="muted">Ticket / Comprobante de compra</div>
  </div>

  <div class="muted">
    N°: ${saleNo}<br/>
    Fecha: ${createdAt}<br/>
    ${customer ? `Cliente: ${customer}<br/>` : ``}
    Canal: ${channel || "-"} · Método: ${method || "-"}
  </div>

  <div class="hr"></div>

  <table>
    <thead>
      <tr>
        <th>Producto</th>
        <th style="text-align:right">Cant</th>
        <th style="text-align:right">Precio</th>
        <th style="text-align:right">Subt</th>
      </tr>
    </thead>
    <tbody>
      ${rows || `<tr><td colspan="4">Sin ítems</td></tr>`}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="3">Total</td>
        <td style="text-align:right">$ ${fmtCOP(total)}</td>
      </tr>
    </tfoot>
  </table>

  ${notes ? `<div class="hr"></div><div class="muted">Notas: ${notes}</div>` : ``}

  <div class="foot">¡Gracias por tu compra!<br/>Síguenos en Instagram: @clothing_fitstore</div>

  <script>
    window.onload = function(){
      setTimeout(function(){ window.print(); }, 50);
    };
  </script>
</body>
</html>`;
}

// Abre ventana con el HTML del ticket para imprimir/guardar PDF
function openReceipt(data) {
  const w = window.open("", "_blank");
  if (!w) {
    alert("Habilita ventanas emergentes para ver/imprimir el ticket.");
    return;
  }
  w.document.open();
  w.document.write(receiptHtml(data));
  w.document.close();
}

/* ====== Página principal ====== */

export default function AdminSaleNew() {
  const navigate = useNavigate();

  // Cabecera
  const [customer, setCustomer] = useState("");
  const [channel, setChannel] = useState("whatsapp"); // whatsapp | tienda | otro
  const [method, setMethod] = useState("efectivo");   // método de pago
  const [notes, setNotes] = useState("");

  // Ítems
  const [items, setItems] = useState([]);

  // Estado UI
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Agregar item (si ya existe aumenta qty)
  const addItem = (p) => {
    setItems((prev) => {
      const found = prev.find((x) => x.product_id === p.product_id);
      if (found) {
        return prev.map((x) =>
          x.product_id === p.product_id ? { ...x, qty: x.qty + 1 } : x
        );
      }
      return [...prev, p];
    });
  };

  const removeItem = (product_id) =>
    setItems((prev) => prev.filter((x) => x.product_id !== product_id));

  const setQty = (product_id, qty) =>
    setItems((prev) =>
      prev.map((x) => (x.product_id === product_id ? { ...x, qty } : x))
    );

  const setPrice = (product_id, price) =>
    setItems((prev) =>
      prev.map((x) => (x.product_id === product_id ? { ...x, price } : x))
    );

  const total = useMemo(
    () => items.reduce((acc, it) => acc + it.qty * it.price, 0),
    [items]
  );

  const canSave = items.length > 0 && total > 0;

  const save = async () => {
    try {
      setSaving(true);
      setError("");

      // Validaciones rápidas
      for (const it of items) {
        if (it.qty <= 0) throw new Error(`Cantidad inválida en ${it.name}`);
        if (it.price < 0) throw new Error(`Precio inválido en ${it.name}`);
      }

      // Usuario actual (para user_id en la venta)
      const { data: { user } } = await supabase.auth.getUser();

      // Payload para el RPC
      const payload = {
        p_customer_name: customer || null,
        p_channel: channel || null,
        p_notes: notes || null,
        p_payment_method: method || null,
        p_items: items.map((it) => ({
          product_id: it.product_id,
          qty: it.qty,
          price: it.price, // ya viene con descuento si aplica
        })),
        p_user_id: user?.id || null,
      };

      const { error } = await supabase.rpc("create_sale", payload);
      if (error) throw error;

      // Ticket con datos en memoria
      const saleNo = "S" + Date.now().toString().slice(-8);
      openReceipt({
        logoUrl: Logo2,
        saleNo,
        createdAt: new Date().toLocaleString(),
        customer,
        channel,
        method,
        items,
        total,
        notes,
      });

      alert("✅ Venta registrada");
      // reset
      setCustomer("");
      setChannel("whatsapp");
      setMethod("efectivo");
      setNotes("");
      setItems([]);
      navigate("/admin/dashboard");
    } catch (err) {
      console.error(err);
      setError(
        err.message ||
          "Error al registrar la venta. Revisa stock, permisos o parámetros del RPC."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Cabecera / metadatos de la venta */}
      <div className="card" style={{ padding: 12, marginTop: 12 }}>
        <div className="form-grid">
          <div>
            <label>Nombre del cliente (opcional)</label>
            <input
              placeholder="Cliente"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
            />
          </div>

          <div>
            <label>Canal</label>
            <select value={channel} onChange={(e) => setChannel(e.target.value)}>
              <option value="whatsapp">WhatsApp</option>
              <option value="tienda">Tienda</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div>
            <label>Método de pago</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label>Notas (opcional)</label>
            <input
              placeholder="Observaciones de la venta…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Buscador de productos */}
      <div style={{ marginTop: 12 }}>
        <ProductSearch onPick={addItem} />
      </div>

      {/* Ítems agregados */}
      <div className="card" style={{ padding: 12, marginTop: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Ítems de la venta</div>

        {!items.length ? (
          <div style={{ opacity: 0.8 }}>Sin ítems. Busca y agrega productos.</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {items.map((it) => (
              <ItemRow
                key={it.product_id}
                it={it}
                onQty={setQty}
                onPrice={setPrice}
                onRemove={removeItem}
              />
            ))}
          </div>
        )}

        {/* Total y acciones */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 12,
            alignItems: "center",
            marginTop: 12,
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 800 }}>
            Total: $ {fmtCOP(total)}
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <button className="btn light" onClick={() => setItems([])} disabled={!items.length}>
              Vaciar
            </button>
            <button className="btn" onClick={save} disabled={!canSave || saving}>
              {saving ? "Guardando..." : "Guardar venta"}
            </button>
          </div>
        </div>

        {error && <div style={{ color: "crimson", marginTop: 8 }}>{error}</div>}
      </div>
    </>
  );
}
