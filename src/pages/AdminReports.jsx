// src/pages/AdminReports.jsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase";
import Logo2 from "../assets/LOGO2.png"; // <-- tu logo

/* ========= helpers ========= */
const toISO = (d) =>
  typeof d === "string" ? d : new Date(d).toISOString().slice(0, 10);
const fmtCOP = (n) =>
  new Intl.NumberFormat("es-CO").format(Math.round(Number(n || 0)));

const METHODS = [
  { v: "", label: "(Todos)" },
  { v: "efectivo", label: "Efectivo" },
  { v: "nequi", label: "Nequi" },
  { v: "Bancolombia", label: "Bancolombia" },
  { v: "daviplata", label: "Daviplata" },
  { v: "tarjeta", label: "Tarjeta" },
  { v: "Otro", label: "Otro" },
];

export default function AdminReports() {
  const today = new Date();
  const d14 = new Date();
  d14.setDate(today.getDate() - 12);

  const [from, setFrom] = useState(toISO(d14));
  const [to, setTo] = useState(toISO(today));
  const [method, setMethod] = useState("");

  const [daily, setDaily] = useState([]);
  const [byProduct, setByProduct] = useState([]);
  const [byMethod, setByMethod] = useState([]);
  const [totals, setTotals] = useState({ orders: 0, units: 0, revenue: 0 });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const toPlusOne = new Date(to);
      toPlusOne.setDate(toPlusOne.getDate() + 1);

      const args = {
        p_from: from,
        p_to: toISO(toPlusOne),
        p_method: method || null,
      };

      const [r1, r2, r3, r4] = await Promise.all([
        supabase.rpc("report_sales_daily", args),
        supabase.rpc("report_sales_by_product", args),
        supabase.rpc("report_sales_by_method", args),
        supabase.rpc("report_sales_totals", args),
      ]);

      if (r1.error) throw r1.error;
      if (r2.error) throw r2.error;
      if (r3.error) throw r3.error;
      if (r4.error) throw r4.error;

      setDaily(r1.data || []);
      setByProduct(r2.data || []);
      setByMethod(r3.data || []);
      const t = Array.isArray(r4.data) ? r4.data[0] : r4.data;
      setTotals({
        orders: t?.orders || 0,
        units: t?.units || 0,
        revenue: t?.revenue || 0,
      });
    } catch (e) {
      console.error(e);
      setErr(e.message || "Error cargando el reporte.");
    } finally {
      setLoading(false);
    }
  }

  const canExport = useMemo(
    () => !loading && (daily.length || byProduct.length || byMethod.length),
    [loading, daily, byProduct, byMethod]
  );

  /* ====== estilos inline ====== */
  const rojoLogo = "#8f1414ff";
  const tableBase = {
    width: "100%",
    borderCollapse: "collapse",
    tableLayout: "fixed",
  };
  const thLeft = {
    textAlign: "left",
    padding: 8,
    background: rojoLogo,
    color: "#fff",
  };
  const thCenter = {
    textAlign: "center",
    padding: 8,
    background: rojoLogo,
    color: "#fff",
  };
  const tdLeft = { textAlign: "left", padding: 8 };
  const tdCenter = { textAlign: "center", padding: 8 };

  /* ========= Exportar a PDF ========= */
  const exportPdf = () => {

    
    const w = window.open("", "_blank");
    if (!w) {
      alert("Permite ventanas emergentes para exportar el PDF.");
      return;
    }

    const methodLabel =
      METHODS.find((m) => m.v === method)?.label || "Todos";

    const totalsLine = `Totales — Pedidos: ${totals.orders} · Unidades: ${totals.units} · Ingresos: $ ${fmtCOP(
      totals.revenue
    )}`;

    const th = (arr) => `<tr>${arr.map((h) => `<th>${h}</th>`).join("")}</tr>`;
    const tr = (arr) => `<tr>${arr.map((c) => `<td>${c}</td>`).join("")}</tr>`;

    const dailyTbl = `
      <table class="tbl">
        ${th(["Fecha", "Pedidos", "Unidades", "Ingresos"])}
        ${
          daily.length
            ? daily
                .map((d) =>
                  tr([
                    d.date || d["date"],
                    d.orders,
                    d.units,
                    `$ ${fmtCOP(d.revenue)}`,
                  ])
                )
                .join("")
            : tr([`Sin datos.`, "", "", ""])
        }
      </table>`;

    const productTbl = `
      <table class="tbl">
        ${th(["Producto", "Unidades", "Ingresos"])}
        ${
          byProduct.length
            ? byProduct
                .map((p) => tr([p.name, p.units, `$ ${fmtCOP(p.revenue)}`]))
                .join("")
            : tr([`Sin datos.`, "", ""])
        }
      </table>`;

    const methodTbl = `
      <table class="tbl">
        ${th(["Método", "Pedidos", "Ingresos"])}
        ${
          byMethod.length
            ? byMethod
                .map((m) => tr([m.method, m.orders, `$ ${fmtCOP(m.revenue)}`]))
                .join("")
            : tr([`Sin datos.`, "", ""])
        }
      </table>`;

    const logoUrl = Logo2;

    const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<title>Reporte de ventas</title>
<style>
  :root{
    --ink:#0f172a; --muted:#64748b; --row:#f8fafc;
    --brand:${rojoLogo}; --accent:#10b981;
  }
  @page{ size: A4 portrait; margin: 14mm; }
  body{
    font-family: ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;
    color: var(--ink); font-size: 12px;
  }
  header{ display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; gap: 12px; }
  .brand-left { display:flex; align-items:center; gap: 10px; }
  .brand-left img { height: 150px; }
  .brand-title { font-weight:800; font-size:16px; line-height:1.2; }
  .brand-sub { font-weight:600; color:var(--brand); font-size:12px; }
  .meta{ color:var(--muted); text-align:right; }
  h2{ font-size:14px; margin:18px 0 8px; }
  .tot{ font-weight:700; margin: 10px 0 14px; }

  .tbl{ width:100%; border-collapse:collapse; table-layout: fixed; }
  .tbl th, .tbl td{ padding:8px 10px; border-bottom:1px solid #ebe5e5ff; }
  .tbl th{ text-align:left; background:var(--brand); color:#fff; }
  .tbl tr:nth-child(even) td{ background:var(--row); }

  .section{ break-inside: avoid; margin-bottom: 12px; }

  footer{
    position: fixed; bottom: 10mm; left:0; right:0;
    text-align: right; color: var(--muted); font-size: 11px;
  }
  .page-number:after{ content: counter(page) "/" counter(pages); }
</style>
</head>
<body>
  <header>
    <div class="brand-left">
      <img src="${logoUrl}" alt="C&M CLOTHING FIT" />
      <div>
        <div class="brand-title">C&M CLOTHING FIT</div>
        <div class="brand-sub">Reporte de ventas</div>
      </div>
    </div>
    <div class="meta">
      Desde: ${from} · Hasta: ${to} · Método: ${methodLabel}<br/>
      Generado: ${new Date().toLocaleString()}
    </div>
  </header>

  <div class="tot">${totalsLine}</div>

  <div class="section">
    <h2>Diario</h2>
    ${dailyTbl}
  </div>

  <div class="section">
    <h2>Top productos</h2>
    ${productTbl}
  </div>

  <div class="section">
    <h2>Métodos de pago</h2>
    ${methodTbl}
  </div>

  <footer>Página <span class="page-number"></span></footer>
</body>
</html>`;

    w.document.open();
    w.document.write(html);
    w.document.close();
    w.onload = () => {
      w.focus();
      setTimeout(() => w.print(), 50);
    };
  };

  return (
    <>
      <div style={{ padding: 12, display: "grid", gap: 10 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div>
            <label style={{ display: "block", fontWeight: 700, marginBottom: 4 }}>
              Desde
            </label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>

          <div>
            <label style={{ display: "block", fontWeight: 700, marginBottom: 4 }}>
              Hasta
            </label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>

          <div>
            <label style={{ display: "block", fontWeight: 700, marginBottom: 4 }}>
              Método de pago
            </label>
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              {METHODS.map((m) => (
                <option key={m.v} value={m.v}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={load} disabled={loading}>
            {loading ? "Cargando…" : "Actualizar"}
          </button>
          <button onClick={exportPdf} disabled={!canExport}>
            Exportar PDF
          </button>
        </div>

        {err && <div style={{ color: "crimson" }}>{err}</div>}
      </div>

      <div style={{ padding: 12, fontWeight: 800 }}>
        Totales — Pedidos: {totals.orders} · Unidades: {totals.units} · Ingresos: $ {fmtCOP(totals.revenue)}
      </div>

      <section style={{ padding: 12 }}>
        <h3>Diario</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={tableBase}>
            <thead>
              <tr>
                <th style={{ ...thLeft, width: "40%" }}>Fecha</th>
                <th style={{ ...thCenter, width: "20%" }}>Pedidos</th>
                <th style={{ ...thCenter, width: "20%" }}>Unidades</th>
                <th style={{ ...thCenter, width: "20%" }}>Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {!daily.length ? (
                <tr>
                  <td colSpan={4} style={tdLeft}>Sin datos.</td>
                </tr>
              ) : (
                daily.map((d) => (
                  <tr key={d.date || d["date"]}>
                    <td style={tdLeft}>{d.date || d["date"]}</td>
                    <td style={tdCenter}>{d.orders}</td>
                    <td style={tdCenter}>{d.units}</td>
                    <td style={tdCenter}>$ {fmtCOP(d.revenue)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ padding: 12 }}>
        <h3>Top productos</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={tableBase}>
            <thead>
              <tr>
                <th style={{ ...thLeft, width: "60%" }}>Producto</th>
                <th style={{ ...thCenter, width: "20%" }}>Unidades</th>
                <th style={{ ...thCenter, width: "20%" }}>Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {!byProduct.length ? (
                <tr>
                  <td colSpan={3} style={tdLeft}>Sin datos.</td>
                </tr>
              ) : (
                byProduct.map((p) => (
                  <tr key={p.name}>
                    <td style={tdLeft}>{p.name}</td>
                    <td style={tdCenter}>{p.units}</td>
                    <td style={tdCenter}>$ {fmtCOP(p.revenue)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ padding: 12 }}>
        <h3>Métodos de pago</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={tableBase}>
            <thead>
              <tr>
                <th style={{ ...thLeft, width: "60%" }}>Método</th>
                <th style={{ ...thCenter, width: "20%" }}>Pedidos</th>
                <th style={{ ...thCenter, width: "20%" }}>Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {!byMethod.length ? (
                <tr>
                  <td colSpan={3} style={tdLeft}>Sin datos.</td>
                </tr>
              ) : (
                byMethod.map((m) => (
                  <tr key={m.method}>
                    <td style={tdLeft}>{m.method}</td>
                    <td style={tdCenter}>{m.orders}</td>
                    <td style={tdCenter}>$ {fmtCOP(m.revenue)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
