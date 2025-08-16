import Layout from "../components/Layout";
import { useCart } from "../store/CartContext";

const WHATSAPP_NUMBER = "573045378344"; // <-- REEMPLAZA por tu número con indicativo
function buildWhatsAppMessage(items, total) {
  const lines = [];

  // Saludo primero
  lines.push("Hola, me gustaría realizar el siguiente pedido:\n");

  // Lista de productos
  items.forEach(i => {
    lines.push(
      `• ${i.name}${i.size ? ` - Talla: ${i.size}` : ""}${
        i.color ? ` - Color: ${i.color}` : ""
      } x${i.qty} → $${(i.price * i.qty).toLocaleString("es-CO")}`
    );
  });

  // Total
  lines.push(`\nTotal: $${total.toLocaleString("es-CO")}`);

  // Retornar codificado para WhatsApp
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
            {items.map((i) => (
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
                  <small style={{ opacity:.85 }}>
                    {i.size ? `Talla: ${i.size} · ` : ""}
                    {i.color ? `Color: ${i.color} · ` : ""}
                    Cant: {i.qty}
                  </small>
                </div>

                <div className="cart-actions" style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700 }}>
                    ${(i.price * i.qty).toLocaleString("es-CO")}
                  </div>
                  <button className="btn" onClick={() => remove(i.key)} style={{ marginLeft: 8 }}>
                    Quitar
                  </button>
                </div>
              </div>
            ))}
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
