import { Link } from "react-router-dom";
import { useState } from "react";
import Layout from "../components/Layout";
import ProductGrid from "../components/ProductGrid";

function FeaturedSection({ title, ...gridProps }) {
  const [count, setCount] = useState(null);
  // Cuando aún no sabemos (count === null) no mostramos nada; cuando sea 0, también ocultamos.
  if (count === 0) return null;

  return (
    <>
      {count > 0 && <h3 className="section-title" style={{ marginTop: 20 }}>{title}</h3>}
      <ProductGrid {...gridProps} silent onCountChange={setCount} />
    </>
  );
}

export default function Home() {
  return (
    <Layout>
      {/* Hero */}
     
       

      {/* Destacados globales (solo aparece si hay) */}
      <FeaturedSection title="Destacados" featured={true} />

      
    </Layout>
  );
}
