import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, X, Plus, Minus, Trash2, CheckCircle2, ArrowRight, Loader2, Package } from "lucide-react";

export default function CartDrawer() {
  const { cart, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, totalPrice, totalItems, confirmOrder } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState<string | null>(null);

  if (!isCartOpen) return null;

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      setIsCartOpen(false);
      navigate("/login", { state: { from: { pathname: "/" } } });
      return;
    }

    setLoading(true);

    try {
      // 1. Register local order history
      const order = confirmOrder(user?.email);
      setOrderCompleted(order.id);

      // 2. Create Mercado Pago preference
      const res = await fetch("/api/checkout/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart }),
      });

      if (res.ok) {
        const data = await res.json();
        const initPoint = data.init_point || data.sandbox_init_point;
        if (initPoint) {
          // Redirect to Mercado Pago checkout
          window.location.href = initPoint;
          return;
        }
      }
    } catch (err) {
      console.error("Error al procesar el pago con Mercado Pago:", err);
    } finally {
      setLoading(false);
      setTimeout(() => {
        setOrderCompleted(null);
        setIsCartOpen(false);
      }, 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => !loading && setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ShoppingBag className="text-emerald-400" size={22} />
              <h2 className="text-lg font-serif font-bold">Tu Carrito ({totalItems})</h2>
            </div>
            <button
              onClick={() => !loading && setIsCartOpen(false)}
              className="text-gray-400 hover:text-white transition p-1"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {orderCompleted ? (
              <div className="py-16 text-center space-y-4">
                <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto animate-bounce" />
                <h3 className="text-2xl font-serif font-bold text-gray-900">¡Pedido Generado!</h3>
                <p className="text-gray-600 text-sm">
                  Número de pedido: <span className="font-mono font-bold text-emerald-700">{orderCompleted}</span>
                </p>
                <p className="text-xs text-gray-500">Redirigiendo a la pasarela de pago de Mercado Pago...</p>
              </div>
            ) : cart.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 bg-stone-100 text-stone-400 rounded-full flex items-center justify-center mx-auto">
                  <ShoppingBag size={28} className="stroke-[1.5] text-stone-400" />
                </div>
                <h3 className="text-lg font-serif font-bold text-gray-900">Tu carrito está vacío</h3>
                <p className="text-gray-500 text-sm max-w-xs mx-auto">
                  Explora nuestros mates y productos artesanales para comenzar tu pedido.
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex gap-4 p-4 bg-stone-50/80 rounded-xl border border-stone-200/60 items-center justify-between"
                >
                  <div className="w-16 h-16 bg-white rounded-lg p-1.5 border border-stone-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {item.product.imageUrl ? (
                      <img src={item.product.imageUrl} alt={item.product.name} className="object-cover h-full w-full rounded" />
                    ) : (
                      <Package size={24} className="text-emerald-700" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm truncate">{item.product.name}</h4>
                    <p className="text-emerald-800 font-bold text-sm">
                      ${item.product.price.toLocaleString("es-AR")} ARS
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        disabled={loading}
                        className="w-6 h-6 rounded bg-white border border-stone-300 flex items-center justify-center text-gray-600 hover:bg-stone-100 text-xs transition"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        disabled={loading}
                        className="w-6 h-6 rounded bg-white border border-stone-300 flex items-center justify-center text-gray-600 hover:bg-stone-100 text-xs transition"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    disabled={loading}
                    className="text-gray-400 hover:text-red-600 transition p-1"
                    title="Eliminar del carrito"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {cart.length > 0 && !orderCompleted && (
            <div className="p-6 bg-stone-50 border-t border-stone-200 space-y-4">
              <div>
                <div className="flex justify-between items-center text-lg font-bold text-gray-900">
                  <span>Total estimado:</span>
                  <span className="text-emerald-800 font-serif text-xl">${totalPrice.toLocaleString("es-AR")} ARS</span>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Hasta 3 cuotas fijas de <strong className="text-stone-700 font-semibold">${Math.round(totalPrice / 3).toLocaleString("es-AR")}</strong> sin interés
                </p>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-emerald-700 text-white py-3.5 px-4 rounded-xl font-bold hover:bg-emerald-800 transition shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Conectando con Mercado Pago...</span>
                  </>
                ) : (
                  <>
                    <span>{isAuthenticated ? "Pagar con Mercado Pago" : "Iniciar Sesión para Comprar"}</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-xs text-stone-500 pt-1">
                <span>🔒 Compra protegida con cifrado SSL</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
