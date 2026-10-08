import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Category } from "@shared/api";
import { Layers, Plus, Edit2, Trash2, X, Package } from "lucide-react";
import { toast } from "sonner";

export default function CategoriesTab() {
  const { token, hasPermission } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setName("");
    setSlug("");
    setDescription("");
    setImageUrl("");
    setModalOpen(true);
  };

  const handleOpenEdit = (c: Category) => {
    setEditingCategory(c);
    setName(c.name);
    setSlug(c.slug);
    setDescription(c.description || "");
    setImageUrl(c.imageUrl || "");
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("El nombre de categoría es obligatorio.");
      return;
    }

    const payload = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      description: description.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
    };

    try {
      let res;
      if (editingCategory) {
        res = await fetch(`/api/admin/categories/${editingCategory.id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/categories", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al guardar");

      toast.success(editingCategory ? "Categoría actualizada" : "Categoría creada con éxito");
      setModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message || "Error al procesar categoría");
    }
  };

  const handleDelete = async (c: Category) => {
    if (!window.confirm(`¿Estás seguro de eliminar la categoría "${c.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/categories/${c.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al eliminar");

      toast.success("Categoría eliminada");
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar categoría");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#EFE8DF]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-script text-lg text-[#BD532B]">Taxonomía de tienda</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#241F1E] tracking-tight">Categorías del Catálogo</h1>
          <p className="text-xs text-[#7A6F68] mt-1">
            Organización taxonómica para navegación y filtros de productos en la tienda.
          </p>
        </div>

        {hasPermission("products.create") && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#BD532B] hover:bg-[#A7441E] text-white font-bold rounded-xl text-xs shadow-md shadow-[#BD532B]/20 transition active:scale-[0.99]"
          >
            <Plus size={16} />
            <span>Nueva Categoría</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-[#7A6F68] text-xs">
            <div className="w-6 h-6 border-2 border-[#BD532B] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Cargando categorías...
          </div>
        ) : categories.length === 0 ? (
          <div className="col-span-full py-16 text-center text-[#7A6F68] text-xs">
            <Layers className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#BD532B]" />
            <p className="font-serif font-bold text-base text-[#241F1E]">No hay categorías configuradas</p>
          </div>
        ) : (
          categories.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-[#EFE8DF] rounded-2xl p-5 shadow-xs hover:border-[#BD532B]/40 hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0E6365]/10 border border-[#0E6365]/20 flex items-center justify-center text-[#0E6365] font-bold text-sm">
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="px-2.5 py-0.5 rounded-lg bg-[#F5EDE2] text-[#8C4E2D] border border-[#E5DDD0] text-[11px] font-semibold flex items-center gap-1">
                    <Package size={12} /> {c.productsCount || 0} productos
                  </span>
                </div>

                <h3 className="text-base font-serif font-bold text-[#241F1E]">{c.name}</h3>
                <p className="text-xs font-mono text-[#8C7D73] mt-0.5">/{c.slug}</p>
                {c.description && (
                  <p className="text-xs text-[#7A6F68] mt-2 line-clamp-2 leading-relaxed">{c.description}</p>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-[#EFE8DF] flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenEdit(c)}
                  className="p-1.5 text-[#7A6F68] hover:text-[#BD532B] hover:bg-[#F5EDE2] rounded-lg transition"
                >
                  <Edit2 size={14} />
                </button>
                {hasPermission("products.delete") && (
                  <button
                    onClick={() => handleDelete(c)}
                    className="p-1.5 text-[#7A6F68] hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
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

            <span className="font-script text-lg text-[#BD532B]">Configuración de taxonomía</span>
            <h2 className="text-xl font-serif font-bold text-[#241F1E] mb-1">
              {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
            </h2>
            <p className="text-xs text-[#7A6F68] mb-5">Define el nombre y datos de navegación de la categoría.</p>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#3A3330] font-medium mb-1">Nombre *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingCategory) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                    }
                  }}
                  placeholder="Ej. Mates Imperiales"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] focus:outline-none focus:border-[#BD532B]"
                />
              </div>

              <div>
                <label className="block text-[#3A3330] font-medium mb-1">Slug identificador URL</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="mates-imperiales"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] font-mono focus:outline-none focus:border-[#BD532B]"
                />
              </div>

              <div>
                <label className="block text-[#3A3330] font-medium mb-1">Descripción</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Breve reseña sobre esta familia de productos..."
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] focus:outline-none focus:border-[#BD532B] resize-none"
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
                  Guardar Categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
