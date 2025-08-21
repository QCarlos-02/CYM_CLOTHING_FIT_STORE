import { Link } from "react-router-dom";
import styles from "./ProductCard.module.css";

/* ===== helpers de descuento ===== */
function readDiscountFromAttrs(p) {
  const attrs = Array.isArray(p?.custom_attrs) ? p.custom_attrs : [];
  const found = attrs.find(
    (a) => (a?.label || "").toLowerCase().trim() === "precio con descuento"
  );
  const n = Number(found?.value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function computePricing(p) {
  const base = Number(p?.price ?? 0);

  // 1) precio final directo
  const dp = p?.discount_price != null && p.discount_price !== ""
    ? Number(p.discount_price)
    : readDiscountFromAttrs(p);

  if (Number.isFinite(dp) && dp > 0 && dp < base) {
    const percent = Math.round((1 - dp / base) * 100);
    return { base, final: dp, percent: percent > 0 ? percent : null };
  }

  // 2) porcentaje
  if (typeof p?.discount_percent === "number" && p.discount_percent > 0) {
    const final = Math.max(0, Math.round(base * (1 - p.discount_percent / 100)));
    return { base, final, percent: p.discount_percent };
  }

  // 3) sin descuento
  return { base, final: base, percent: null };
}

export default function ProductCard({ product, p: pProp }) {
  // acepto "product" o "p" por compatibilidad
  const p = product || pProp;
  if (!p) return null;

  const frontImg = p.images?.front || p.images?.full || p.images?.back || "";
  const backImg  = p.images?.back  || p.images?.full || p.images?.front || "";

  const { base, final, percent } = computePricing(p);
  const hasDiscount = final < base;

  return (
    <Link to={`/producto/${p.id}`} className={styles.card}>
      <div className={styles.imgWrapper}>
        {/* Badge de descuento en la esquina */}
        {hasDiscount && (
          <span className={styles.badge}>
            {percent ? `-${percent}%` : "OFERTA"}
          </span>
        )}

        {/* Cara frontal */}
        <img
          src={frontImg}
          alt={p.name}
          className={`${styles.img} ${styles.front}`}
          loading="lazy"
          decoding="async"
        />

        {/* Cara trasera */}
        <img
          src={backImg}
          alt={p.name}
          className={`${styles.img} ${styles.back}`}
          loading="lazy"
          decoding="async"
        />
      </div>

      <div className={styles.info}>
        <h3 className={styles.name}>{p.name}</h3>

        {/* Precio */}
        <div className={styles.prices}>
          {hasDiscount && (
            <span className={styles.old}>${base.toLocaleString("es-CO")}</span>
          )}
          <span className={`${styles.new} ${!hasDiscount ? styles.noDisc : ""}`}>
            ${final.toLocaleString("es-CO")}
          </span>
        </div>
      </div>
    </Link>
  );
}
