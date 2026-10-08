import React, { useState, useEffect } from "react";
import { CustomerLayout } from "@/components/customer/CustomerLayout";
import { customerService } from "@/services/customerService";
import { CustomerPortalCoupon } from "@shared/api";
import {
  Tag,
  Copy,
  Check,
  Calendar,
  Sparkles,
  Percent,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function CustomerCoupons() {
  const [coupons, setCoupons] = useState<CustomerPortalCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerService.getCoupons();
      setCoupons(data);
    } catch (err: any) {
      setError(err.message || "No pudimos cargar tus cupones.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`¡Cupón "${code}" copiado!`, {
      description: "Pegalo en el checkout para aplicar tu descuento.",
    });
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <CustomerLayout
      title="Mis Cupones y Beneficios"
      subtitle="Descuentos activos y promociones exclusivas para tu cuenta."
    >
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 bg-white rounded-3xl border border-[#EFE8DF]" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-white rounded-3xl border border-red-200 p-8 text-center max-w-lg mx-auto">
          <p className="text-red-600 font-semibold mb-3">{error}</p>
          <button
            onClick={loadCoupons}
            className="px-5 py-2.5 rounded-xl bg-[#BD532B] text-white text-xs font-bold hover:bg-[#A34320] transition shadow-sm"
          >
            Intentar nuevamente
          </button>
        </div>
      ) : coupons.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#EFE8DF] p-12 text-center shadow-sm">
          <Tag className="w-12 h-12 mx-auto text-[#BD532B]/40 mb-3" />
          <h3 className="text-base font-bold text-[#241F1E]">No tenés cupones activos</h3>
          <p className="text-xs text-[#7A6F68] mt-1 max-w-sm mx-auto">
            Te notificaremos por correo y en tu panel cuando tengamos promociones especiales para vos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {coupons.map((coupon) => {
            const isAvailable = coupon.status === "available";

            return (
              <div
                key={coupon.id}
                className={`bg-white rounded-3xl border shadow-sm p-6 relative overflow-hidden transition flex flex-col justify-between ${
                  isAvailable
                    ? "border-[#EFE8DF] hover:border-[#BD532B]/50"
                    : "border-gray-200 opacity-60 bg-gray-50/50"
                }`}
              >
                {/* Decorative Ticket Perforations */}
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#FAF7F2] border border-[#EFE8DF]" />
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#FAF7F2] border border-[#EFE8DF]" />

                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isAvailable
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : coupon.status === "used"
                          ? "bg-gray-100 text-gray-700"
                          : "bg-red-50 text-red-600 border border-red-200"
                      }`}
                    >
                      {isAvailable ? "Disponible" : coupon.status === "used" ? "Utilizado" : "Vencido"}
                    </span>

                    <span className="text-[11px] text-[#7A6F68] flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Vence el {new Date(coupon.validTo).toLocaleDateString("es-AR")}</span>
                    </span>
                  </div>

                  {/* Benefit Display */}
                  <div className="my-2">
                    <h3 className="text-2xl font-black text-[#241F1E] flex items-baseline gap-1">
                      {coupon.type === "percentage" ? (
                        <>
                          <span>{coupon.value}%</span>
                          <span className="text-sm font-bold text-[#BD532B]">OFF</span>
                        </>
                      ) : (
                        <>
                          <span>${coupon.value.toLocaleString("es-AR")}</span>
                          <span className="text-sm font-bold text-[#0E6365]">de descuento</span>
                        </>
                      )}
                    </h3>
                    <p className="text-xs text-[#7A6F68] mt-1">{coupon.description}</p>
                  </div>
                </div>

                {/* Coupon Code Strip */}
                <div className="pt-4 border-t border-dashed border-[#EFE8DF] mt-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 bg-[#FAF7F2] px-3 py-1.5 rounded-xl border border-[#EFE8DF]">
                    <Tag className="w-3.5 h-3.5 text-[#BD532B]" />
                    <code className="font-mono text-xs font-bold text-[#241F1E] tracking-wider">
                      {coupon.code}
                    </code>
                  </div>

                  {isAvailable && (
                    <button
                      onClick={() => handleCopy(coupon.code)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs ${
                        copiedCode === coupon.code
                          ? "bg-emerald-600 text-white"
                          : "bg-[#BD532B] text-white hover:bg-[#A34320]"
                      }`}
                    >
                      {copiedCode === coupon.code ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar código</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CustomerLayout>
  );
}
