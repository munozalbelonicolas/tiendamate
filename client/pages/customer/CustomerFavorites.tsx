import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CustomerLayout } from "@/components/customer/CustomerLayout";
import { customerService } from "@/services/customerService";
import { useCart } from "@/context/CartContext";
import { CustomerFavoriteItem, Product } from "@shared/api";
import {
  Heart,
  ShoppingBag,
  Trash2,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

export default function CustomerFavorites() {
  const [favorites, setFavorites] = useState<CustomerFavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { addToCart, setIsCartOpen } = useCart();

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerService.getFavorites();
      setFavorites(data);
    } catch (err: any) {
      setError(err.message || "No pudimos cargar tus favoritos.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (productId: number) => {
    // Optimistic UI update
    setFavorites((prev) => prev.filter((f) => f.productId !== productId));
    try {
      await customerService.removeFavorite(productId);
      toast.success("Producto eliminado de tus favoritos.");
    } catch (err: any) {
      toast.error("Error al quitar favorito");
      loadFavorites();
    }
  };

  const handleAddToCart = (fav: CustomerFavoriteItem) => {
    if (!fav.product.isPublished || fav.product.stock <= 0) {
      toast.error("Este producto ya no está disponible o se encuentra agotado.");
      return;
    }

    const cartProd: Product = {
      id: fav.product.id,
      name: fav.product.name,
      slug: fav.product.slug || `producto-${fav.product.id}`,
      price: fav.product.price,
      stock: fav.product.stock,
      imageUrl: fav.product.imageUrl || "/placeholder.png",
      categoryId: 1,
      isPublished: true,
    };

    addToCart(cartProd);
    setIsCartOpen(true);
  };

  return (
    <CustomerLayout
      title="Mis Favoritos"
      subtitle="Tus artículos seleccionados para comprar cuando quieras."
    >
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-white rounded-3xl border border-[#EFE8DF]" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-white rounded-3xl border border-red-200 p-8 text-center max-w-lg mx-auto">
          <p className="text-red-600 font-semibold mb-3">{error}</p>
          <button
            onClick={loadFavorites}
            className="px-5 py-2.5 rounded-xl bg-[#BD532B] text-white text-xs font-bold hover:bg-[#A34320] transition shadow-sm"
          >
            Intentar nuevamente
          </button>
        </div>
      ) : favorites.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#EFE8DF] p-12 text-center shadow-sm">
          <Heart className="w-12 h-12 mx-auto text-rose-300 mb-3" />
          <h3 className="text-base font-bold text-[#241F1E]">Tu lista de favoritos está vacía</h3>
          <p className="text-xs text-[#7A6F68] mt-1 max-w-sm mx-auto mb-6">
            Guardá mates, bombillas y accesorios haciendo clic en el corazón mientras explorás la tienda.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#BD532B] text-white text-xs font-bold hover:bg-[#A34320] transition shadow-sm"
          >
            <span>Explorar catálogo matero</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((fav) => {
            const isAvailable = fav.product.isPublished && fav.product.stock > 0;

            return (
              <div
                key={fav.id}
                className="bg-white rounded-3xl border border-[#EFE8DF] shadow-sm overflow-hidden flex flex-col justify-between hover:border-[#BD532B]/40 transition group"
              >
                <div>
                  {/* Image with quick actions */}
                  <div className="relative aspect-square bg-[#FAF7F2] overflow-hidden">
                    {fav.product.imageUrl ? (
                      <img
                        src={fav.product.imageUrl}
                        alt={fav.product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#7A6F68]">
                        <ShoppingBag className="w-12 h-12 opacity-30" />
                      </div>
                    )}

                    {/* Stock pill */}
                    <div className="absolute top-3 left-3">
                      {isAvailable ? (
                        <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-white/90 backdrop-blur-xs text-[#0E6365] border border-[#EFE8DF] shadow-xs">
                          En stock ({fav.product.stock} un.)
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-red-100 text-red-700 border border-red-200">
                          Agotado
                        </span>
                      )}
                    </div>

                    {/* Remove favorite button */}
                    <button
                      onClick={() => handleRemoveFavorite(fav.productId)}
                      className="absolute top-3 right-3 p-2 rounded-xl bg-white/90 backdrop-blur-xs text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition shadow-xs"
                      title="Quitar de favoritos"
                      aria-label="Quitar de favoritos"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Product Details */}
                  <div className="p-5">
                    {fav.product.categoryName && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#BD532B]">
                        {fav.product.categoryName}
                      </span>
                    )}
                    <h3 className="text-sm font-bold text-[#241F1E] mt-1 line-clamp-2">
                      {fav.product.name}
                    </h3>
                    <p className="text-base font-black text-[#241F1E] mt-2">
                      ${fav.product.price.toLocaleString("es-AR")}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-5 pt-0 border-t border-[#FAF7F2] mt-2 flex items-center gap-2">
                  <Link
                    to={`/product/${fav.productId}`}
                    className="p-2.5 rounded-xl border border-[#EFE8DF] text-[#7A6F68] hover:text-[#241F1E] hover:bg-[#FAF7F2] transition"
                    title="Ver detalle del producto"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={() => handleAddToCart(fav)}
                    disabled={!isAvailable}
                    className="flex-1 py-2.5 rounded-xl bg-[#BD532B] text-white text-xs font-bold hover:bg-[#A34320] transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{isAvailable ? "Agregar al carrito" : "No disponible"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CustomerLayout>
  );
}
