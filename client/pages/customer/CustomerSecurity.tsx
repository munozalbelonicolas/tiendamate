import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CustomerLayout } from "@/components/customer/CustomerLayout";
import { customerService } from "@/services/customerService";
import { useAuth } from "@/context/AuthContext";
import { CustomerSessionItem } from "@shared/api";
import {
  Shield,
  KeyRound,
  Laptop,
  Smartphone,
  Globe,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  LogOut,
  X,
} from "lucide-react";
import { toast } from "sonner";

export default function CustomerSecurity() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState<CustomerSessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  // Account Deletion modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const data = await customerService.getSessions();
      setSessions(data);
    } catch {
      // ignore
    } finally {
      setSessionsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error("Completá todos los campos de contraseña.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("La confirmación de la contraseña no coincide.");
      return;
    }

    setPasswordSaving(true);
    try {
      await customerService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      toast.success("Contraseña actualizada correctamente.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar contraseña.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    try {
      const res = await customerService.deleteSession(sessionId);
      setSessions(res.sessions);
      toast.success("Sesión cerrada en el dispositivo remoto.");
    } catch {
      toast.error("Error al cerrar sesión.");
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await customerService.deleteAccount();
      toast.success("Tu cuenta ha sido eliminada. Redirigiendo a la tienda...");
      logout();
      setDeleteModalOpen(false);
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar la cuenta.");
    } finally {
      setDeleting(false);
    }
  };

  const getDeviceIcon = (dev: string) => {
    if (dev.toLowerCase().includes("iphone") || dev.toLowerCase().includes("android")) {
      return Smartphone;
    }
    return Laptop;
  };

  return (
    <CustomerLayout
      title="Seguridad y Sesiones"
      subtitle="Administrá tu contraseña, revisá tus dispositivos conectados y la privacidad de tu cuenta."
    >
      <div className="space-y-8 max-w-3xl">
        {/* Password Change Form */}
        <div className="bg-white rounded-3xl border border-[#EFE8DF] p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 pb-4 border-b border-[#EFE8DF] mb-6">
            <div className="w-10 h-10 rounded-2xl bg-[#BD532B]/10 text-[#BD532B] flex items-center justify-center font-bold">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#241F1E]">Cambiar Contraseña</h3>
              <p className="text-xs text-[#7A6F68]">
                Utilizá al menos 8 caracteres combinando números y letras.
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#241F1E] mb-1.5">
                Contraseña actual
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-[#EFE8DF] bg-[#FAF7F2] text-xs font-medium text-[#241F1E] focus:outline-none focus:ring-2 focus:ring-[#BD532B]"
                placeholder="••••••••"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#241F1E] mb-1.5">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#EFE8DF] bg-[#FAF7F2] text-xs font-medium text-[#241F1E] focus:outline-none focus:ring-2 focus:ring-[#BD532B]"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#241F1E] mb-1.5">
                  Confirmar nueva contraseña
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-[#EFE8DF] bg-[#FAF7F2] text-xs font-medium text-[#241F1E] focus:outline-none focus:ring-2 focus:ring-[#BD532B]"
                  placeholder="Repetir nueva contraseña"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={passwordSaving}
                className="px-5 py-2.5 rounded-xl bg-[#BD532B] text-white text-xs font-bold hover:bg-[#A34320] transition shadow-sm disabled:opacity-50"
              >
                {passwordSaving ? "Actualizando..." : "Actualizar contraseña"}
              </button>
            </div>
          </form>
        </div>

        {/* Active Devices & Sessions */}
        <div className="bg-white rounded-3xl border border-[#EFE8DF] p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 pb-4 border-b border-[#EFE8DF] mb-6">
            <div className="w-10 h-10 rounded-2xl bg-[#0E6365]/10 text-[#0E6365] flex items-center justify-center font-bold">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#241F1E]">Dispositivos y Sesiones Activas</h3>
              <p className="text-xs text-[#7A6F68]">
                Lugares y dispositivos donde iniciaste sesión recientemente.
              </p>
            </div>
          </div>

          {sessionsLoading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-[#FAF7F2] rounded-2xl border border-[#EFE8DF]" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-[#F5EFE6]">
              {sessions.map((sess) => {
                const Icon = getDeviceIcon(sess.deviceName);

                return (
                  <div
                    key={sess.id}
                    className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#FAF7F2] border border-[#EFE8DF] flex items-center justify-center text-[#7A6F68] flex-shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-[#241F1E]">{sess.deviceName}</p>
                          {sess.isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Activo ahora
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#7A6F68] mt-0.5">
                          {sess.browser || "Navegador web"} · {sess.ipAddress || "Argentina"}
                        </p>
                      </div>
                    </div>

                    {!sess.isCurrent && (
                      <button
                        onClick={() => handleTerminateSession(sess.id)}
                        className="text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-xl transition"
                      >
                        Cerrar sesión
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Danger Zone: Account Deletion */}
        <div className="bg-red-50/40 rounded-3xl border border-red-200 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-red-900">Eliminar Cuenta de Úno más</h3>
              <p className="text-xs text-red-700/80 mt-1 leading-relaxed">
                Eliminar tu cuenta puede eliminar permanentemente tus datos personales cuando la
                legislación y las obligaciones comerciales lo permitan. Conservaremos los registros
                fiscales obligatorios de compras previas.
              </p>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition shadow-sm"
              >
                Eliminar mi cuenta
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#EFE8DF] animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-[#241F1E] text-center">
              ¿Confirmás que querés eliminar tu cuenta?
            </h3>
            <p className="text-xs text-[#7A6F68] text-center mt-2 leading-relaxed">
              Tus datos de acceso, favoritos y direcciones se borrarán de inmediato. Esta acción no se
              puede deshacer.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl border border-[#EFE8DF] text-xs font-bold text-[#7A6F68] hover:bg-[#FAF7F2]"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition shadow-sm disabled:opacity-50"
              >
                {deleting ? "Eliminando..." : "Sí, eliminar cuenta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </CustomerLayout>
  );
}
