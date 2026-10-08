import React, { useState, useEffect } from "react";
import { CustomerLayout } from "@/components/customer/CustomerLayout";
import { customerService } from "@/services/customerService";
import { CustomerNotificationItem, CustomerNotificationPreferences } from "@shared/api";
import {
  Bell,
  Check,
  CheckCheck,
  ShoppingBag,
  Tag,
  Shield,
  MessageSquare,
  Mail,
  Smartphone,
  Save,
  Clock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export default function CustomerNotifications() {
  const [notifications, setNotifications] = useState<CustomerNotificationItem[]>([]);
  const [preferences, setPreferences] = useState<CustomerNotificationPreferences>({
    orderUpdates: true,
    promotions: true,
    emailChannel: true,
    whatsappChannel: true,
    pushChannel: false,
  });
  const [loading, setLoading] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [notifs, profile] = await Promise.all([
        customerService.getNotifications(),
        customerService.getProfile(),
      ]);
      setNotifications(notifs);
      if (profile.notificationPreferences) {
        setPreferences(profile.notificationPreferences);
      }
    } catch (err: any) {
      setError(err.message || "No pudimos cargar tus notificaciones.");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      const updated = await customerService.markNotificationRead(id);
      setNotifications(updated);
    } catch {
      toast.error("Error al marcar como leída");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const updated = await customerService.markAllNotificationsRead();
      setNotifications(updated);
      toast.success("Todas las notificaciones marcadas como leídas.");
    } catch {
      toast.error("Error al actualizar notificaciones.");
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrefs(true);
    try {
      await customerService.updateProfile({
        notificationPreferences: preferences,
      });
      toast.success("Preferencias de notificaciones guardadas.");
    } catch (err: any) {
      toast.error("Error al guardar preferencias.");
    } finally {
      setSavingPrefs(false);
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "order":
        return <ShoppingBag className="w-4 h-4 text-[#BD532B]" />;
      case "promo":
        return <Tag className="w-4 h-4 text-[#0E6365]" />;
      case "security":
        return <Shield className="w-4 h-4 text-amber-600" />;
      default:
        return <Bell className="w-4 h-4 text-[#7A6F68]" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <CustomerLayout
      title="Centro de Notificaciones"
      subtitle="Mantenete al tanto de tus compras y configurá los avisos que querés recibir."
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Notifications List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl border border-[#EFE8DF] p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#EFE8DF] mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#241F1E]">Notificaciones Recientes</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#BD532B] text-white">
                    {unreadCount} nuevas
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#BD532B] hover:underline"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Marcar todas como leídas</span>
                </button>
              )}
            </div>

            {loading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-[#FAF7F2] rounded-2xl border border-[#EFE8DF]" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center text-[#7A6F68]">
                <Bell className="w-10 h-10 mx-auto text-[#BD532B]/30 mb-2" />
                <p className="text-xs font-semibold">No tenés notificaciones pendientes.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#F5EFE6]">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4 transition rounded-2xl p-3 ${
                      n.isRead ? "text-[#7A6F68]" : "bg-[#FAF7F2]/80 font-medium"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white border border-[#EFE8DF] flex items-center justify-center flex-shrink-0 shadow-xs">
                        {getNotifIcon(n.type)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#241F1E]">{n.title}</h4>
                        <p className="text-xs text-[#7A6F68] mt-0.5 leading-relaxed">{n.message}</p>
                        <span className="text-[10px] text-[#7A6F68] flex items-center gap-1 mt-1.5">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(n.createdAt).toLocaleDateString("es-AR", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </span>
                      </div>
                    </div>

                    {!n.isRead && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="p-1 rounded-lg text-[#7A6F68] hover:text-[#BD532B] hover:bg-white transition flex-shrink-0"
                        title="Marcar como leída"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Preferences Form */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl border border-[#EFE8DF] p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#241F1E] pb-3 border-b border-[#EFE8DF] mb-4">
              Preferencias de Comunicación
            </h3>

            <form onSubmit={handleSavePreferences} className="space-y-6">
              {/* Category 1: Pedidos */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] mb-3">
                  Actualizaciones de Pedidos
                </h4>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.orderUpdates}
                    onChange={(e) =>
                      setPreferences({ ...preferences, orderUpdates: e.target.checked })
                    }
                    className="mt-0.5 rounded border-[#EFE8DF] text-[#BD532B] focus:ring-[#BD532B]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#241F1E] block">
                      Avisos de preparación y despacho
                    </span>
                    <span className="text-[11px] text-[#7A6F68]">
                      Confirmación de pago, salida de depósito y entrega.
                    </span>
                  </div>
                </label>
              </div>

              {/* Category 2: Promociones */}
              <div className="pt-4 border-t border-[#EFE8DF]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] mb-3">
                  Beneficios y Novedades
                </h4>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.promotions}
                    onChange={(e) =>
                      setPreferences({ ...preferences, promotions: e.target.checked })
                    }
                    className="mt-0.5 rounded border-[#EFE8DF] text-[#BD532B] focus:ring-[#BD532B]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#241F1E] block">
                      Cupones y lanzamientos exclusivos
                    </span>
                    <span className="text-[11px] text-[#7A6F68]">
                      Descuentos en yerbas seleccionadas y accesorios.
                    </span>
                  </div>
                </label>
              </div>

              {/* Category 3: Canales */}
              <div className="pt-4 border-t border-[#EFE8DF]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] mb-3">
                  Canales Habilitados
                </h4>
                <div className="space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#7A6F68]" />
                      <span className="text-xs font-medium text-[#241F1E]">Correo Electrónico</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.emailChannel}
                      onChange={(e) =>
                        setPreferences({ ...preferences, emailChannel: e.target.checked })
                      }
                      className="rounded border-[#EFE8DF] text-[#BD532B] focus:ring-[#BD532B]"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#0E6365]" />
                      <span className="text-xs font-medium text-[#241F1E]">WhatsApp</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.whatsappChannel}
                      onChange={(e) =>
                        setPreferences({ ...preferences, whatsappChannel: e.target.checked })
                      }
                      className="rounded border-[#EFE8DF] text-[#BD532B] focus:ring-[#BD532B]"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-[#7A6F68]" />
                      <span className="text-xs font-medium text-[#241F1E]">Notificaciones Push</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.pushChannel}
                      onChange={(e) =>
                        setPreferences({ ...preferences, pushChannel: e.target.checked })
                      }
                      className="rounded border-[#EFE8DF] text-[#BD532B] focus:ring-[#BD532B]"
                    />
                  </label>
                </div>
              </div>

              {/* Save Preferences Button */}
              <div className="pt-4 border-t border-[#EFE8DF]">
                <button
                  type="submit"
                  disabled={savingPrefs}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#BD532B] text-white text-xs font-bold hover:bg-[#A34320] transition shadow-sm disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingPrefs ? "Guardando..." : "Guardar preferencias"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
