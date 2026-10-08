import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { TenantMembership, AdminRole } from "@shared/api";
import { ShieldCheck, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

const ROLES_INFO: Record<AdminRole, { label: string; desc: string; badge: string }> = {
  SUPER_ADMIN: {
    label: "Super Administrador",
    desc: "Control total de la plataforma, miembros y configuración",
    badge: "bg-[#BD532B]/10 text-[#BD532B] border-[#BD532B]/30",
  },
  ADMIN: {
    label: "Administrador de Comercio",
    desc: "Gestión integral de catálogo, pedidos, inventario y clientes",
    badge: "bg-[#0E6365]/10 text-[#0E6365] border-[#0E6365]/30",
  },
  MANAGER: {
    label: "Gerente Operativo",
    desc: "Gestión de catálogo, pedidos y reportes sin acceso a configuración",
    badge: "bg-[#8C4E2D]/10 text-[#8C4E2D] border-[#8C4E2D]/30",
  },
  OPERADOR: {
    label: "Operador Logístico",
    desc: "Acceso limitado a preparación de pedidos e inventario",
    badge: "bg-amber-50 text-amber-800 border-amber-300",
  },
  VIEWER: {
    label: "Observador / Auditor",
    desc: "Acceso de solo lectura a métricas y reportes",
    badge: "bg-stone-100 text-stone-700 border-stone-300",
  },
};

export default function UsersTab() {
  const { token, hasPermission, user: currentUser } = useAuth();
  const [members, setMembers] = useState<TenantMembership[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<AdminRole>("ADMIN");

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Ingresa el correo electrónico de Google del usuario.");
      return;
    }

    try {
      const res = await fetch("/api/admin/users/invite", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: name.trim() || undefined,
          role,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al invitar usuario");

      toast.success(`Usuario ${email} habilitado con rol ${role}.`);
      setModalOpen(false);
      setEmail("");
      setName("");
      fetchMembers();
    } catch (err: any) {
      toast.error(err.message || "Error al invitar usuario");
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: AdminRole) => {
    try {
      const res = await fetch(`/api/admin/users/${memberId}/role`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) throw new Error("Error al modificar rol");

      toast.success("Rol actualizado con éxito");
      fetchMembers();
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar rol");
    }
  };

  const handleRemove = async (m: TenantMembership) => {
    if (m.userEmail === currentUser?.email) {
      toast.error("No puedes revocar tu propio acceso.");
      return;
    }

    if (!window.confirm(`¿Revocar acceso al usuario ${m.userEmail}? Ya no podrá ingresar al panel.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${m.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Error al eliminar membresía");

      toast.success("Acceso revocado correctamente.");
      fetchMembers();
    } catch (err: any) {
      toast.error(err.message || "Error al revocar acceso");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#EFE8DF]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-script text-lg text-[#BD532B]">Seguridad & equipo</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#241F1E] tracking-tight">Usuarios y Permisos (RBAC)</h1>
          <p className="text-xs text-[#7A6F68] mt-1">
            Asignación estricta de privilegios. Solo cuentas Google explícitamente autorizadas pueden operar en TiendaMate.
          </p>
        </div>

        {hasPermission("users.manage") && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#BD532B] hover:bg-[#A7441E] text-white font-bold rounded-xl text-xs shadow-md shadow-[#BD532B]/20 transition active:scale-[0.99]"
          >
            <Plus size={16} />
            <span>Habilitar Usuario Google</span>
          </button>
        )}
      </div>

      {/* Security Notice */}
      <div className="p-4 bg-white border border-[#EFE8DF] rounded-2xl flex items-start gap-3 text-xs text-[#3A3330] shadow-xs">
        <ShieldCheck size={20} className="text-[#0E6365] shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-[#241F1E]">Seguridad y Mínimo Privilegio</p>
          <p className="text-[#7A6F68] mt-0.5 leading-relaxed">
            Una cuenta de Google válida no otorga acceso por sí sola. Para que un colaborador ingrese al panel, su correo
            electrónico debe estar registrado en esta nómina con un rol asignado.
          </p>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white border border-[#EFE8DF] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#EFE8DF] bg-[#F7F3EC] text-[#6E625A]">
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Usuario</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Correo de Google</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Rol Asignado</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px] text-center">Estado</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Habilitado desde</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EAE1]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#7A6F68]">
                    <div className="w-6 h-6 border-2 border-[#BD532B] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Cargando usuarios autorizados...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#7A6F68]">No hay usuarios asignados.</td>
                </tr>
              ) : (
                members.map((m) => {
                  const roleConfig = ROLES_INFO[m.role] || ROLES_INFO.ADMIN;
                  return (
                    <tr key={m.id} className="hover:bg-[#FAF7F2]/70 transition">
                      <td className="py-3 px-4 font-semibold text-[#241F1E]">{m.userName}</td>
                      <td className="py-3 px-4 font-mono text-[#7A6F68]">{m.userEmail}</td>
                      <td className="py-3 px-4">
                        {hasPermission("users.manage") ? (
                          <select
                            value={m.role}
                            onChange={(e) => handleUpdateRole(m.id, e.target.value as AdminRole)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border uppercase ${roleConfig.badge} bg-white focus:outline-none`}
                          >
                            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="MANAGER">MANAGER</option>
                            <option value="OPERADOR">OPERADOR</option>
                            <option value="VIEWER">VIEWER</option>
                          </select>
                        ) : (
                          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase border ${roleConfig.badge}`}>
                            {m.role}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Activo
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#8C7D73]">
                        {new Date(m.createdAt).toLocaleDateString("es-AR")}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {hasPermission("users.manage") && m.userEmail !== currentUser?.email && (
                          <button
                            onClick={() => handleRemove(m)}
                            title="Revocar acceso"
                            className="p-1.5 text-[#7A6F68] hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#EFE8DF] rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setModalOpen(false)} className="absolute top-5 right-5 text-[#8C7D73] hover:text-[#241F1E] p-1 rounded-lg hover:bg-[#FAF7F2]">
              <X size={18} />
            </button>

            <span className="font-script text-lg text-[#BD532B]">Seguridad y acceso</span>
            <h2 className="text-xl font-serif font-bold text-[#241F1E] mb-1">Habilitar Nuevo Usuario de Google</h2>
            <p className="text-xs text-[#7A6F68] mb-5">
              Ingresa el correo con el que este colaborador iniciará sesión mediante "Continuar con Google".
            </p>

            <form onSubmit={handleInvite} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#3A3330] font-medium mb-1">Correo Electrónico de Google *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@gmail.com o tuempresa.com"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] focus:outline-none focus:border-[#BD532B]"
                />
              </div>

              <div>
                <label className="block text-[#3A3330] font-medium mb-1">Nombre Completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Juan Pérez"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] focus:outline-none focus:border-[#BD532B]"
                />
              </div>

              <div>
                <label className="block text-[#3A3330] font-medium mb-1">Rol Operativo *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as AdminRole)}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] focus:outline-none focus:border-[#BD532B]"
                >
                  <option value="ADMIN">ADMIN — Administrador del Comercio</option>
                  <option value="MANAGER">MANAGER — Gerente Operativo</option>
                  <option value="OPERADOR">OPERADOR — Operador Logístico</option>
                  <option value="VIEWER">VIEWER — Observador (Solo Lectura)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN — Control Total</option>
                </select>
                <p className="text-[11px] text-[#8C7D73] mt-1">{ROLES_INFO[role].desc}</p>
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
                  Habilitar Acceso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
