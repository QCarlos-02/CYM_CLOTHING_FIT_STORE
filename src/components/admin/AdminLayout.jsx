import Layout from "../Layout";
import AdminMenu from "./AdminMenu";


export default function AdminLayout({ title, actions, children }) {
  return (
    <Layout>
      {/* Barra superior del admin */}
      <div className="admin-topbar">
        <div className="admin-topbar-left">
          <AdminMenu />
          {title ? <h2 className="section-title" style={{ margin: 0 }}>{title}</h2> : null}
        </div>
        <div className="admin-topbar-right">
          {actions}
        </div>
      </div>

      {/* Contenido principal de cada sección */}
      <div style={{ marginTop: 12 }}>
        {children}
      </div>
    </Layout>
  );
}
