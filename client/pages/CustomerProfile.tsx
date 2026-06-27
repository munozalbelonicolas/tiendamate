import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { LogOut, ShoppingBag, ArrowLeft, Shield, PackageCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CustomerProfile() {
  const { user, logout, isAdmin } = useAuth();
  const { orders } = useCart();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Inicia Sesión</h2>
          <p className="text-gray-600 mb-6">Debes ingresar a tu cuenta para ver tu perfil de usuario.</p>
          <button
            onClick={() => navigate("/login")}
            className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition font-medium text-sm"
          >
            Ir a Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  // Filter orders by active user email or show global session orders
  const customerOrders = orders.filter(
    (order) => !order.userEmail || order.userEmail.toLowerCase() === user.email.toLowerCase()
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 font-medium text-sm transition"
          >
            <ArrowLeft size={18} />
            Volver a la Tienda
          </button>

          {isAdmin && (
            <button
              onClick={() => navigate("/admin")}
              className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-slate-800 transition"
            >
              <Shield size={16} className="text-emerald-400" />
              Panel de Administrador
            </button>
          )}
        </div>
      </header>

      {/* Profile Info */}
      <main className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex items-center gap-6 pb-6 border-b border-gray-100">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-3xl font-bold font-serif">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-500 text-sm">{user.email}</p>
              <span className="inline-block mt-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize">
                Rol: {user.role === "admin" ? "Administrador" : "Cliente"}
              </span>
            </div>
          </div>

          <div className="pt-6 flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-gray-800">Mi Cuenta</h3>
              <p className="text-xs text-gray-500">Gestión de datos personales y sesión activa</p>
            </div>
            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold text-sm bg-red-50 px-4 py-2 rounded-lg transition"
            >
              <LogOut size={18} />
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Dynamic Orders Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center gap-3 mb-6">
            <ShoppingBag className="text-emerald-600" size={24} />
            <h2 className="text-xl font-bold font-serif text-gray-900">Historial de Compras</h2>
          </div>

          {customerOrders.length === 0 ? (
            <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50/50">
              <p className="text-gray-500 text-sm mb-4">Aún no has realizado ninguna compra en TiendaMate.</p>
              <button
                onClick={() => navigate("/")}
                className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition"
              >
                Explorar Catálogo de Mates
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {customerOrders.map((order) => (
                <div key={order.id} className="border border-gray-200 bg-gray-50/70 rounded-xl p-6 space-y-4 shadow-sm">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <PackageCheck className="text-emerald-600" size={20} />
                      <span className="font-mono font-bold text-gray-900">{order.id}</span>
                    </div>
                    <span className="text-xs text-gray-500">{order.date}</span>
                  </div>

                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.product.id} className="flex justify-between text-sm text-gray-800">
                        <span className="font-medium">{item.product.name} (x{item.quantity})</span>
                        <span className="font-bold text-gray-900">${(item.product.price * item.quantity).toLocaleString("es-AR")}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-gray-200 flex justify-between items-center text-base font-bold text-gray-900">
                    <span>Total Pagado:</span>
                    <span className="text-emerald-700 font-bold">${order.total.toLocaleString("es-AR")} ARS</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
