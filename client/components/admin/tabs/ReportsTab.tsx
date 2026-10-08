import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { BarChart3, Download, FileSpreadsheet, ShoppingBag, Boxes, Users } from "lucide-react";
import { toast } from "sonner";

export default function ReportsTab() {
  const { token } = useAuth();
  const [reportType, setReportType] = useState<"sales" | "orders" | "inventory" | "customers">("sales");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics/report?type=${reportType}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const rows = await res.json();
        setData(rows);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  const handleDownloadCsv = async () => {
    try {
      const res = await fetch(`/api/admin/analytics/report?type=${reportType}&format=csv`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Error al descargar reporte");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reporte_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Reporte CSV descargado con éxito");
    } catch (err: any) {
      toast.error(err.message || "Error al exportar");
    }
  };

  const tabs: Array<{ id: any; label: string; icon: any }> = [
    { id: "sales", label: "Ventas y Facturación", icon: BarChart3 },
    { id: "orders", label: "Historial de Pedidos", icon: ShoppingBag },
    { id: "inventory", label: "Valuación de Inventario", icon: Boxes },
    { id: "customers", label: "Clientes y Recurrencia", icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#EFE8DF]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-script text-lg text-[#BD532B]">Gestión contable</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#241F1E] tracking-tight">Reportes y Analítica Contable</h1>
          <p className="text-xs text-[#7A6F68] mt-1">
            Informes operativos construidos estrictamente a partir de transacciones reales persistidas.
          </p>
        </div>

        <button
          onClick={handleDownloadCsv}
          disabled={data.length === 0}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#0E6365] hover:bg-[#094749] text-white font-bold rounded-xl text-xs shadow-md shadow-[#0E6365]/20 transition disabled:opacity-40"
        >
          <Download size={15} />
          <span>Exportar a CSV</span>
        </button>
      </div>

      {/* Tabs Selector */}
      <div className="flex gap-2 border-b border-[#EFE8DF] pb-2 overflow-x-auto text-xs">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = reportType === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setReportType(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition whitespace-nowrap ${
                isActive
                  ? "bg-[#BD532B] text-white shadow-xs font-semibold"
                  : "text-[#7A6F68] hover:text-[#241F1E] hover:bg-white border border-transparent"
              }`}
            >
              <Icon size={15} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Report Table */}
      <div className="bg-white border border-[#EFE8DF] rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[#EFE8DF] flex items-center justify-between text-xs text-[#7A6F68] bg-[#F7F3EC]/50">
          <span>{data.length} registros computados</span>
          <span className="font-mono text-[11px] text-[#8C7D73]">Formato: Tabular Relacional</span>
        </div>

        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          {loading ? (
            <div className="py-16 text-center text-[#7A6F68] text-xs">
              <div className="w-6 h-6 border-2 border-[#BD532B] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Generando informe desde la base de datos...
            </div>
          ) : data.length === 0 ? (
            <div className="py-16 text-center text-[#7A6F68] text-xs">
              <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#BD532B]" />
              <p className="font-serif font-bold text-base text-[#241F1E]">Sin movimientos registrados</p>
              <p className="text-[11px] text-[#7A6F68] mt-1">Este informe se completará al existir operaciones comerciales.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#EFE8DF] bg-[#F7F3EC] text-[#6E625A] sticky top-0">
                  {Object.keys(data[0]).map((key) => (
                    <th key={key} className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap">
                      {key.replace(/_/g, " ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EAE1] font-mono text-[11px]">
                {data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF7F2]/70 transition text-[#3A3330]">
                    {Object.keys(data[0]).map((key) => {
                      const val = row[key];
                      const isMoney = key.includes("total") || key.includes("precio") || key.includes("costo") || key.includes("subtotal") || key.includes("valuacion");
                      return (
                        <td key={key} className="py-2.5 px-4 whitespace-nowrap">
                          {isMoney && typeof val === "number" ? `$${val.toLocaleString("es-AR")}` : String(val ?? "—")}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
