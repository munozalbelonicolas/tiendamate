import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { InventoryMovement, Product } from "@shared/api";
import {
  Boxes,
  Plus,
  Minus,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  X,
  History,
} from "lucide-react";
import { toast } from "sonner";

export default function InventoryTab() {
  const { token, hasPermission } = useAuth();
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Adjustment Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | "">("");
  const [adjustmentDelta, setAdjustmentDelta] = useState<number>(1);
  const [adjustmentType, setAdjustmentType] = useState<"in" | "out" | "adjustment">("in");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      const [movRes, lowRes, prodRes] = await Promise.all([
        fetch("/api/admin/inventory/movements?limit=30", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/inventory/low-stock", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/products?limit=100&includeUnpublished=true", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (movRes.ok) {
        const movData = await movRes.json();
        setMovements(movData.items);
      }
      if (lowRes.ok) {
        const lowData = await lowRes.json();
        setLowStockProducts(lowData);
      }
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData.items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !adjustmentReason.trim()) {
      toast.error("Selecciona un producto y especifica el motivo del ajuste.");
      return;
    }

    const deltaValue = adjustmentType === "out" ? -Math.abs(adjustmentDelta) : Math.abs(adjustmentDelta);

    setAdjusting(true);
    try {
      const res = await fetch("/api/admin/inventory/adjust", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: selectedProductId,
          delta: deltaValue,
          reason: adjustmentReason.trim(),
          type: adjustmentType,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al registrar ajuste");

      toast.success("Ajuste de inventario registrado con éxito.");
      setAdjustModalOpen(false);
      setAdjustmentReason("");
      fetchInventoryData();
    } catch (err: any) {
      toast.error(err.message || "Error al ajustar stock");
    } finally {
      setAdjusting(false);
    }
  };

  const getMovementBadge = (type: string, qty: number) => {
    if (qty > 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0E6365] bg-[#0E6365]/10 px-2.5 py-0.5 rounded-lg border border-[#0E6365]/20">
          <ArrowUpRight size={12} /> +{qty}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-lg border border-red-200">
        <ArrowDownRight size={12} /> {qty}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#EFE8DF]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-script text-lg text-[#BD532B]">Depósito y existencias</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#241F1E] tracking-tight">Control de Inventario</h1>
          <p className="text-xs text-[#7A6F68] mt-1">
            Supervisión de existencias, alertas de reposición y trazabilidad completa de movimientos.
          </p>
        </div>

        {hasPermission("inventory.manage") && (
          <button
            onClick={() => {
              setSelectedProductId(products[0]?.id || "");
              setAdjustmentDelta(1);
              setAdjustmentType("in");
              setAdjustmentReason("");
              setAdjustModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#BD532B] hover:bg-[#A7441E] text-white font-bold rounded-xl text-xs shadow-md shadow-[#BD532B]/20 transition active:scale-[0.99]"
          >
            <Boxes size={16} />
            <span>Ajustar Stock Manual</span>
          </button>
        )}
      </div>

      {/* Low Stock Alerts Banner */}
      {lowStockProducts.length > 0 && (
        <div className="bg-[#FAF3E8] border border-[#F0D5A6] rounded-2xl p-4 text-[#8C4E2D] shadow-xs">
          <div className="flex items-center gap-2 font-bold text-sm text-[#8C4E2D] mb-2 font-serif">
            <AlertTriangle size={18} className="text-[#BD532B]" />
            <span>Alertas de Reposición ({lowStockProducts.length} productos con stock crítico)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-3">
            {lowStockProducts.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-[#EFE8DF] rounded-xl p-3 flex items-center justify-between shadow-2xs"
              >
                <div>
                  <p className="font-semibold text-xs text-[#241F1E] truncate max-w-[170px]">{p.name}</p>
                  <p className="text-[10px] text-[#8C7D73] font-mono">{p.sku}</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
                    {p.stock} un.
                  </span>
                  <p className="text-[10px] text-[#8C7D73] mt-0.5">Mín: {p.minStockAlert}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Movements Table */}
      <div className="bg-white border border-[#EFE8DF] rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[#EFE8DF] flex items-center justify-between bg-[#F7F3EC]/50">
          <div className="flex items-center gap-2 text-[#241F1E] font-bold text-sm font-serif">
            <History size={16} className="text-[#0E6365]" />
            <span>Historial de Movimientos de Stock</span>
          </div>
          <span className="text-xs text-[#7A6F68]">Últimos {movements.length} registros auditados</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#EFE8DF] bg-[#F7F3EC] text-[#6E625A]">
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Fecha y Hora</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Producto</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px] text-center">Variación</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px] text-center">Stock Anterior</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px] text-center">Nuevo Stock</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Motivo del Ajuste</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Responsable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EAE1]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#7A6F68]">
                    <div className="w-6 h-6 border-2 border-[#BD532B] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Cargando movimientos...
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#7A6F68]">
                    No se registran movimientos en el historial.
                  </td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr key={m.id} className="hover:bg-[#FAF7F2]/70 transition">
                    <td className="py-3 px-4 text-[#8C7D73] font-mono text-[11px]">
                      {new Date(m.createdAt).toLocaleString("es-AR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-[#241F1E] truncate max-w-[200px]">{m.productName}</p>
                      <p className="text-[10px] text-[#8C7D73] font-mono">{m.productSku}</p>
                    </td>
                    <td className="py-3 px-4 text-center">{getMovementBadge(m.type, m.quantity)}</td>
                    <td className="py-3 px-4 text-center font-mono text-[#7A6F68]">{m.previousStock} un.</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-[#241F1E]">{m.newStock} un.</td>
                    <td className="py-3 px-4 text-[#3A3330] max-w-[220px] truncate">{m.reason}</td>
                    <td className="py-3 px-4 text-[#8C7D73] text-[11px] truncate max-w-[140px]">
                      {m.userName || "Sistema"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Adjustment Modal */}
      {adjustModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#EFE8DF] rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setAdjustModalOpen(false)}
              className="absolute top-5 right-5 text-[#8C7D73] hover:text-[#241F1E] p-1 rounded-lg hover:bg-[#FAF7F2]"
            >
              <X size={18} />
            </button>

            <span className="font-script text-lg text-[#BD532B]">Movimiento de depósito</span>
            <h2 className="text-xl font-serif font-bold text-[#241F1E] mb-1">Ajuste Manual de Inventario</h2>
            <p className="text-xs text-[#7A6F68] mb-5">
              Toda modificación queda registrada en auditoría con tu usuario y motivo obligatorio.
            </p>

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#3A3330] font-medium mb-1">Producto *</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] focus:outline-none focus:border-[#BD532B]"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — Stock actual: {p.stock}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#3A3330] font-medium mb-1">Tipo de Operación</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustmentType("in")}
                    className={`py-2 px-3 rounded-xl font-medium border flex items-center justify-center gap-1.5 transition ${
                      adjustmentType === "in"
                        ? "bg-[#0E6365]/15 text-[#0E6365] border-[#0E6365] font-bold"
                        : "bg-[#FAF7F2] text-[#7A6F68] border-[#E5DDD0] hover:text-[#241F1E]"
                    }`}
                  >
                    <Plus size={14} /> Entrada / Ingreso
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentType("out")}
                    className={`py-2 px-3 rounded-xl font-medium border flex items-center justify-center gap-1.5 transition ${
                      adjustmentType === "out"
                        ? "bg-red-50 text-red-700 border-red-300 font-bold"
                        : "bg-[#FAF7F2] text-[#7A6F68] border-[#E5DDD0] hover:text-[#241F1E]"
                    }`}
                  >
                    <Minus size={14} /> Salida / Merma
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[#3A3330] font-medium mb-1">Cantidad de Unidades *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustmentDelta}
                  onChange={(e) => setAdjustmentDelta(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] focus:outline-none focus:border-[#BD532B] font-bold"
                />
              </div>

              <div>
                <label className="block text-[#3A3330] font-medium mb-1">Motivo Justificativo *</label>
                <select
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] focus:outline-none focus:border-[#BD532B] mb-2"
                >
                  <option value="">Selecciona un motivo estándar...</option>
                  <option value="Ingreso de mercadería por compra mayorista">Ingreso de mercadería por compra mayorista</option>
                  <option value="Ajuste por conteo físico en inventario">Ajuste por conteo físico en inventario</option>
                  <option value="Rotura o merma en depósito">Rotura o merma en depósito</option>
                  <option value="Devolución de cliente verificada">Devolución de cliente verificada</option>
                  <option value="Muestra para showroom o promoción">Muestra para showroom o promoción</option>
                </select>
                <input
                  type="text"
                  placeholder="O escribe un motivo detallado..."
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] focus:outline-none focus:border-[#BD532B]"
                />
              </div>

              <div className="pt-4 border-t border-[#EFE8DF] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4 py-2 bg-[#F5EDE2] hover:bg-[#EAE1D3] text-[#3A3330] rounded-xl font-medium transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className="px-5 py-2 bg-[#BD532B] hover:bg-[#A7441E] text-white font-bold rounded-xl transition shadow-md shadow-[#BD532B]/20 disabled:opacity-50"
                >
                  {adjusting ? "Guardando..." : "Confirmar Ajuste"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
