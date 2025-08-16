import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../supabase";

export default function PrivateRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { if (alive) { setAllowed(false); setLoading(false); } return; }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle();

        if (error) { console.error(error); if (alive) { setAllowed(false); setLoading(false); } return; }
        if (alive) { setAllowed(profile?.role === "admin"); setLoading(false); }
      } catch (e) {
        console.error(e);
        if (alive) { setAllowed(false); setLoading(false); }
      }
    })();
    return () => { alive = false; };
  }, []);

  if (loading) return <main className="container">Cargando...</main>;
  return allowed ? children : <Navigate to="/admin/login" replace />;
}
