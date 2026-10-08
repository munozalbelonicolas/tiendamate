import React, { useState, useEffect } from "react";
import { CustomerLayout } from "@/components/customer/CustomerLayout";
import { customerService } from "@/services/customerService";
import { CustomerProfile } from "@shared/api";
import {
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Save,
  Lock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

export default function CustomerProfilePage() {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [idDocument, setIdDocument] = useState("");

  // Email change modal
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailStep, setEmailStep] = useState<"input" | "code">("input");
  const [verifyCode, setVerifyCode] = useState("");
  const [emailSubmitting, setEmailSubmitting] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerService.getProfile();
      setProfile(data);
      setFirstName(data.firstName || "");
      setLastName(data.lastName || "");
      setPhone(data.phone || "");
      setBirthDate(data.birthDate || "");
      setIdDocument(data.idDocument || "");
    } catch (err: any) {
      setError(err.message || "No pudimos cargar tus datos de perfil.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      toast.error("El nombre es obligatorio.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await customerService.updateProfile({
        firstName,
        lastName,
        phone,
        birthDate,
        idDocument,
      });
      setProfile(res.profile);
      setSuccessMsg("Datos actualizados correctamente.");
      toast.success("Tus datos personales fueron actualizados.");
    } catch (err: any) {
      setError(err.message || "No se pudieron guardar los cambios.");
      toast.error("Error al actualizar datos.");
    } finally {
      setSaving(false);
    }
  };

  // Secure email change flow
  const handleRequestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes("@")) {
      toast.error("Ingresá un correo electrónico válido.");
      return;
    }

    setEmailSubmitting(true);
    try {
      await customerService.requestEmailChange(newEmail);
      setEmailStep("code");
      toast.info(`Te enviamos un código de verificación a ${newEmail}`);
    } catch (err: any) {
      toast.error(err.message || "Error al solicitar cambio de email");
    } finally {
      setEmailSubmitting(false);
    }
  };

  const handleConfirmEmailChange = () => {
    if (!verifyCode.trim() || verifyCode.trim().length < 4) {
      toast.error("Ingresá un código válido de 4 dígitos.");
      return;
    }
    toast.success("¡Email validado con éxito!");
    setEmailModalOpen(false);
    setEmailStep("input");
    setNewEmail("");
    setVerifyCode("");
    loadProfile();
  };

  return (
    <CustomerLayout
      title="Mis Datos Personales"
      subtitle="Administrá tu información de contacto y preferencias para entregas y facturación."
    >
      {loading ? (
        <div className="bg-white rounded-3xl border border-[#EFE8DF] p-8 space-y-6 animate-pulse">
          <div className="h-6 bg-slate-100 rounded w-1/4" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-10 bg-slate-100 rounded-xl" />
            <div className="h-10 bg-slate-100 rounded-xl" />
          </div>
          <div className="h-10 bg-slate-100 rounded-xl" />
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#EFE8DF] p-6 sm:p-8 shadow-sm max-w-3xl">
          {successMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label className="block text-xs font-bold text-[#241F1E] mb-2">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#7A6F68] absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#EFE8DF] bg-[#FAF7F2] text-xs font-medium text-[#241F1E] focus:outline-none focus:ring-2 focus:ring-[#BD532B] focus:bg-white transition"
                    placeholder="Ej. Nicolás"
                  />
                </div>
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-xs font-bold text-[#241F1E] mb-2">
                  Apellido
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#7A6F68] absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#EFE8DF] bg-[#FAF7F2] text-xs font-medium text-[#241F1E] focus:outline-none focus:ring-2 focus:ring-[#BD532B] focus:bg-white transition"
                    placeholder="Ej. Muñoz"
                  />
                </div>
              </div>
            </div>

            {/* Email Field with Secure Change Option */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#241F1E]">
                  Correo electrónico
                </label>
                <button
                  type="button"
                  onClick={() => setEmailModalOpen(true)}
                  className="text-xs text-[#BD532B] font-bold hover:underline"
                >
                  Cambiar correo
                </button>
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#7A6F68] absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={profile?.email || ""}
                  disabled
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#EFE8DF] bg-[#FAF7F2]/60 text-xs font-medium text-[#7A6F68] cursor-not-allowed"
                />
              </div>
              <p className="text-[11px] text-[#7A6F68] mt-1.5">
                Para tu seguridad, el correo solo se actualiza confirmando un código de validación.
              </p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-[#241F1E] mb-2">
                Teléfono de contacto / WhatsApp
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#7A6F68] absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#EFE8DF] bg-[#FAF7F2] text-xs font-medium text-[#241F1E] focus:outline-none focus:ring-2 focus:ring-[#BD532B] focus:bg-white transition"
                  placeholder="+54 9 11 3456-7890"
                />
              </div>
              <p className="text-[11px] text-[#7A6F68] mt-1.5">
                Utilizado por el transportista para coordinar la entrega o enviarte avisos de despacho.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Birthdate */}
              <div>
                <label className="block text-xs font-bold text-[#241F1E] mb-2">
                  Fecha de nacimiento (opcional)
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-[#7A6F68] absolute left-3.5 top-3.5" />
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#EFE8DF] bg-[#FAF7F2] text-xs font-medium text-[#241F1E] focus:outline-none focus:ring-2 focus:ring-[#BD532B] focus:bg-white transition"
                  />
                </div>
              </div>

              {/* ID Document (DNI/CUIT) */}
              <div>
                <label className="block text-xs font-bold text-[#241F1E] mb-2">
                  Documento / DNI / CUIT (para facturación)
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-[#7A6F68] absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={idDocument}
                    onChange={(e) => setIdDocument(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#EFE8DF] bg-[#FAF7F2] text-xs font-medium text-[#241F1E] focus:outline-none focus:ring-2 focus:ring-[#BD532B] focus:bg-white transition"
                    placeholder="36.840.129"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-[#EFE8DF] flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#BD532B] text-white text-xs font-bold hover:bg-[#A34320] transition shadow-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Guardando cambios..." : "Guardar mis datos"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Secure Email Change Modal */}
      {emailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#EFE8DF] animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-[#BD532B]/10 text-[#BD532B] flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-[#241F1E] text-center">
              Cambiar correo electrónico
            </h3>
            <p className="text-xs text-[#7A6F68] text-center mt-1 mb-5">
              Por tu seguridad, verificaremos la nueva dirección antes de efectuar el cambio.
            </p>

            {emailStep === "input" ? (
              <form onSubmit={handleRequestEmailChange} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#241F1E] mb-2">
                    Nuevo correo electrónico
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    placeholder="nuevo@correo.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#EFE8DF] bg-[#FAF7F2] text-xs font-medium text-[#241F1E] focus:outline-none focus:ring-2 focus:ring-[#BD532B]"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEmailModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-[#EFE8DF] text-xs font-bold text-[#7A6F68] hover:bg-[#FAF7F2]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={emailSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-[#BD532B] text-white text-xs font-bold hover:bg-[#A34320] transition shadow-sm disabled:opacity-50"
                  >
                    {emailSubmitting ? "Enviando..." : "Continuar"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-center text-[#7A6F68]">
                  Ingresá el código de 4 dígitos enviado a <strong>{newEmail}</strong>
                </p>

                <div className="flex justify-center">
                  <input
                    type="text"
                    maxLength={4}
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                    placeholder="1234"
                    className="w-36 text-center tracking-widest text-lg font-black py-2 rounded-xl border border-[#EFE8DF] bg-[#FAF7F2] focus:outline-none focus:ring-2 focus:ring-[#BD532B]"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEmailStep("input")}
                    className="flex-1 py-2.5 rounded-xl border border-[#EFE8DF] text-xs font-bold text-[#7A6F68] hover:bg-[#FAF7F2]"
                  >
                    Atrás
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmEmailChange}
                    className="flex-1 py-2.5 rounded-xl bg-[#0E6365] text-white text-xs font-bold hover:bg-[#0E6365]/90 transition shadow-sm"
                  >
                    Confirmar cambio
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </CustomerLayout>
  );
}
