import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Package,
  Layers,
  Boxes,
  ShoppingBag,
  Users,
  Tag,
  BarChart3,
  ShieldCheck,
  Settings,
  LogOut,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Menu,
  X,
  ChevronRight,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

export type AdminTab =
  | "dashboard"
  | "products"
  | "categories"
  | "inventory"
  | "orders"
  | "customers"
  | "promotions"
  | "reports"
  | "users"
  | "settings";

interface AdminLayoutProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  children: React.ReactNode;
}

export default function AdminLayout({
  currentTab,
  onSelectTab,
  children,
}: AdminLayoutProps) {
  const { user, role, token, logout, envInfo, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resettingDemo, setResettingDemo] = useState(false);

  const isDemo = envInfo?.isDemo ?? true;

  const handleResetDemo = async () => {
    if (!window.confirm("¿Deseas reiniciar la base de datos de demostración con los valores iniciales?")) {
      return;
    }

    setResettingDemo(true);
    try {
      const res = await fetch("/api/admin/demo/reset", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Error al reiniciar");
      }

      toast.success("Base de datos DEMO restablecida con éxito.");
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Error al restablecer base de datos.");
    } finally {
      setResettingDemo(false);
    }
  };

  const navItems: Array<{
    id: AdminTab;
    label: string;
    icon: any;
    permission?: string;
  }> = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "products", label: "Productos", icon: Package, permission: "products.read" },
    { id: "categories", label: "Categorías", icon: Layers, permission: "products.read" },
    { id: "inventory", label: "Inventario", icon: Boxes, permission: "inventory.manage" },
    { id: "orders", label: "Pedidos", icon: ShoppingBag, permission: "orders.read" },
    { id: "customers", label: "Clientes", icon: Users, permission: "customers.read" },
    { id: "promotions", label: "Promociones", icon: Tag, permission: "settings.manage" },
    { id: "reports", label: "Reportes", icon: BarChart3, permission: "reports.read" },
    { id: "users", label: "Usuarios y Permisos", icon: ShieldCheck, permission: "users.manage" },
    { id: "settings", label: "Configuración", icon: Settings, permission: "settings.manage" },
  ];

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: "bg-[#0E6365]/10 text-[#0E6365] border-[#0E6365]/30",
    ADMIN: "bg-[#BD532B]/10 text-[#BD532B] border-[#BD532B]/30",
    MANAGER: "bg-blue-50 text-blue-800 border-blue-200",
    OPERADOR: "bg-amber-50 text-amber-800 border-amber-200",
    VIEWER: "bg-stone-100 text-stone-700 border-stone-200",
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#241F1E] flex flex-col font-sans selection:bg-[#BD532B] selection:text-white">
      {/* ── Top Announcement Bar (Terracota Idéntico a la Tienda) ── */}
      <div className="bg-[#BD532B] text-white text-xs py-2 px-4 border-b border-[#A7441E] z-30">
        <div className="container mx-auto flex justify-between items-center text-center sm:text-left">
          <div className="flex items-center gap-2 font-medium">
            <Truck size={14} className="text-white/90" />
            <span>Panel de Administración — TiendaMate Oficial</span>
          </div>

          <div className="flex items-center gap-3">
            {isDemo && (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block font-medium text-white/90">
                  Entorno de demostración activo
                </span>
                <button
                  onClick={handleResetDemo}
                  disabled={resettingDemo}
                  className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-2.5 py-0.5 rounded-full text-[11px] font-bold transition disabled:opacity-50"
                >
                  <RefreshCw size={11} className={resettingDemo ? "animate-spin" : ""} />
                  <span>{resettingDemo ? "Restableciendo..." : "Restablecer datos DEMO"}</span>
                </button>
              </div>
            )}

            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1 text-white/90 hover:text-white font-semibold text-[11px] transition pl-3 border-l border-white/30"
              title="Abrir tienda pública"
            >
              <span>Ver Tienda</span>
              <ExternalLink size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar (Estilo TiendaMate) */}
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[#EFE8DF] shadow-[1px_0_4px_rgba(0,0,0,0.02)] shrink-0">
          {/* Brand Header */}
          <div className="p-5 border-b border-[#EFE8DF] flex items-center justify-between">
            <div
              onClick={() => navigate("/")}
              className="cursor-pointer flex flex-col leading-none select-none group"
            >
              <div className="flex items-baseline leading-none">
                <span className="font-script text-3xl text-[#0E6365] font-bold tracking-tight">
                  Úno
                </span>
                <span className="font-serif font-bold text-2xl text-[#BD532B] ml-0.5 tracking-tight">
                  más
                </span>
              </div>
              <span className="text-[8.5px] uppercase tracking-[0.22em] font-semibold text-[#8C7D73] mt-0.5">
                PANEL DE CONTROL
              </span>
            </div>

            <button
              onClick={() => navigate("/")}
              title="Abrir tienda pública"
              className="p-1.5 text-[#7A6F68] hover:text-[#BD532B] hover:bg-[#FAF7F2] rounded-lg transition"
            >
              <ExternalLink size={16} />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              if (item.permission && !hasPermission(item.permission as any)) {
                return null;
              }

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition ${
                    isActive
                      ? "bg-[#BD532B] text-white font-bold shadow-[0_2px_8px_rgba(189,83,43,0.22)]"
                      : "text-[#5A4F48] hover:text-[#BD532B] hover:bg-[#FAF7F2] font-medium"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={17} className={isActive ? "text-white" : "text-[#7A6F68]"} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight size={14} className="text-white" />}
                </button>
              );
            })}
          </nav>

          {/* User Profile Box */}
          <div className="p-4 border-t border-[#EFE8DF] bg-[#FAF7F2]/60">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-[#E5DDD0] border border-[#D5C9B8] flex items-center justify-center overflow-hidden shrink-0">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-[#BD532B]">
                    {user?.name?.charAt(0).toUpperCase() || "A"}
                  </span>
                )}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-bold text-[#241F1E] truncate">{user?.name || "Administrador"}</p>
                <p className="text-[11px] text-[#7A6F68] truncate">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${
                  roleColors[role || "ADMIN"] || roleColors.ADMIN
                }`}
              >
                {role || "ADMIN"}
              </span>

              <button
                onClick={logout}
                title="Cerrar sesión"
                className="flex items-center gap-1 text-[11px] font-semibold text-[#8C7D73] hover:text-red-600 transition"
              >
                <LogOut size={13} />
                <span>Salir</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header */}
          <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-[#EFE8DF]">
            <div className="flex items-baseline leading-none">
              <span className="font-script text-3xl text-[#0E6365] font-bold">Úno</span>
              <span className="font-serif font-bold text-2xl text-[#BD532B] ml-0.5">más</span>
              <span className="text-[9px] uppercase tracking-wider font-semibold text-[#8C7D73] ml-2">Admin</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#5A4F48] hover:text-[#BD532B]"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </header>

          {/* Mobile Drawer */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-white border-b border-[#EFE8DF] p-4 space-y-1 z-20 shadow-md">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                      isActive ? "bg-[#BD532B] text-white" : "text-[#5A4F48] hover:bg-[#FAF7F2]"
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              <div className="pt-3 mt-2 border-t border-[#EFE8DF] flex justify-between items-center text-xs">
                <span className="text-[#7A6F68]">{user?.email}</span>
                <button onClick={logout} className="text-red-600 font-bold">
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}

          {/* Main Module Content Canvas */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#FAF7F2]">
            <div className="max-w-7xl mx-auto space-y-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
