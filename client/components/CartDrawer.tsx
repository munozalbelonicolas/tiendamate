import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Package,
  Sparkles,
} from "lucide-react";

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    totalPrice,
    totalItems,
    confirmOrder,
  } = useCart();
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
      const order = await confirmOrder(user?.email);
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
      {/* Warm Dim Backdrop */}
      <div
        className="absolute inset-0 bg-[#241F1E]/50 backdrop-blur-xs transition-opacity"
        onClick={() => !loading && setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-8 sm:pl-10">
        <div className="w-screen max-w-md bg-[#FAF7F2] shadow-2xl flex flex-col border-l border-[#EFE8DF]">
          {/* Header */}
          <div className="p-5 bg-white border-b border-[#EFE8DF] flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] border border-[#EFE8DF] flex items-center justify-center text-[#BD532B] shadow-xs">
                <ShoppingBag size={18} className="stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-base font-serif font-bold text-[#241F1E] leading-tight">
                  Tu Carrito
                </h2>
                <p className="text-[11px] text-[#7A6F68]">
                  {totalItems === 0
                    ? "Sin productos seleccionados"
                    : `${totalItems} ${totalItems === 1 ? "artículo" : "artículos"} seleccionados`}
                </p>
              </div>
            </div>

            <button
              onClick={() => !loading && setIsCartOpen(false)}
              className="p-2 rounded-xl text-[#7A6F68] hover:text-[#241F1E] hover:bg-[#FAF7F2] border border-transparent hover:border-[#EFE8DF] transition"
              aria-label="Cerrar carrito"
            >
              <X size={18} />
            </button>
          </div>

          {/* Sub-header banner */}
          <div className="bg-[#FAF7F2] border-b border-[#EFE8DF] px-5 py-2 flex items-center justify-between text-xs text-[#7A6F68]">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles size={12} className="text-[#BD532B]" />
              <span>Piezas y yerbas seleccionadas</span>
            </span>
            <span className="text-[11px] font-semibold text-[#0E6365] bg-[#0E6365]/10 px-2 py-0.5 rounded-full">
              Envíos a todo el país
            </span>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
            {orderCompleted ? (
              <div className="py-16 text-center space-y-4 bg-white rounded-2xl border border-[#EFE8DF] p-6 shadow-xs">
                <div className="w-16 h-16 rounded-full bg-[#0E6365]/10 border border-[#0E6365]/20 flex items-center justify-center mx-auto text-[#0E6365] animate-bounce">
                  <CheckCircle2 size={36} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-serif font-bold text-[#241F1E]">
                    ¡Pedido Generado!
                  </h3>
                  <p className="text-xs text-[#7A6F68]">
                    Número de pedido:
                  </p>
                  <span className="inline-block font-mono font-bold text-[#0E6365] bg-[#0E6365]/10 px-3 py-1 rounded-full text-xs border border-[#0E6365]/20 mt-1">
                    {orderCompleted}
                  </span>
                </div>
                <p className="text-xs text-[#7A6F68] max-w-xs mx-auto leading-relaxed">
                  Redirigiendo de forma segura a la pasarela de pago de Mercado Pago...
                </p>
              </div>
            ) : cart.length === 0 ? (
              <div className="py-16 text-center space-y-4 bg-white rounded-2xl border border-[#EFE8DF] p-8 shadow-xs">
                <div className="w-16 h-16 bg-[#FAF7F2] border border-[#EFE8DF] text-[#BD532B] rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                  <ShoppingBag size={28} className="stroke-[1.8]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-serif font-bold text-[#241F1E]">
                    Tu carrito está vacío
                  </h3>
                  <p className="text-xs text-[#7A6F68] max-w-xs mx-auto leading-relaxed">
                    Explorá nuestros mates de calabaza, bombillas de alpaca y accesorios artesanales para comenzar tu pedido.
                  </p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#BD532B] hover:bg-[#A34320] text-white text-xs font-bold transition shadow-sm"
                >
                  <span>Explorar Productos</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex gap-3.5 p-3.5 bg-white rounded-2xl border border-[#EFE8DF] items-center justify-between shadow-xs hover:border-[#BD532B]/30 transition group"
                >
                  <div className="w-16 h-16 bg-[#FAF7F2] rounded-xl border border-[#EFE8DF] flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {item.product.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="object-cover h-full w-full rounded-lg"
                      />
                    ) : (
                      <Package size={22} className="text-[#BD532B]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-[#241F1E] text-sm truncate group-hover:text-[#BD532B] transition">
                      {item.product.name}
                    </h4>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-[#BD532B] font-bold text-sm">
                        ${item.product.price.toLocaleString("es-AR")}
                      </span>
                      <span className="text-[10px] text-[#7A6F68] font-semibold">ARS</span>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <div className="inline-flex items-center rounded-lg border border-[#EFE8DF] bg-[#FAF7F2] p-0.5">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          disabled={loading}
                          className="w-6 h-6 rounded-md bg-white border border-[#EFE8DF] flex items-center justify-center text-[#7A6F68] hover:text-[#BD532B] hover:bg-[#FAF7F2] text-xs transition disabled:opacity-40 shadow-xs"
                          aria-label="Disminuir cantidad"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="text-xs font-bold w-6 text-center text-[#241F1E]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          disabled={loading}
                          className="w-6 h-6 rounded-md bg-white border border-[#EFE8DF] flex items-center justify-center text-[#7A6F68] hover:text-[#BD532B] hover:bg-[#FAF7F2] text-xs transition disabled:opacity-40 shadow-xs"
                          aria-label="Aumentar cantidad"
                        >
                          <Plus size={11} />
                        </button>
                      </div>

                      <span className="text-[11px] text-stone-400">
                        = ${(item.product.price * item.quantity).toLocaleString("es-AR")}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    disabled={loading}
                    className="text-stone-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl transition"
                    title="Eliminar del carrito"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {cart.length > 0 && !orderCompleted && (
            <div className="p-5 sm:p-6 bg-white border-t border-[#EFE8DF] space-y-4 shadow-[0_-4px_16px_rgba(0,0,0,0.02)]">
              <div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#7A6F68]">
                    Total Estimado
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-serif font-black text-[#BD532B]">
                      ${totalPrice.toLocaleString("es-AR")}
                    </span>
                    <span className="text-xs font-sans font-bold text-[#7A6F68]">ARS</span>
                  </div>
                </div>
                <p className="text-xs text-[#7A6F68] mt-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0E6365]" />
                  Hasta 3 cuotas fijas de{" "}
                  <strong className="text-[#241F1E] font-semibold">
                    ${Math.round(totalPrice / 3).toLocaleString("es-AR")}
                  </strong>{" "}
                  sin interés
                </p>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#BD532B] hover:bg-[#A34320] text-white py-3.5 px-6 rounded-full font-bold text-sm transition shadow-md hover:shadow-lg disabled:opacity-50 active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Conectando con Mercado Pago...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {isAuthenticated ? "Pagar con Mercado Pago" : "Iniciar Sesión para Comprar"}
                    </span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-3 text-[11px] text-[#7A6F68] pt-1">
                <span>🔒 Compra protegida SSL</span>
                <span>•</span>
                <span>🛡️ Mercado Pago oficial</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
