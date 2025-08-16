// src/pages/AdminLogin.jsx
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";
import { ensureProfile } from "../utils/ensureProfile";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  // Si ya está logueado, aseguro perfil y si es admin entro directo
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) return;
      const prof = await ensureProfile();
      if (alive && prof?.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      }
    })();
    return () => { alive = false; };
  }, [navigate]);

  const login = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      // 1) Autenticación
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });
      if (error) throw error;

      // 2) Garantizar perfil
      const prof = await ensureProfile();

      // 3) Validar rol
      if (prof?.role !== "admin") {
        setMsg("Tu usuario no es admin.");
        await supabase.auth.signOut();
        return;
      }

      // 4) Entrar
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setMsg(err.message || "Error al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="auth-wrap">
        <div className="auth-card card">
          <div className="auth-head">
            <div className="auth-icon">🔐</div>
            <h2 className="auth-title">Acceso de administrador</h2>
            <p className="auth-sub">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={login} className="auth-form">
            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="pass">Contraseña</label>
              <input
                id="pass"
                type="password"
                placeholder="••••••••"
                value={pass}
                onChange={e => setPass(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {msg && <div className="auth-msg">{msg}</div>}

            <button className="btn auth-btn" disabled={loading}>
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          <div className="auth-foot">
            <span className="badge">Solo personal autorizado</span>
          </div>
        </div>
      </div>
    </Layout>
  );
}
