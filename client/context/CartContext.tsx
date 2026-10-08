import { createContext, useContext, useState, useEffect } from "react";
import { Product } from "@shared/api";
import { toast } from "sonner";

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  userEmail?: string;
}

interface CartContextType {
  cart: CartItem[];
  orders: Order[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, delta: number) => void;
  clearCart: () => void;
  confirmOrder: (userEmail?: string) => Promise<Order>;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("tiendamate_cart");
    return saved ? JSON.parse(saved) : [];
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem("tiendamate_orders");
    return saved ? JSON.parse(saved) : [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("tiendamate_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("tiendamate_orders", JSON.stringify(orders));
  }, [orders]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });

    toast.success(`¡${product.name} agregado al carrito!`, {
      description: "Haz clic en el ícono del carrito para revisar tu pedido.",
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalPrice = cart.reduce(
    (acc, item) => acc + (item.product.promoPrice ?? item.product.price) * item.quantity,
    0
  );
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const confirmOrder = async (userEmail?: string): Promise<Order> => {
    try {
      // Persist real order in SQLite
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: userEmail ? userEmail.split("@")[0] : "Cliente Web",
          customerEmail: userEmail || "cliente@tiendamate.com",
          items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
          paymentMethod: "mercadopago",
        }),
      });

      if (res.ok) {
        const persisted = await res.json();
        const newOrder: Order = {
          id: persisted.orderNumber || `PED-${persisted.id}`,
          date: new Date(persisted.createdAt).toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          items: [...cart],
          total: persisted.total || totalPrice,
          userEmail,
        };
        setOrders((prev) => [newOrder, ...prev]);
        clearCart();
        return newOrder;
      }
    } catch (err) {
      console.error("Error persistiendo orden en backend:", err);
    }

    // Fallback if network offline
    const localFallbackOrder: Order = {
      id: `PED-${Math.floor(100000 + Math.random() * 900000)}`,
      date: new Date().toLocaleDateString("es-AR"),
      items: [...cart],
      total: totalPrice,
      userEmail,
    };
    setOrders((prev) => [localFallbackOrder, ...prev]);
    clearCart();
    return localFallbackOrder;
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        orders,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        confirmOrder,
        isCartOpen,
        setIsCartOpen,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe usarse dentro de un CartProvider");
  }
  return context;
};
