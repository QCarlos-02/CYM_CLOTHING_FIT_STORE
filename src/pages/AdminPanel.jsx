// src/pages/AdminPanel.jsx
import { useEffect, useMemo, useState } from "react";
import { v4 as uuid } from "uuid";
import { supabase } from "../supabase";
import AdminProductTable from "../components/AdminProductTable";

// Utilidad para crear un slug del nombre real (opcional, sólo para legacy)
const slugify = (s) =>
  String(s || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quita tildes
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")                      // espacios -> _
    .replace(/^_+|_+$/g, "");                         // sin _ en bordes

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
    category_id: "",         // ★ clave: esta es la verdad
    gender: "unisex",
    sport: "futbol",
    price: "",
    sizes: "S,M,L,XL",
    colors: "negro,blanco",
    featured: false,
    active: true,
    stock: 0,
  };
  const [form, setForm] = useState(initialForm);

  const [files, setFiles] = useState({ front: null, back: null, full: null });
  const [preview, setPreview] = useState({ front: "", back: "", full: "" });

  const handle = (k, v) => setForm(s => ({ ...s, [k]: v }));
  const pick = (k, file) => {
    setFiles(s => ({ ...s, [k]: file || null }));
    setPreview(p => ({ ...p, [k]: file ? URL.createObjectURL(file) : "" }));
  };

  // categoría seleccionada (para reglas UI, etiquetas, etc.)
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
    setTab("crear");
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

      // Si quieres mantener un texto legacy, DERÍVALO del nombre real (opcional)
      const legacyCategory = selectedCat ? slugify(selectedCat.name) : null;

    // ...dentro de handleSubmit, al armar payload:
const payload = {
  id,
  name: form.name.trim(),
  category_id: form.category_id,   // ★ verdad única
  // category: null,               // puedes omitirlo; si dejas el trigger, se autollenará
  gender: form.gender,
  sport: isUniformes ? (form.sport || "futbol") : null,
  price: Number(form.price),
  sizes: form.sizes.split(",").map(s => s.trim()).filter(Boolean),
  colors: form.colors.split(",").map(c => c.trim()).filter(Boolean),
  images,
  featured: !!form.featured,
  active: !!form.active,
  stock: Number(form.stock || 0),
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
    setForm({
      name: prod.name,
      category_id: prod.category_id || "",  // ★ conservar relación
      gender: prod.gender || "unisex",
      sport: prod.sport || "futbol",
      price: prod.price,
      sizes: (prod.sizes || []).join(","),
      colors: (prod.colors || []).join(","),
      featured: !!prod.featured,
      active: !!prod.active,
      stock: prod.stock || 0,
    });
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
          {/* Fila 1 */}
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
              <label htmlFor="sizes">{isColonias ? "Presentación" : "Tallas"} (coma)</label>
              <input id="sizes" placeholder={isColonias ? "50 ml, 75 ml" : "S,M,L,XL"}
                value={form.sizes} onChange={e => handle("sizes", e.target.value)} />
            </div>

            <div>
              <label htmlFor="colors">Colores (coma)</label>
              <input id="colors" placeholder="negro,blanco"
                value={form.colors} onChange={e => handle("colors", e.target.value)} />
            </div>

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

          {/* Imágenes */}
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
