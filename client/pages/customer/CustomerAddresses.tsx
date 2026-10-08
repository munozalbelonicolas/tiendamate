import React, { useState, useEffect } from "react";
import { CustomerLayout } from "@/components/customer/CustomerLayout";
import { customerService } from "@/services/customerService";
import { CustomerAddress } from "@shared/api";
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Check,
  Star,
  Home,
  Briefcase,
  Building,
  AlertCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";

export default function CustomerAddresses() {
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [title, setTitle] = useState("Casa");
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [floorApt, setFloorApt] = useState("");
  const [city, setCity] = useState("CABA");
  const [state, setState] = useState("Buenos Aires");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("Argentina");
  const [notes, setNotes] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerService.getAddresses();
      setAddresses(data);
    } catch (err: any) {
      setError(err.message || "No pudimos cargar tus direcciones.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle("Casa");
    setRecipientName("");
    setPhone("");
    setStreet("");
    setStreetNumber("");
    setFloorApt("");
    setCity("CABA");
    setState("Buenos Aires");
    setPostalCode("");
    setCountry("Argentina");
    setNotes("");
    setIsDefault(addresses.length === 0);
    setModalOpen(true);
  };

  const handleOpenEdit = (addr: CustomerAddress) => {
    setEditingId(addr.id);
    setTitle(addr.title);
    setRecipientName(addr.recipientName || "");
    setPhone(addr.phone || "");
    setStreet(addr.street);
    setStreetNumber(addr.streetNumber || "");
    setFloorApt(addr.floorApt || "");
    setCity(addr.city);
    setState(addr.state || "Buenos Aires");
    setPostalCode(addr.postalCode || "");
    setCountry(addr.country || "Argentina");
    setNotes(addr.notes || "");
    setIsDefault(addr.isDefault);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!street.trim() || !city.trim()) {
      toast.error("La calle y la ciudad son obligatorias.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title,
        recipientName,
        phone,
        street,
        streetNumber,
        floorApt,
        city,
        state,
        postalCode,
        country,
        notes,
        isDefault,
      };

      if (editingId) {
        await customerService.updateAddress(editingId, payload);
        toast.success("Dirección actualizada correctamente.");
      } else {
        await customerService.createAddress(payload);
        toast.success("Dirección guardada correctamente.");
      }

      setModalOpen(false);
      loadAddresses();
    } catch (err: any) {
      toast.error(err.message || "No se pudo guardar la dirección.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Estás seguro de eliminar esta dirección?")) return;
    try {
      await customerService.deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast.success("Dirección eliminada correctamente.");
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar la dirección.");
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await customerService.updateAddress(id, { isDefault: true });
      loadAddresses();
      toast.success("Dirección predeterminada actualizada.");
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar dirección.");
    }
  };

  const getAliasIcon = (t: string) => {
    const clean = t.toLowerCase();
    if (clean.includes("trabajo") || clean.includes("oficina")) return Briefcase;
    if (clean.includes("depto") || clean.includes("edificio")) return Building;
    return Home;
  };

  return (
    <CustomerLayout
      title="Mis Direcciones"
      subtitle="Administrá los domicilios para recibir tus envíos o retirar tus compras."
    >
      {/* Top action button */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#BD532B] text-white text-xs font-bold hover:bg-[#A34320] transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar nueva dirección</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 bg-white rounded-3xl border border-[#EFE8DF]" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-white rounded-3xl border border-red-200 p-8 text-center max-w-lg mx-auto">
          <p className="text-red-600 font-semibold mb-3">{error}</p>
          <button
            onClick={loadAddresses}
            className="px-5 py-2.5 rounded-xl bg-[#BD532B] text-white text-xs font-bold hover:bg-[#A34320] transition shadow-sm"
          >
            Intentar nuevamente
          </button>
        </div>
      ) : addresses.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#EFE8DF] p-12 text-center shadow-sm">
          <MapPin className="w-12 h-12 mx-auto text-[#BD532B]/40 mb-3" />
          <h3 className="text-base font-bold text-[#241F1E]">No tenés direcciones guardadas</h3>
          <p className="text-xs text-[#7A6F68] mt-1 max-w-sm mx-auto mb-6">
            Guardá tus domicilios frecuentes para comprar en un solo clic durante el checkout.
          </p>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#BD532B] text-white text-xs font-bold hover:bg-[#A34320] transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar primera dirección</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((addr) => {
            const Icon = getAliasIcon(addr.title);

            return (
              <div
                key={addr.id}
                className={`bg-white rounded-3xl border p-6 shadow-sm transition flex flex-col justify-between ${
                  addr.isDefault
                    ? "border-[#BD532B] ring-1 ring-[#BD532B]"
                    : "border-[#EFE8DF] hover:border-[#BD532B]/40"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[#FAF7F2] text-[#BD532B] flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm text-[#241F1E]">{addr.title}</span>
                    </div>

                    {addr.isDefault ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#BD532B]/10 text-[#BD532B] border border-[#BD532B]/20">
                        Predeterminada
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetDefault(addr.id)}
                        className="text-[11px] font-semibold text-[#7A6F68] hover:text-[#BD532B] transition"
                      >
                        Hacer predeterminada
                      </button>
                    )}
                  </div>

                  {/* Address Content */}
                  <div className="text-xs text-[#241F1E] space-y-1 my-3">
                    <p className="font-bold text-sm">
                      {addr.street} {addr.streetNumber || ""}
                    </p>
                    {addr.floorApt && <p className="text-[#7A6F68]">{addr.floorApt}</p>}
                    <p className="text-[#7A6F68]">
                      {addr.city}, {addr.state || "Buenos Aires"}{" "}
                      {addr.postalCode ? `(CP ${addr.postalCode})` : ""}
                    </p>
                    {addr.recipientName && (
                      <p className="text-[#7A6F68] pt-1">
                        Destinatario: <strong className="text-[#241F1E]">{addr.recipientName}</strong>
                      </p>
                    )}
                    {addr.phone && (
                      <p className="text-[#7A6F68]">Teléfono: {addr.phone}</p>
                    )}
                    {addr.notes && (
                      <p className="text-[11px] text-[#7A6F68] italic pt-1">
                        Referencia: {addr.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-[#EFE8DF] flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenEdit(addr)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#7A6F68] hover:text-[#241F1E] hover:bg-[#FAF7F2] transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>

                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Address Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#EFE8DF] max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#EFE8DF] mb-5">
              <h3 className="text-lg font-bold text-[#241F1E]">
                {editingId ? "Editar Dirección" : "Nueva Dirección de Entrega"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-xl text-[#7A6F68] hover:bg-[#FAF7F2]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Alias Quick Select */}
              <div>
                <label className="block text-xs font-bold text-[#241F1E] mb-2">
                  Alias de la dirección
                </label>
                <div className="flex gap-2 mb-2">
                  {["Casa", "Trabajo", "Oficina", "Otro"].map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setTitle(a)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition ${
                        title === a
                          ? "bg-[#BD532B] text-white border-[#BD532B]"
                          : "border-[#EFE8DF] bg-[#FAF7F2] text-[#7A6F68] hover:bg-white"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
                {title === "Otro" && (
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Casa de fin de semana"
                    className="w-full px-4 py-2 rounded-xl border border-[#EFE8DF] bg-[#FAF7F2] text-xs font-medium text-[#241F1E] focus:outline-none focus:ring-1 focus:ring-[#BD532B]"
                  />
                )}
              </div>

              {/* Recipient & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#241F1E] mb-1.5">
                    Nombre del destinatario
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Quién recibe el paquete"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#EFE8DF] bg-[#FAF7F2] text-xs font-medium text-[#241F1E] focus:outline-none focus:ring-1 focus:ring-[#BD532B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#241F1E] mb-1.5">
                    Teléfono de contacto
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+54 9 11 ..."
                    className="w-full px-4 py-2.5 rounded-xl border border-[#EFE8DF] bg-[#FAF7F2] text-xs font-medium text-[#241F1E] focus:outline-none focus:ring-1 focus:ring-[#BD532B]"
                  />
                </div>
              </div>

              {/* Street & Number */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-[#241F1E] mb-1.5">
                    Calle <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    required
                    placeholder="Av. Santa Fe"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#EFE8DF] bg-[#FAF7F2] text-xs font-medium text-[#241F1E] focus:outline-none focus:ring-1 focus:ring-[#BD532B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#241F1E] mb-1.5">
                    Número
                  </label>
                  <input
                    type="text"
                    value={streetNumber}
                    onChange={(e) => setStreetNumber(e.target.value)}
                    placeholder="3421"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#EFE8DF] bg-[#FAF7F2] text-xs font-medium text-[#241F1E] focus:outline-none focus:ring-1 focus:ring-[#BD532B]"
                  />
                </div>
              </div>

              {/* Floor / Apt & Postal Code */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#241F1E] mb-1.5">
                    Piso / Departamento
                  </label>
                  <input
                    type="text"
                    value={floorApt}
                    onChange={(e) => setFloorApt(e.target.value)}
                    placeholder="Piso 4 Depto B"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#EFE8DF] bg-[#FAF7F2] text-xs font-medium text-[#241F1E] focus:outline-none focus:ring-1 focus:ring-[#BD532B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#241F1E] mb-1.5">
                    Código Postal
                  </label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="1425"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#EFE8DF] bg-[#FAF7F2] text-xs font-medium text-[#241F1E] focus:outline-none focus:ring-1 focus:ring-[#BD532B]"
                  />
                </div>
              </div>

              {/* City & State */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#241F1E] mb-1.5">
                    Ciudad / Localidad <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    placeholder="CABA, Córdoba, etc."
                    className="w-full px-4 py-2.5 rounded-xl border border-[#EFE8DF] bg-[#FAF7F2] text-xs font-medium text-[#241F1E] focus:outline-none focus:ring-1 focus:ring-[#BD532B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#241F1E] mb-1.5">
                    Provincia
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Buenos Aires"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#EFE8DF] bg-[#FAF7F2] text-xs font-medium text-[#241F1E] focus:outline-none focus:ring-1 focus:ring-[#BD532B]"
                  />
                </div>
              </div>

              {/* Reference notes */}
              <div>
                <label className="block text-xs font-bold text-[#241F1E] mb-1.5">
                  Referencia adicional para entrega (opcional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Timbre 4B, portón negro, entre calles..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[#EFE8DF] bg-[#FAF7F2] text-xs font-medium text-[#241F1E] focus:outline-none focus:ring-1 focus:ring-[#BD532B]"
                />
              </div>

              {/* Default checkbox */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isDefaultCheckbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded border-[#EFE8DF] text-[#BD532B] focus:ring-[#BD532B]"
                />
                <label htmlFor="isDefaultCheckbox" className="text-xs font-medium text-[#241F1E]">
                  Establecer como dirección predeterminada
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 pt-4 border-t border-[#EFE8DF]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#EFE8DF] text-xs font-bold text-[#7A6F68] hover:bg-[#FAF7F2]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#BD532B] text-white text-xs font-bold hover:bg-[#A34320] transition shadow-sm disabled:opacity-50"
                >
                  {submitting ? "Guardando..." : "Guardar dirección"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </CustomerLayout>
  );
}
