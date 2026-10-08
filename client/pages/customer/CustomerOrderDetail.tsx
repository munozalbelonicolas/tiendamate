import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { CustomerLayout } from "@/components/customer/CustomerLayout";
import { customerService } from "@/services/customerService";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { CustomerPortalOrder, Product } from "@shared/api";
import {
  ArrowLeft,
  ShoppingBag,
  Truck,
  CheckCircle2,
  Clock,
  Package,
  FileText,
  AlertTriangle,
  RotateCcw,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

export default function CustomerOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, setIsCartOpen } = useCart();
  const { user } = useAuth();

  const [order, setOrder] = useState<CustomerPortalOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancel order modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (id) {
      loadOrder(id);
    }
  }, [id]);

  const loadOrder = async (orderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await customerService.getOrder(orderId);
      setOrder(res);
    } catch (err: any) {
      setError(err.message || "No se pudo cargar la información del pedido.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    setCancelling(true);
    try {
      const res = await customerService.cancelOrder(order.id);
      setOrder(res.order);
      setShowCancelModal(false);
      toast.success(res.message || "Pedido cancelado con éxito.");
    } catch (err: any) {
      toast.error(err.message || "No se pudo cancelar el pedido.");
    } finally {
      setCancelling(false);
    }
  };

  // Re-order validation logic
  const handleReorderItem = (item: any) => {
    if (!item.isAvailable || (item.currentStock !== undefined && item.currentStock <= 0)) {
      toast.error(`El producto "${item.productName}" está agotado temporalmente.`);
      return;
    }

    if (item.currentPrice && item.currentPrice !== item.unitPrice) {
      toast.info(
        `El precio actual de ${item.productName} es de $${item.currentPrice.toLocaleString("es-AR")} (anterior: $${item.unitPrice.toLocaleString("es-AR")}).`
      );
    }

    // Adapt to product shape for cart
    const dummyProduct: Product = {
      id: item.productId,
      name: item.productName,
      slug: `producto-${item.productId}`,
      price: item.currentPrice ?? item.unitPrice,
      stock: item.currentStock ?? 10,
      imageUrl: item.imageUrl || "/placeholder.png",
      categoryId: 1,
      isPublished: true,
      sku: item.productSku,
    };

    addToCart(dummyProduct);
    setIsCartOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "shipped":
        return { label: "En camino", color: "bg-blue-50 text-blue-700 border-blue-200" };
      case "delivered":
        return { label: "Entregado", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "processing":
        return { label: "Preparando pedido", color: "bg-amber-50 text-amber-700 border-amber-200" };
      case "confirmed":
        return { label: "Confirmado", color: "bg-purple-50 text-purple-700 border-purple-200" };
      case "cancelled":
        return { label: "Cancelado", color: "bg-red-50 text-red-700 border-red-200" };
      default:
        return { label: "Pendiente", color: "bg-gray-100 text-gray-700 border-gray-200" };
    }
  };

  const getTimelineStep = (status: string) => {
    if (status === "delivered") return 5;
    if (status === "shipped") return 4;
    if (status === "processing") return 3;
    if (status === "confirmed") return 2;
    return 1;
  };

  const canCancel = order && ["pending", "confirmed"].includes(order.status);
  const isDelivered = order && order.status === "delivered";

  // WhatsApp contextual support link
  const supportMessage = order
    ? encodeURIComponent(
        `Hola Úno más | Espacio Nativo, necesito ayuda con mi pedido #${order.orderNumber} (Usuario: ${user?.email || "Cliente"}).`
      )
    : "";
  const whatsappUrl = `https://wa.me/5491134567890?text=${supportMessage}`;

  return (
    <CustomerLayout>
      {/* Top back navigation */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/cuenta/pedidos"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#7A6F68] hover:text-[#BD532B] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Mis Pedidos</span>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-32 bg-white rounded-3xl border border-[#EFE8DF]" />
          <div className="h-64 bg-white rounded-3xl border border-[#EFE8DF]" />
          <div className="h-44 bg-white rounded-3xl border border-[#EFE8DF]" />
        </div>
      ) : error || !order ? (
        <div className="bg-white rounded-3xl border border-red-200 p-10 text-center max-w-lg mx-auto">
          <p className="text-red-600 font-semibold mb-4">{error || "Pedido no encontrado"}</p>
          <Link
            to="/cuenta/pedidos"
            className="px-5 py-2.5 rounded-xl bg-[#BD532B] text-white text-xs font-bold hover:bg-[#A34320] transition shadow-sm"
          >
            Regresar al listado
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Order Header Card */}
          <div className="bg-white rounded-3xl border border-[#EFE8DF] p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EFE8DF]">
              <div>
                <span className="text-xs text-[#7A6F68] uppercase font-semibold tracking-wider">
                  Detalle del pedido
                </span>
                <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#241F1E] mt-0.5">
                  Pedido #{order.orderNumber}
                </h1>
                <p className="text-xs text-[#7A6F68] mt-1">
                  Comprado el{" "}
                  {new Date(order.createdAt).toLocaleDateString("es-AR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`px-3 py-1.5 text-xs font-bold rounded-full border ${
                    getStatusBadge(order.status).color
                  }`}
                >
                  {getStatusBadge(order.status).label}
                </span>

                {order.invoiceUrl && (
                  <a
                    href={order.invoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#EFE8DF] text-xs font-bold text-[#7A6F68] hover:text-[#241F1E] hover:bg-[#FAF7F2] transition"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Ver Factura</span>
                  </a>
                )}
              </div>
            </div>

            {/* Timeline Progress */}
            <div className="pt-8 pb-4">
              <div className="relative">
                {/* Progress bar */}
                <div className="absolute top-4 left-4 right-4 sm:left-10 sm:right-10 h-1 bg-[#EFE8DF] -z-0">
                  <div
                    className="h-full bg-[#BD532B] transition-all duration-500"
                    style={{
                      width: `${Math.min(100, ((getTimelineStep(order.status) - 1) / 4) * 100)}%`,
                    }}
                  />
                </div>

                {/* Steps */}
                <div className="grid grid-cols-5 relative z-10 text-center">
                  {[
                    { step: 1, label: "Realizado", sub: "Recibido" },
                    { step: 2, label: "Confirmado", sub: "Pago aprobado" },
                    { step: 3, label: "Preparando", sub: "En depósito" },
                    { step: 4, label: "Despachado", sub: "En tránsito" },
                    { step: 5, label: "Entregado", sub: "Destino final" },
                  ].map((s) => {
                    const currentStep = getTimelineStep(order.status);
                    const isDone = s.step <= currentStep;
                    const isCurrent = s.step === currentStep;

                    return (
                      <div key={s.step} className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                            isDone
                              ? "bg-[#BD532B] text-white shadow-sm ring-4 ring-white"
                              : "bg-white text-[#7A6F68] border border-[#EFE8DF]"
                          } ${isCurrent ? "ring-2 ring-[#BD532B]" : ""}`}
                        >
                          {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.step}
                        </div>
                        <span
                          className={`text-xs mt-2 font-semibold hidden sm:block ${
                            isDone ? "text-[#241F1E]" : "text-[#7A6F68]"
                          }`}
                        >
                          {s.label}
                        </span>
                        <span className="text-[10px] text-[#7A6F68] hidden md:block">{s.sub}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Shipping & Tracking Banner */}
          {order.shippingCarrier && (
            <div className="bg-gradient-to-r from-white via-white to-[#FAF7F2] rounded-3xl border border-[#EFE8DF] p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#0E6365]/10 text-[#0E6365] flex items-center justify-center font-bold">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#241F1E]">
                    Envío con {order.shippingCarrier}
                  </h3>
                  <p className="text-xs text-[#7A6F68] mt-0.5">
                    Guía de seguimiento:{" "}
                    <strong className="text-[#241F1E] font-mono">{order.trackingNumber}</strong>
                  </p>
                  {order.estimatedDelivery && (
                    <p className="text-xs font-semibold text-[#0E6365] mt-1">
                      Fecha estimada: {order.estimatedDelivery}
                    </p>
                  )}
                </div>
              </div>

              {order.trackingUrl && (
                <a
                  href={order.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0E6365] text-white text-xs font-bold hover:bg-[#0E6365]/90 transition shadow-sm whitespace-nowrap"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Seguir en {order.shippingCarrier}</span>
                </a>
              )}
            </div>
          )}

          {/* Products Table / Cards */}
          <div className="bg-white rounded-3xl border border-[#EFE8DF] p-6 sm:p-8 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#7A6F68] mb-5">
              Productos comprados ({order.items.length})
            </h3>

            <div className="divide-y divide-[#F5EFE6]">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-16 h-16 rounded-2xl object-cover border border-[#EFE8DF] bg-white flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-[#FAF7F2] border border-[#EFE8DF] flex items-center justify-center text-[#7A6F68] flex-shrink-0">
                        <ShoppingBag className="w-6 h-6 opacity-40" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-[#241F1E]">{item.productName}</h4>
                      {item.productSku && (
                        <p className="text-[11px] text-[#7A6F68]">SKU: {item.productSku}</p>
                      )}
                      <p className="text-xs text-[#7A6F68] mt-1">
                        {item.quantity} un. × ${item.unitPrice.toLocaleString("es-AR")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <span className="text-base font-black text-[#241F1E]">
                      ${item.totalPrice.toLocaleString("es-AR")}
                    </span>

                    {/* Re-order CTA */}
                    <button
                      onClick={() => handleReorderItem(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#EFE8DF] text-xs font-bold text-[#7A6F68] hover:text-[#BD532B] hover:bg-[#FAF7F2] transition shadow-xs"
                      title="Agregar este producto al carrito con precio y stock actualizado"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Volver a comprar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery & Payment Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Delivery address */}
            <div className="bg-white rounded-3xl border border-[#EFE8DF] p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-[#7A6F68]">
                <MapPin className="w-4 h-4 text-[#BD532B]" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Dirección de entrega</h4>
              </div>
              {order.shippingAddress ? (
                <div className="text-xs text-[#241F1E] space-y-1">
                  <p className="font-bold text-sm">
                    {order.shippingAddress.title ? `${order.shippingAddress.title} · ` : ""}
                    {order.shippingAddress.street}{" "}
                    {order.shippingAddress.streetNumber || ""}
                  </p>
                  {order.shippingAddress.floorApt && (
                    <p className="text-[#7A6F68]">{order.shippingAddress.floorApt}</p>
                  )}
                  <p className="text-[#7A6F68]">
                    {order.shippingAddress.city},{" "}
                    {order.shippingAddress.state || "Buenos Aires"}{" "}
                    {order.shippingAddress.postalCode ? `(CP ${order.shippingAddress.postalCode})` : ""}
                  </p>
                  {order.shippingAddress.notes && (
                    <p className="text-[11px] text-[#7A6F68] italic pt-1">
                      Nota: {order.shippingAddress.notes}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#7A6F68]">Información de envío estándar.</p>
              )}
            </div>

            {/* Financial Summary */}
            <div className="bg-white rounded-3xl border border-[#EFE8DF] p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-[#7A6F68]">
                <CreditCard className="w-4 h-4 text-[#0E6365]" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Resumen de pago</h4>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-[#7A6F68]">
                  <span>Subtotal</span>
                  <span>${order.subtotal.toLocaleString("es-AR")}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-[#0E6365] font-semibold">
                    <span>Descuento aplicado</span>
                    <span>-${order.discount.toLocaleString("es-AR")}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#7A6F68]">
                  <span>Costo de envío</span>
                  <span>
                    {order.shippingCost === 0
                      ? "Gratis"
                      : `$${order.shippingCost.toLocaleString("es-AR")}`}
                  </span>
                </div>
                <div className="pt-3 border-t border-[#EFE8DF] flex justify-between items-baseline">
                  <span className="font-bold text-sm text-[#241F1E]">Total abonado</span>
                  <span className="text-lg font-black text-[#241F1E]">
                    ${order.total.toLocaleString("es-AR")}
                  </span>
                </div>
                <p className="text-[11px] text-[#7A6F68] pt-1">
                  Método de pago:{" "}
                  <strong className="capitalize text-[#241F1E]">{order.paymentMethod}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Action Footer: Returns, Cancel, Support */}
          <div className="bg-white rounded-3xl border border-[#EFE8DF] p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-[#0E6365] hover:underline"
              >
                <MessageCircle className="w-4 h-4" />
                <span>¿Necesitás ayuda con este pedido?</span>
              </a>
            </div>

            <div className="flex items-center gap-3">
              {isDelivered && (
                <Link
                  to="/cuenta/devoluciones"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#EFE8DF] text-xs font-bold text-[#7A6F68] hover:text-[#241F1E] hover:bg-[#FAF7F2] transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Solicitar cambio o devolución</span>
                </Link>
              )}

              {canCancel && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Cancelar pedido</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#EFE8DF] animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#241F1E] text-center">
              ¿Querés cancelar este pedido?
            </h3>
            <p className="text-xs text-[#7A6F68] text-center mt-2 leading-relaxed">
              El pedido <strong>#{order.orderNumber}</strong> se cancelará de forma permanente y los
              artículos volverán al inventario disponible.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-xl border border-[#EFE8DF] text-xs font-bold text-[#7A6F68] hover:bg-[#FAF7F2]"
              >
                No cancelar
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition shadow-sm disabled:opacity-50"
              >
                {cancelling ? "Cancelando..." : "Confirmar cancelación"}
              </button>
            </div>
          </div>
        </div>
      )}
    </CustomerLayout>
  );
}
