import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import ProductCard from "../productCard/ProductCard";

export default function ProductGrid({
  category,
  gender,
  featured,
  q,
  size,
  color,
  minPrice,
  maxPrice,
  silent = false,
  onCountChange, // <- nuevo
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchProducts = async () => {
      setLoading(true);
      let qy = supabase.from("products").select("*").eq("active", true);

      if (category) qy = qy.eq("category", category);
      if (gender) qy = qy.eq("gender", gender);
      if (featured !== undefined) qy = qy.eq("featured", featured);

      if (q && q.trim()) qy = qy.ilike("name", `%${q.trim()}%`);
      if (minPrice) qy = qy.gte("price", Number(minPrice));
      if (maxPrice) qy = qy.lte("price", Number(maxPrice));
      if (size) qy = qy.contains("sizes", [size]);
      if (color) qy = qy.contains("colors", [color]);

      const { data, error } = await qy.order("created_at", { ascending: false }).limit(60);
      if (!cancelled) {
        const list = error ? [] : (data || []);
        setItems(list);
        setLoading(false);
        if (onCountChange) onCountChange(list.length);
      }
    };
    fetchProducts();
    return () => { cancelled = true; };
  }, [category, gender, featured, q, size, color, minPrice, maxPrice, onCountChange]);

  if (loading) return silent ? null : <div style={{opacity:.8}}>Cargando catálogo…</div>;
  if (!items.length) return silent ? null : <div style={{opacity:.8}}>No hay productos con esos filtros.</div>;

  return (
    <div className="grid-cards">
      {items.map(p => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}
