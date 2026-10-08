import "dotenv/config";
import express from "express";
import cors from "cors";
import { getDatabase } from "./db/connection";
import { requireAuth, requirePermission } from "./middleware/auth";

// Public route handlers
import {
  getProducts,
  getProductByIdHandler,
  createProductHandler,
  updateProductHandler,
  deleteProductHandler,
} from "./routes/products";
import { handleLogin, handleRegister } from "./routes/auth";
import { createPreference } from "./routes/checkout";
import { handleCreateStorefrontOrder } from "./routes/publicOrders";
import { handlePublicValidateCoupon } from "./routes/adminCoupons";
import { handleGetEnvInfo, handleResetDemoData } from "./routes/adminDemo";
import customerPortalRouter from "./routes/customerPortal";

// Admin route handlers
import {
  handleGoogleSession,
  handleGetMe,
  handleDevDemoLogin,
} from "./routes/adminAuth";
import {
  handleAdminListProducts,
  handleAdminGetProduct,
  handleAdminCreateProduct,
  handleAdminUpdateProduct,
  handleAdminDeleteProduct,
  handleAdminBulkImportProducts,
} from "./routes/adminProducts";
import {
  handleAdminListCategories,
  handleAdminCreateCategory,
  handleAdminUpdateCategory,
  handleAdminDeleteCategory,
} from "./routes/adminCategories";
import {
  handleAdminListMovements,
  handleAdminLowStock,
  handleAdminAdjustStock,
} from "./routes/adminInventory";
import {
  handleAdminListOrders,
  handleAdminGetOrder,
  handleAdminUpdateOrderStatus,
} from "./routes/adminOrders";
import {
  handleAdminListCustomers,
  handleAdminGetCustomer,
} from "./routes/adminCustomers";
import {
  handleAdminDashboardMetrics,
  handleAdminReportData,
} from "./routes/adminAnalytics";
import {
  handleAdminGetSettings,
  handleAdminUpdateSettings,
} from "./routes/adminSettings";
import {
  handleAdminListUsers,
  handleAdminInviteUser,
  handleAdminUpdateUserRole,
  handleAdminRemoveUser,
} from "./routes/adminUsers";
import {
  handleAdminListCoupons,
  handleAdminCreateCoupon,
  handleAdminToggleCoupon,
} from "./routes/adminCoupons";
import { handleAdminListAudit } from "./routes/adminAudit";

