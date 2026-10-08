import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "node:path";
import fs from "node:fs";

process.env.APP_ENV = "testing";
process.env.TENANT_ID = "tiendamate_test";

import { getDatabase, closeDatabase } from "../db/connection";
import {
  getOrCreateCustomerByEmail,
  getCustomerProfile,
  updateCustomerProfile,
  getCustomerDashboardData,
  listCustomerOrders,
  listCustomerAddresses,
  createCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
  listCustomerFavorites,
  addCustomerFavorite,
  removeCustomerFavorite,
  listCustomerCoupons,
  createCustomerReturn,
  listCustomerReturns,
  listCustomerNotifications,
  markNotificationAsRead,
  listCustomerSessions,
  deleteCustomerAccount,
} from "../db/repositories/customerPortalRepository";
import {
  createCustomerSessionToken,
  verifyCustomerSessionToken,
} from "../middleware/auth";

describe("Customer Account Portal - Test Suite", () => {
  const tenantId = "tiendamate_test";
  const testEmail = "cliente.prueba@tiendamate.com";
  let customerId: number;

  beforeAll(() => {
    const db = getDatabase();
    const cust = getOrCreateCustomerByEmail(tenantId, testEmail, "Cliente Prueba", "+54 9 11 5555-4444");
    customerId = cust.id;
  });

  it("1. Customer Session Token: Signs and verifies token safely with HMAC", () => {
    const token = createCustomerSessionToken({
      customerId: 42,
      email: "test@matero.com",
      name: "Juan Matero",
      tenantId,
    });

    expect(token).toMatch(/^cust\./);
    const payload = verifyCustomerSessionToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.customerId).toBe(42);
    expect(payload?.email).toBe("test@matero.com");
    expect(payload?.type).toBe("customer_portal");
  });

  it("2. Customer Profile: Retrieves and updates profile with validation", () => {
    const profile = getCustomerProfile(tenantId, customerId);
    expect(profile).not.toBeNull();
    expect(profile?.email).toBe(testEmail);

    const updated = updateCustomerProfile(tenantId, customerId, {
      firstName: "Nicolás",
      lastName: "Actualizado",
      phone: "+54 9 11 9999-8888",
      birthDate: "1994-08-20",
      idDocument: "38.123.456",
    });

    expect(updated?.firstName).toBe("Nicolás");
    expect(updated?.lastName).toBe("Actualizado");
    expect(updated?.phone).toBe("+54 9 11 9999-8888");
    expect(updated?.birthDate).toBe("1994-08-20");
    expect(updated?.idDocument).toBe("38.123.456");
  });

  it("3. Customer Addresses: Creates, defaults and manages addresses", () => {
    const addr = createCustomerAddress(customerId, {
      title: "Casa",
      recipientName: "Nicolás",
      street: "Av. Corrientes",
      streetNumber: "1234",
      floorApt: "2A",
      city: "CABA",
      postalCode: "1043",
      country: "Argentina",
      isDefault: true,
    });

    expect(addr.id).toBeDefined();
    expect(addr.title).toBe("Casa");
    expect(addr.isDefault).toBe(true);

    const list = listCustomerAddresses(customerId);
    expect(list.length).toBeGreaterThanOrEqual(1);

    const updatedAddr = updateCustomerAddress(customerId, addr.id, {
      title: "Casa Principal",
    });
    expect(updatedAddr.title).toBe("Casa Principal");
  });

  it("4. Customer Favorites: Adds and removes favorites", () => {
    const db = getDatabase();
    // Ensure product exists
    const prod = db.prepare("SELECT id FROM products LIMIT 1").get() as { id: number } | undefined;
    if (prod) {
      addCustomerFavorite(customerId, prod.id);
      const favs = listCustomerFavorites(customerId);
      expect(favs.some((f) => f.productId === prod.id)).toBe(true);

      removeCustomerFavorite(customerId, prod.id);
      const favsAfter = listCustomerFavorites(customerId);
      expect(favsAfter.some((f) => f.productId === prod.id)).toBe(false);
    }
  });

  it("5. Customer Notifications: Lists and marks notifications as read", () => {
    const notifs = listCustomerNotifications(customerId);
    expect(Array.isArray(notifs)).toBe(true);
    if (notifs.length > 0) {
      const readNotifs = markNotificationAsRead(customerId, notifs[0].id);
      expect(readNotifs.find((n) => n.id === notifs[0].id)?.isRead).toBe(true);
    }
  });

  it("6. Customer Sessions: Lists active sessions", () => {
    const sessions = listCustomerSessions(customerId);
    expect(sessions.length).toBeGreaterThanOrEqual(1);
    expect(sessions[0].deviceName).toBeDefined();
  });

  it("7. Account Deletion: Anonymizes customer row and purges private data", () => {
    const res = deleteCustomerAccount(tenantId, customerId);
    expect(res).toBe(true);

    const db = getDatabase();
    const cust = db.prepare("SELECT * FROM customers WHERE id = ?").get(customerId) as any;
    expect(cust.first_name).toBe("Usuario");
    expect(cust.last_name).toBe("Eliminado");
    expect(cust.is_active).toBe(0);
    expect(cust.email).toMatch(/anonimizado_/);

    const addrs = db.prepare("SELECT * FROM customer_addresses WHERE customer_id = ?").all(customerId);
    expect(addrs.length).toBe(0);
  });
});
