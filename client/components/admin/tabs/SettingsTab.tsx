import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { StoreSettings, AuditLog } from "@shared/api";
import { History, Save, Store, Mail, DollarSign } from "lucide-react";
import { toast } from "sonner";

export default function SettingsTab() {
  const { token, hasPermission } = useAuth();
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: "TiendaMate",
    supportEmail: "contacto@tiendamate.com.ar",
    currency: "ARS",
    timezone: "America/Argentina/Buenos_Aires",
    taxRate: 21,
    minStockThreshold: 5,
    freeShippingThreshold: 45000,
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<"store" | "audit">("store");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSettingsAndAudit = async () => {
    setLoading(true);
    try {
      const [setRes, auditRes] = await Promise.all([
        fetch("/api/admin/settings", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/audit?limit=30", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (setRes.ok) {
        const setData = await setRes.json();
        setSettings(setData);
      }
      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditLogs(auditData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndAudit();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al guardar");

      toast.success("Configuración del comercio guardada en la base de datos.");
      setSettings(data);
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar configuración");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#EFE8DF]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-script text-lg text-[#BD532B]">Preferencias globales</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#241F1E] tracking-tight">Configuración del Comercio</h1>
          <p className="text-xs text-[#7A6F68] mt-1">
            Parámetros operativos, umbrales comerciales y registro oficial de auditoría.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveSubTab("store")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeSubTab === "store"
                ? "bg-[#BD532B] text-white shadow-xs"
                : "bg-white text-[#7A6F68] hover:text-[#241F1E] border border-[#E5DDD0]"
            }`}
          >
            Ajustes Generales
          </button>
          <button
            onClick={() => setActiveSubTab("audit")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeSubTab === "audit"
                ? "bg-[#BD532B] text-white shadow-xs"
                : "bg-white text-[#7A6F68] hover:text-[#241F1E] border border-[#E5DDD0]"
            }`}
          >
            Registro de Auditoría ({auditLogs.length})
          </button>
        </div>
      </div>

      {activeSubTab === "store" ? (
        <form onSubmit={handleSaveSettings} className="space-y-6 max-w-3xl text-xs">
          {/* Identity Box */}
          <div className="bg-white border border-[#EFE8DF] rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-serif font-bold text-[#241F1E] flex items-center gap-2">
              <Store size={16} className="text-[#BD532B]" />
              <span>Identidad del Comercio</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#3A3330] font-medium mb-1">Nombre Comercial *</label>
                <input
                  type="text"
                  required
                  value={settings.storeName}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] focus:outline-none focus:border-[#BD532B]"
                />
              </div>

              <div>
                <label className="block text-[#3A3330] font-medium mb-1">URL de Logotipo</label>
                <input
                  type="text"
                  value={settings.logoUrl || ""}
                  onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                  placeholder="/images/logo.png"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] focus:outline-none focus:border-[#BD532B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#3A3330] font-medium mb-1">Anuncio / Banner Superior de Tienda</label>
              <input
                type="text"
                value={settings.announcement || ""}
                onChange={(e) => setSettings({ ...settings, announcement: e.target.value })}
                placeholder="¡Envíos gratis a todo el país en compras superiores a $45.000!"
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] focus:outline-none focus:border-[#BD532B]"
              />
            </div>
          </div>

          {/* Contact Box */}
          <div className="bg-white border border-[#EFE8DF] rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-serif font-bold text-[#241F1E] flex items-center gap-2">
              <Mail size={16} className="text-[#0E6365]" />
              <span>Contacto y Ubicación</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#3A3330] font-medium mb-1">Correo de Soporte *</label>
                <input
                  type="email"
                  required
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] focus:outline-none focus:border-[#BD532B]"
                />
              </div>

              <div>
                <label className="block text-[#3A3330] font-medium mb-1">Teléfono / WhatsApp</label>
                <input
                  type="text"
                  value={settings.phone || ""}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  placeholder="+54 11 4567-8900"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] focus:outline-none focus:border-[#BD532B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#3A3330] font-medium mb-1">Dirección Física / Depósito</label>
              <input
                type="text"
                value={settings.address || ""}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                placeholder="Av. Corrientes 1234, CABA, Argentina"
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] focus:outline-none focus:border-[#BD532B]"
              />
            </div>
          </div>

          {/* Commerce Policies & Thresholds */}
          <div className="bg-white border border-[#EFE8DF] rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-serif font-bold text-[#241F1E] flex items-center gap-2">
              <DollarSign size={16} className="text-[#8C4E2D]" />
              <span>Políticas Comerciales y Fiscales</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[#3A3330] font-medium mb-1">Tasa de Impuesto / IVA (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.taxRate}
                  onChange={(e) => setSettings({ ...settings, taxRate: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] focus:outline-none focus:border-[#BD532B] font-bold"
                />
              </div>

              <div>
                <label className="block text-[#3A3330] font-medium mb-1">Envío Gratis Desde ($)</label>
                <input
                  type="number"
                  min="0"
                  value={settings.freeShippingThreshold}
                  onChange={(e) => setSettings({ ...settings, freeShippingThreshold: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] focus:outline-none focus:border-[#BD532B] font-bold"
                />
              </div>

              <div>
                <label className="block text-[#3A3330] font-medium mb-1">Alerta Stock Mínimo Global</label>
                <input
                  type="number"
                  min="1"
                  value={settings.minStockThreshold}
                  onChange={(e) => setSettings({ ...settings, minStockThreshold: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] focus:outline-none focus:border-[#BD532B] font-bold"
                />
              </div>
            </div>
          </div>

          {hasPermission("settings.manage") && (
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#BD532B] hover:bg-[#A7441E] text-white font-bold rounded-xl shadow-md shadow-[#BD532B]/20 transition disabled:opacity-50 active:scale-[0.99]"
              >
                <Save size={15} />
                <span>{saving ? "Guardando..." : "Guardar Cambios"}</span>
              </button>
            </div>
          )}
        </form>
      ) : (
        /* Audit Logs List */
        <div className="bg-white border border-[#EFE8DF] rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[#EFE8DF] flex items-center justify-between text-xs bg-[#F7F3EC]/50">
            <span className="font-serif font-bold text-[#241F1E] flex items-center gap-1.5">
              <History size={15} className="text-[#0E6365]" /> Registro Inmutable de Auditoría
            </span>
            <span className="text-[#7A6F68]">Últimos {auditLogs.length} eventos registrados</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#EFE8DF] bg-[#F7F3EC] text-[#6E625A]">
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Fecha y Hora</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Usuario Responsable</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Acción</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Entidad</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Detalles del Cambio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EAE1] font-mono text-[11px]">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[#7A6F68]">
                      No hay eventos en la bitácora.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#FAF7F2]/70 transition text-[#3A3330]">
                      <td className="py-3 px-4 text-[#8C7D73]">
                        {new Date(log.createdAt).toLocaleString("es-AR")}
                      </td>
                      <td className="py-3 px-4 text-[#241F1E] font-sans font-medium">{log.userEmail}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-lg bg-[#0E6365]/10 text-[#0E6365] border border-[#0E6365]/20 text-[10px] font-bold">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#7A6F68]">{log.entityType} #{log.entityId}</td>
                      <td className="py-3 px-4 font-sans text-[#7A6F68] truncate max-w-xs">
                        {log.newValues || log.oldValues || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
