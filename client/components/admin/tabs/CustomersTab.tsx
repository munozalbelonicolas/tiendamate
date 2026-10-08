import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Customer } from "@shared/api";
import { Users, Search, ShoppingBag, MapPin, X, ChevronLeft, ChevronRight } from "lucide-react";

export default function CustomersTab() {
  const { token } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filter
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState("");

  // Customer Drawer Modal
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: "15",
      });
      if (search.trim()) query.set("search", search.trim());

      const res = await fetch(`/api/admin/customers?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setCustomers(data.items);
        setTotalPages(data.pagination.totalPages);
        setTotalItems(data.pagination.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDetail = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedCustomer(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, search]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#EFE8DF]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-script text-lg text-[#BD532B]">Comunidad de mates</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#241F1E] tracking-tight">Directorio de Clientes</h1>
          <p className="text-xs text-[#7A6F68] mt-1">
            Ficha de compradores, historial de compras acumulado y métricas de recurrencia ({totalItems} clientes).
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-[#EFE8DF] shadow-xs text-xs">
        <div className="relative max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C7D73]" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo electrónico o teléfono..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] placeholder-[#8C7D73] focus:outline-none focus:border-[#BD532B] transition"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#EFE8DF] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#EFE8DF] bg-[#F7F3EC] text-[#6E625A]">
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Cliente</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Email</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Teléfono</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px] text-center">Pedidos</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">Gasto Total</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">Última Compra</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EAE1]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#7A6F68]">
                    <div className="w-6 h-6 border-2 border-[#BD532B] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Cargando clientes...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-[#7A6F68]">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#BD532B]" />
                    <p className="font-serif font-bold text-base text-[#241F1E]">No se encontraron clientes</p>
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FAF7F2]/70 transition">
                    <td className="py-3 px-4 font-semibold text-[#241F1E]">
                      {c.firstName} {c.lastName}
                    </td>
                    <td className="py-3 px-4 text-[#7A6F68]">{c.email}</td>
                    <td className="py-3 px-4 text-[#8C7D73] font-mono text-[11px]">{c.phone || "—"}</td>
                    <td className="py-3 px-4 text-center font-bold text-[#241F1E]">{c.totalOrders}</td>
                    <td className="py-3 px-4 text-right font-bold text-[#BD532B]">
                      {formatCurrency(c.totalSpent)}
                    </td>
                    <td className="py-3 px-4 text-right text-[#8C7D73]">
                      {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString("es-AR") : "Sin compras"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => fetchCustomerDetail(c.id)}
                        className="px-3 py-1 bg-white hover:bg-[#FAF7F2] text-[#241F1E] border border-[#E5DDD0] rounded-xl text-xs font-semibold transition shadow-2xs"
                      >
                        Ver Ficha
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-3 bg-[#FAF7F2] border-t border-[#EFE8DF] flex items-center justify-between text-xs text-[#7A6F68]">
          <div>
            Página <strong className="text-[#241F1E]">{page}</strong> de <strong className="text-[#241F1E]">{totalPages}</strong>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-[#E5DDD0] bg-white hover:border-[#BD532B] text-[#241F1E] disabled:opacity-30 shadow-2xs transition"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-[#E5DDD0] bg-white hover:border-[#BD532B] text-[#241F1E] disabled:opacity-30 shadow-2xs transition"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Customer Detail Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#EFE8DF] rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedCustomer(null)}
              className="absolute top-5 right-5 text-[#8C7D73] hover:text-[#241F1E] p-1 rounded-lg hover:bg-[#FAF7F2]"
            >
              <X size={18} />
            </button>

            <span className="font-script text-lg text-[#BD532B]">Perfil del cliente</span>
            <div className="flex items-center gap-3 mb-4 mt-1">
              <div className="w-12 h-12 rounded-2xl bg-[#BD532B] flex items-center justify-center font-bold text-white text-lg shadow-md font-serif">
                {selectedCustomer.firstName.charAt(0)}
              </div>
              <div>
                <h2 className="text-lg font-serif font-bold text-[#241F1E]">
                  {selectedCustomer.firstName} {selectedCustomer.lastName}
                </h2>
                <p className="text-xs text-[#7A6F68]">{selectedCustomer.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5 text-xs">
              <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#E5DDD0]">
                <span className="text-[#8C7D73] text-[10px]">Total Gastado</span>
                <p className="text-base font-bold text-[#BD532B]">{formatCurrency(selectedCustomer.totalSpent)}</p>
              </div>
              <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#E5DDD0]">
                <span className="text-[#8C7D73] text-[10px]">Pedidos Totales</span>
                <p className="text-base font-bold text-[#241F1E]">{selectedCustomer.totalOrders} órdenes</p>
              </div>
            </div>

            {/* Addresses */}
            <div className="mb-5 text-xs">
              <h4 className="font-serif font-bold text-[#241F1E] mb-2 flex items-center gap-1.5">
                <MapPin size={14} className="text-[#BD532B]" /> Direcciones Guardadas
              </h4>
              {selectedCustomer.addresses?.length > 0 ? (
                <div className="space-y-1.5">
                  {selectedCustomer.addresses.map((addr: any) => (
                    <div key={addr.id} className="p-3 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#3A3330]">
                      <p className="font-medium text-[#241F1E]">{addr.title}: {addr.street}</p>
                      <p className="text-[11px] text-[#7A6F68]">{addr.city}, {addr.state} (CP {addr.postal_code})</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#8C7D73] text-xs">No tiene direcciones registradas.</p>
              )}
            </div>

            {/* Recent Orders */}
            <div className="text-xs">
              <h4 className="font-serif font-bold text-[#241F1E] mb-2 flex items-center gap-1.5">
                <ShoppingBag size={14} className="text-[#0E6365]" /> Órdenes Recientes
              </h4>
              {selectedCustomer.recentOrders?.length > 0 ? (
                <div className="space-y-1.5">
                  {selectedCustomer.recentOrders.map((ord: any) => (
                    <div
                      key={ord.id}
                      className="p-3 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <p className="font-mono font-bold text-[#BD532B]">#{ord.order_number}</p>
                        <p className="text-[10px] text-[#8C7D73]">
                          {new Date(ord.created_at).toLocaleDateString("es-AR")}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-[#241F1E]">{formatCurrency(ord.total)}</span>
                        <p className="text-[10px] text-[#0E6365] font-semibold uppercase">{ord.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#8C7D73] text-xs">Sin pedidos en el historial.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
