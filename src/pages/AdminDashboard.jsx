// src/pages/AdminDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend
} from "recharts";
import { supabase } from "../supabase";

const COLORS = ["#22c55e","#38bdf8","#f97316","#a78bfa","#f43f5e","#eab308"];
const currency = (n) =>
  new Intl.NumberFormat("es-CO", { style:"currency", currency:"COP", maximumFractionDigits:0 })
    .format(Number(n || 0));

export default function AdminDashboard(){
  const [byDay, setByDay]       = useState([]);
  const [byMonth, setByMonth]   = useState([]);
  const [byYear, setByYear]     = useState([]);
  const [byMethod, setByMethod] = useState([]);
  const [cards, setCards]       = useState({ today: 0, month: 0, year: 0 });

  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true); setErr("");
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Bogota";

        const [rCards, d1, d2, d3, d4] = await Promise.all([
          // Tarjetas rápidas (Hoy / Mes / Año) – desde RPC
          supabase.rpc("dash_sales_cards", { p_tz: tz }),
          // Series para las gráficas – desde las vistas
          supabase.from("sales_by_day").select("*"),
          supabase.from("sales_by_month").select("*"),
          supabase.from("sales_by_year").select("*"),
          supabase.from("sales_by_method").select("*"),
        ]);

        if (!alive) return;

        // Manejo de errores de series
        if (d1.error || d2.error || d3.error || d4.error) {
          throw (d1.error || d2.error || d3.error || d4.error);
        }

        // Series
        setByDay(d1.data || []);
        setByMonth(d2.data || []);
        setByYear(d3.data || []);
        setByMethod(d4.data || []);

        // Tarjetas (RPC)
        if (rCards?.error) {
          // Si el RPC no está, lo dejamos en 0 y luego haremos fallback para "Hoy"
          console.warn("dash_sales_cards RPC error:", rCards.error);
          setCards({ today: 0, month: 0, year: 0 });
        } else {
          const row = Array.isArray(rCards.data) ? rCards.data[0] : rCards.data;
          setCards({
            today:  Number(row?.today_revenue  || 0),
            month:  Number(row?.month_revenue  || 0),
            year:   Number(row?.year_revenue   || 0),
          });
        }
      } catch (e) {
        if (!alive) return;
        console.error(e);
        setErr(e.message || "No se pudo cargar el dashboard.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, []);

  // Serie últimos 30 días, completando huecos
  const last30 = useMemo(() => {
    const map = new Map((byDay || []).map(r => [String(r.day), r]));
    const arr = [];
    for(let i=29;i>=0;i--){
      const d = dayjs().subtract(i, "day").format("YYYY-MM-DD");
      const row = map.get(d) || { day:d, orders:0, revenue:0 };
      arr.push({ ...row, label: dayjs(d).format("DD/MM") });
    }
    return arr;
  }, [byDay]);

  // Fallback para “Hoy” si el RPC no existe: tomo el último dato de last30
  const todayRevenue = cards.today || (last30.at(-1)?.revenue || 0);

  // “Este mes” y “Este año” desde RPC (si llegó) o desde vistas como respaldo
  const monthFromView = (byMonth.find(m => String(m.month) === dayjs().format("YYYY-MM"))?.revenue) || 0;
  const yearFromView  = (byYear.find(y => Number(y.year) === dayjs().year())?.revenue) || 0;

  const monthRevenue = cards.month || monthFromView;
  const yearRevenue  = cards.year  || yearFromView;

  // Asegurar % en métodos (si la vista no trae percent lo calculamos)
  const byMethodWithPct = useMemo(() => {
    const total = (byMethod || []).reduce((a, b) => a + Number(b.revenue || 0), 0);
    if (!total) return byMethod || [];
    return (byMethod || []).map(m => ({
      ...m,
      percent: m.percent ?? (Number(m.revenue || 0) / total)
    }));
  }, [byMethod]);

  return (
    <div className="card" style={{ padding:16, display:"grid", gap:16 }}>
      <h2 style={{ margin:0 }}>Dashboard</h2>

      {loading && <div>Cargando…</div>}
      {err && <div style={{ color:"crimson" }}>{err}</div>}

      {!loading && !err && (
        <>
          {/* KPIs */}
          <div
            style={{
              display:"grid",
              gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",
              gap:12
            }}
          >
            <div className="card" style={{ padding:12 }}>
              <div style={{ opacity:.8 }}>Hoy</div>
              <div style={{ fontWeight:800, fontSize:22 }}>
                {currency(todayRevenue)}
              </div>
            </div>
            <div className="card" style={{ padding:12 }}>
              <div style={{ opacity:.8 }}>Este mes</div>
              <div style={{ fontWeight:800, fontSize:22 }}>
                {currency(monthRevenue)}
              </div>
            </div>
            <div className="card" style={{ padding:12 }}>
              <div style={{ opacity:.8 }}>Este año</div>
              <div style={{ fontWeight:800, fontSize:22 }}>
                {currency(yearRevenue)}
              </div>
            </div>
          </div>

          {/* Línea: últimos 30 días */}
          <div className="card" style={{ padding:12 }}>
            <h3 style={{ margin:"0 0 8px" }}>Ingresos últimos 30 días</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={last30}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis tickFormatter={(v) => (v/1000) + "k"} />
                <Tooltip formatter={(v) => currency(v)} />
                <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Barras: por mes */}
          <div className="card" style={{ padding:12 }}>
            <h3 style={{ margin:"0 0 8px" }}>Ingresos por mes</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => (v/1000) + "k"} />
                <Tooltip formatter={(v) => currency(v)} />
                <Bar dataKey="revenue" fill="#38bdf8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Donut: métodos de pago */}
          <div className="card" style={{ padding:12 }}>
            <h3 style={{ margin:"0 0 8px" }}>Métodos de pago</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={byMethodWithPct}
                  dataKey="revenue"
                  nameKey="method"
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={90}
                  label={(d) => `${d.method}: ${Math.round((d.percent || 0)*100)}%`}
                >
                  {byMethodWithPct.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => currency(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