export function createServer() {
  const app = express();

  // Initialize SQLite database eagerly on server boot
  getDatabase();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ==========================================
  // Public Store & Utility Routes
  // ==========================================
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/env", handleGetEnvInfo);

  // Storefront Auth Routes
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/register", handleRegister);

  // Storefront Products Routes (SQLite backed)
  app.get("/api/products", getProducts);
  app.get("/api/products/:id", getProductByIdHandler);
  app.post("/api/products", createProductHandler);
  app.put("/api/products/:id", updateProductHandler);
  app.delete("/api/products/:id", deleteProductHandler);

  // Storefront Orders & Checkout
  app.post("/api/orders", handleCreateStorefrontOrder);
  app.post("/api/coupons/validate", handlePublicValidateCoupon);
  app.post("/api/checkout/create-preference", createPreference);

  // ==========================================
  // Customer Account Portal (/api/me)
  // ==========================================
  app.use("/api/me", customerPortalRouter);

  // ==========================================
  // Admin Authentication
  // ==========================================
  app.post("/api/admin/auth/google-session", handleGoogleSession);
  app.post("/api/admin/auth/dev-demo-login", handleDevDemoLogin);
  app.get("/api/admin/auth/me", requireAuth, handleGetMe);

  // ==========================================
  // Admin Commercial Modules (Protected)
  // ==========================================

  // 1. Products
  app.get("/api/admin/products", requireAuth, requirePermission("products.read"), handleAdminListProducts);
  app.get("/api/admin/products/:id", requireAuth, requirePermission("products.read"), handleAdminGetProduct);
  app.post("/api/admin/products", requireAuth, requirePermission("products.create"), handleAdminCreateProduct);
  app.put("/api/admin/products/:id", requireAuth, requirePermission("products.update"), handleAdminUpdateProduct);
  app.delete("/api/admin/products/:id", requireAuth, requirePermission("products.delete"), handleAdminDeleteProduct);
  app.post("/api/admin/products/bulk-import", requireAuth, requirePermission("products.create"), handleAdminBulkImportProducts);

  // 2. Categories
  app.get("/api/admin/categories", requireAuth, requirePermission("products.read"), handleAdminListCategories);
  app.post("/api/admin/categories", requireAuth, requirePermission("products.create"), handleAdminCreateCategory);
  app.put("/api/admin/categories/:id", requireAuth, requirePermission("products.update"), handleAdminUpdateCategory);
  app.delete("/api/admin/categories/:id", requireAuth, requirePermission("products.delete"), handleAdminDeleteCategory);

  // 3. Inventory
  app.get("/api/admin/inventory/movements", requireAuth, requirePermission("inventory.manage"), handleAdminListMovements);
  app.get("/api/admin/inventory/low-stock", requireAuth, requirePermission("inventory.manage"), handleAdminLowStock);
  app.post("/api/admin/inventory/adjust", requireAuth, requirePermission("inventory.manage"), handleAdminAdjustStock);

  // 4. Orders
  app.get("/api/admin/orders", requireAuth, requirePermission("orders.read"), handleAdminListOrders);
  app.get("/api/admin/orders/:id", requireAuth, requirePermission("orders.read"), handleAdminGetOrder);
  app.patch("/api/admin/orders/:id/status", requireAuth, requirePermission("orders.update"), handleAdminUpdateOrderStatus);

  // 5. Customers
  app.get("/api/admin/customers", requireAuth, requirePermission("customers.read"), handleAdminListCustomers);
  app.get("/api/admin/customers/:id", requireAuth, requirePermission("customers.read"), handleAdminGetCustomer);

  // 6. Dashboard & Reports
  app.get("/api/admin/analytics/dashboard", requireAuth, requirePermission("reports.read"), handleAdminDashboardMetrics);
  app.get("/api/admin/analytics/report", requireAuth, requirePermission("reports.read"), handleAdminReportData);

  // 7. Store Settings
  app.get("/api/admin/settings", requireAuth, requirePermission("settings.manage"), handleAdminGetSettings);
  app.put("/api/admin/settings", requireAuth, requirePermission("settings.manage"), handleAdminUpdateSettings);

  // 8. Users & Permissions (RBAC)
  app.get("/api/admin/users", requireAuth, requirePermission("users.manage"), handleAdminListUsers);
  app.post("/api/admin/users/invite", requireAuth, requirePermission("users.manage"), handleAdminInviteUser);
  app.put("/api/admin/users/:id/role", requireAuth, requirePermission("users.manage"), handleAdminUpdateUserRole);
  app.delete("/api/admin/users/:id", requireAuth, requirePermission("users.manage"), handleAdminRemoveUser);

  // 9. Promotions & Coupons
  app.get("/api/admin/coupons", requireAuth, requirePermission("settings.manage"), handleAdminListCoupons);
  app.post("/api/admin/coupons", requireAuth, requirePermission("settings.manage"), handleAdminCreateCoupon);
  app.patch("/api/admin/coupons/:id/toggle", requireAuth, requirePermission("settings.manage"), handleAdminToggleCoupon);

  // 10. Audit Logs
  app.get("/api/admin/audit", requireAuth, requirePermission("reports.read"), handleAdminListAudit);

  // 11. Environment / Demo Control
  app.post("/api/admin/demo/reset", requireAuth, requirePermission("settings.manage"), handleResetDemoData);

  return app;
}
