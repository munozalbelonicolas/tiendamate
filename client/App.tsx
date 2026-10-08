import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import CartDrawer from "./components/CartDrawer";
import Index from "./pages/Index";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ProductDetail from "./pages/ProductDetail";
import NotFound from "./pages/NotFound";

// Customer Account Portal Pages
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import CustomerOrders from "./pages/customer/CustomerOrders";
import CustomerOrderDetail from "./pages/customer/CustomerOrderDetail";
import CustomerProfilePage from "./pages/customer/CustomerProfile";
import CustomerAddresses from "./pages/customer/CustomerAddresses";
import CustomerFavorites from "./pages/customer/CustomerFavorites";
import CustomerCoupons from "./pages/customer/CustomerCoupons";
import CustomerReturns from "./pages/customer/CustomerReturns";
import CustomerNotifications from "./pages/customer/CustomerNotifications";
import CustomerSecurity from "./pages/customer/CustomerSecurity";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <CartDrawer />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminDashboard />} />

              {/* Customer Account Portal Routes */}
              <Route path="/cuenta" element={<CustomerDashboard />} />
              <Route path="/cuenta/pedidos" element={<CustomerOrders />} />
              <Route path="/cuenta/pedidos/:id" element={<CustomerOrderDetail />} />
              <Route path="/cuenta/perfil" element={<CustomerProfilePage />} />
              <Route path="/cuenta/direcciones" element={<CustomerAddresses />} />
              <Route path="/cuenta/favoritos" element={<CustomerFavorites />} />
              <Route path="/cuenta/cupones" element={<CustomerCoupons />} />
              <Route path="/cuenta/devoluciones" element={<CustomerReturns />} />
              <Route path="/cuenta/notificaciones" element={<CustomerNotifications />} />
              <Route path="/cuenta/seguridad" element={<CustomerSecurity />} />
              
              {/* Alias for /profile -> /cuenta */}
              <Route path="/profile" element={<CustomerDashboard />} />

              {/* Dynamic product detail */}
              <Route path="/product/:id" element={<ProductDetail />} />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);


createRoot(document.getElementById("root")!).render(<App />);
