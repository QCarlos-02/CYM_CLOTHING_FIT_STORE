import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartCtx = createContext();
const STORAGE_KEY = "cart_v1";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const add = (product, qty = 1, options = {}) => {
    setItems(prev => {
      const key = product.id + "|" + (options.size || "") + "|" + (options.color || "");
      const idx = prev.findIndex(i => i.key === key);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + qty };
        return copy;
      }
      return [...prev, {
        key,
        id: product.id,
        name: product.name,
        price: Number(product.price || 0),
        image: product.images?.front || product.images?.full,
        size: options.size || null,
        color: options.color || null,
        qty
      }];
    });
  };

  const remove = (key) => setItems(prev => prev.filter(i => i.key !== key));
  const clear = () => setItems([]);

  const total = useMemo(() => items.reduce((s, i) => s + i.price * i.qty, 0), [items]);
  const totalCount = useMemo(() => items.reduce((s,i)=> s+i.qty, 0), [items]);

  const value = { items, add, remove, clear, total, totalCount };
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export const useCart = () => useContext(CartCtx);
