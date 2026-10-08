import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import AdminLayout, { AdminTab } from "@/components/admin/AdminLayout";
import DashboardTab from "@/components/admin/tabs/DashboardTab";
import ProductsTab from "@/components/admin/tabs/ProductsTab";
import CategoriesTab from "@/components/admin/tabs/CategoriesTab";
import InventoryTab from "@/components/admin/tabs/InventoryTab";
import OrdersTab from "@/components/admin/tabs/OrdersTab";
import CustomersTab from "@/components/admin/tabs/CustomersTab";
import PromotionsTab from "@/components/admin/tabs/PromotionsTab";
import ReportsTab from "@/components/admin/tabs/ReportsTab";
import UsersTab from "@/components/admin/tabs/UsersTab";
import SettingsTab from "@/components/admin/tabs/SettingsTab";
import { ShieldAlert, ArrowLeft, LogIn } from "lucide-react";

export default function AdminDashboard() {
  const { user, token, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = (searchParams.get("tab") as AdminTab) || "dashboard";
  const [currentTab, setCurrentTab] = useState<AdminTab>(tabParam);

  useEffect(() => {
    if (tabParam && tabParam !== currentTab) {
      setCurrentTab(tabParam);
    }
  }, [tabParam]);

  const handleSelectTab = (tab: AdminTab) => {
    setCurrentTab(tab);
    setSearchParams({ tab });
  };

  // Auth & RBAC Guard with TiendaMate Warm Theme
  if (!token || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] p-4 text-[#241F1E] font-sans">
        <div className="bg-white border border-[#EFE8DF] p-8 rounded-3xl max-w-md w-full text-center shadow-[0_4px_20px_rgba(36,31,30,0.06)] relative overflow-hidden">
          <div className="w-14 h-14 bg-red-50 border border-red-200 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={28} />
          </div>

          <h2 className="text-xl font-serif font-bold text-[#241F1E] mb-2">Acceso Administrativo Requerido</h2>
          <p className="text-xs text-[#7A6F68] mb-6 leading-relaxed">
            {user
              ? `La cuenta Google "${user.email}" no posee permisos de administración autorizados para gestionar este comercio.`
              : "Debes iniciar sesión con una cuenta de Google autorizada para acceder al panel."}
          </p>

          <div className="space-y-3">
            <button
              onClick={() => navigate("/admin/login")}
              className="w-full flex items-center justify-center gap-2 bg-[#BD532B] hover:bg-[#A84520] text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-sm active:scale-[0.99]"
            >
              <LogIn size={15} />
              <span>Iniciar Sesión como Administrador</span>
            </button>

            <button
              onClick={() => navigate("/")}
              className="w-full flex items-center justify-center gap-2 bg-[#F5EFE6] hover:bg-[#EAE1D5] text-[#3A3330] font-semibold py-2.5 px-4 rounded-xl text-xs transition border border-[#E5DDD0]"
            >
              <ArrowLeft size={15} />
              <span>Volver a la Tienda</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout currentTab={currentTab} onSelectTab={handleSelectTab}>
      {currentTab === "dashboard" && <DashboardTab />}
      {currentTab === "products" && <ProductsTab />}
      {currentTab === "categories" && <CategoriesTab />}
      {currentTab === "inventory" && <InventoryTab />}
      {currentTab === "orders" && <OrdersTab />}
      {currentTab === "customers" && <CustomersTab />}
      {currentTab === "promotions" && <PromotionsTab />}
      {currentTab === "reports" && <ReportsTab />}
      {currentTab === "users" && <UsersTab />}
      {currentTab === "settings" && <SettingsTab />}
    </AdminLayout>
  );
}
