import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { customerService } from "@/services/customerService";
import { CustomerNotificationItem } from "@shared/api";
import {
  User,
  ShoppingBag,
  MapPin,
  Heart,
  Tag,
  RotateCcw,
  Bell,
  Shield,
  LogOut,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  MessageCircle,
  HelpCircle,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface CustomerLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export const CustomerLayout: React.FC<CustomerLayoutProps> = ({ children, title, subtitle }) => {
  const { user, logout, isAdmin } = useAuth();
  const { totalItems, setIsCartOpen } = useCart();

  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<CustomerNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications for bell dropdown
  useEffect(() => {
    customerService
      .getNotifications()
      .then((data) => {
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.isRead).length);
      })
      .catch(() => {});
  }, [location.pathname]);

  const handleMarkAllRead = async () => {
    try {
      const updated = await customerService.markAllNotificationsRead();
      setNotifications(updated);
      setUnreadCount(0);
      toast.success("Notificaciones marcadas como leídas");
    } catch {
      toast.error("No se pudieron actualizar las notificaciones");
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Sesión cerrada correctamente");
    navigate("/");
  };

  const navItems = [
    { label: "Mi Resumen", path: "/cuenta", icon: User, exact: true },
    { label: "Mis Pedidos", path: "/cuenta/pedidos", icon: ShoppingBag },
    { label: "Mis Direcciones", path: "/cuenta/direcciones", icon: MapPin },
    { label: "Mis Favoritos", path: "/cuenta/favoritos", icon: Heart },
    { label: "Mis Cupones", path: "/cuenta/cupones", icon: Tag },
    { label: "Devoluciones y Cambios", path: "/cuenta/devoluciones", icon: RotateCcw },
    {
      label: "Notificaciones",
      path: "/cuenta/notificaciones",
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { label: "Mis Datos", path: "/cuenta/perfil", icon: User },
    { label: "Seguridad y Sesiones", path: "/cuenta/seguridad", icon: Shield },
  ];

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      const parts = name.trim().split(" ");
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return "TM";
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#241F1E] flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EFE8DF] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Store Link */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-[#7A6F68] hover:text-[#241F1E] hover:bg-[#FAF7F2] transition"
              aria-label="Menú de cuenta"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <Link to="/" className="flex items-center gap-3 group select-none">
              <div className="flex flex-col leading-none">
                <div className="flex items-baseline leading-none">
                  <span className="font-script text-3xl sm:text-4xl text-[#0E6365] font-bold tracking-tight group-hover:opacity-90 transition">
                    Úno
                  </span>
                  <span className="font-serif font-bold text-xl sm:text-2xl text-[#BD532B] ml-0.5 tracking-tight group-hover:opacity-90 transition">
                    más
                  </span>
                </div>
                <span className="text-[8px] sm:text-[8.5px] uppercase tracking-[0.22em] font-semibold text-stone-500 mt-0.5">
                  ESPACIO NATIVO
                </span>
              </div>
              <span className="hidden sm:inline-block px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider rounded-full bg-[#FAF7F2] text-[#7A6F68] border border-[#EFE8DF]">
                Mi Cuenta
              </span>
            </Link>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/"
              className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-[#7A6F68] hover:text-[#BD532B] transition px-3 py-1.5 rounded-lg hover:bg-[#FAF7F2]"
            >
              ← Volver a la Tienda
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#FAF7F2] text-[#3A3330] hover:text-white border border-[#EFE8DF] hover:bg-[#BD532B] hover:border-[#BD532B] transition group shadow-xs"
                title="Panel de Administración"
              >
                <Shield className="w-3.5 h-3.5 text-[#BD532B] group-hover:text-white transition-colors" />
                <span>Admin</span>
              </Link>
            )}


            {/* Notification Bell with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-xl text-[#7A6F68] hover:text-[#241F1E] hover:bg-[#FAF7F2] transition"
                aria-label="Notificaciones"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#BD532B] text-[10px] font-bold text-white shadow-sm animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-[#EFE8DF] p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DF]">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-[#BD532B]" />
                        <h4 className="font-semibold text-sm text-[#241F1E]">Notificaciones</h4>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-[#BD532B] hover:underline font-medium"
                        >
                          Marcar leídas
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-[#F5EFE6] py-1">
                      {notifications.length === 0 ? (
                        <div className="py-6 text-center text-xs text-[#7A6F68]">
                          No tenés notificaciones pendientes.
                        </div>
                      ) : (
                        notifications.slice(0, 5).map((n) => (
                          <div
                            key={n.id}
                            className={`p-3 text-xs rounded-xl transition ${
                              n.isRead ? "text-[#7A6F68]" : "bg-[#FAF7F2] text-[#241F1E] font-medium"
                            }`}
                          >
                            <p className="font-semibold text-[#241F1E] mb-0.5">{n.title}</p>
                            <p className="line-clamp-2 text-[#7A6F68]">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="pt-2 border-t border-[#EFE8DF] text-center">
                      <Link
                        to="/cuenta/notificaciones"
                        onClick={() => setNotificationsOpen(false)}
                        className="text-xs font-semibold text-[#BD532B] hover:underline block py-1"
                      >
                        Ver todas las notificaciones →
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-xl text-[#7A6F68] hover:text-[#241F1E] hover:bg-[#FAF7F2] transition"
              aria-label="Abrir carrito"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#BD532B] text-[10px] font-bold text-white shadow-sm">
                  {totalItems}
                </span>
              )}
            </button>

            {/* User Avatar Badge */}
            <div className="flex items-center gap-2 pl-2 border-l border-[#EFE8DF]">
              <div className="w-8 h-8 rounded-full bg-[#BD532B]/10 border border-[#BD532B]/30 flex items-center justify-center text-[#BD532B] font-bold text-xs">
                {getInitials(user?.name, user?.email)}
              </div>
              <span className="hidden lg:inline-block text-xs font-semibold text-[#241F1E] max-w-[130px] truncate">
                {user?.name || user?.email?.split("@")[0] || "Cliente"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area with Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Desktop Navigation Sidebar */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="bg-white rounded-2xl border border-[#EFE8DF] shadow-sm p-4 sticky top-24">
              {/* Customer Greeting Header in Sidebar */}
              <div className="p-3 mb-2 bg-[#FAF7F2] rounded-xl border border-[#EFE8DF]/60 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#BD532B] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  {getInitials(user?.name, user?.email)}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs text-[#7A6F68]">Mi cuenta</p>
                  <p className="text-sm font-bold text-[#241F1E] truncate">
                    {user?.name || "Cliente"}
                  </p>
                </div>
              </div>

              {/* Navigation Menu */}
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const isActive = item.exact
                    ? location.pathname === item.path
                    : location.pathname.startsWith(item.path);

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                        isActive
                          ? "bg-[#BD532B] text-white shadow-sm font-semibold"
                          : "text-[#7A6F68] hover:text-[#241F1E] hover:bg-[#FAF7F2]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={`w-4 h-4 ${isActive ? "text-white" : "text-[#7A6F68]"}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                            isActive ? "bg-white text-[#BD532B]" : "bg-[#BD532B] text-white"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}

                <div className="pt-2 border-t border-[#EFE8DF] mt-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              </nav>

              {/* Help & Support Quick Box */}
              <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-[#0E6365]/10 to-[#0E6365]/5 border border-[#0E6365]/20">
                <div className="flex items-center gap-2 mb-1 text-[#0E6365] font-bold text-xs uppercase tracking-wider">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>¿Necesitás ayuda?</span>
                </div>
                <p className="text-xs text-[#7A6F68] mb-3 leading-relaxed">
                  ¿Consultas con tu compra o entrega? Nuestro equipo matero está para ayudarte.
                </p>
                <a
                  href="https://wa.me/5491134567890?text=Hola%20TiendaMate,%20necesito%20ayuda%20con%20mi%20cuenta"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-xl bg-[#0E6365] text-white hover:bg-[#0E6365]/90 transition shadow-sm"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp de Soporte</span>
                </a>
              </div>
            </div>
          </aside>

          {/* Mobile Drawer Navigation */}
          {mobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex">
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
              <div className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-[#EFE8DF] mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#BD532B] text-white flex items-center justify-center font-bold text-sm">
                        {getInitials(user?.name, user?.email)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#241F1E]">{user?.name || "Cliente"}</p>
                        <p className="text-xs text-[#7A6F68]">{user?.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-1 rounded-lg text-[#7A6F68] hover:bg-[#FAF7F2]"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <nav className="space-y-1">
                    {navItems.map((item) => {
                      const isActive = item.exact
                        ? location.pathname === item.path
                        : location.pathname.startsWith(item.path);

                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition ${
                            isActive
                              ? "bg-[#BD532B] text-white font-semibold shadow-sm"
                              : "text-[#7A6F68] hover:bg-[#FAF7F2]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="w-5 h-5" />
                            <span>{item.label}</span>
                          </div>
                          {item.badge !== undefined && (
                            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-white text-[#BD532B]">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                <div className="pt-4 border-t border-[#EFE8DF] space-y-2">
                  <Link
                    to="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl border border-[#EFE8DF] text-[#7A6F68] hover:bg-[#FAF7F2]"
                  >
                    ← Volver a la Tienda
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Workspace */}
          <main className="col-span-1 lg:col-span-9">
            {title && (
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#241F1E] tracking-tight">{title}</h1>
                {subtitle && <p className="text-sm text-[#7A6F68] mt-1">{subtitle}</p>}
              </div>
            )}
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
