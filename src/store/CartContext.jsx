// src/store/CartContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartCtx = createContext();
const STORAGE_KEY = "cart_v1";

/** Intenta leer "Precio con descuento" desde custom_attrs */
function readDiscountFromAttrs(product) {
  const attrs = Array.isArray(product?.custom_attrs) ? product.custom_attrs : [];
  const found = attrs.find(
    (a) => (a?.label || "").toLowerCase().trim() === "precio con descuento"
  );
  if (!found) return null;

  const n = Number(found.value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Devuelve el precio unitario EFECTIVO (aplica descuento si existe).
 *  Orden de prioridad:
 *   1) product.discount_price (precio final)
 *   2) custom_attrs["Precio con descuento"]
 *   3) product.discount_percent (porcentaje)
 *   4) product.price (normal)
 */
function getUnitPrice(product) {
  const base = Number(product?.price ?? 0);

  // 1) Campo directo discount_price
  if (product?.discount_price != null && product.discount_price !== "") {
    const d = Number(product.discount_price);
    if (Number.isFinite(d) && d > 0 && d < base) return d;
  }

  // 2) Atributo personalizado "Precio con descuento"
  const fromAttrs = readDiscountFromAttrs(product);
  if (fromAttrs && fromAttrs > 0 && fromAttrs < base) return fromAttrs;

  // 3) Porcentaje
  if (typeof product?.discount_percent === "number" && product.discount_percent > 0) {
    const p = Math.round(base * (1 - product.discount_percent / 100));
    return p > 0 ? p : 0;
  }

  // 4) Normal
  return base;
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  /** Agregar al carrito */
  const add = (product, qty = 1, options = {}) => {
    setItems(prev => {
      const key = product.id + "|" + (options.size || "") + "|" + (options.color || "");
      const idx = prev.findIndex(i => i.key === key);

      // Precio unitario EFECTIVO (ya con descuento si existe)
      const unitPrice = getUnitPrice(product);
      const originalPrice = Number(product?.price ?? 0);

      // Para mostrar badges/line-through guardamos la "fuente" de descuento
      const discountPrice =
        product?.discount_price != null && product.discount_price !== ""
          ? Number(product.discount_price)
          : readDiscountFromAttrs(product); // <- lee del atributo

      const discountPercent =
        typeof product?.discount_percent === "number" ? product.discount_percent : null;

      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          qty: copy[idx].qty + qty,
          price: unitPrice,                 // siempre refrescamos por si cambió
          originalPrice,
          discount_price: discountPrice ?? null,
          discount_percent: discountPercent,
        };
        return copy;
      }

      return [
        ...prev,
        {
          key,
          id: product.id,
          name: product.name,
          image: product.images?.front || product.images?.full || product.images?.back || "",
          size: options.size || null,
          color: options.color || null,
          qty,
          // precio unitario que usaremos en subtotal y total
          price: unitPrice,

          // auxiliares para UI
          originalPrice,
          discount_price: discountPrice ?? null,
          discount_percent: discountPercent,
        }
      ];
    });
  };

  const remove = (key) => setItems(prev => prev.filter(i => i.key !== key));
  const clear = () => setItems([]);

  // Total SIEMPRE usando el unit price efectivo
  const total = useMemo(() => items.reduce((s, i) => s + i.price * i.qty, 0), [items]);
  const totalCount = useMemo(() => items.reduce((s,i)=> s+i.qty, 0), [items]);

  const value = { items, add, remove, clear, total, totalCount };
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export const useCart = () => useContext(CartCtx);
