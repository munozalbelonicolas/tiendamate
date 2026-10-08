import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { CustomerLayout } from "@/components/customer/CustomerLayout";
import { customerService } from "@/services/customerService";
import { CustomerReturnRequest, CustomerPortalOrder } from "@shared/api";
import {
  RotateCcw,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  AlertTriangle,
  HelpCircle,
  X,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";

export default function CustomerReturns() {
  const [searchParams] = useSearchParams();
  const preselectedOrderId = searchParams.get("orderId");

  const [returns, setReturns] = useState<CustomerReturnRequest[]>([]);
  const [orders, setOrders] = useState<CustomerPortalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Return Modal State
  const [modalOpen, setModalOpen] = useState(Boolean(preselectedOrderId));
  const [selectedOrderId, setSelectedOrderId] = useState<number | "">(
    preselectedOrderId ? Number(preselectedOrderId) : ""
  );
  const [selectedProductId, setSelectedProductId] = useState<number | "">("");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState<
    "defective" | "wrong_item" | "not_as_expected" | "wrong_size" | "other"
  >("defective");
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [returnsData, ordersData] = await Promise.all([
        customerService.getReturns(),
        customerService.getOrders("all"),
      ]);
      setReturns(returnsData);
      setOrders(ordersData);

      if (preselectedOrderId) {
        const matchingOrder = ordersData.find((o) => o.id === Number(preselectedOrderId));
        if (matchingOrder && matchingOrder.items.length > 0) {
          setSelectedOrderId(matchingOrder.id);
          setSelectedProductId(matchingOrder.items[0].productId);
        }
      }
    } catch (err: any) {
      setError(err.message || "No pudimos cargar tus devoluciones.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return { label: "Aprobada", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle };
      case "rejected":
        return { label: "Rechazada", color: "bg-red-50 text-red-700 border-red-200", icon: XCircle };
      case "refunded":
        return { label: "Reembolso realizado", color: "bg-purple-50 text-purple-700 border-purple-200", icon: CheckCircle };
      case "item_received":
        return { label: "Producto recibido", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Package };
      case "under_review":
        return { label: "En revisión", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock };
      default:
        return { label: "Solicitud enviada", color: "bg-gray-100 text-gray-700 border-gray-200", icon: Clock };
    }
  };

  const getReasonLabel = (r: string) => {
    switch (r) {
      case "defective":
        return "Producto defectuoso / daño de fábrica";
      case "wrong_item":
        return "Producto incorrecto recibido";
      case "not_as_expected":
        return "No era lo que esperaba";
      case "wrong_size":
        return "Talle o tamaño inadecuado";
      default:
        return "Otro motivo";
    }
  };

  const selectedOrder = orders.find((o) => o.id === Number(selectedOrderId));

  const handleOrderChange = (orderId: number) => {
    setSelectedOrderId(orderId);
    const ord = orders.find((o) => o.id === orderId);
    if (ord && ord.items.length > 0) {
      setSelectedProductId(ord.items[0].productId);
      setQuantity(1);
    }
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || !selectedProductId) {
      toast.error("Seleccioná el pedido y el producto a devolver.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await customerService.createReturn({
        orderId: Number(selectedOrderId),
        productId: Number(selectedProductId),
        quantity,
        reason,
        comments,
      });

      setReturns(res.returns);
      setModalOpen(false);
      setComments("");
      toast.success("Solicitud de devolución enviada correctamente.", {
        description: "Nuestro equipo la revisará dentro de las próximas 24 horas hábiles.",
      });
    } catch (err: any) {
      toast.error(err.message || "Error al enviar la solicitud.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CustomerLayout
      title="Devoluciones y Cambios"
      subtitle="Gestioná cambios de productos y devoluciones con total respaldo y garantía."
    >
      {/* Top Banner & Action */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="bg-white px-4 py-2.5 rounded-2xl border border-[#EFE8DF] shadow-xs inline-flex items-center gap-2 text-xs text-[#7A6F68]">
          <HelpCircle className="w-4 h-4 text-[#0E6365]" />
          <span>Tenés hasta 30 días corridos luego de recibir tu compra para solicitar cambio.</span>
        </div>

        <button
          onClick={() => {
            if (orders.length > 0) {
              setSelectedOrderId(orders[0].id);
              setSelectedProductId(orders[0].items[0]?.productId || "");
            }
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#BD532B] text-white text-xs font-bold hover:bg-[#A34320] transition shadow-sm whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Solicitar devolución o cambio</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="h-36 bg-white rounded-3xl border border-[#EFE8DF]" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-white rounded-3xl border border-red-200 p-8 text-center max-w-lg mx-auto">
          <p className="text-red-600 font-semibold mb-3">{error}</p>
          <button
            onClick={loadData}
            className="px-5 py-2.5 rounded-xl bg-[#BD532B] text-white text-xs font-bold hover:bg-[#A34320] transition shadow-sm"
          >
            Intentar nuevamente
          </button>
        </div>
      ) : returns.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#EFE8DF] p-12 text-center shadow-sm">
          <RotateCcw className="w-12 h-12 mx-auto text-[#BD532B]/40 mb-3" />
          <h3 className="text-base font-bold text-[#241F1E]">No tenés solicitudes de devolución</h3>
          <p className="text-xs text-[#7A6F68] mt-1 max-w-sm mx-auto mb-6">
            Si necesitás cambiar un producto de tus compras recientes, hacé clic en el botón superior.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {returns.map((ret) => {
            const badge = getStatusBadge(ret.status);

            return (
              <div
                key={ret.id}
                className="bg-white rounded-3xl border border-[#EFE8DF] p-6 shadow-sm hover:border-[#BD532B]/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  {ret.productImageUrl ? (
                    <img
                      src={ret.productImageUrl}
                      alt={ret.productName}
                      className="w-16 h-16 rounded-2xl object-cover border border-[#EFE8DF] bg-[#FAF7F2] flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-[#FAF7F2] border border-[#EFE8DF] flex items-center justify-center text-[#7A6F68] flex-shrink-0">
                      <ShoppingBag className="w-6 h-6 opacity-40" />
                    </div>
                  )}

                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-[#241F1E]">
                        Pedido #{ret.orderNumber}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}
                      >
                        <badge.icon className="w-3 h-3" />
                        <span>{badge.label}</span>
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-[#241F1E]">{ret.productName}</h4>
                    <p className="text-xs text-[#7A6F68] mt-0.5">
                      Cantidad: {ret.quantity} un. · Motivo: <strong>{getReasonLabel(ret.reason)}</strong>
                    </p>

                    {ret.comments && (
                      <p className="text-[11px] text-[#7A6F68] mt-1 italic">
                        "{ret.comments}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-xs text-[#7A6F68] self-end sm:self-center text-right">
                  <p>
                    Solicitado el{" "}
                    {new Date(ret.createdAt).toLocaleDateString("es-AR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Return Request Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#EFE8DF] max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#EFE8DF] mb-5">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-[#BD532B]" />
                <h3 className="text-lg font-bold text-[#241F1E]">
                  Solicitar Devolución o Cambio
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-xl text-[#7A6F68] hover:bg-[#FAF7F2]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReturn} className="space-y-4">
              {/* Select Order */}
              <div>
                <label className="block text-xs font-bold text-[#241F1E] mb-1.5">
                  1. Seleccioná el pedido
                </label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => handleOrderChange(Number(e.target.value))}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-[#EFE8DF] bg-[#FAF7F2] text-xs font-semibold text-[#241F1E] focus:outline-none focus:ring-1 focus:ring-[#BD532B]"
                >
                  <option value="">-- Seleccionar pedido --</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      Pedido #{o.orderNumber} · {new Date(o.createdAt).toLocaleDateString("es-AR")} (${o.total.toLocaleString("es-AR")})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Product in Order */}
              {selectedOrder && (
                <div>
                  <label className="block text-xs font-bold text-[#241F1E] mb-1.5">
                    2. Seleccioná el producto
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(Number(e.target.value))}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-[#EFE8DF] bg-[#FAF7F2] text-xs font-semibold text-[#241F1E] focus:outline-none focus:ring-1 focus:ring-[#BD532B]"
                  >
                    {selectedOrder.items.map((item) => (
                      <option key={item.id} value={item.productId}>
                        {item.productName} (Comprado: {item.quantity} un.)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="block text-xs font-bold text-[#241F1E] mb-1.5">
                  3. Cantidad a devolver
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-24 px-3 py-2 rounded-xl border border-[#EFE8DF] bg-[#FAF7F2] text-xs font-bold text-[#241F1E] focus:outline-none focus:ring-1 focus:ring-[#BD532B]"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-[#241F1E] mb-1.5">
                  4. Motivo de la solicitud
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#EFE8DF] bg-[#FAF7F2] text-xs font-semibold text-[#241F1E] focus:outline-none focus:ring-1 focus:ring-[#BD532B]"
                >
                  <option value="defective">Producto defectuoso / daño de fábrica</option>
                  <option value="wrong_item">Producto incorrecto recibido</option>
                  <option value="not_as_expected">No era lo que esperaba</option>
                  <option value="wrong_size">Talle o tamaño inadecuado</option>
                  <option value="other">Otro motivo</option>
                </select>
              </div>

              {/* Comments */}
              <div>
                <label className="block text-xs font-bold text-[#241F1E] mb-1.5">
                  5. Detalle adicional (opcional)
                </label>
                <textarea
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Describí brevemente el inconveniente para agilizar la resolución..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[#EFE8DF] bg-[#FAF7F2] text-xs font-medium text-[#241F1E] focus:outline-none focus:ring-1 focus:ring-[#BD532B]"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 pt-4 border-t border-[#EFE8DF]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#EFE8DF] text-xs font-bold text-[#7A6F68] hover:bg-[#FAF7F2]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedOrderId}
                  className="flex-1 py-2.5 rounded-xl bg-[#BD532B] text-white text-xs font-bold hover:bg-[#A34320] transition shadow-sm disabled:opacity-50"
                >
                  {submitting ? "Enviando..." : "Confirmar solicitud"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </CustomerLayout>
  );
}
