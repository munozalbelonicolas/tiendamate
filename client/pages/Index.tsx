import {
  Truck,
  Sparkles,
  Search,
  X,
  User as UserIcon,
  ShoppingBag,
  ArrowRight,
  Star,
  CheckCircle2,
  Plus,
  Minus,
  RotateCcw,
  ShieldCheck,
  Award,
  BookOpen,
  CreditCard,
  Heart,
  Package,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useNavigate } from "react-router-dom";
import { Product } from "@shared/api";
import { toast } from "sonner";

export default function Index() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc">("featured");
  const [newsletterEmail, setNewsletterEmail] = useState("");

  const { user, isAuthenticated, isAdmin } = useAuth();
  const { cart, addToCart, updateQuantity, setIsCartOpen, totalItems } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data: Product[]) => {
        setProducts(data);
      })
      .catch((err) => console.error("Error cargando productos:", err))
      .finally(() => setLoadingProducts(false));
  }, []);

  // Filtro y ordenamiento de productos
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      const matchesCategory =
        selectedCategory === "Todos" ||
        p.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    if (sortBy === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, selectedCategory, searchQuery, sortBy]);

  // Lista de categorías únicas para los tabs
  const categoriesList = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ["Todos", ...Array.from(set)];
  }, [products]);

  // Añadir al carrito (sin bloqueo de login)
  const handleAddToCart = (product: Product) => {
    addToCart(product);
  };

  // Scroll suave al catálogo con categoría seleccionada
  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    const element = document.getElementById("products");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  const getItemQuantityInCart = (productId: number) => {
    const item = cart.find((i) => i.product.id === productId);
    return item ? item.quantity : 0;
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || !newsletterEmail.includes("@")) {
      toast.error("Por favor, ingresa un correo electrónico válido");
      return;
    }
    toast.success("¡Bienvenido a Úno más | Espacio Nativo!", {
      description: "Te enviamos tu cupón del 10% OFF a tu casilla de correo.",
    });
    setNewsletterEmail("");
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#241F1E] flex flex-col font-sans selection:bg-[#BD532B] selection:text-white">
      {/* ── 1. Top Announcement Bar (Terracota Exacto) ── */}
      <div className="bg-[#BD532B] text-white text-xs py-2 px-4 border-b border-[#A7441E]">
        <div className="container mx-auto flex justify-between items-center text-center sm:text-left">
          <div className="flex items-center gap-2 font-medium">
            <Truck size={14} className="text-white/90" />
            <span>Envíos a todo el país</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 font-medium text-white/95">
            <Sparkles size={14} className="text-white/90" />
            <span>Productos que mantienen viva nuestra tradición</span>
          </div>
        </div>
      </div>

      {/* ── 2. Header de Navegación ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EFE8DF] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="container mx-auto px-4 py-3.5 flex justify-between items-center gap-4">
          {/* Logo "Úno más | ESPACIO NATIVO" */}
          <div
            onClick={() => {
              setSelectedCategory("Todos");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="cursor-pointer flex flex-col leading-none select-none group"
          >
            <div className="flex items-baseline leading-none">
              <span className="font-script text-4xl text-[#0E6365] font-bold tracking-tight">
                Úno
              </span>
              <span className="font-serif font-bold text-2xl text-[#BD532B] ml-0.5 tracking-tight">
                más
              </span>
            </div>
            <span className="text-[8.5px] uppercase tracking-[0.22em] font-semibold text-stone-500 mt-0.5">
              ESPACIO NATIVO
            </span>
          </div>

          {/* Menú de Navegación Central */}
          <nav className="hidden md:flex items-center gap-8">
            {["Mates", "Bombillas", "Accesorios", "Yerbas"].map((cat) => (
              <button
                key={cat}
                onClick={() => handleSelectCategory(cat)}
                className={`text-sm font-medium transition-colors hover:text-[#BD532B] ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? "text-[#BD532B] font-bold"
                    : "text-[#3A3330]"
                }`}
              >
                {cat}
              </button>
            ))}
          </nav>

          {/* Buscador + Acciones de Usuario & Carrito */}
          <div className="flex items-center gap-4">
            {/* Buscador en cápsula */}
            <div className="relative hidden sm:block">
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-56 md:w-64 lg:w-72 bg-stone-50 border border-stone-200/90 rounded-full pl-4 pr-10 py-1.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#BD532B] focus:ring-1 focus:ring-[#BD532B]/30 transition"
              />
              <Search
                size={16}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-600 cursor-pointer pointer-events-none"
              />
            </div>

            {/* Icono de Usuario */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    onClick={() => navigate("/admin")}
                    className="hidden lg:flex items-center gap-1.5 bg-[#FAF7F2] hover:bg-[#BD532B] text-[#3A3330] hover:text-white border border-[#EFE8DF] hover:border-[#BD532B] text-xs px-3.5 py-1.5 rounded-full font-semibold transition-all duration-200 shadow-xs group"
                    title="Panel de Administración"
                  >
                    <ShieldCheck size={14} className="text-[#BD532B] group-hover:text-white transition-colors" />
                    <span>Admin</span>
                  </button>
                )}

                <button
                  onClick={() => navigate("/cuenta")}
                  className="p-1 text-[#3A3330] hover:text-[#BD532B] transition"
                  title="Mi Cuenta"
                >
                  <UserIcon size={22} className="stroke-[1.6]" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="p-1 text-[#3A3330] hover:text-[#BD532B] transition"
                title="Iniciar Sesión"
              >
                <UserIcon size={22} className="stroke-[1.6]" />
              </button>
            )}

            {/* Icono de Carrito con badge terracotta */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-1 text-[#3A3330] hover:text-[#BD532B] transition"
              aria-label="Abrir Carrito"
            >
              <ShoppingBag size={22} className="stroke-[1.6]" />
              <span className="absolute -top-1 -right-1.5 bg-[#BD532B] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                {totalItems}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ── 3. Hero Section Panorámico con Paisaje Criollo ── */}
      <section className="relative w-full overflow-hidden min-h-[460px] md:min-h-[520px] flex items-center bg-[#ECE4D8]">
        {/* Fotografía de Fondo Panorámica */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-banner.jpg"
            alt="Mate tradicional al atardecer en el campo argentino"
            className="w-full h-full object-cover object-right md:object-center"
          />
          {/* Degrade suave a la izquierda para garantizar perfecta legibilidad del texto */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#FAF7F2]/95 via-[#FAF7F2]/75 to-transparent sm:w-3/4 md:w-3/5 lg:w-1/2"></div>
        </div>

        {/* Contenido Textual del Hero */}
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-xl space-y-4">
            <p className="text-[11px] sm:text-xs uppercase tracking-[0.2em] font-semibold text-[#66544C]">
              Tradición argentina, siempre cerca
            </p>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-black text-[#1F1A19] leading-[1.08] tracking-tight">
              El mate que elegís <br />
              <span className="text-[#BD532B]">habla de vos</span>
            </h1>

            <p className="text-stone-600 text-sm sm:text-base leading-relaxed max-w-md pt-1">
              Piezas artesanales, materiales nobles y una historia que se vive en cada encuentro.
            </p>

            {/* Botones de Acción */}
            <div className="flex flex-wrap items-center gap-3.5 pt-3">
              <button
                onClick={() => {
                  const el = document.getElementById("products");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="bg-[#BD532B] hover:bg-[#A3431E] text-white px-7 py-3 rounded-full font-medium text-sm transition-all transform hover:-translate-y-0.5 shadow-md flex items-center gap-2"
              >
                <span>Ver colección</span>
                <span className="text-base leading-none">→</span>
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById("esencia");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="bg-transparent hover:bg-white/40 border border-stone-800 text-stone-900 px-7 py-3 rounded-full font-medium text-sm transition"
              >
                Nuestra historia
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Tarjetas de Categorías (Exacto como el Mockup) ── */}
      <section id="categories" className="py-10 bg-[#FAF7F2]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Mates */}
            <div
              onClick={() => handleSelectCategory("Mates")}
              className="bg-[#F4ECE3] border border-[#E9DFD2] rounded-3xl p-6 flex items-center justify-between overflow-hidden relative group cursor-pointer hover:shadow-lg transition-all duration-300"
            >
              <div className="flex flex-col justify-between h-full z-10 pr-2">
                <div>
                  <h3 className="font-serif font-bold text-2xl text-[#231E1D]">Mates</h3>
                  <p className="text-xs text-[#6B5E59] mt-1.5 leading-relaxed">
                    Piezas únicas <br /> con identidad.
                  </p>
                </div>
                <div className="mt-8">
                  <div className="w-9 h-9 rounded-full border border-stone-400 flex items-center justify-center text-stone-700 group-hover:bg-[#BD532B] group-hover:border-[#BD532B] group-hover:text-white transition">
                    <ArrowRight size={14} />
                  </div>
                </div>
              </div>

              <div className="w-36 h-36 sm:w-40 sm:h-40 flex-shrink-0 relative overflow-hidden rounded-2xl">
                <img
                  src="/images/cat-mates.jpg"
                  alt="Mates de calabaza y alpaca"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

            {/* Card 2: Bombillas */}
            <div
              onClick={() => handleSelectCategory("Bombillas")}
              className="bg-[#F4ECE3] border border-[#E9DFD2] rounded-3xl p-6 flex items-center justify-between overflow-hidden relative group cursor-pointer hover:shadow-lg transition-all duration-300"
            >
              <div className="flex flex-col justify-between h-full z-10 pr-2">
                <div>
                  <h3 className="font-serif font-bold text-2xl text-[#231E1D]">Bombillas</h3>
                  <p className="text-xs text-[#6B5E59] mt-1.5 leading-relaxed">
                    Diseño y <br /> tradición.
                  </p>
                </div>
                <div className="mt-8">
                  <div className="w-9 h-9 rounded-full border border-stone-400 flex items-center justify-center text-stone-700 group-hover:bg-[#BD532B] group-hover:border-[#BD532B] group-hover:text-white transition">
                    <ArrowRight size={14} />
                  </div>
                </div>
              </div>

              <div className="w-36 h-36 sm:w-40 sm:h-40 flex-shrink-0 relative overflow-hidden rounded-2xl">
                <img
                  src="/images/cat-bombillas.jpg"
                  alt="Bombillas de alpaca cincelada"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

            {/* Card 3: Accesorios */}
            <div
              onClick={() => handleSelectCategory("Accesorios")}
              className="bg-[#F4ECE3] border border-[#E9DFD2] rounded-3xl p-6 flex items-center justify-between overflow-hidden relative group cursor-pointer hover:shadow-lg transition-all duration-300"
            >
              <div className="flex flex-col justify-between h-full z-10 pr-2">
                <div>
                  <h3 className="font-serif font-bold text-2xl text-[#231E1D]">Accesorios</h3>
                  <p className="text-xs text-[#6B5E59] mt-1.5 leading-relaxed">
                    Todo para <br /> tu mate.
                  </p>
                </div>
                <div className="mt-8">
                  <div className="w-9 h-9 rounded-full border border-stone-400 flex items-center justify-center text-stone-700 group-hover:bg-[#BD532B] group-hover:border-[#BD532B] group-hover:text-white transition">
                    <ArrowRight size={14} />
                  </div>
                </div>
              </div>

              <div className="w-36 h-36 sm:w-40 sm:h-40 flex-shrink-0 relative overflow-hidden rounded-2xl">
                <img
                  src="/images/cat-accesorios.jpg"
                  alt="Matera y accesorios de cuero"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Sección "Nuestra Esencia" (Peeking del Mockup) ── */}
      <section id="esencia" className="py-14 sm:py-20 bg-white border-y border-[#ECE2D5]">
        <div className="container mx-auto px-4 max-w-3xl text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#6B5E59]">
              Nuestra Esencia
            </span>
            <span className="w-8 h-[1px] bg-[#BD532B]/60 inline-block"></span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#1F1A19]">
            Más que productos, <span className="text-[#BD532B] italic">una tradición viva</span>
          </h2>

          <p className="text-stone-600 text-sm sm:text-base leading-relaxed pt-2">
            Cada mate que forjamos en nuestro taller lleva el alma de artesanos criollos.
            Trabajamos exclusivamente con calabazas seleccionadas, cueros vacunos curtidos naturalmente
            y orfebrería en alpaca labrada para que cada cebada sea un homenaje a nuestros orígenes.
          </p>
        </div>
      </section>

      {/* ── 6. Catálogo de Productos con Filtros y Búsqueda ── */}
      <section id="products" className="py-16 bg-[#FAF7F2] flex-1">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#BD532B]">
                Colección Completa
              </span>
              <h2 className="text-3xl font-serif font-bold text-[#231E1D] mt-1">
                Piezas Destacadas
              </h2>
            </div>

            {/* Pestañas de Filtro */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
              {categoriesList.map((cat) => {
                const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                      isSelected
                        ? "bg-[#BD532B] text-white shadow-sm"
                        : "bg-white text-stone-600 border border-[#E7DCD0] hover:bg-[#F4ECE3]"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid de Productos */}
          {loadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-3xl p-4 border border-[#EBE1D4] space-y-3 animate-pulse">
                  <div className="aspect-square bg-stone-200 rounded-2xl"></div>
                  <div className="h-4 bg-stone-200 rounded w-2/3"></div>
                  <div className="h-4 bg-stone-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-[#EBE1D4] max-w-md mx-auto p-8 space-y-3">
              <Search size={32} className="mx-auto text-stone-400 stroke-[1.5]" />
              <h3 className="font-serif font-bold text-lg text-stone-900">Sin coincidencias</h3>
              <p className="text-xs text-stone-500">
                No encontramos productos en "{selectedCategory}".
              </p>
              <button
                onClick={() => {
                  setSelectedCategory("Todos");
                  setSearchQuery("");
                }}
                className="bg-[#BD532B] text-white text-xs font-semibold px-4 py-2 rounded-full"
              >
                Ver todos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => {
                const qty = getItemQuantityInCart(product.id);

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-3xl border border-[#EBE1D4] overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:border-[#BD532B]/40"
                  >
                    {/* Clic para Detalle */}
                    <div
                      className="cursor-pointer"
                      onClick={() => navigate(`/product/${product.id}`)}
                      title={`Ver detalle de ${product.name}`}
                    >
                      <div className="relative aspect-square bg-[#F7F2EB] overflow-hidden">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-300">
                            <Package size={40} />
                          </div>
                        )}

                        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur px-2.5 py-0.5 rounded-full text-[10px] font-bold text-[#BD532B] border border-[#EFE8DF]">
                          {product.category}
                        </div>
                      </div>

                      <div className="p-5 pb-2">
                        <div className="flex items-center gap-1 text-[11px] text-amber-500 mb-1">
                          <Star size={12} className="fill-amber-400 text-amber-400" />
                          <span className="font-bold text-stone-700">4.9</span>
                        </div>
                        <h3 className="font-serif font-bold text-base text-[#241F1E] group-hover:text-[#BD532B] transition line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                      </div>
                    </div>

                    {/* Precios y Botón de Carrito */}
                    <div className="p-5 pt-0 space-y-3">
                      <div className="pt-2 border-t border-stone-100">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xl font-serif font-bold text-[#1F1A19]">
                            ${product.price.toLocaleString("es-AR")}
                          </span>
                          <span className="text-[10px] font-bold text-stone-400">ARS</span>
                        </div>
                        <p className="text-[11px] text-[#6B5E59]">
                          3 cuotas sin interés de ${Math.round(product.price / 3).toLocaleString("es-AR")}
                        </p>
                      </div>

                      {qty > 0 ? (
                        <div className="flex items-center justify-between bg-[#F7F2EB] border border-[#E7DCD0] rounded-full p-1">
                          <button
                            onClick={() => updateQuantity(product.id, -1)}
                            className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-stone-700 hover:bg-[#BD532B] hover:text-white transition"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-xs font-bold text-stone-900">{qty}</span>
                          <button
                            onClick={() => updateQuantity(product.id, 1)}
                            className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-stone-700 hover:bg-[#BD532B] hover:text-white transition"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="w-full bg-[#BD532B] hover:bg-[#A3431E] text-white py-2.5 px-4 rounded-full text-xs font-medium transition shadow-sm"
                        >
                          Agregar al carrito
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── 7. Newsletter & Pie de Página en Armonía Terracota ── */}
      <footer className="bg-[#241F1E] text-[#D1C7BD] pt-14 pb-8 border-t border-stone-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-stone-800">
            {/* Columna Marca */}
            <div className="space-y-3">
              <div className="flex items-baseline leading-none">
                <span className="font-script text-4xl text-emerald-400 font-bold">Úno</span>
                <span className="font-serif font-bold text-2xl text-[#BD532B] ml-0.5">más</span>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed">
                Espacio nativo de artesanía argentina. Elaboramos piezas con alma y tradición criolla para acompañar tus mejores momentos.
              </p>
            </div>

            {/* Enlaces */}
            <div className="space-y-2">
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">Categorías</h4>
              <ul className="space-y-1.5 text-xs text-stone-400">
                <li><button onClick={() => handleSelectCategory("Mates")} className="hover:text-white transition">Mates de Calabaza</button></li>
                <li><button onClick={() => handleSelectCategory("Bombillas")} className="hover:text-white transition">Bombillas de Alpaca</button></li>
                <li><button onClick={() => handleSelectCategory("Termos")} className="hover:text-white transition">Termos de Acero</button></li>
                <li><button onClick={() => handleSelectCategory("Accesorios")} className="hover:text-white transition">Materas y Cuero</button></li>
              </ul>
            </div>

            {/* Beneficios */}
            <div className="space-y-2">
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">Medios de Pago</h4>
              <p className="text-xs text-stone-400">
                Hasta 6 cuotas con Mercado Pago y 10% de descuento abonando por transferencia bancaria.
              </p>
              <div className="flex gap-2 pt-1 text-[10px] font-semibold text-stone-300">
                <span className="bg-stone-900 border border-stone-800 px-2 py-0.5 rounded">Mercado Pago</span>
                <span className="bg-stone-900 border border-stone-800 px-2 py-0.5 rounded">Tarjetas</span>
                <span className="bg-stone-900 border border-stone-800 px-2 py-0.5 rounded">Transferencia</span>
              </div>
            </div>

            {/* Newsletter */}
            <div className="space-y-2">
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">Comunidad</h4>
              <p className="text-xs text-stone-400">Recibe novedades y un 10% OFF en tu primera compra.</p>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <input
                  type="email"
                  placeholder="Tu correo..."
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="bg-stone-900 border border-stone-800 rounded-full px-3 py-1.5 text-xs text-white placeholder-stone-500 flex-1 focus:outline-none focus:border-[#BD532B]"
                />
                <button
                  type="submit"
                  className="bg-[#BD532B] hover:bg-[#A3431E] text-white px-3 py-1.5 rounded-full text-xs font-bold transition"
                >
                  OK
                </button>
              </form>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-stone-500 gap-2">
            <p>© 2026 Úno más | Espacio Nativo. Todos los derechos reservados.</p>
            <p>Hecho con pasión en Argentina 🧉</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
