import { Link } from "react-router-dom";
import styles from "./ProductCard.module.css";

export default function ProductCard({ product, p: pProp }) {
  // Acepta product o p para ser compatible con ambos usos
  const p = product || pProp;
  if (!p) return null; // seguridad por si llega mal

  const frontImg = p.images?.front || p.images?.full || p.images?.back || "";
  const backImg  = p.images?.back  || p.images?.full || p.images?.front || "";

  return (
    <Link to={`/producto/${p.id}`} className={styles.card}>
      <div className={styles.imgWrapper}>
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
        <p className={styles.price}>
          ${Number(p.price).toLocaleString("es-CO")}
        </p>
      </div>
    </Link>
  );
}
