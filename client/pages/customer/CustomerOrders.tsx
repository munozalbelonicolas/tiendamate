import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CustomerLayout } from "@/components/customer/CustomerLayout";
import { customerService } from "@/services/customerService";
import { CustomerPortalOrder } from "@shared/api";
import {
  ShoppingBag,
  Truck,
  CheckCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  Search,
  Filter,
} from "lucide-react";

export default function CustomerOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilter = searchParams.get("status") || "all";
  const initialYear = searchParams.get("year") || "all";

  const [statusFilter, setStatusFilter] = useState(initialFilter);
  const [yearFilter, setYearFilter] = useState(initialYear);
  const [orders, setOrders] = useState<CustomerPortalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, [statusFilter, yearFilter]);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await customerService.getOrders(statusFilter, yearFilter);
      setOrders(res);
    } catch (err: any) {
      setError(err.message || "No pudimos cargar tus pedidos.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (status === "all") next.delete("status");
      else next.set("status", status);
      return next;
    });
  };

  const handleYearChange = (year: string) => {
    setYearFilter(year);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (year === "all") next.delete("year");
      else next.set("year", year);
      return next;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "shipped":
        return { label: "En camino", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Truck };
      case "delivered":
        return { label: "Entregado", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle };
      case "processing":
        return { label: "Preparando pedido", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock };
      case "confirmed":
        return { label: "Confirmado", color: "bg-purple-50 text-purple-700 border-purple-200", icon: CheckCircle };
      case "cancelled":
        return { label: "Cancelado", color: "bg-red-50 text-red-700 border-red-200", icon: Clock };
      default:
        return { label: "Pendiente de pago", color: "bg-gray-100 text-gray-700 border-gray-200", icon: Clock };
    }
  };

  return (
    <CustomerLayout
      title="Mis Pedidos"
      subtitle="Consultá el estado en tiempo real, seguimiento de entrega y facturas de tus compras."
    >
      {/* Simple Shopper Filter Bar */}
      <div className="bg-white rounded-2xl border border-[#EFE8DF] p-3 sm:p-4 mb-6 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: "all", label: "Todos" },
            { id: "active", label: "En curso" },
            { id: "delivered", label: "Entregados" },
            { id: "cancelled", label: "Cancelados" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleStatusChange(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === tab.id
                  ? "bg-[#BD532B] text-white shadow-sm"
                  : "bg-[#FAF7F2] text-[#7A6F68] hover:text-[#241F1E] hover:bg-[#F3ECE1]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Year Filter */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-[#7A6F68] font-medium hidden sm:inline">Año:</span>
          <select
            value={yearFilter}
            onChange={(e) => handleYearChange(e.target.value)}
            className="text-xs font-semibold bg-[#FAF7F2] border border-[#EFE8DF] rounded-xl px-3 py-1.5 text-[#241F1E] focus:outline-none focus:ring-1 focus:ring-[#BD532B]"
          >
            <option value="all">Todos los años</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-white rounded-3xl border border-[#EFE8DF]" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-white rounded-3xl border border-red-200 p-8 text-center max-w-lg mx-auto">
          <p className="text-red-600 font-semibold mb-3">{error}</p>
          <button
            onClick={loadOrders}
            className="px-5 py-2.5 rounded-xl bg-[#BD532B] text-white text-xs font-bold hover:bg-[#A34320] transition shadow-sm"
          >
            Intentar de nuevo
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#EFE8DF] p-12 text-center shadow-sm">
          <ShoppingBag className="w-12 h-12 mx-auto text-[#BD532B]/40 mb-3" />
          <h3 className="text-base font-bold text-[#241F1E]">No tenés pedidos en esta sección</h3>
          <p className="text-xs text-[#7A6F68] mt-1 max-w-sm mx-auto mb-6">
            Si realizaste compras recientemente o con otros filtros, seleccioná "Todos" o visitá nuestra tienda.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#BD532B] text-white text-xs font-bold hover:bg-[#A34320] transition shadow-sm"
          >
            <span>Ver productos disponibles</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const badge = getStatusBadge(order.status);
            const totalItemsCount = order.items.reduce((acc, i) => acc + i.quantity, 0);

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-[#EFE8DF] shadow-sm hover:shadow-md transition overflow-hidden"
              >
                {/* Order Header */}
                <div className="p-5 sm:p-6 border-b border-[#EFE8DF] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF7F2]/40">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-bold text-sm text-[#241F1E]">Pedido #{order.orderNumber}</span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border ${badge.color}`}
                    >
                      <badge.icon className="w-3.5 h-3.5" />
                      <span>{badge.label}</span>
                    </span>
                    <span className="text-xs text-[#7A6F68]">
                      {new Date(order.createdAt).toLocaleDateString("es-AR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="sm:text-right">
                      <span className="text-[11px] text-[#7A6F68] block">Total ({totalItemsCount} productos)</span>
                      <span className="text-base font-black text-[#241F1E]">
                        ${order.total.toLocaleString("es-AR")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Items & Fast Tracking */}
                <div className="p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  {/* Thumbnails Gallery */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 overflow-x-auto pb-1 max-w-full">
                      {order.items.slice(0, 4).map((item) => (
                        <div key={item.id} className="relative flex-shrink-0 group">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.productName}
                              className="w-16 h-16 rounded-2xl object-cover border border-[#EFE8DF] bg-white"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-2xl bg-[#FAF7F2] border border-[#EFE8DF] flex items-center justify-center text-[#7A6F68]">
                              <ShoppingBag className="w-6 h-6 opacity-40" />
                            </div>
                          )}
                          <span className="absolute -top-1.5 -right-1.5 bg-[#241F1E] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                            {item.quantity}
                          </span>
                        </div>
                      ))}

                      {order.items.length > 4 && (
                        <div className="w-16 h-16 rounded-2xl bg-[#FAF7F2] border border-[#EFE8DF] flex items-center justify-center text-xs font-bold text-[#7A6F68]">
                          +{order.items.length - 4}
                        </div>
                      )}

                      <div className="ml-2 hidden sm:block">
                        <p className="text-xs font-bold text-[#241F1E] line-clamp-1">
                          {order.items[0]?.productName}
                        </p>
                        {order.items.length > 1 && (
                          <p className="text-[11px] text-[#7A6F68]">
                            y {order.items.length - 1} producto{order.items.length > 2 ? "s" : ""} más
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Carrier Info Preview */}
                    {order.shippingCarrier && order.trackingNumber && (
                      <div className="mt-3 text-xs text-[#7A6F68] flex items-center gap-2">
                        <Truck className="w-3.5 h-3.5 text-[#0E6365]" />
                        <span>
                          Enviado por <strong className="text-[#241F1E]">{order.shippingCarrier}</strong> (Guía:{" "}
                          {order.trackingNumber})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-[#EFE8DF]">
                    {order.trackingUrl && (
                      <a
                        href={order.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#EFE8DF] text-[#7A6F68] hover:text-[#241F1E] hover:bg-[#FAF7F2] text-xs font-bold transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Seguir envío</span>
                      </a>
                    )}

                    <Link
                      to={`/cuenta/pedidos/${order.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#BD532B] text-white text-xs font-bold hover:bg-[#A34320] transition shadow-sm"
                    >
                      <span>Ver detalle</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CustomerLayout>
  );
}
