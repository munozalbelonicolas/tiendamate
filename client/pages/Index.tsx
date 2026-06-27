import { ShoppingCart, Leaf, Truck, Award, User as UserIcon, ShieldCheck, LogIn } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useNavigate } from "react-router-dom";
import { Product } from "@shared/api";

export default function Index() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const { user, isAuthenticated, isAdmin } = useAuth();
  const { cart, addToCart, setIsCartOpen, totalItems } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
      })
      .catch((err) => console.error("Error cargando productos:", err))
      .finally(() => setLoadingProducts(false));
  }, []);

  const handleAddToCart = (product: Product) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: "/" } } });
      return;
    }
    addToCart(product);
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: "/" } } });
      return;
    }
    const cartElement = document.getElementById("products");
    cartElement?.scrollIntoView({ behavior: "smooth" });
  };

  const getItemQuantityInCart = (productId: number) => {
    const item = cart.find((i) => i.product.id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-primary/10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-serif font-bold text-emerald-800 flex items-center gap-2">
            Tienda<span className="text-amber-700">Mate</span>
          </div>
          <nav className="hidden md:flex gap-8">
            <a href="#categories" className="text-gray-700 hover:text-emerald-700 font-medium transition">
              Categorías
            </a>
            <a href="#products" className="text-gray-700 hover:text-emerald-700 font-medium transition">
              Productos
            </a>
            <a href="#about" className="text-gray-700 hover:text-emerald-700 font-medium transition">
              Sobre Nosotros
            </a>
          </nav>

          <div className="flex items-center gap-4">
            {/* User auth state */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <button
                    onClick={() => navigate("/admin")}
                    className="hidden sm:flex items-center gap-1 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-md font-semibold hover:bg-slate-800 transition"
                  >
                    <ShieldCheck size={14} className="text-emerald-400" />
                    Admin Panel
                  </button>
                )}
                <button
                  onClick={() => navigate("/profile")}
                  className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition text-sm font-semibold"
                >
                  <UserIcon size={16} />
                  <span className="max-w-[100px] truncate">{user?.name}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="flex items-center gap-2 bg-slate-100 text-slate-800 hover:bg-slate-200 px-4 py-2 rounded-lg transition text-sm font-semibold"
              >
                <LogIn size={16} />
                Iniciar Sesión
              </button>
            )}

            {/* Cart Button con badge animado */}
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  navigate("/login");
                } else {
                  setIsCartOpen(true);
                }
              }}
              className="flex items-center gap-2 bg-emerald-700 text-white px-4 py-2 rounded-lg hover:bg-emerald-800 transition shadow-sm relative"
            >
              <ShoppingCart size={18} />
              <span className="text-sm font-bold">{totalItems}</span>
              {/* Punto verde animado cuando hay productos en el carrito */}
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-ping" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-50 via-white to-amber-50 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block bg-amber-100 text-amber-900 px-3.5 py-1 rounded-full text-sm font-semibold">
                Tradición Artesanal Argentina
              </div>
              <h1 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 leading-tight">
                Experimenta la Esencia del Mate
              </h1>
              <p className="text-lg text-gray-600 max-w-lg">
                Descubre nuestra selección premium de mates, termos y bombillas artesanales, creados en Argentina con máxima calidad.
              </p>
              <button
                onClick={handleBuyNow}
                className="bg-emerald-700 text-white px-8 py-4 rounded-xl font-semibold hover:bg-emerald-800 transition transform hover:scale-105 shadow-md"
              >
                Comprar Ahora
              </button>
            </div>
            <div className="relative h-96 md:h-full flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-200/40 to-amber-200/40 rounded-3xl transform rotate-3"></div>
              <div className="relative bg-white/90 backdrop-blur rounded-3xl p-8 shadow-2xl transform -rotate-3 border border-emerald-100">
                <div className="w-full h-80 bg-gradient-to-br from-emerald-100 to-amber-100 rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <Leaf className="w-24 h-24 text-emerald-700 mx-auto mb-4 animate-bounce" />
                    <p className="text-emerald-900 font-serif font-bold text-xl">Selección Artesanal Premium</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-serif font-bold text-center text-gray-900 mb-16">
            Nuestras Categorías
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Mates",
                description: "Mates artesanales de calabaza y madera seleccionada",
                icon: "🧉",
              },
              {
                title: "Termos",
                description: "Termos aislantes de alta calidad con pico cebador",
                icon: "🫖",
              },
              {
                title: "Bombillas",
                description: "Bombillas de alpaca y plata fina con filtro desmontable",
                icon: "✨",
              },
            ].map((category, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-white to-emerald-50/50 border border-emerald-100 rounded-2xl p-8 hover:shadow-xl transition transform hover:-translate-y-1"
              >
                <div className="text-5xl mb-4">{category.icon}</div>
                <h3 className="text-2xl font-serif font-bold text-gray-900 mb-3">
                  {category.title}
                </h3>
                <p className="text-gray-600 text-sm">{category.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section id="products" className="py-16 md:py-24 bg-gradient-to-b from-emerald-50/30 to-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-serif font-bold text-center text-gray-900 mb-4">
            Catálogo de Productos
          </h2>
          <p className="text-center text-gray-600 mb-16 max-w-xl mx-auto">
            Selección curada de nuestros mejores artículos. {!isAuthenticated && <span className="font-semibold text-emerald-700">Inicia sesión para realizar tu compra.</span>}
          </p>

          {loadingProducts ? (
            <div className="text-center py-12 text-gray-500">Cargando catálogo...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => {
                const qty = getItemQuantityInCart(product.id);
                return (
                  <div
                    key={product.id}
                    className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition group flex flex-col justify-between"
                  >
                    {/* Zona clickeable → navega al detalle del producto */}
                    <div
                      className="cursor-pointer"
                      onClick={() => navigate(`/product/${product.id}`)}
                      title={`Ver detalle de ${product.name}`}
                    >
                      <div className="aspect-square bg-gradient-to-br from-emerald-100/50 to-amber-100/50 flex items-center justify-center group-hover:scale-105 transition overflow-hidden p-6">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="object-cover h-full w-full rounded-xl" />
                        ) : (
                          <span className="text-6xl">🧉</span>
                        )}
                      </div>
                      <div className="p-6">
                        <span className="inline-block bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full mb-2">
                          {product.category}
                        </span>
                        <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">
                          {product.name}
                        </h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
                      </div>
                    </div>

                    <div className="px-6 pb-6 pt-0 flex justify-between items-center border-t border-gray-50">
                      <span className="text-2xl font-bold text-emerald-800">
                        ${product.price.toLocaleString("es-AR")}
                      </span>
                      <button
                        onClick={() => handleAddToCart(product)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition transform hover:scale-105 ${
                          qty > 0
                            ? "bg-amber-600 text-white"
                            : "bg-emerald-700 text-white hover:bg-emerald-800"
                        }`}
                      >
                        <ShoppingCart size={18} />
                        <span>{qty > 0 ? `Agregado (${qty})` : "Agregar"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Artisanal & Shipping Section */}
      <section id="about" className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Artisanal Quality */}
            <div className="space-y-6 flex flex-col justify-center">
              <div className="inline-flex items-center gap-3 text-emerald-700 mb-2">
                <Award size={24} />
                <span className="font-semibold">Calidad Artesanal</span>
              </div>
              <h2 className="text-4xl font-serif font-bold text-gray-900">
                Crafted con Tradición
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Cada mate, termo y bombilla es seleccionado y preparado siguiendo técnicas tradicionales argentinas con materiales premium.
              </p>
            </div>

            {/* Nationwide Shipping */}
            <div className="space-y-6 flex flex-col justify-center">
              <div className="inline-flex items-center gap-3 text-amber-700 mb-2">
                <Truck size={24} />
                <span className="font-semibold">Envíos a Todo el País</span>
              </div>
              <h2 className="text-4xl font-serif font-bold text-gray-900">
                Entrega Rápida y Segura
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Enviamos a todas las provincias de Argentina con garantía de entrega y seguimiento en tiempo real.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-gray-300 py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm opacity-75">
            © 2026 TiendaMate. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
