import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingCart,
  ShoppingBag,
  Minus,
  Plus,
  Package,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Tag,
  Info,
} from "lucide-react";
import { Product } from "@shared/api";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

/** ─────────────────────────────────────────────────────────────
 *  ProductDetail — Vista dinámica de detalle de producto
 *  Ruta: /product/:id
 *
 *  Estrategia:
 *  - useParams() extrae el ID de la URL
 *  - fetch a /api/products/:id (endpoint ya existente en el servidor)
 *  - useCart() accede al carrito global sin necesidad de pasar props
 *  - useAuth() para verificar autenticación antes de agregar al carrito
 * ───────────────────────────────────────────────────────────── */
export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Estado del producto y carga
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carrito y autenticación desde el contexto global
  const { cart, addToCart, updateQuantity, setIsCartOpen } = useCart();
  const { isAuthenticated } = useAuth();

  // Busca el item actual en el carrito para mostrar cantidad
  const cartItem = cart.find((i) => i.product.id === product?.id);
  const qtyInCart = cartItem?.quantity ?? 0;

  // ── Fetch del producto por ID ──────────────────────────────
  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError(null);

    fetch(`/api/products/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Producto no encontrado");
        return res.json();
      })
      .then((data: Product) => setProduct(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Manejador: Agregar al carrito ─────────────────────────
  const handleAddToCart = () => {
    if (!product) return;

    // Si no está autenticado, redirigir a login conservando la ruta de origen
    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: `/product/${id}` } } });
      return;
    }
    addToCart(product);
  };

  // ── Manejador: Abrir panel del carrito ────────────────────
  const handleOpenCart = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setIsCartOpen(true);
  };

  // ── Estado: Cargando ───────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-gray-500">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
          <p className="font-medium">Cargando producto...</p>
        </div>
      </div>
    );
  }

  // ── Estado: Error / No encontrado ──────────────────────────
  if (error || !product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-10 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Producto no encontrado
          </h2>
          <p className="text-gray-600 mb-6 text-sm">
            {error ||
              "El producto que buscas no existe o fue removido del catálogo."}
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-emerald-800 transition"
          >
            Volver a la Tienda
          </button>
        </div>
      </div>
    );
  }

  // ── Render principal ───────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      {/* ── Header de navegación ── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          {/* Botón Volver */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-emerald-700 font-semibold text-sm transition group"
          >
            <ArrowLeft
              size={18}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Volver a la Tienda
          </button>

          {/* Logo */}
          <div className="text-xl font-serif font-bold text-emerald-800 hidden sm:block">
            Tienda<span className="text-amber-700">Mate</span>
          </div>

          {/* Botón carrito con badge de cantidad */}
          <button
            onClick={handleOpenCart}
            className="flex items-center gap-2 bg-emerald-700 text-white px-4 py-2 rounded-lg hover:bg-emerald-800 transition shadow-sm relative"
          >
            <ShoppingCart size={18} />
            {qtyInCart > 0 && (
              <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-bounce">
                {qtyInCart}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ── Contenido principal ── */}
      <main className="container mx-auto px-4 py-10 max-w-5xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <button
            onClick={() => navigate("/")}
            className="hover:text-emerald-700 transition"
          >
            Inicio
          </button>
          <span>/</span>
          <span className="text-gray-400">{product.category}</span>
          <span>/</span>
          <span className="text-gray-900 font-medium truncate max-w-[200px]">
            {product.name}
          </span>
        </nav>

        {/* Grid principal: Imagen | Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* ── Columna Izquierda: Imagen ── */}
          <div className="space-y-4">
            <div className="aspect-square bg-gradient-to-br from-emerald-50 to-amber-50 rounded-3xl overflow-hidden border border-gray-100 shadow-lg">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-8xl">🧉</span>
                </div>
              )}
            </div>

            {/* Indicador de stock */}
            <div className="flex items-center gap-2">
              <Package size={16} className="text-emerald-600" />
              <span className="text-sm">
                {product.stock > 10 ? (
                  <span className="text-emerald-700 font-semibold">
                    Stock disponible ({product.stock} unidades)
                  </span>
                ) : product.stock > 0 ? (
                  <span className="text-amber-600 font-semibold">
                    ¡Últimas {product.stock} unidades!
                  </span>
                ) : (
                  <span className="text-red-600 font-semibold">Sin stock</span>
                )}
              </span>
            </div>
          </div>

          {/* ── Columna Derecha: Información ── */}
          <div className="flex flex-col gap-6">
            {/* Categoría + Nombre */}
            <div>
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                <Tag size={12} />
                {product.category}
              </span>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Precio */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-emerald-800">
                ${product.price.toLocaleString("es-AR")}
              </span>
              <span className="text-gray-500 text-sm font-medium">ARS</span>
            </div>

            {/* Descripción completa */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Info size={16} className="text-gray-400" />
                <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Descripción
                </span>
              </div>
              <p className="text-gray-600 leading-relaxed text-[15px]">
                {product.description}
              </p>
            </div>

            {/* ── Controles si el producto ya está en el carrito ── */}
            {qtyInCart > 0 ? (
              <div className="space-y-3">
                {/* Badge de confirmación */}
                <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-200">
                  <CheckCircle2 size={18} className="flex-shrink-0" />
                  <span className="text-sm font-semibold">
                    {qtyInCart === 1
                      ? "1 unidad en tu carrito"
                      : `${qtyInCart} unidades en tu carrito`}
                  </span>
                </div>

                {/* Controles de cantidad + Ir al carrito */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateQuantity(product.id, -1)}
                    className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center hover:bg-gray-200 transition text-gray-700"
                    title="Reducir cantidad"
                  >
                    <Minus size={16} />
                  </button>

                  <span className="w-10 text-center text-lg font-bold text-gray-900">
                    {qtyInCart}
                  </span>

                  <button
                    onClick={() => updateQuantity(product.id, 1)}
                    className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center hover:bg-gray-200 transition text-gray-700"
                    title="Aumentar cantidad"
                  >
                    <Plus size={16} />
                  </button>

                  <button
                    onClick={handleOpenCart}
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white py-2.5 px-4 rounded-xl font-semibold hover:bg-slate-800 transition text-sm"
                  >
                    <ShoppingBag size={16} />
                    Ver Carrito
                  </button>
                </div>
              </div>
            ) : (
              /* Botón agregar (producto no está en el carrito aún) */
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex items-center justify-center gap-3 bg-emerald-700 text-white py-4 px-6 rounded-2xl font-bold text-lg hover:bg-emerald-800 transition transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <ShoppingCart size={22} />
                {product.stock === 0 ? "Sin Stock" : "Añadir al Carrito"}
              </button>
            )}

            {/* Aviso si no está autenticado */}
            {!isAuthenticated && (
              <p className="text-xs text-gray-500 text-center">
                Necesitás{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="text-emerald-700 font-semibold hover:underline"
                >
                  iniciar sesión
                </button>{" "}
                para agregar al carrito.
              </p>
            )}

            {/* ── Tabla de Especificaciones Técnicas ── */}
            {product.specs && Object.keys(product.specs).length > 0 && (
              <div className="border-t border-gray-100 pt-6">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                  Especificaciones Técnicas
                </h2>
                <div className="rounded-2xl overflow-hidden border border-gray-100">
                  <table className="w-full text-sm">
                    <tbody>
                      {Object.entries(product.specs).map(([key, val], idx) => (
                        <tr
                          key={key}
                          className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}
                        >
                          <td className="py-2.5 px-4 font-semibold text-gray-700 w-2/5 border-r border-gray-100">
                            {key}
                          </td>
                          <td className="py-2.5 px-4 text-gray-600">{val}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-gray-400 py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-xs">
          © 2026 TiendaMate. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
