import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { supabase } from "../supabase";
import { useCart } from "../store/CartContext";

export default function ProductDetail() {
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const { add } = useCart();
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [qty, setQty] = useState(1);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!alive) return;
      if (!error) setP(data);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const isColonias = useMemo(
    () =>
      (p?.category || "").toLowerCase() === "colonias" ||
      (p?.category_id && p?.category_slug === "colonias"),
    [p]
  );

  const labelSizes = isColonias ? "Presentación" : "Tallas";
  const sizesArray = Array.isArray(p?.sizes)
    ? p.sizes
    : (p?.sizes || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
  const colorsArray = Array.isArray(p?.colors)
    ? p.colors
    : (p?.colors || "")
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

  if (loading)
    return (
      <Layout>
        <div>Cargando…</div>
      </Layout>
    );
  if (!p)
    return (
      <Layout>
        <div>Producto no encontrado.</div>
      </Layout>
    );

  return (
    <Layout>
      <h2>{p.name}</h2>

      <div className="product-detail-grid">
        <img
          src={p.images?.full || p.images?.front || p.images?.back}
          alt={p.name}
          className="product-detail-img"
        />

        <div>
          <p>
            <b>Precio:</b> ${Number(p.price).toLocaleString("es-CO")}
          </p>
          <p>
            <b>Categoría:</b> {p.category}
          </p>
          <p>
            <b>Género:</b> {p.gender}
          </p>
          {p.sport && (
            <p>
              <b>Deporte:</b> {p.sport}
            </p>
          )}
          <p>
            <b>{labelSizes}:</b> {sizesArray.join(", ")}
          </p>
          <p>
            <b>Colores:</b> {colorsArray.join(", ")}
          </p>

          {sizesArray.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <label>
                <b>{labelSizes}:</b>&nbsp;
              </label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
              >
                <option value="">Selecciona</option>
                {sizesArray.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          {colorsArray.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <label>
                <b>Color:</b>&nbsp;
              </label>
              <select
                value={color}
                onChange={(e) => setColor(e.target.value)}
              >
                <option value="">Selecciona</option>
                {colorsArray.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ marginTop: 8 }}>
            <label>
              <b>Cantidad:</b>&nbsp;
            </label>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) =>
                setQty(Math.max(1, Number(e.target.value || 1)))
              }
              style={{ width: 90 }}
            />
          </div>

          <button
            className="btn"
            style={{ marginTop: 15 }}
            onClick={() => add(p, qty, { size, color })}
          >
            Añadir al carrito
          </button>
        </div>
      </div>
    </Layout>
  );
}
