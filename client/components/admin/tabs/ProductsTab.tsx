import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Product, Category } from "@shared/api";
import {
  Package,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Edit2,
  Trash2,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Eye,
  EyeOff,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { toast } from "sonner";

export default function ProductsTab() {
  const { token, hasPermission } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [stockStatus, setStockStatus] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all");
  const [sortBy, setSortBy] = useState<string>("created_desc");

  // Modals
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    category: "Mates",
    price: "",
    promoPrice: "",
    cost: "",
    stock: "10",
    minStockAlert: "5",
    description: "",
    imageUrl: "",
    isPublished: true,
    isFeatured: false,
    seoTitle: "",
    seoDescription: "",
  });

  // Bulk Import State
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importMode, setImportMode] = useState<"create_only" | "upsert">("upsert");
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<any | null>(null);

  const fetchCategories = async () => {
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
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: "15",
        includeUnpublished: "true",
      });
      if (search.trim()) query.set("search", search.trim());
      if (selectedCategory !== "Todos") query.set("category", selectedCategory);
      if (stockStatus !== "all") query.set("stockStatus", stockStatus);
      if (sortBy) query.set("sortBy", sortBy);

      const res = await fetch(`/api/admin/products?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setProducts(data.items);
        setTotalPages(data.pagination.totalPages);
        setTotalItems(data.pagination.total);
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

  useEffect(() => {
    fetchProducts();
  }, [page, search, selectedCategory, stockStatus, sortBy]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      sku: `MAT-${Math.floor(100 + Math.random() * 900)}`,
      name: "",
      category: categories[0]?.name || "Mates",
      price: "",
      promoPrice: "",
      cost: "",
      stock: "10",
      minStockAlert: "5",
      description: "",
      imageUrl: "",
      isPublished: true,
      isFeatured: false,
      seoTitle: "",
      seoDescription: "",
    });
    setProductModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      sku: p.sku || "",
      name: p.name,
      category: p.category,
      price: String(p.price),
      promoPrice: p.promoPrice ? String(p.promoPrice) : "",
      cost: p.cost ? String(p.cost) : "",
      stock: String(p.stock),
      minStockAlert: String(p.minStockAlert || 5),
      description: p.description || "",
      imageUrl: p.imageUrl || "",
      isPublished: p.isPublished ?? true,
      isFeatured: p.isFeatured ?? false,
      seoTitle: p.seoTitle || "",
      seoDescription: p.seoDescription || "",
    });
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.sku) {
      toast.error("Por favor completa los campos obligatorios: SKU, Nombre y Precio.");
      return;
    }

    const payload = {
      sku: formData.sku.trim(),
      name: formData.name.trim(),
      category: formData.category,
      price: Number(formData.price),
      promoPrice: formData.promoPrice ? Number(formData.promoPrice) : null,
      cost: formData.cost ? Number(formData.cost) : null,
      stock: Number(formData.stock),
      minStockAlert: Number(formData.minStockAlert),
      description: formData.description,
      imageUrl: formData.imageUrl.trim() || undefined,
      isPublished: formData.isPublished,
      isFeatured: formData.isFeatured,
      seoTitle: formData.seoTitle,
      seoDescription: formData.seoDescription,
    };

    try {
      let res;
      if (editingProduct) {
        res = await fetch(`/api/admin/products/${editingProduct.id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/products", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Error al guardar producto");
      }

      toast.success(editingProduct ? "Producto actualizado correctamente" : "Producto creado exitosamente");
      setProductModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message || "Error al procesar la solicitud.");
    }
  };

  const handleDeleteProduct = async (p: Product) => {
    if (!window.confirm(`¿Estás seguro de archivar/eliminar el producto "${p.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Error al eliminar");
      }

      toast.success("Producto eliminado del catálogo");
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar producto");
    }
  };

  // Bulk Import CSV parser
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        toast.error("El archivo CSV no contiene filas de datos.");
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const parsedRows = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
        const rowObj: any = {};
        headers.forEach((h, idx) => {
          rowObj[h] = values[idx] || "";
        });

        parsedRows.push({
          sku: rowObj.sku || `IMP-${i}`,
          name: rowObj.nombre || rowObj.name || "",
          category: rowObj.categoria || rowObj.category || "General",
          price: Number(rowObj.precio || rowObj.price || 0),
          stock: Number(rowObj.stock || 0),
          description: rowObj.descripcion || rowObj.description || "",
          imageUrl: rowObj.imagen || rowObj.image_url || "",
        });
      }

      setImportRows(parsedRows);
      setImportResults(null);
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (importRows.length === 0) return;
    setImporting(true);
    try {
      const res = await fetch("/api/admin/products/bulk-import", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items: importRows, mode: importMode }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Error en importación");
      }

      setImportResults(data);
      toast.success(`Importación finalizada: ${data.created} creados, ${data.updated} actualizados.`);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message || "Error al ejecutar importación");
    } finally {
      setImporting(false);
    }
  };

  const downloadSampleCsv = () => {
    const sample =
      "sku,nombre,categoria,precio,stock,descripcion,imagen\n" +
      "MAT-CRI-01,Mate Criollo Torneado,Mates,15000,20,Mate de algarrobo macizo torneado,/images/mate-imperial.jpg\n" +
      "TER-LUM-02,Termo Luminox 1L,Termos,28000,15,Termo de acero inoxidable con pico cebador,/images/termo-acero.jpg\n" +
      "BOM-RAN-03,Bombilla Cincelada Ranura,Bombillas,6500,40,Bombilla de acero quirúrgico desmontable,/images/bombilla-alpaca.jpg";

    const blob = new Blob([sample], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "plantilla_productos_tiendamate.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#EFE8DF]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-script text-lg text-[#BD532B]">Catálogo & Existencias</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#241F1E] tracking-tight">Catálogo de Productos</h1>
          <p className="text-xs text-[#7A6F68] mt-1">
            Gestión de artículos, variantes, control de precios e inventario ({totalItems} productos en total).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasPermission("products.create") && (
            <>
              <button
                onClick={() => {
                  setImportRows([]);
                  setImportResults(null);
                  setImportModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#FAF7F2] text-[#241F1E] border border-[#E5DDD0] rounded-xl text-xs font-semibold shadow-xs transition"
              >
                <Upload size={14} className="text-[#BD532B]" />
                <span>Importación Masiva</span>
              </button>

              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#BD532B] hover:bg-[#A7441E] text-white font-bold rounded-xl text-xs shadow-md shadow-[#BD532B]/20 transition active:scale-[0.99]"
              >
                <Plus size={16} />
                <span>Nuevo Producto</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-3.5 rounded-2xl border border-[#EFE8DF] shadow-xs text-xs">
        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C7D73]" />
          <input
            type="text"
            placeholder="Buscar por nombre, SKU..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] placeholder-[#8C7D73] focus:outline-none focus:border-[#BD532B] transition"
          />
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] focus:outline-none focus:border-[#BD532B] transition"
          >
            <option value="Todos">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Stock Status */}
        <div>
          <select
            value={stockStatus}
            onChange={(e) => {
              setStockStatus(e.target.value as any);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] focus:outline-none focus:border-[#BD532B] transition"
          >
            <option value="all">Todo el inventario</option>
            <option value="in_stock">En stock disponible</option>
            <option value="low_stock">Stock bajo (Alerta)</option>
            <option value="out_of_stock">Agotado (0 unidades)</option>
          </select>
        </div>

        {/* Sorting */}
        <div>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] focus:outline-none focus:border-[#BD532B] transition"
          >
            <option value="created_desc">Más recientes primero</option>
            <option value="price_asc">Precio: Menor a Mayor</option>
            <option value="price_desc">Precio: Mayor a Menor</option>
            <option value="stock_asc">Stock: Menor a Mayor</option>
            <option value="stock_desc">Stock: Mayor a Menor</option>
            <option value="name_asc">Nombre: A - Z</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-[#EFE8DF] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#EFE8DF] bg-[#F7F3EC] text-[#6E625A]">
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Producto</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">SKU</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Categoría</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">Precio</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px] text-center">Stock</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px] text-center">Estado</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EAE1]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#7A6F68]">
                    <div className="w-6 h-6 border-2 border-[#BD532B] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Cargando catálogo persistente...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-[#7A6F68]">
                    <Package className="w-10 h-10 mx-auto mb-3 opacity-30 text-[#BD532B]" />
                    <p className="font-serif font-bold text-base text-[#241F1E]">No se encontraron productos</p>
                    <p className="text-[11px] text-[#7A6F68] mt-1 max-w-sm mx-auto">
                      No hay artículos que coincidan con los filtros aplicados o tu catálogo se encuentra actualmente vacío.
                    </p>
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isLow = p.stock <= (p.minStockAlert || 5);
                  const isOut = p.stock <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-[#FAF7F2]/70 transition">
                      {/* Product Image & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#EFE8DF] overflow-hidden shrink-0 flex items-center justify-center">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon size={16} className="text-[#8C7D73]" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-[#241F1E] truncate max-w-[220px]">{p.name}</p>
                            {p.isFeatured && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-[#BD532B] font-medium">
                                <Sparkles size={10} /> Destacado
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3 px-4 font-mono text-[#8C7D73]">{p.sku}</td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-lg bg-[#F5EDE2] text-[#6E625A] border border-[#E5DDD0] text-[11px] font-medium">
                          {p.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 text-right">
                        <p className="font-bold text-[#241F1E]">{formatCurrency(p.price)}</p>
                        {p.promoPrice && (
                          <p className="text-[10px] text-[#BD532B] font-medium">
                            Promo: {formatCurrency(p.promoPrice)}
                          </p>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            isOut
                              ? "bg-red-50 text-red-700 border-red-200"
                              : isLow
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-[#0E6365]/10 text-[#0E6365] border-[#0E6365]/20"
                          }`}
                        >
                          {p.stock} un.
                        </span>
                      </td>

                      {/* Publish Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                            p.isPublished ? "text-[#0E6365]" : "text-[#8C7D73]"
                          }`}
                        >
                          {p.isPublished ? <Eye size={12} /> : <EyeOff size={12} />}
                          <span>{p.isPublished ? "Visible" : "Oculto"}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            title="Editar producto"
                            className="p-1.5 text-[#7A6F68] hover:text-[#BD532B] hover:bg-[#F5EDE2] rounded-lg transition"
                          >
                            <Edit2 size={14} />
                          </button>
                          {hasPermission("products.delete") && (
                            <button
                              onClick={() => handleDeleteProduct(p)}
                              title="Eliminar producto"
                              className="p-1.5 text-[#7A6F68] hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 bg-[#FAF7F2] border-t border-[#EFE8DF] flex items-center justify-between text-xs text-[#7A6F68]">
          <div>
            Mostrando página <strong className="text-[#241F1E]">{page}</strong> de{" "}
            <strong className="text-[#241F1E]">{totalPages}</strong> ({totalItems} productos)
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-[#E5DDD0] bg-white hover:border-[#BD532B] text-[#241F1E] disabled:opacity-30 disabled:cursor-not-allowed transition shadow-2xs"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-[#E5DDD0] bg-white hover:border-[#BD532B] text-[#241F1E] disabled:opacity-30 disabled:cursor-not-allowed transition shadow-2xs"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Create / Edit Product */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#EFE8DF] rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setProductModalOpen(false)}
              className="absolute top-5 right-5 text-[#8C7D73] hover:text-[#241F1E] p-1 rounded-lg hover:bg-[#FAF7F2]"
            >
              <X size={18} />
            </button>

            <span className="font-script text-lg text-[#BD532B]">Ficha de artículo</span>
            <h2 className="text-xl font-serif font-bold text-[#241F1E] mb-1">
              {editingProduct ? "Editar Producto" : "Nuevo Producto en Catálogo"}
            </h2>
            <p className="text-xs text-[#7A6F68] mb-6">
              Todos los datos se validan y persisten de forma inmediata en la base de datos.
            </p>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#3A3330] font-medium mb-1">Código SKU *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                    placeholder="Ej. MAT-IMP-01"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] font-mono focus:outline-none focus:border-[#BD532B]"
                  />
                </div>

                <div>
                  <label className="block text-[#3A3330] font-medium mb-1">Categoría *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] focus:outline-none focus:border-[#BD532B]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#3A3330] font-medium mb-1">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej. Mate Imperial de Calabaza con Alpaca"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] focus:outline-none focus:border-[#BD532B]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[#3A3330] font-medium mb-1">Precio de Venta ($ ARS) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="100"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="25000"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] focus:outline-none focus:border-[#BD532B]"
                  />
                </div>

                <div>
                  <label className="block text-[#3A3330] font-medium mb-1">Precio Promocional ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={formData.promoPrice}
                    onChange={(e) => setFormData({ ...formData, promoPrice: e.target.value })}
                    placeholder="Opcional"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] focus:outline-none focus:border-[#BD532B]"
                  />
                </div>

                <div>
                  <label className="block text-[#3A3330] font-medium mb-1">Costo ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    placeholder="Opcional"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] focus:outline-none focus:border-[#BD532B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#3A3330] font-medium mb-1">Stock Disponible *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] focus:outline-none focus:border-[#BD532B]"
                  />
                </div>

                <div>
                  <label className="block text-[#3A3330] font-medium mb-1">Umbral Alerta Stock Bajo</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minStockAlert}
                    onChange={(e) => setFormData({ ...formData, minStockAlert: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] focus:outline-none focus:border-[#BD532B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#3A3330] font-medium mb-1">URL de Imagen</label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="/images/mate-imperial.jpg o https://..."
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] focus:outline-none focus:border-[#BD532B]"
                />
              </div>

              <div>
                <label className="block text-[#3A3330] font-medium mb-1">Descripción</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detalles del producto, materiales, proceso de curado..."
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-[#241F1E] focus:outline-none focus:border-[#BD532B] resize-none"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-[#3A3330]">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="rounded border-[#E5DDD0] text-[#BD532B] focus:ring-0"
                  />
                  <span>Publicado en catálogo online</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-[#3A3330]">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="rounded border-[#E5DDD0] text-[#BD532B] focus:ring-0"
                  />
                  <span>Producto Destacado en Inicio</span>
                </label>
              </div>

              <div className="pt-4 border-t border-[#EFE8DF] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2 bg-[#F5EDE2] hover:bg-[#EAE1D3] text-[#3A3330] rounded-xl font-medium transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#BD532B] hover:bg-[#A7441E] text-white font-bold rounded-xl transition shadow-md shadow-[#BD532B]/20"
                >
                  {editingProduct ? "Guardar Cambios" : "Crear Producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Bulk Import CSV */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#EFE8DF] rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setImportModalOpen(false)}
              className="absolute top-5 right-5 text-[#8C7D73] hover:text-[#241F1E] p-1 rounded-lg hover:bg-[#FAF7F2]"
            >
              <X size={18} />
            </button>

            <span className="font-script text-lg text-[#BD532B]">Operaciones masivas</span>
            <h2 className="text-xl font-serif font-bold text-[#241F1E] mb-1">Carga Masiva de Productos (CSV)</h2>
            <p className="text-xs text-[#7A6F68] mb-5">
              Carga múltiples artículos simultáneamente con validación previa de columnas y SKUs.
            </p>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3.5 bg-[#FAF7F2] border border-[#E5DDD0] rounded-2xl">
                <div>
                  <p className="font-semibold text-[#241F1E]">Descargar Plantilla Oficial</p>
                  <p className="text-[11px] text-[#7A6F68]">Archivo CSV de ejemplo con encabezados requeridos</p>
                </div>
                <button
                  onClick={downloadSampleCsv}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F5EDE2] text-[#241F1E] border border-[#E5DDD0] rounded-xl text-xs font-medium transition shadow-2xs"
                >
                  <Download size={13} className="text-[#BD532B]" />
                  <span>Descargar Plantilla</span>
                </button>
              </div>

              <div>
                <label className="block text-[#3A3330] font-medium mb-1.5">Seleccionar archivo CSV</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="block w-full text-xs text-[#7A6F68] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#BD532B]/10 file:text-[#BD532B] hover:file:bg-[#BD532B]/20 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[#3A3330] font-medium mb-1">Modo de Importación</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-[#3A3330] cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="upsert"
                      checked={importMode === "upsert"}
                      onChange={() => setImportMode("upsert")}
                      className="text-[#BD532B] focus:ring-0"
                    />
                    <span>Crear nuevos y actualizar existentes si coincide SKU</span>
                  </label>
                  <label className="flex items-center gap-2 text-[#3A3330] cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="create_only"
                      checked={importMode === "create_only"}
                      onChange={() => setImportMode("create_only")}
                      className="text-[#BD532B] focus:ring-0"
                    />
                    <span>Solo nuevos (Rechazar si el SKU ya existe)</span>
                  </label>
                </div>
              </div>

              {importRows.length > 0 && (
                <div className="mt-4">
                  <p className="font-semibold text-[#241F1E] mb-2">
                    Vista previa de importación ({importRows.length} filas detectadas)
                  </p>
                  <div className="max-h-48 overflow-y-auto border border-[#E5DDD0] rounded-2xl bg-[#FAF7F2] p-2">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="text-[#7A6F68] border-b border-[#E5DDD0]">
                          <th className="p-1">SKU</th>
                          <th className="p-1">Nombre</th>
                          <th className="p-1">Categoría</th>
                          <th className="p-1 text-right">Precio</th>
                          <th className="p-1 text-center">Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EFE8DF]">
                        {importRows.slice(0, 10).map((r, i) => (
                          <tr key={i} className="text-[#3A3330]">
                            <td className="p-1 font-mono text-[#8C7D73]">{r.sku}</td>
                            <td className="p-1 truncate max-w-[150px] font-medium">{r.name}</td>
                            <td className="p-1">{r.category}</td>
                            <td className="p-1 text-right font-medium text-[#BD532B]">${r.price}</td>
                            <td className="p-1 text-center font-bold">{r.stock}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {importRows.length > 10 && (
                      <p className="text-[10px] text-[#8C7D73] text-center py-1">
                        ... y {importRows.length - 10} filas más.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {importResults && (
                <div className="p-3.5 bg-[#0E6365]/10 border border-[#0E6365]/20 rounded-2xl text-[#0E6365]">
                  <p className="font-semibold flex items-center gap-1.5">
                    <CheckCircle2 size={15} /> Resultado de importación:
                  </p>
                  <p className="text-[11px] mt-1 text-[#241F1E]">
                    Total: {importResults.total} | Creados: {importResults.created} | Actualizados: {importResults.updated} | Errores: {importResults.failed}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-[#EFE8DF] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="px-4 py-2 bg-[#F5EDE2] hover:bg-[#EAE1D3] text-[#3A3330] rounded-xl font-medium transition"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={importRows.length === 0 || importing}
                  className="px-5 py-2 bg-[#BD532B] hover:bg-[#A7441E] text-white font-bold rounded-xl transition shadow-md shadow-[#BD532B]/20 disabled:opacity-40"
                >
                  {importing ? "Importando..." : `Procesar ${importRows.length} Productos`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
