// src/utils/ensureProfile.js
import { supabase } from "../supabase";

export async function ensureProfile() {
  const { data: { session } } = await supabase.auth.getSession();
  const uid = session?.user?.id;
  if (!uid) return null;

  // Lee el perfil (la más reciente por si acaso)
  const { data: prof } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("id", uid)
    .limit(1)
    .maybeSingle();

  if (prof) return prof;

  // Si no existe, lo crea
  const payload = {
    id: uid,
    email: session.user.email ?? null,
    role: "user", // por defecto
  };

  const { data: up, error: upErr } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select()
    .maybeSingle();

  if (upErr) throw upErr;
  return up;
}
