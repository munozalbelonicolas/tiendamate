import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DashboardMetrics } from "@shared/api";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Package,
  AlertTriangle,
  Clock,
  Truck,
  Users,
  Calendar,
  RefreshCw,
  ArrowUpRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const PIE_COLORS = ["#BD532B", "#0E6365", "#D97706", "#8C4E2D", "#5D6B4F", "#241F1E"];

export default function DashboardTab() {
  const { token } = useAuth();
  const [period, setPeriod] = useState<"today" | "7days" | "30days" | "month" | "all">("30days");
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics/dashboard?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error("Error al cargar métricas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [period]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header and Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#EFE8DF]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-script text-lg text-[#BD532B]">Resumen comercial</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#241F1E] tracking-tight">Dashboard General</h1>
          <p className="text-xs text-[#7A6F68] mt-1">
            Métricas comerciales en tiempo real calculadas sobre la base de datos persistente.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#F5EDE2]/70 border border-[#E5DDD0] rounded-xl p-1 text-xs shadow-inner">
            <button
              onClick={() => setPeriod("today")}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                period === "today"
                  ? "bg-[#BD532B] text-white font-semibold shadow-xs"
                  : "text-[#7A6F68] hover:text-[#241F1E]"
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setPeriod("7days")}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                period === "7days"
                  ? "bg-[#BD532B] text-white font-semibold shadow-xs"
                  : "text-[#7A6F68] hover:text-[#241F1E]"
              }`}
            >
              7 Días
            </button>
            <button
              onClick={() => setPeriod("30days")}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                period === "30days"
                  ? "bg-[#BD532B] text-white font-semibold shadow-xs"
                  : "text-[#7A6F68] hover:text-[#241F1E]"
              }`}
            >
              30 Días
            </button>
            <button
              onClick={() => setPeriod("month")}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                period === "month"
                  ? "bg-[#BD532B] text-white font-semibold shadow-xs"
                  : "text-[#7A6F68] hover:text-[#241F1E]"
              }`}
            >
              Mes Actual
            </button>
            <button
              onClick={() => setPeriod("all")}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                period === "all"
                  ? "bg-[#BD532B] text-white font-semibold shadow-xs"
                  : "text-[#7A6F68] hover:text-[#241F1E]"
              }`}
            >
              Histórico
            </button>
          </div>

          <button
            onClick={fetchMetrics}
            title="Refrescar métricas"
            className="p-2 bg-white border border-[#E5DDD0] hover:border-[#BD532B] hover:text-[#BD532B] rounded-xl text-[#7A6F68] transition shadow-xs"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* 8 KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* KPI 1: Ventas */}
        <div className="bg-white border border-[#EFE8DF] rounded-2xl p-4 shadow-sm hover:border-[#BD532B]/40 hover:shadow-md transition">
          <div className="flex items-center justify-between text-[#7A6F68] mb-2">
            <span className="text-xs font-medium">Ventas del período</span>
            <div className="w-8 h-8 rounded-xl bg-[#BD532B]/10 text-[#BD532B] flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#241F1E] tracking-tight font-serif">
            {loading ? "..." : formatCurrency(metrics?.salesTotal || 0)}
          </div>
          <p className="text-[11px] text-[#BD532B] flex items-center gap-1 mt-1 font-medium">
            <ArrowUpRight size={13} />
            <span>Pedidos cobrados y confirmados</span>
          </p>
        </div>

        {/* KPI 2: Pedidos */}
        <div className="bg-white border border-[#EFE8DF] rounded-2xl p-4 shadow-sm hover:border-[#0E6365]/40 hover:shadow-md transition">
          <div className="flex items-center justify-between text-[#7A6F68] mb-2">
            <span className="text-xs font-medium">Cantidad de pedidos</span>
            <div className="w-8 h-8 rounded-xl bg-[#0E6365]/10 text-[#0E6365] flex items-center justify-center">
              <ShoppingBag size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#241F1E] tracking-tight font-serif">
            {loading ? "..." : metrics?.ordersCount || 0}
          </div>
          <p className="text-[11px] text-[#7A6F68] mt-1">Excluye cancelados</p>
        </div>

        {/* KPI 3: Ticket Promedio */}
        <div className="bg-white border border-[#EFE8DF] rounded-2xl p-4 shadow-sm hover:border-[#8C4E2D]/40 hover:shadow-md transition">
          <div className="flex items-center justify-between text-[#7A6F68] mb-2">
            <span className="text-xs font-medium">Ticket promedio</span>
            <div className="w-8 h-8 rounded-xl bg-[#8C4E2D]/10 text-[#8C4E2D] flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#241F1E] tracking-tight font-serif">
            {loading ? "..." : formatCurrency(metrics?.averageTicket || 0)}
          </div>
          <p className="text-[11px] text-[#7A6F68] mt-1">Por pedido completado</p>
        </div>

        {/* KPI 4: Productos Publicados */}
        <div className="bg-white border border-[#EFE8DF] rounded-2xl p-4 shadow-sm hover:border-[#5D6B4F]/40 hover:shadow-md transition">
          <div className="flex items-center justify-between text-[#7A6F68] mb-2">
            <span className="text-xs font-medium">Productos publicados</span>
            <div className="w-8 h-8 rounded-xl bg-[#5D6B4F]/10 text-[#5D6B4F] flex items-center justify-center">
              <Package size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#241F1E] tracking-tight font-serif">
            {loading ? "..." : metrics?.publishedProducts || 0}
          </div>
          <p className="text-[11px] text-[#7A6F68] mt-1">Visibles en catálogo</p>
        </div>

        {/* KPI 5: Stock Bajo */}
        <div className="bg-white border border-[#EFE8DF] rounded-2xl p-4 shadow-sm hover:border-amber-500/40 hover:shadow-md transition">
          <div className="flex items-center justify-between text-[#7A6F68] mb-2">
            <span className="text-xs font-medium">Stock bajo / crítico</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className={`text-xl sm:text-2xl font-bold tracking-tight font-serif ${(metrics?.lowStockProducts || 0) > 0 ? "text-amber-700" : "text-[#241F1E]"}`}>
            {loading ? "..." : metrics?.lowStockProducts || 0}
          </div>
          <p className="text-[11px] text-[#7A6F68] mt-1">≤ umbral de alerta</p>
        </div>

        {/* KPI 6: Pedidos Pendientes */}
        <div className="bg-white border border-[#EFE8DF] rounded-2xl p-4 shadow-sm hover:border-orange-500/40 hover:shadow-md transition">
          <div className="flex items-center justify-between text-[#7A6F68] mb-2">
            <span className="text-xs font-medium">Pedidos pendientes</span>
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-700 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#241F1E] tracking-tight font-serif">
            {loading ? "..." : metrics?.pendingOrders || 0}
          </div>
          <p className="text-[11px] text-[#7A6F68] mt-1">Por preparar o confirmar</p>
        </div>

        {/* KPI 7: Pedidos Enviados */}
        <div className="bg-white border border-[#EFE8DF] rounded-2xl p-4 shadow-sm hover:border-[#0E6365]/40 hover:shadow-md transition">
          <div className="flex items-center justify-between text-[#7A6F68] mb-2">
            <span className="text-xs font-medium">Pedidos enviados</span>
            <div className="w-8 h-8 rounded-xl bg-[#0E6365]/10 text-[#0E6365] flex items-center justify-center">
              <Truck size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#241F1E] tracking-tight font-serif">
            {loading ? "..." : metrics?.shippedOrders || 0}
          </div>
          <p className="text-[11px] text-[#7A6F68] mt-1">En camino a destino</p>
        </div>

        {/* KPI 8: Clientes Registrados */}
        <div className="bg-white border border-[#EFE8DF] rounded-2xl p-4 shadow-sm hover:border-[#BD532B]/40 hover:shadow-md transition">
          <div className="flex items-center justify-between text-[#7A6F68] mb-2">
            <span className="text-xs font-medium">Clientes registrados</span>
            <div className="w-8 h-8 rounded-xl bg-[#8C4E2D]/10 text-[#8C4E2D] flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#241F1E] tracking-tight font-serif">
            {loading ? "..." : metrics?.registeredCustomers || 0}
          </div>
          <p className="text-[11px] text-[#7A6F68] mt-1">Compradores únicos</p>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Evolution Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-[#EFE8DF] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-serif font-bold text-[#241F1E]">Evolución de Ventas ($ ARS)</h3>
              <p className="text-xs text-[#7A6F68]">Distribución cronológica según fecha de pedido</p>
            </div>
          </div>

          <div className="h-72 w-full">
            {metrics?.salesChart && metrics.salesChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.salesChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#BD532B" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#BD532B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EFE8DF" vertical={false} />
                  <XAxis dataKey="date" stroke="#8C7D73" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#8C7D73"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E5DDD0",
                      borderRadius: "12px",
                      fontSize: "12px",
                      color: "#241F1E",
                      boxShadow: "0 4px 12px rgba(36,31,30,0.08)",
                    }}
                    formatter={(val: any) => [formatCurrency(Number(val)), "Ventas"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#BD532B"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#salesGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[#8C7D73] text-xs">
                <Calendar className="w-8 h-8 mb-2 opacity-40 text-[#BD532B]" />
                <p>Todavía no se registraron ventas en el período seleccionado.</p>
              </div>
            )}
          </div>
        </div>

        {/* Order Status Doughnut (1 col) */}
        <div className="bg-white border border-[#EFE8DF] rounded-2xl p-5 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-serif font-bold text-[#241F1E]">Estados de Pedidos</h3>
            <p className="text-xs text-[#7A6F68]">Distribución de órdenes activas</p>
          </div>

          <div className="h-64 w-full flex-1">
            {metrics?.orderStatusChart && metrics.orderStatusChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.orderStatusChart}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {metrics.orderStatusChart.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E5DDD0",
                      borderRadius: "12px",
                      fontSize: "12px",
                      color: "#241F1E",
                      boxShadow: "0 4px 12px rgba(36,31,30,0.08)",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "11px", paddingTop: "10px", color: "#3A3330" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[#8C7D73] text-xs">
                <ShoppingBag className="w-8 h-8 mb-2 opacity-40 text-[#0E6365]" />
                <p>No hay pedidos registrados en este período.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Second Row: Categories Distribution & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Category Bar Chart */}
        <div className="bg-white border border-[#EFE8DF] rounded-2xl p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-serif font-bold text-[#241F1E]">Ventas por Categoría ($ ARS)</h3>
            <p className="text-xs text-[#7A6F68]">Rendimiento por línea de productos</p>
          </div>

          <div className="h-64 w-full">
            {metrics?.categoryChart && metrics.categoryChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.categoryChart} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EFE8DF" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#8C7D73"
                    fontSize={11}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis type="category" dataKey="category" stroke="#8C7D73" fontSize={11} width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E5DDD0",
                      borderRadius: "12px",
                      fontSize: "12px",
                      color: "#241F1E",
                      boxShadow: "0 4px 12px rgba(36,31,30,0.08)",
                    }}
                    formatter={(val: any) => [formatCurrency(Number(val)), "Facturación"]}
                  />
                  <Bar dataKey="total" fill="#0E6365" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[#8C7D73] text-xs">
                <p>Sin datos de facturación por categoría.</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Products Table */}
        <div className="bg-white border border-[#EFE8DF] rounded-2xl p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-serif font-bold text-[#241F1E]">Top 5 Productos más Vendidos</h3>
              <p className="text-xs text-[#7A6F68]">Basado en unidades comercializadas en el período</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            {metrics?.topProducts && metrics.topProducts.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#EFE8DF] text-[#7A6F68] bg-[#FAF7F2]">
                    <th className="py-2.5 px-2 font-medium">Producto</th>
                    <th className="py-2.5 px-2 font-medium text-center">Unidades</th>
                    <th className="py-2.5 px-2 font-medium text-right">Facturación</th>
                    <th className="py-2.5 px-2 font-medium text-right">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EAE1]">
                  {metrics.topProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-[#FAF7F2]/60 transition">
                      <td className="py-2.5 px-2 text-[#241F1E] font-medium">
                        <p className="truncate max-w-[200px] font-semibold">{p.name}</p>
                        <p className="text-[10px] text-[#8C7D73]">{p.sku}</p>
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-[#241F1E]">{p.unitsSold}</td>
                      <td className="py-2.5 px-2 text-right font-semibold text-[#BD532B]">
                        {formatCurrency(p.totalRevenue)}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.stock <= 5
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : "bg-[#F5EDE2] text-[#6E625A]"
                          }`}
                        >
                          {p.stock} un.
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-[#8C7D73] text-xs">
                <p>Todavía no se registran ventas para calcular el ranking.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
