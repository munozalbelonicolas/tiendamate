import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Order, OrderStatus } from "@shared/api";
import {
  ShoppingBag,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  PackageCheck,
  XCircle,
  RotateCcw,
  User,
  MapPin,
  X,
  ChevronLeft,
  ChevronRight,
  Send,
} from "lucide-react";
import { toast } from "sonner";

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string; border: string; icon: any }
> = {
  pending: { label: "Pendiente", bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", icon: Clock },
  confirmed: { label: "Confirmado", bg: "bg-[#0E6365]/10", text: "text-[#0E6365]", border: "border-[#0E6365]/20", icon: CheckCircle2 },
  processing: { label: "En Preparación", bg: "bg-[#F5EDE2]", text: "text-[#8C4E2D]", border: "border-[#E5DDD0]", icon: PackageCheck },
  shipped: { label: "Enviado", bg: "bg-[#0E6365]/10", text: "text-[#0E6365]", border: "border-[#0E6365]/20", icon: Truck },
  delivered: { label: "Entregado", bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200", icon: CheckCircle2 },
  cancelled: { label: "Cancelado", bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: XCircle },
  refunded: { label: "Reembolsado", bg: "bg-stone-100", text: "text-stone-700", border: "border-stone-300", icon: RotateCcw },
};

export default function OrdersTab() {
  const { token, hasPermission } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");

  // Selected Order Drawer / Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newNote, setNewNote] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: "15",
      });
      if (search.trim()) query.set("search", search.trim());
      if (statusFilter !== "all") query.set("status", statusFilter);
      if (paymentFilter !== "all") query.set("paymentStatus", paymentFilter);

      const res = await fetch(`/api/admin/orders?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setOrders(data.items);
        setTotalPages(data.pagination.totalPages);
        setTotalItems(data.pagination.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, search, statusFilter, paymentFilter]);

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          internalNotes: newNote.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al actualizar estado");

      toast.success(`Pedido actualizado a estado: ${newStatus}`);
      setSelectedOrder(data);
      setNewNote("");
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar pedido");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#EFE8DF]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-script text-lg text-[#BD532B]">Ventas y envíos</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#241F1E] tracking-tight">Gestión de Pedidos</h1>
          <p className="text-xs text-[#7A6F68] mt-1">
            Monitoreo logístico, validación de cobros y estados de entrega ({totalItems} pedidos totales).
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-2xl border border-[#EFE8DF] shadow-xs text-xs">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C7D73]" />
          <input
            type="text"
            placeholder="Buscar por # de pedido, cliente o email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] placeholder-[#8C7D73] focus:outline-none focus:border-[#BD532B] transition"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] focus:outline-none focus:border-[#BD532B] transition"
          >
            <option value="all">Todos los estados de pedido</option>
            <option value="pending">Pendiente</option>
            <option value="confirmed">Confirmado</option>
            <option value="processing">En Preparación</option>
            <option value="shipped">Enviado</option>
            <option value="delivered">Entregado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>

        <div>
          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] focus:outline-none focus:border-[#BD532B] transition"
          >
            <option value="all">Todos los estados de pago</option>
            <option value="approved">Cobrado / Aprobado</option>
            <option value="pending">Pago Pendiente</option>
            <option value="rejected">Rechazado</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-[#EFE8DF] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#EFE8DF] bg-[#F7F3EC] text-[#6E625A]">
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Orden</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Fecha</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Cliente</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px] text-center">Items</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">Total</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px] text-center">Estado Pago</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px] text-center">Estado Logístico</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EAE1]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#7A6F68]">
                    <div className="w-6 h-6 border-2 border-[#BD532B] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Cargando pedidos...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-[#7A6F68]">
                    <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30 text-[#BD532B]" />
                    <p className="font-serif font-bold text-base text-[#241F1E]">No se encontraron pedidos</p>
                    <p className="text-[11px] text-[#7A6F68] mt-1 max-w-sm mx-auto">
                      Las órdenes realizadas por tus clientes en la tienda aparecerán aquí automáticamente.
                    </p>
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const conf = STATUS_CONFIG[o.status] || STATUS_CONFIG.pending;
                  const Icon = conf.icon;

                  return (
                    <tr key={o.id} className="hover:bg-[#FAF7F2]/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#BD532B]">#{o.orderNumber}</td>
                      <td className="py-3 px-4 text-[#8C7D73]">
                        {new Date(o.createdAt).toLocaleDateString("es-AR", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-[#241F1E] truncate max-w-[170px]">{o.customerName}</p>
                        <p className="text-[10px] text-[#8C7D73] truncate max-w-[170px]">{o.customerEmail}</p>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-[#3A3330]">
                        {o.items?.reduce((acc, i) => acc + i.quantity, 0) || 0}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[#241F1E]">
                        {formatCurrency(o.total)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            o.paymentStatus === "approved"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {o.paymentStatus === "approved" ? "Aprobado" : "Pendiente"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${conf.bg} ${conf.text} ${conf.border}`}
                        >
                          <Icon size={11} />
                          <span>{conf.label}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="px-3 py-1 bg-white hover:bg-[#FAF7F2] text-[#241F1E] border border-[#E5DDD0] rounded-xl text-xs font-semibold transition shadow-2xs"
                        >
                          Ver Detalle
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-3 bg-[#FAF7F2] border-t border-[#EFE8DF] flex items-center justify-between text-xs text-[#7A6F68]">
          <div>
            Página <strong className="text-[#241F1E]">{page}</strong> de <strong className="text-[#241F1E]">{totalPages}</strong>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-[#E5DDD0] bg-white hover:border-[#BD532B] text-[#241F1E] disabled:opacity-30 shadow-2xs transition"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-[#E5DDD0] bg-white hover:border-[#BD532B] text-[#241F1E] disabled:opacity-30 shadow-2xs transition"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#EFE8DF] rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-5 right-5 text-[#8C7D73] hover:text-[#241F1E] p-1 rounded-lg hover:bg-[#FAF7F2]"
            >
              <X size={18} />
            </button>

            <div className="flex items-center justify-between border-b border-[#EFE8DF] pb-4 mb-4">
              <div>
                <span className="text-[11px] font-mono text-[#8C7D73]">Pedido #{selectedOrder.orderNumber}</span>
                <h2 className="text-xl font-serif font-bold text-[#241F1E]">Detalle de la Orden</h2>
              </div>
              <div>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                    STATUS_CONFIG[selectedOrder.status].bg
                  } ${STATUS_CONFIG[selectedOrder.status].text} ${STATUS_CONFIG[selectedOrder.status].border}`}
                >
                  {STATUS_CONFIG[selectedOrder.status].label}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-xs">
              {/* Customer Box */}
              <div className="bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#E5DDD0]">
                <div className="flex items-center gap-2 font-bold text-[#241F1E] mb-2 font-serif">
                  <User size={14} className="text-[#0E6365]" />
                  <span>Datos del Comprador</span>
                </div>
                <p className="text-[#241F1E] font-semibold">{selectedOrder.customerName}</p>
                <p className="text-[#7A6F68]">{selectedOrder.customerEmail}</p>
                {selectedOrder.customerPhone && <p className="text-[#7A6F68]">{selectedOrder.customerPhone}</p>}
              </div>

              {/* Shipping Address */}
              <div className="bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#E5DDD0]">
                <div className="flex items-center gap-2 font-bold text-[#241F1E] mb-2 font-serif">
                  <MapPin size={14} className="text-[#BD532B]" />
                  <span>Dirección de Envío</span>
                </div>
                {selectedOrder.shippingAddress ? (
                  <p className="text-[#3A3330]">
                    {selectedOrder.shippingAddress.street}, {selectedOrder.shippingAddress.city}
                  </p>
                ) : (
                  <p className="text-[#8C7D73]">Retiro en showroom o envío a coordinar</p>
                )}
                <p className="text-[#7A6F68] mt-1 capitalize font-medium">
                  Medio de Pago: {selectedOrder.paymentMethod}
                </p>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-6">
              <h3 className="text-xs font-serif font-bold text-[#241F1E] mb-2">Artículos del Pedido (Precios Históricos)</h3>
              <div className="border border-[#EFE8DF] rounded-2xl overflow-hidden bg-white">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#EFE8DF] text-[#6E625A] bg-[#F7F3EC]">
                      <th className="p-2.5">Producto</th>
                      <th className="p-2.5 text-center">Cantidad</th>
                      <th className="p-2.5 text-right">Precio Unitario</th>
                      <th className="p-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EAE1]">
                    {selectedOrder.items?.map((item) => (
                      <tr key={item.id} className="text-[#3A3330]">
                        <td className="p-2.5 font-medium text-[#241F1E]">{item.productName}</td>
                        <td className="p-2.5 text-center font-bold">{item.quantity}</td>
                        <td className="p-2.5 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="p-2.5 text-right font-semibold text-[#241F1E]">
                          {formatCurrency(item.totalPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E5DDD0] mb-6 space-y-1.5 text-xs">
              <div className="flex justify-between text-[#7A6F68]">
                <span>Subtotal</span>
                <span>{formatCurrency(selectedOrder.subtotal)}</span>
              </div>
              {selectedOrder.discount > 0 && (
                <div className="flex justify-between text-[#0E6365] font-medium">
                  <span>Descuento aplicado</span>
                  <span>-{formatCurrency(selectedOrder.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#7A6F68]">
                <span>Costo de Envío</span>
                <span>{selectedOrder.shippingCost === 0 ? "Gratis" : formatCurrency(selectedOrder.shippingCost)}</span>
              </div>
              <div className="flex justify-between text-base font-serif font-bold text-[#241F1E] pt-2 border-t border-[#E5DDD0]">
                <span>Total Final</span>
                <span className="text-[#BD532B]">{formatCurrency(selectedOrder.total)}</span>
              </div>
            </div>

            {/* State Transition Actions */}
            {hasPermission("orders.update") && (
              <div className="mb-6 p-4 bg-[#F5EDE2]/60 border border-[#E5DDD0] rounded-2xl">
                <h4 className="text-xs font-serif font-bold text-[#241F1E] mb-2">Transición de Estado del Pedido</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedOrder.status === "pending" && (
                    <button
                      onClick={() => handleUpdateStatus("confirmed")}
                      disabled={updatingStatus}
                      className="px-3 py-1.5 bg-[#0E6365] hover:bg-[#094749] text-white rounded-xl text-xs font-semibold shadow-xs"
                    >
                      Confirmar Pedido
                    </button>
                  )}
                  {selectedOrder.status === "confirmed" && (
                    <button
                      onClick={() => handleUpdateStatus("processing")}
                      disabled={updatingStatus}
                      className="px-3 py-1.5 bg-[#8C4E2D] hover:bg-[#733E23] text-white rounded-xl text-xs font-semibold shadow-xs"
                    >
                      Comenzar Preparación
                    </button>
                  )}
                  {selectedOrder.status === "processing" && (
                    <button
                      onClick={() => handleUpdateStatus("shipped")}
                      disabled={updatingStatus}
                      className="px-3 py-1.5 bg-[#0E6365] hover:bg-[#094749] text-white rounded-xl text-xs font-semibold shadow-xs"
                    >
                      Despachar / Enviar
                    </button>
                  )}
                  {selectedOrder.status === "shipped" && (
                    <button
                      onClick={() => handleUpdateStatus("delivered")}
                      disabled={updatingStatus}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs"
                    >
                      Marcar como Entregado
                    </button>
                  )}
                  {!["delivered", "cancelled", "refunded"].includes(selectedOrder.status) && (
                    <button
                      onClick={() => handleUpdateStatus("cancelled")}
                      disabled={updatingStatus}
                      className="px-3 py-1.5 bg-red-100 text-red-800 border border-red-300 hover:bg-red-200 rounded-xl text-xs font-semibold transition"
                    >
                      Cancelar Pedido
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Internal Notes */}
            <div>
              <h4 className="text-xs font-serif font-bold text-[#241F1E] mb-2">Notas Internas y Auditoría</h4>
              {selectedOrder.internalNotes && (
                <div className="p-3 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#3A3330] text-xs whitespace-pre-wrap mb-3 font-mono">
                  {selectedOrder.internalNotes}
                </div>
              )}

              {hasPermission("orders.update") && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Agregar nota interna (ej. Nro de tracking andreani 2819...)"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="flex-1 px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-xs text-[#241F1E] focus:outline-none focus:border-[#BD532B]"
                  />
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.status)}
                    disabled={!newNote.trim() || updatingStatus}
                    className="px-3.5 py-2 bg-[#BD532B] hover:bg-[#A7441E] text-white rounded-xl text-xs font-medium transition disabled:opacity-40 shadow-xs"
                  >
                    <Send size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
