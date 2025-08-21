import Layout from "../components/Layout";
import { useCart } from "../store/CartContext";

const WHATSAPP_NUMBER = "573045378344"; // tu número

function buildWhatsAppMessage(items, total, clienteNombre = "*Tu nombre?*") {
  const lines = [];
  lines.push(`Hola *Clothing Fit*, un gusto saludarlos. Soy ${clienteNombre} \u{1F60A}`);
  lines.push(`Quisiera confirmar el siguiente pedido realizado desde la página:\n`);

  items.forEach(i => {
    // usar SIEMPRE i.price (unitario efectivo con descuento)
    const unit = i.price;
    const sub = unit * i.qty;

    lines.push(
      `• *Producto:* ${i.name}` +
      (i.color ? `\n• *Color:* ${i.color}` : "") +
      (i.size ? `\n• *Talla:* ${i.size}` : "") +
      `\n• *Cantidad:* ${i.qty} unidades` +
      `\n• *Subtotal:* $${sub.toLocaleString("es-CO")}\n`
    );
  });

  lines.push(`*Total:* $${total.toLocaleString("es-CO")}\n`);
  lines.push(`Por favor indíquenme cómo continuar con el proceso de pago y envío.`);
  lines.push(`Muchas gracias por su amable atención \u{1F5A4}`);
  return encodeURIComponent(lines.join("\n"));
}

export default function CartPage() {
  const { items, remove, clear, total } = useCart();
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${buildWhatsAppMessage(items, total)}`;

  return (
    <Layout>
      <h2 className="section-title">Tu carrito</h2>

      {!items.length ? (
        <p style={{ opacity:.85 }}>Tu carrito está vacío.</p>
      ) : (
        <>
          <div style={{ display: "grid", gap: 12 }}>
            {items.map((i) => {
              const hasDiscount =
                (i.discount_price != null && i.discount_price !== "" && Number(i.discount_price) < Number(i.originalPrice)) ||
                (typeof i.discount_percent === "number" && i.discount_percent > 0);

              const unit = i.price;                 // unitario EFECTIVO
              const subtotal = unit * i.qty;

              return (
                <div key={i.key} className="cart-row">
                  <img
                    src={i.image}
                    alt={i.name}
                    loading="lazy"
                    decoding="async"
                    style={{ width:64, height:64, objectFit:"cover", borderRadius:8 }}
                  />

                  <div>
                    <div style={{ fontWeight: 600 }}>{i.name}</div>
                    <small style={{ opacity:.85, display:"block" }}>
                      {i.size ? `Talla: ${i.size} · ` : ""}
                      {i.color ? `Color: ${i.color} · ` : ""}
                      Cant: {i.qty}
                    </small>

                    {/* línea de precios unitarios (muestra tachado si hay descuento) */}
                    <div style={{ fontSize:13 }}>
                      {hasDiscount && (
                        <span style={{ textDecoration:"line-through", color:"var(--muted)", marginRight:8 }}>
                          ${Number(i.originalPrice).toLocaleString("es-CO")}
                        </span>
                      )}
                      <span style={{ fontWeight:700 }}>
                        ${unit.toLocaleString("es-CO")} <small>/u</small>
                      </span>
                      {hasDiscount && typeof i.discount_percent === "number" && i.discount_percent > 0 && (
                        <span style={{
                          marginLeft:8, background:"var(--danger)", color:"#fff",
                          borderRadius:999, fontWeight:800, padding:"1px 6px", fontSize:12
                        }}>
                          -{i.discount_percent}%
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="cart-actions" style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700 }}>
                      ${subtotal.toLocaleString("es-CO")}
                    </div>
                    <button className="btn" onClick={() => remove(i.key)} style={{ marginLeft: 8 }}>
                      Quitar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 12,
              alignItems: "center",
              marginTop: 16,
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              Total: ${total.toLocaleString("es-CO")}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <button className="btn light" onClick={clear}>Vaciar</button>
              <a className="btn" href={waUrl} target="_blank" rel="noreferrer">Pedir por WhatsApp</a>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
