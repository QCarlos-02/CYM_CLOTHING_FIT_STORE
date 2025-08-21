import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { supabase } from "../supabase";
import { useCart } from "../store/CartContext";

/** Helpers */
const fmtCOP = (n) => Number(n || 0).toLocaleString("es-CO");
const parseMoney = (v) => {
  if (v == null) return null;
  const num = String(v).replace(/[^\d]/g, "");
  return num ? Number(num) : null;
};
const isDiscountLabel = (s = "") =>
  /^(precio\s*con\s*descuento|descuento|precio\s*descuento)$/i.test(
    String(s).trim()
  );

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

  /** --- Descuento desde atributos personalizados --- */
  const discountAttr = (p?.custom_attrs || []).find((a) =>
    isDiscountLabel(a?.label)
  );
  const discountPriceRaw = parseMoney(discountAttr?.value);
  const hasDiscount =
    discountPriceRaw != null &&
    Number(p?.price) > 0 &&
    discountPriceRaw < Number(p?.price);
  const discountPct = hasDiscount
    ? Math.max(
        0,
        Math.round((1 - discountPriceRaw / Number(p.price)) * 100)
      )
    : 0;

  /** Atributos personalizados a mostrar (excluye el de descuento) */
  const publicAttrs = (p?.custom_attrs || []).filter(
    (a) => !isDiscountLabel(a?.label)
  );

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
          {/* ======= BLOQUE DE PRECIOS ======= */}
          <div className="price-wrap">
            {hasDiscount ? (
              <>
                <div className="price-line">
                  <span className="price-label">Precio:</span>
                  <span className="price-old">$ {fmtCOP(p.price)}</span>
                </div>
                <div className="price-line">
                  <span className="price-label">Descuento:</span>
                  <span className="price-new">$ {fmtCOP(discountPriceRaw)}</span>
                  {discountPct > 0 && (
                    <span className="discount-badge">-{discountPct}%</span>
                  )}
                </div>
              </>
            ) : (
              <div className="price-line">
                <span className="price-label">Precio</span>
                <span className="price-new no-discount">
                  $ {fmtCOP(p.price)}
                </span>
              </div>
            )}
          </div>

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

          {/* Detalles / atributos personalizados */}
          {!!publicAttrs.length && (
            <>
              <p style={{ marginTop: 12, fontWeight: 800 }}>Detalles</p>
              <div style={{ display: "grid", gap: 6 }}>
                {publicAttrs.map((a, i) => (
                  <div key={i}>
                    <b>{a.label}:</b> {a.value}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Opcionales legacy visibles solo si existen */}
          {sizesArray.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <label style={{ fontWeight: 800 }}>{labelSizes}:&nbsp;</label>
              <select value={size} onChange={(e) => setSize(e.target.value)}>
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
            <div style={{ marginTop: 12 }}>
              <label style={{ fontWeight: 800 }}>Color:&nbsp;</label>
              <select value={color} onChange={(e) => setColor(e.target.value)}>
                <option value="">Selecciona</option>
                {colorsArray.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <label style={{ fontWeight: 800 }}>Cantidad:&nbsp;</label>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value || 1)))}
              style={{ width: 120 }}
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
