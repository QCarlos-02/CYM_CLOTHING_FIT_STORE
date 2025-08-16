import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import ProductDetail from "./pages/ProductDetail";
import CartPage from "./pages/CartPage";



import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPanel from "./pages/AdminPanel";
import AdminSaleNew from "./pages/AdminSaleNew";
import AdminUsers from "./pages/AdminUsers";        // si hiciste el placeholder
import AdminInventory from "./pages/AdminInventory";// si hiciste el placeholder

import RequireAdmin from "./components/RequireAdmin";
import AdminShell from "./components/admin/AdminShell";
import AdminCategories from "./pages/AdminCategories";
import AdminReports from "./pages/AdminReports";


export default function App(){
  return (
    <Routes>
      {/* Público */}
      <Route path="/" element={<Home />} />
      <Route path="/catalogo" element={<Catalog />} />
      <Route path="/producto/:id" element={<ProductDetail />} />
      <Route path="/carrito" element={<CartPage />} />

      {/* Auth */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Admin (todo en una sola “app” interna) */}
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminShell />
          </RequireAdmin>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="products" element={<AdminPanel />} />
        <Route path="sales/new" element={<AdminSaleNew />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="inventory" element={<AdminInventory />} />
        <Route path="reports" element={<AdminReports />} />

      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
