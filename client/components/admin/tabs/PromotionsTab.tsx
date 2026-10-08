import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Coupon } from "@shared/api";
import { Tag, Plus, Calendar, X } from "lucide-react";
import { toast } from "sonner";

export default function PromotionsTab() {
  const { token, hasPermission } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percentage" | "fixed">("percentage");
  const [value, setValue] = useState("");
  const [minPurchase, setMinPurchase] = useState("0");
  const [maxUses, setMaxUses] = useState("100");
  const [validDays, setValidDays] = useState("30");

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !value) {
      toast.error("El código y el valor del descuento son obligatorios.");
      return;
    }

    const payload = {
      code: code.trim().toUpperCase(),
      type,
      value: Number(value),
      minPurchase: Number(minPurchase || 0),
      maxUses: Number(maxUses || 100),
      validTo: new Date(Date.now() + Number(validDays) * 86400000).toISOString(),
    };

    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al crear cupón");

      toast.success(`Cupón ${data.code} creado exitosamente.`);
      setModalOpen(false);
      setCode("");
      setValue("");
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.message || "Error al crear cupón");
    }
  };

  const handleToggle = async (c: Coupon) => {
    try {
      const res = await fetch(`/api/admin/coupons/${c.id}/toggle`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !c.isActive }),
      });

      if (!res.ok) throw new Error("Error al modificar estado");

      toast.success(`Cupón ${c.code} ${!c.isActive ? "activado" : "desactivado"}`);
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#EFE8DF]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-script text-lg text-[#BD532B]">Fidelización y campañas</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#241F1E] tracking-tight">Promociones y Cupones</h1>
          <p className="text-xs text-[#7A6F68] mt-1">
            Gestión de códigos de descuento con validación server-side y límites de aplicación.
          </p>
        </div>

        {hasPermission("settings.manage") && (
          <button
            onClick={() => {
              setCode("");
              setValue("");
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#BD532B] hover:bg-[#A7441E] text-white font-bold rounded-xl text-xs shadow-md shadow-[#BD532B]/20 transition active:scale-[0.99]"
          >
            <Plus size={16} />
            <span>Crear Cupón</span>
          </button>
        )}
      </div>

      {/* Grid of Coupons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-[#7A6F68] text-xs">
            <div className="w-6 h-6 border-2 border-[#BD532B] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Cargando cupones...
          </div>
        ) : coupons.length === 0 ? (
          <div className="col-span-full py-16 text-center text-[#7A6F68] text-xs">
            <Tag className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#BD532B]" />
            <p className="font-serif font-bold text-base text-[#241F1E]">No hay cupones activos</p>
          </div>
        ) : (
          coupons.map((c) => (
            <div
              key={c.id}
              className={`bg-white border rounded-2xl p-5 shadow-xs transition flex flex-col justify-between ${
                c.isActive ? "border-[#EFE8DF] hover:border-[#BD532B]/40 hover:shadow-md" : "border-[#EFE8DF] opacity-60 bg-[#FAF7F2]"
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <span className="px-3 py-1 rounded-xl bg-[#BD532B]/10 text-[#BD532B] font-mono font-bold text-sm tracking-wider border border-[#BD532B]/20">
                    {c.code}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      c.isActive
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-stone-100 text-stone-600 border border-stone-200"
                    }`}
                  >
                    {c.isActive ? "Activo" : "Inactivo"}
                  </span>
                </div>

                <div className="text-xl font-serif font-bold text-[#241F1E] mb-2">
                  {c.type === "percentage" ? `${c.value}% OFF` : `$${c.value} OFF`}
                </div>

                <div className="space-y-1 text-xs text-[#7A6F68]">
                  <p>Compra mínima: {c.minPurchase > 0 ? `$${c.minPurchase}` : "Sin mínimo"}</p>
                  <p>
                    Usos: <strong className="text-[#241F1E]">{c.usedCount}</strong> de {c.maxUses} permitidos
                  </p>
                  <p className="flex items-center gap-1 text-[11px] text-[#8C7D73] mt-2">
                    <Calendar size={12} />
                    <span>Vence: {new Date(c.validTo).toLocaleDateString("es-AR")}</span>
                  </p>
                </div>
              </div>

              {hasPermission("settings.manage") && (
                <div className="pt-4 mt-4 border-t border-[#EFE8DF] flex justify-end">
                  <button
                    onClick={() => handleToggle(c)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      c.isActive
                        ? "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                    }`}
                  >
                    {c.isActive ? "Pausar Cupón" : "Activar Cupón"}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#EFE8DF] rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 text-[#8C7D73] hover:text-[#241F1E] p-1 rounded-lg hover:bg-[#FAF7F2]"
            >
              <X size={18} />
            </button>

            <span className="font-script text-lg text-[#BD532B]">Promoción comercial</span>
            <h2 className="text-xl font-serif font-bold text-[#241F1E] mb-1">Crear Nuevo Cupón</h2>
            <p className="text-xs text-[#7A6F68] mb-5">El descuento se verificará de manera segura en el backend al comprar.</p>

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#3A3330] font-medium mb-1">Código Promocional *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Ej. MATERO20"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] font-mono uppercase focus:outline-none focus:border-[#BD532B] font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#3A3330] font-medium mb-1">Tipo de Descuento</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] focus:outline-none focus:border-[#BD532B]"
                  >
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed">Monto Fijo ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#3A3330] font-medium mb-1">Valor de Descuento *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={type === "percentage" ? "15" : "5000"}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] focus:outline-none focus:border-[#BD532B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#3A3330] font-medium mb-1">Compra Mínima ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={minPurchase}
                    onChange={(e) => setMinPurchase(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] focus:outline-none focus:border-[#BD532B]"
                  />
                </div>

                <div>
                  <label className="block text-[#3A3330] font-medium mb-1">Límite de Usos</label>
                  <input
                    type="number"
                    min="1"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] focus:outline-none focus:border-[#BD532B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#3A3330] font-medium mb-1">Vigencia (Días a partir de hoy)</label>
                <input
                  type="number"
                  min="1"
                  value={validDays}
                  onChange={(e) => setValidDays(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] focus:outline-none focus:border-[#BD532B]"
                />
              </div>

              <div className="pt-4 border-t border-[#EFE8DF] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-[#F5EDE2] hover:bg-[#EAE1D3] text-[#3A3330] rounded-xl font-medium transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#BD532B] hover:bg-[#A7441E] text-white font-bold rounded-xl transition shadow-md shadow-[#BD532B]/20"
                >
                  Guardar Cupón
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
