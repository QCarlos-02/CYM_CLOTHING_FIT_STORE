import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../supabase";
import { ensureProfile } from "../utils/ensureProfile";

export default function RequireAdmin({ children }) {
  const [status, setStatus] = useState("checking"); // 'checking' | 'ok' | 'noauth' | 'norole'

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        if (alive) setStatus("noauth");
        return;
      }

      await ensureProfile();

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!alive) return;
      setStatus(profile?.role === "admin" ? "ok" : "norole");
    })();
    return () => { alive = false; };
  }, []);

  if (status === "checking") return <div style={{ padding:16 }}>Cargando…</div>;
  if (status === "noauth") return <Navigate to="/admin/login" replace />;
  if (status === "norole") return <div style={{ padding:16 }}>No tienes permisos de administrador.</div>;

  return children;
}
