import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Product } from "@shared/api";
import { Plus, Trash2, Edit2, Package, ArrowLeft, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Mates");
  const [description, setDescription] = useState("");
  const [stock, setStock] = useState("10");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setName("");
    setPrice("");
    setCategory("Mates");
    setDescription("");
    setStock("10");
    setImageUrl("");
    setShowForm(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name);
    setPrice(prod.price.toString());
    setCategory(prod.category);
    setDescription(prod.description);
    setStock(prod.stock.toString());
    setImageUrl(prod.imageUrl || "");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name,
      price: Number(price),
      category,
      description,
      stock: Number(stock),
      imageUrl: imageUrl || undefined,
    };

    try {
      if (editingProduct) {
        // Update
        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          setProducts(products.map((p) => (p.id === updated.id ? updated : p)));
        }
      } else {
        // Create
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          setProducts([...products, created]);
        }
      }
      setShowForm(false);
    } catch (err) {
      console.error("Error guardando producto:", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Estás seguro de eliminar este producto?")) {
      try {
        const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
        if (res.ok) {
          setProducts(products.filter((p) => p.id !== id));
        }
      } catch (err) {
        console.error("Error eliminando producto:", err);
      }
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center border border-gray-100">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Acceso Restringido</h2>
          <p className="text-gray-600 mb-6">Necesitas permisos de Administrador para ver este panel.</p>
          <button
            onClick={() => navigate("/admin-login")}
            className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition font-medium"
          >
            Iniciar Sesión como Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-slate-900 text-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="text-gray-400 hover:text-white transition"
              title="Volver a la tienda"
            >
              <ArrowLeft size={20} />
            </button>
            <Package className="text-emerald-400" size={24} />
            <h1 className="text-xl font-bold font-serif">Panel de Administración - TiendaMate</h1>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-300">Hola, <strong className="text-white">{user?.name}</strong></span>
            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md text-red-400 hover:text-red-300 transition"
            >
              <LogOut size={16} />
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Gestión de Productos</h2>
            <p className="text-gray-600 text-sm">Administra el catálogo de productos disponibles en la tienda</p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition font-medium shadow-sm"
          >
            <Plus size={18} />
            Nuevo Producto
          </button>
        </div>

        {/* Modal / Form section */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
              <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
                <h3 className="font-bold text-lg">
                  {editingProduct ? "Editar Producto" : "Nuevo Producto"}
                </h3>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white">✕</button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Precio ($ ARS)</label>
                    <input
                      type="number"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Categoría</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="Mates">Mates</option>
                      <option value="Termos">Termos</option>
                      <option value="Bombillas">Bombillas</option>
                      <option value="Yerbas">Yerbas</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Stock disponible</label>
                    <input
                      type="number"
                      required
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">URL Imagen (opcional)</label>
                    <input
                      type="text"
                      value={imageUrl}
                      placeholder="https://..."
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Descripción</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border rounded-md text-sm focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 border text-gray-700 rounded-md text-sm hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700 font-medium"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Cargando catálogo...</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                <tr>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Producto</th>
                  <th className="px-6 py-3">Categoría</th>
                  <th className="px-6 py-3">Precio</th>
                  <th className="px-6 py-3">Stock</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-mono text-gray-400">#{prod.id}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {prod.name}
                      <p className="text-xs text-gray-500 font-normal line-clamp-1">{prod.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                        {prod.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">${prod.price.toLocaleString("es-AR")}</td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold ${prod.stock < 5 ? "text-amber-600" : "text-gray-700"}`}>
                        {prod.stock} u.
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(prod)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(prod.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
