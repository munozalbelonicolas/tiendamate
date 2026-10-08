import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "node:path";
import fs from "node:fs";

// Configure testing environment before connecting to DB
process.env.APP_ENV = "testing";
process.env.TENANT_ID = "test_tenant";
process.env.INITIAL_ADMIN_EMAIL = "admin@testcommerce.com";

import { getDatabase, closeDatabase } from "../db/connection";
import { resetDemoData, seedDemoData } from "../db/seed";
import {
  createProduct,
  updateProduct,
  getProductById,
} from "../db/repositories/productsRepository";
import {
  adjustStock,
  listInventoryMovements,
} from "../db/repositories/inventoryRepository";
import {
  createOrder,
  updateOrderStatus,
} from "../db/repositories/ordersRepository";
import { getDashboardMetrics } from "../db/repositories/analyticsRepository";
import {
  createSignedSessionToken,
  verifySignedSessionToken,
} from "../middleware/auth";
import {
  getMembership,
} from "../db/repositories/usersRepository";

describe("E-Commerce Administration Platform - Test Suite", () => {
  const testTenant = "test_tenant";
  const testAdminEmail = "admin@testcommerce.com";
  const testDbPath = path.resolve(process.cwd(), "data", "tiendamate_testing.sqlite");

  beforeAll(() => {
    // Reset test database
    closeDatabase();
    if (fs.existsSync(testDbPath)) {
      try {
        fs.unlinkSync(testDbPath);
      } catch {}
    }

    // Connect and initialize clean testing database
    getDatabase();
  });

  afterAll(() => {
    closeDatabase();
    if (fs.existsSync(testDbPath)) {
      try {
        fs.unlinkSync(testDbPath);
      } catch {}
    }
  });

  describe("1. Environment Isolation & Zero Mock Rules", () => {
    it("should start with clean production/testing tables before any demo seed", () => {
      const db = getDatabase();
      const prodCount = (db.prepare("SELECT COUNT(*) as c FROM products WHERE tenant_id = ?").get(testTenant) as any).c;
      const orderCount = (db.prepare("SELECT COUNT(*) as c FROM orders WHERE tenant_id = ?").get(testTenant) as any).c;

      // In testing/production without demo seed, tables MUST be empty (0 mock products, 0 mock orders)
      expect(prodCount).toBe(0);
      expect(orderCount).toBe(0);
    });

    it("should populate demo data when seedDemoData is explicitly invoked", () => {
      const db = getDatabase();
      seedDemoData(db, testTenant);

      const prodCount = (db.prepare("SELECT COUNT(*) as c FROM products WHERE tenant_id = ?").get(testTenant) as any).c;
      const orderCount = (db.prepare("SELECT COUNT(*) as c FROM orders WHERE tenant_id = ?").get(testTenant) as any).c;

      expect(prodCount).toBeGreaterThanOrEqual(10);
      expect(orderCount).toBeGreaterThanOrEqual(6);
    });

    it("should strictly forbid resetDemoData when APP_ENV is production", () => {
      const db = getDatabase();
      const originalEnv = process.env.APP_ENV;
      process.env.APP_ENV = "production";

      expect(() => {
        resetDemoData(db, testTenant, testAdminEmail);
      }).toThrow(/ACCION BLOQUEADA/);

      process.env.APP_ENV = originalEnv;
    });
  });

  describe("2. Authentication, Tokens & RBAC Membership", () => {
    it("should create and verify tamper-proof signed session tokens", () => {
      const token = createSignedSessionToken({
        userId: "usr_test_123",
        email: testAdminEmail,
        name: "Admin Tester",
        role: "ADMIN",
        tenantId: testTenant,
      });

      expect(token).toContain(".");
      const verified = verifySignedSessionToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.email).toBe(testAdminEmail);
      expect(verified?.role).toBe("ADMIN");
    });

    it("should reject tampered tokens", () => {
      const validToken = createSignedSessionToken({
        userId: "usr_test_123",
        email: testAdminEmail,
        name: "Admin Tester",
        role: "ADMIN",
        tenantId: testTenant,
      });

      const tampered = validToken.slice(0, -4) + "XXXX";
      const verified = verifySignedSessionToken(tampered);
      expect(verified).toBeNull();
    });

    it("should verify tenant membership and permissions", () => {
      const membership = getMembership(testTenant, testAdminEmail);
      expect(membership).not.toBeNull();
      expect(membership?.role).toBe("SUPER_ADMIN");
      expect(membership?.permissions).toContain("products.create");
      expect(membership?.permissions).toContain("inventory.manage");
    });

    it("should reject users not registered in tenant memberships", () => {
      const randomGoogleUser = "unauthorized.user@gmail.com";
      const membership = getMembership(testTenant, randomGoogleUser);
      expect(membership).toBeNull();
    });
  });

  describe("3. Products Repository & ACID Inventory Persistence", () => {
    it("should create a new product and register initial inventory movement", () => {
      const newSku = `TEST-MATE-${Date.now()}`;
      const product = createProduct(
        testTenant,
        {
          sku: newSku,
          name: "Mate de Ensayo Unitario",
          category: "Mates",
          price: 28000,
          stock: 15,
          minStockAlert: 5,
        },
        testAdminEmail
      );

      expect(product.id).toBeDefined();
      expect(product.sku).toBe(newSku);
      expect(product.stock).toBe(15);

      // Verify persistence in SQLite
      const fetched = getProductById(testTenant, product.id);
      expect(fetched).not.toBeNull();
      expect(fetched?.price).toBe(28000);

      // Verify audit movement was created
      const movements = listInventoryMovements(testTenant, { productId: product.id });
      expect(movements.items.length).toBeGreaterThanOrEqual(1);
      expect(movements.items[0].quantity).toBe(15);
      expect(movements.items[0].reason).toContain("Alta inicial");
    });

    it("should reject duplicate SKU within the same tenant", () => {
      const duplicateSku = "DUP-SKU-01";
      createProduct(testTenant, { sku: duplicateSku, name: "Original", price: 10000, stock: 5 }, testAdminEmail);

      expect(() => {
        createProduct(testTenant, { sku: duplicateSku, name: "Duplicado", price: 12000, stock: 2 }, testAdminEmail);
      }).toThrow(/Ya existe un producto con el código SKU/);
    });

    it("should adjust stock manually and record reason and responsible user", () => {
      const product = createProduct(
        testTenant,
        { sku: `ADJ-SKU-${Date.now()}`, name: "Mate para Ajuste", price: 15000, stock: 10 },
        testAdminEmail
      );

      const movement = adjustStock(
        testTenant,
        product.id,
        5,
        "Recepción de nueva partida",
        testAdminEmail,
        "in"
      );

      expect(movement.previousStock).toBe(10);
      expect(movement.newStock).toBe(15);
      expect(movement.userName).toBe(testAdminEmail);

      const updated = getProductById(testTenant, product.id);
      expect(updated?.stock).toBe(15);
    });

    it("should prevent adjusting stock below 0", () => {
      const product = createProduct(
        testTenant,
        { sku: `NEG-SKU-${Date.now()}`, name: "Mate Stock Cero", price: 15000, stock: 2 },
        testAdminEmail
      );

      expect(() => {
        adjustStock(testTenant, product.id, -10, "Ajuste excesivo", testAdminEmail);
      }).toThrow(/Stock insuficiente/);
    });
  });

  describe("4. Order Management & Business Rules", () => {
    it("should create order, decrement product stock atomically, and preserve historical price", () => {
      const product = createProduct(
        testTenant,
        { sku: `ORD-TEST-${Date.now()}`, name: "Mate para Vender", price: 20000, stock: 10 },
        testAdminEmail
      );

      const order = createOrder(testTenant, {
        customerName: "Martín Fierro",
        customerEmail: "martin.fierro@pampa.com",
        items: [{ productId: product.id, quantity: 3 }],
        paymentMethod: "mercadopago",
      });

      expect(order.id).toBeDefined();
      expect(order.status).toBe("confirmed");
      expect(order.total).toBe(60000);
      expect(order.items[0].unitPrice).toBe(20000);
      expect(order.items[0].quantity).toBe(3);

      // Verify stock was decremented from 10 to 7
      const updatedProduct = getProductById(testTenant, product.id);
      expect(updatedProduct?.stock).toBe(7);
    });

    it("should prevent invalid order status transitions", () => {
      const product = createProduct(
        testTenant,
        { sku: `TRN-TEST-${Date.now()}`, name: "Mate Transición", price: 10000, stock: 5 },
        testAdminEmail
      );

      const order = createOrder(testTenant, {
        customerName: "Don Segundo",
        customerEmail: "segundo@sombra.com",
        items: [{ productId: product.id, quantity: 1 }],
      });

      // Valid: confirmed -> processing
      const step1 = updateOrderStatus(testTenant, order.id, "processing", "Preparando en depósito");
      expect(step1.status).toBe("processing");

      // Invalid: processing -> delivered (must pass through shipped first!)
      expect(() => {
        updateOrderStatus(testTenant, order.id, "delivered");
      }).toThrow(/Transición de estado inválida/);
    });

    it("should re-stock products when an order is cancelled", () => {
      const product = createProduct(
        testTenant,
        { sku: `CNC-TEST-${Date.now()}`, name: "Mate para Cancelar", price: 10000, stock: 10 },
        testAdminEmail
      );

      const order = createOrder(testTenant, {
        customerName: "Juan Moreira",
        customerEmail: "moreira@gaucho.com",
        items: [{ productId: product.id, quantity: 4 }],
      });

      // Stock is now 6
      expect(getProductById(testTenant, product.id)?.stock).toBe(6);

      // Cancel order
      updateOrderStatus(testTenant, order.id, "cancelled", "Cancelado a solicitud del cliente");

      // Stock must be restored to 10
      expect(getProductById(testTenant, product.id)?.stock).toBe(10);
    });
  });

  describe("5. Metrics and Analytics Calculations", () => {
    it("should compute real aggregate KPIs from database rows", () => {
      const metrics = getDashboardMetrics(testTenant, "all");

      expect(metrics.salesTotal).toBeGreaterThan(0);
      expect(metrics.ordersCount).toBeGreaterThan(0);
      expect(metrics.averageTicket).toBe(Math.round(metrics.salesTotal / metrics.ordersCount));
      expect(metrics.salesChart.length).toBeGreaterThan(0);
      expect(metrics.topProducts.length).toBeGreaterThan(0);
    });
  });
});
