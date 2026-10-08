import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CustomerLayout } from "@/components/customer/CustomerLayout";
import { customerService } from "@/services/customerService";
import { CustomerDashboardData } from "@shared/api";
import {
  ShoppingBag,
  MapPin,
  Heart,
  Tag,
  Shield,
  ArrowRight,
  Package,
  Truck,
  CheckCircle,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export default function CustomerDashboard() {
  const [data, setData] = useState<CustomerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await customerService.getDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.message || "No pudimos cargar los datos de tu cuenta.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "shipped":
        return { label: "En camino", color: "bg-blue-50 text-blue-700 border-blue-200" };
      case "delivered":
        return { label: "Entregado", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "processing":
        return { label: "Preparando", color: "bg-amber-50 text-amber-700 border-amber-200" };
      case "confirmed":
        return { label: "Confirmado", color: "bg-purple-50 text-purple-700 border-purple-200" };
      case "cancelled":
        return { label: "Cancelado", color: "bg-red-50 text-red-700 border-red-200" };
      default:
        return { label: "Pendiente", color: "bg-gray-100 text-gray-700 border-gray-200" };
    }
  };

  // Timeline step active calculation
  const getTimelineStep = (status: string) => {
    if (status === "delivered") return 4;
    if (status === "shipped") return 3;
    if (status === "processing") return 2;
    if (status === "confirmed") return 1;
    return 1;
  };

  return (
    <CustomerLayout>
      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-28 bg-white rounded-3xl border border-[#EFE8DF] p-6" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-white rounded-2xl border border-[#EFE8DF]" />
            ))}
          </div>
          <div className="h-64 bg-white rounded-3xl border border-[#EFE8DF]" />
        </div>
      ) : error ? (
        <div className="bg-white rounded-3xl border border-red-200 p-8 text-center max-w-lg mx-auto">
          <p className="text-red-600 font-semibold mb-3">{error}</p>
          <button
            onClick={loadDashboard}
            className="px-5 py-2.5 rounded-xl bg-[#BD532B] text-white text-xs font-bold hover:bg-[#A34320] transition shadow-sm"
          >
            Intentar nuevamente
          </button>
        </div>
      ) : data ? (
        <div className="space-y-8">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-white via-white to-[#FAF7F2] rounded-3xl border border-[#EFE8DF] p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold tracking-wider uppercase text-[#BD532B] flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5" /> Portal de Cliente
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#241F1E]">
                Hola, {data.profile.firstName || "Amigo Matero"}
              </h1>
              <p className="text-sm text-[#7A6F68] mt-1">
                Bienvenido a tu espacio personal. Consultá el estado de tus compras, envíos y preferencias.
              </p>
            </div>
            <Link
              to="/cuenta/perfil"
              className="px-4 py-2 text-xs font-bold rounded-xl border border-[#EFE8DF] text-[#7A6F68] hover:bg-[#FAF7F2] hover:text-[#241F1E] transition whitespace-nowrap"
            >
              Ver mis datos
            </Link>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link
              to="/cuenta/pedidos?status=active"
              className="bg-white p-5 rounded-2xl border border-[#EFE8DF] shadow-sm hover:border-[#BD532B]/50 transition group"
            >
              <div className="flex items-center justify-between text-[#7A6F68] mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">En curso</span>
                <Truck className="w-4 h-4 text-[#BD532B] group-hover:scale-110 transition" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-[#241F1E]">{data.activeOrderCount}</p>
              <p className="text-[11px] text-[#7A6F68] mt-1">Pedidos activos</p>
            </Link>

            <Link
              to="/cuenta/pedidos"
              className="bg-white p-5 rounded-2xl border border-[#EFE8DF] shadow-sm hover:border-[#BD532B]/50 transition group"
            >
              <div className="flex items-center justify-between text-[#7A6F68] mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Compras</span>
                <ShoppingBag className="w-4 h-4 text-[#0E6365] group-hover:scale-110 transition" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-[#241F1E]">{data.totalOrdersCount}</p>
              <p className="text-[11px] text-[#7A6F68] mt-1">Historial registrado</p>
            </Link>

            <Link
              to="/cuenta/favoritos"
              className="bg-white p-5 rounded-2xl border border-[#EFE8DF] shadow-sm hover:border-[#BD532B]/50 transition group"
            >
              <div className="flex items-center justify-between text-[#7A6F68] mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Favoritos</span>
                <Heart className="w-4 h-4 text-rose-500 group-hover:scale-110 transition" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-[#241F1E]">{data.favoritesCount}</p>
              <p className="text-[11px] text-[#7A6F68] mt-1">Guardados para después</p>
            </Link>

            <Link
              to="/cuenta/cupones"
              className="bg-white p-5 rounded-2xl border border-[#EFE8DF] shadow-sm hover:border-[#BD532B]/50 transition group"
            >
              <div className="flex items-center justify-between text-[#7A6F68] mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Beneficios</span>
                <Tag className="w-4 h-4 text-amber-500 group-hover:scale-110 transition" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-[#241F1E]">{data.availableCouponsCount}</p>
              <p className="text-[11px] text-[#7A6F68] mt-1">Cupones para vos</p>
            </Link>
          </div>

          {/* Latest Order Showcase with Tracking */}
          {data.latestOrder ? (
            <div className="bg-white rounded-3xl border border-[#EFE8DF] shadow-sm overflow-hidden">
              <div className="p-6 sm:p-8 border-b border-[#EFE8DF] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-bold text-[#241F1E]">
                      Pedido #{data.latestOrder.orderNumber}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                        getStatusBadge(data.latestOrder.status).color
                      }`}
                    >
                      {getStatusBadge(data.latestOrder.status).label}
                    </span>
                  </div>
                  <p className="text-xs text-[#7A6F68]">
                    Realizado el{" "}
                    {new Date(data.latestOrder.createdAt).toLocaleDateString("es-AR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs text-[#7A6F68]">Total</span>
                    <p className="text-lg font-black text-[#241F1E]">
                      ${data.latestOrder.total.toLocaleString("es-AR")}
                    </p>
                  </div>
                  <Link
                    to={`/cuenta/pedidos/${data.latestOrder.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#BD532B] text-white text-xs font-bold hover:bg-[#A34320] transition shadow-sm"
                  >
                    <span>Ver pedido</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Quick Tracking Status Timeline */}
              <div className="p-6 sm:p-8 bg-[#FAF7F2]/60 border-b border-[#EFE8DF]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] mb-5">
                  Seguimiento de envío
                </h4>

                <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute top-4 left-4 right-4 sm:left-8 sm:right-8 h-1 bg-[#EFE8DF] -z-0">
                    <div
                      className="h-full bg-[#BD532B] transition-all duration-500"
                      style={{
                        width: `${Math.min(100, ((getTimelineStep(data.latestOrder.status) - 1) / 3) * 100)}%`,
                      }}
                    />
                  </div>

                  {/* Steps */}
                  <div className="grid grid-cols-4 relative z-10 text-center">
                    {[
                      { step: 1, label: "Pedido confirmado", icon: CheckCircle },
                      { step: 2, label: "Preparando", icon: Package },
                      { step: 3, label: "Despachado", icon: Truck },
                      { step: 4, label: "Entregado", icon: CheckCircle },
                    ].map((s) => {
                      const currentStep = getTimelineStep(data.latestOrder!.status);
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
                            <s.icon className="w-4 h-4" />
                          </div>
                          <span
                            className={`text-xs mt-2 font-medium hidden sm:block ${
                              isDone ? "text-[#241F1E] font-semibold" : "text-[#7A6F68]"
                            }`}
                          >
                            {s.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {data.latestOrder.shippingCarrier && data.latestOrder.trackingNumber && (
                  <div className="mt-6 pt-4 border-t border-[#EFE8DF]/80 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#7A6F68] gap-2">
                    <div>
                      <span className="font-semibold text-[#241F1E]">Transportista:</span>{" "}
                      {data.latestOrder.shippingCarrier} · Código:{" "}
                      <code className="bg-white px-2 py-0.5 rounded border border-[#EFE8DF] font-mono text-[#241F1E]">
                        {data.latestOrder.trackingNumber}
                      </code>
                    </div>
                    {data.latestOrder.estimatedDelivery && (
                      <div className="text-[#0E6365] font-semibold">
                        Llega: {data.latestOrder.estimatedDelivery}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Items in latest order */}
              <div className="p-6 sm:p-8">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] mb-4">
                  Productos del pedido
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.latestOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-[#FAF7F2] border border-[#EFE8DF]"
                    >
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="w-14 h-14 rounded-xl object-cover border border-[#EFE8DF] bg-white flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-white border border-[#EFE8DF] flex items-center justify-center text-[#7A6F68]">
                          <ShoppingBag className="w-5 h-5 opacity-40" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[#241F1E] truncate">{item.productName}</p>
                        <p className="text-[11px] text-[#7A6F68]">
                          {item.quantity} un. × ${item.unitPrice.toLocaleString("es-AR")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-[#EFE8DF] p-10 text-center">
              <ShoppingBag className="w-12 h-12 mx-auto text-[#BD532B]/40 mb-3" />
              <h3 className="text-base font-bold text-[#241F1E]">Todavía no realizaste ningún pedido</h3>
              <p className="text-xs text-[#7A6F68] mt-1 max-w-sm mx-auto mb-5">
                Explorá nuestra tienda con mates artesanales, bombillas de alpaca y yerbas seleccionadas.
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#BD532B] text-white text-xs font-bold hover:bg-[#A34320] transition shadow-sm"
              >
                <span>Descubrir productos</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Quick Access Grid */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] mb-4">
              Accesos directos
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                to="/cuenta/pedidos"
                className="bg-white p-5 rounded-2xl border border-[#EFE8DF] shadow-sm hover:border-[#BD532B]/50 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] text-[#BD532B] flex items-center justify-center font-bold">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#241F1E]">Mis pedidos</p>
                    <p className="text-xs text-[#7A6F68]">Historial y seguimiento</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#7A6F68] group-hover:translate-x-1 transition" />
              </Link>

              <Link
                to="/cuenta/direcciones"
                className="bg-white p-5 rounded-2xl border border-[#EFE8DF] shadow-sm hover:border-[#BD532B]/50 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] text-[#0E6365] flex items-center justify-center font-bold">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#241F1E]">Mis direcciones</p>
                    <p className="text-xs text-[#7A6F68]">Casa, oficina y entregas</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#7A6F68] group-hover:translate-x-1 transition" />
              </Link>

              <Link
                to="/cuenta/seguridad"
                className="bg-white p-5 rounded-2xl border border-[#EFE8DF] shadow-sm hover:border-[#BD532B]/50 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] text-amber-600 flex items-center justify-center font-bold">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#241F1E]">Seguridad</p>
                    <p className="text-xs text-[#7A6F68]">Contraseña y dispositivos</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#7A6F68] group-hover:translate-x-1 transition" />
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </CustomerLayout>
  );
}
