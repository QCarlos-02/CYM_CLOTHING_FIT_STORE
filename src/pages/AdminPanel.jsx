// src/pages/AdminPanel.jsx
import { useEffect, useMemo, useState } from "react";
import { v4 as uuid } from "uuid";
import { supabase } from "../supabase";
import AdminProductTable from "../components/AdminProductTable";

const SLUG_TO_LEGACY = {
  uniformes: "uniformes",
  gym_hombre: "gym_hombre",
  gym_mujer: "gym_mujer",
  accesorios: "accesorios",
  colonias: "colonias",
};

export default function AdminPanel() {
  const [tab, setTab] = useState("crear"); // crear | listado
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // categorías (desde BD)
  const [cats, setCats] = useState([]);
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, active")
        .order("name");
      if (!error) setCats(data || []);
    })();
  }, []);

  const initialForm = {
    name: "",
    category_id: "",          // relación (obligatorio seleccionar)
    category: "",             // legacy textual (lo autocompletamos desde el slug)
    gender: "unisex",
    sport: "futbol",
    price: "",
    // legacy ocultos por toggle:
    sizes: "",
    colors: "",
    featured: false,
    active: true,
    stock: 0,
    // 👇 Atributos personalizados (pares etiqueta/valor)
    custom_attrs: [],
  };
  const [form, setForm] = useState(initialForm);

  // Toggle para mostrar/ocultar campos legacy
  const [showLegacy, setShowLegacy] = useState(false);

  // ===== NUEVO: descuento opcional (como un bloque independiente) =====
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountPrice, setDiscountPrice] = useState(""); // COP final

  const [files, setFiles] = useState({ front: null, back: null, full: null });
  const [preview, setPreview] = useState({ front: "", back: "", full: "" });

  const handle = (k, v) => setForm(s => ({ ...s, [k]: v }));
  const pick = (k, file) => {
    setFiles(s => ({ ...s, [k]: file || null }));
    setPreview(p => ({ ...p, [k]: file ? URL.createObjectURL(file) : "" }));
  };

  // categoría seleccionada completa
  const selectedCat = useMemo(
    () => cats.find(c => c.id === form.category_id) || null,
    [cats, form.category_id]
  );

  const isUniformes = selectedCat?.slug === "uniformes";
  const isColonias  = selectedCat?.slug === "colonias";

  // subir imagen a storage
  const uploadImage = async (productId, key, file) => {
    if (!file) return null;
    const path = `${productId}/${key}-${file.name}`.replace(/\s+/g, "_");
    const { data, error } = await supabase.storage
      .from("products")
      .upload(path, file, { cacheControl: "3600", upsert: true });
    if (error) throw error;
    const { data: pub } = supabase.storage.from("products").getPublicUrl(data.path);
    return pub.publicUrl;
  };

  const resetAll = () => {
    setForm(initialForm);
    setFiles({ front: null, back: null, full: null });
    setPreview({ front: "", back: "", full: "" });
    setEditing(null);
    setShowLegacy(false);
    // reset descuento
    setShowDiscount(false);
    setDiscountPrice("");
    setTab("crear");
  };

  // ========= Atributos personalizados (UI) =========
  const addAttr = () => {
    setForm(f => ({ ...f, custom_attrs: [...(f.custom_attrs || []), { label: "", value: "" }] }));
  };
  const updateAttr = (idx, key, val) => {
    setForm(f => ({
      ...f,
      custom_attrs: f.custom_attrs.map((a, i) => i === idx ? { ...a, [key]: val } : a)
    }));
  };
  const removeAttr = (idx) => {
    setForm(f => ({
      ...f,
      custom_attrs: f.custom_attrs.filter((_, i) => i !== idx)
    }));
  };

  // crear / actualizar
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");

    try {
      if (!form.name.trim()) throw new Error("El nombre es obligatorio.");
      if (!form.price || isNaN(Number(form.price))) throw new Error("Precio inválido.");
      if (!form.category_id) throw new Error("Selecciona una categoría.");

      // confirmar rol admin
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      const { data: profile, error: profErr } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", uid || "")
        .maybeSingle();
      if (profErr) throw profErr;
      if (profile?.role !== "admin") throw new Error("Tu usuario no es admin.");

      const id = editing?.id || uuid();
      const images = { ...(editing?.images || {}) };

      if (files.front) images.front = await uploadImage(id, "front", files.front);
      if (files.back)  images.back  = await uploadImage(id, "back",  files.back);
      if (files.full)  images.full  = await uploadImage(id, "full",  files.full);

      // completar legacy category a partir del slug para compatibilidad
      const legacyCategory =
        selectedCat?.slug && SLUG_TO_LEGACY[selectedCat.slug]
          ? SLUG_TO_LEGACY[selectedCat.slug]
          : (form.category || "accesorios");

      // Solo incluimos sizes/colors si activaste el bloque y hay contenido
      const sizesArr  = (showLegacy && form.sizes.trim())
        ? form.sizes.split(",").map(s => s.trim()).filter(Boolean)
        : null;
      const colorsArr = (showLegacy && form.colors.trim())
        ? form.colors.split(",").map(c => c.trim()).filter(Boolean)
        : null;

      // Filtramos atributos personalizados vacíos
      let attrs = (form.custom_attrs || [])
        .map(a => ({ label: (a.label || "").trim(), value: (a.value || "").trim() }))
        .filter(a => a.label.length > 0 || a.value.length > 0);

      // ===== NUEVO: si habilitaste descuento, lo agregamos como atributo dedicado =====
      if (showDiscount) {
        const dp = Number(discountPrice);
        if (isNaN(dp) || dp <= 0) throw new Error("El precio con descuento no es válido.");
        if (Number(form.price) <= dp) throw new Error("El descuento debe ser menor al precio normal.");
        // Eliminamos duplicado previo si existe
        attrs = attrs.filter(a => a.label.toLowerCase() !== "precio con descuento");
        attrs.push({ label: "Precio con descuento", value: String(dp) });
      } else {
        // Si lo apagaste, lo retiramos de custom_attrs
        attrs = attrs.filter(a => a.label.toLowerCase() !== "precio con descuento");
      }

      const payload = {
        id,
        name: form.name.trim(),
        category_id: form.category_id,
        category: legacyCategory,                 // <- legacy
        gender: form.gender,
        sport: isUniformes ? (form.sport || "futbol") : null,
        price: Number(form.price),
        sizes: sizesArr,     // null si no aplica
        colors: colorsArr,   // null si no aplica
        images,
        featured: !!form.featured,
        active: !!form.active,
        stock: Number(form.stock || 0),
        custom_attrs: attrs.length ? attrs : null, // null si no hay
      };

      if (editing) {
        const { error } = await supabase.from("products").update(payload).eq("id", id);
        if (error) throw error;
        alert("✅ Producto actualizado");
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
        alert("✅ Producto creado");
      }

      resetAll();
      setTab("listado");
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Error al guardar el producto.");
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (prod) => {
    setEditing(prod);

    // Buscar si el producto ya trae “Precio con descuento”
    const attrs = Array.isArray(prod.custom_attrs) ? prod.custom_attrs : (prod.custom_attrs || []);
    const discountAttr = attrs.find(a => (a?.label || "").toLowerCase() === "precio con descuento");
    const discountVal = discountAttr ? String(Number(discountAttr.value) || "") : "";

    setForm({
      name: prod.name,
      category_id: prod.category_id || "",
      category: prod.category || "",
      gender: prod.gender || "unisex",
      sport: prod.sport || "futbol",
      price: prod.price,
      sizes: Array.isArray(prod.sizes) ? prod.sizes.join(",") : (prod.sizes || ""),
      colors: Array.isArray(prod.colors) ? prod.colors.join(",") : (prod.colors || ""),
      featured: !!prod.featured,
      active: !!prod.active,
      stock: prod.stock || 0,
      custom_attrs: attrs,
    });

    setShowLegacy(
      (Array.isArray(prod.sizes) && prod.sizes.length > 0) ||
      (typeof prod.sizes === "string" && prod.sizes.trim() !== "") ||
      (Array.isArray(prod.colors) && prod.colors.length > 0) ||
      (typeof prod.colors === "string" && prod.colors.trim() !== "")
    );

    // Prefill descuento
    setShowDiscount(!!discountAttr);
    setDiscountPrice(discountVal);

    setFiles({ front: null, back: null, full: null });
    setPreview({
      front: prod.images?.front || "",
      back:  prod.images?.back  || "",
      full:  prod.images?.full  || "",
    });
    setTab("crear");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
        <button className={`btn ${tab === "crear" ? "" : "light"}`} onClick={() => setTab("crear")}>
          {editing ? "Editar producto" : "Crear producto"}
        </button>
        <button className={`btn ${tab === "listado" ? "" : "light"}`} onClick={() => setTab("listado")}>
          Listado
        </button>
      </div>

      {tab === "crear" && (
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
          {/* fila 1 */}
          <div className="image-grid">
            <div>
              <label htmlFor="name">Nombre del producto</label>
              <input id="name" placeholder="Nombre del producto"
                value={form.name} onChange={e => handle("name", e.target.value)} />
            </div>

            <div>
              <label htmlFor="price">Precio (COP)</label>
              <input id="price" type="number" placeholder="Precio (COP)"
                value={form.price} onChange={e => handle("price", e.target.value)} />
            </div>

            <div>
              <label htmlFor="category_id">Categoría</label>
              <select
                id="category_id"
                value={form.category_id}
                onChange={e => handle("category_id", e.target.value)}
              >
                <option value="">(Elegir categoría)</option>
                {cats.map(c => (
                  <option key={c.id} value={c.id} disabled={!c.active}>
                    {c.name}{!c.active ? " (inactiva)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="gender">Género</label>
              <select id="gender" value={form.gender} onChange={e => handle("gender", e.target.value)}>
                <option value="unisex">Unisex</option>
                <option value="hombre">Hombre</option>
                <option value="mujer">Mujer</option>
              </select>
            </div>

            {isUniformes && (
              <div>
                <label htmlFor="sport">Deporte</label>
                <input id="sport" placeholder="Deporte (ej: fútbol)"
                  value={form.sport} onChange={e => handle("sport", e.target.value)} />
              </div>
            )}

            <div>
              <label htmlFor="stock">Stock</label>
              <input id="stock" type="number" placeholder="Stock"
                value={form.stock} onChange={e => handle("stock", e.target.value)} />
            </div>

            <div style={{ alignSelf: "end" }}>
              <label><input type="checkbox"
                checked={form.featured}
                onChange={e => handle("featured", e.target.checked)} /> Destacado</label>
            </div>
            <div style={{ alignSelf: "end" }}>
              <label><input type="checkbox"
                checked={form.active}
                onChange={e => handle("active", e.target.checked)} /> Activo</label>
            </div>
          </div>

          {/* ========= Descuento (opcional) ========= */}
          {!showDiscount ? (
            <div>
              <button
                type="button"
                className="btn light"
                onClick={() => setShowDiscount(true)}
              >
                + Añadir descuento (opcional)
              </button>
            </div>
          ) : (
            <div className="form-grid" style={{ alignItems:"end" }}>
              <div>
                <label>Descuento — Precio con descuento (COP)</label>
                <input
                  type="number"
                  placeholder="Ej: 159900"
                  value={discountPrice}
                  onChange={(e)=>setDiscountPrice(e.target.value)}
                />
                <small style={{ color:"var(--muted)" }}>
                  Debe ser menor al precio normal.
                </small>
              </div>
              <div>
                <button
                  type="button"
                  className="btn light"
                  onClick={() => { setShowDiscount(false); setDiscountPrice(""); }}
                >
                  Quitar descuento
                </button>
              </div>
            </div>
          )}

          {/* ========= Atributos personalizados ========= */}
          <div className="card" style={{ padding: 12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <strong>Atributos personalizados (opcional)</strong>
              <button type="button" className="btn light" onClick={addAttr}>+ Añadir atributo</button>
            </div>

            {(form.custom_attrs || []).length === 0 ? (
              <div style={{ color: "var(--muted)" }}>
                No hay atributos. Puedes añadir los que necesites (p. ej. “Material”, “Capacidad”, “Garantía”…).
              </div>
            ) : (
              <div style={{ display:"grid", gap:8 }}>
                {(form.custom_attrs || []).map((a, idx) => (
                  <div key={idx} className="form-grid" style={{ alignItems:"end" }}>
                    <div>
                      <label>Etiqueta</label>
                      <input
                        placeholder="Ej: Talla, Color, Material, Presentación…"
                        value={a.label}
                        onChange={(e)=>updateAttr(idx, "label", e.target.value)}
                      />
                    </div>
                    <div>
                      <label>Contenido</label>
                      <input
                        placeholder="Ej: M, Negro, Algodón, 500 ml…"
                        value={a.value}
                        onChange={(e)=>updateAttr(idx, "value", e.target.value)}
                      />
                    </div>
                    <div>
                      <button type="button" className="btn light" onClick={()=>removeAttr(idx)}>Quitar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ========= Tallas / Colores (legacy) ========= */}
          {!showLegacy ? (
            <div>
              <button
                type="button"
                className="btn light"
                onClick={() => setShowLegacy(true)}
              >
                + Añadir tallas/colores (opcional)
              </button>
            </div>
          ) : (
            <div className="form-grid">
              <div>
                <label>{isColonias ? "Presentaciones (legacy)" : "Tallas (legacy)"} — opcional</label>
                <input
                  placeholder={isColonias ? "50 ml, 75 ml, 100 ml" : "S,M,L,XL"}
                  value={form.sizes}
                  onChange={(e) => handle("sizes", e.target.value)}
                />
              </div>
              <div>
                <label>Colores (legacy) — opcional</label>
                <input
                  placeholder="negro,blanco"
                  value={form.colors}
                  onChange={(e) => handle("colors", e.target.value)}
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <button
                  type="button"
                  className="btn light"
                  onClick={() => { setShowLegacy(false); handle("sizes",""); handle("colors",""); }}
                >
                  Quitar campos legacy
                </button>
              </div>
            </div>
          )}

          {/* imágenes */}
          <div className="form-grid">
            <div>
              <label>Imagen frontal</label>
              <input type="file" accept="image/*" onChange={e => pick("front", e.target.files?.[0] || null)} />
              {preview.front && <img src={preview.front} alt="front" style={{ width: "100%", marginTop: 8, borderRadius: 8 }} />}
            </div>

            <div>
              <label>Imagen trasera</label>
              <input type="file" accept="image/*" onChange={e => pick("back", e.target.files?.[0] || null)} />
              {preview.back && <img src={preview.back} alt="back" style={{ width: "100%", marginTop: 8, borderRadius: 8 }} />}
            </div>

            <div>
              <label>Uniforme completo</label>
              <input type="file" accept="image/*" onChange={e => pick("full", e.target.files?.[0] || null)} />
              {preview.full && <img src={preview.full} alt="full" style={{ width: "100%", marginTop: 8, borderRadius: 8 }} />}
            </div>
          </div>

          {errorMsg && <div style={{ color: "crimson" }}>{errorMsg}</div>}

          <div>
            <button className="btn" disabled={saving}>
              {saving ? "Guardando..." : editing ? "Actualizar producto" : "Guardar producto"}
            </button>
            {editing && (
              <button type="button" className="btn light" style={{ marginLeft: 8 }} onClick={resetAll}>
                Cancelar edición
              </button>
            )}
          </div>
        </form>
      )}

      {tab === "listado" && <AdminProductTable onEdit={onEdit} />}
    </>
  );
}
