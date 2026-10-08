import { getDatabase } from "../connection";
import { StoreSettings } from "@shared/api";

export function getStoreSettings(tenantId: string): StoreSettings {
  const db = getDatabase();
  const row = db.prepare("SELECT * FROM store_settings WHERE tenant_id = ?").get(tenantId) as any;

  if (!row) {
    return {
      storeName: "TiendaMate",
      supportEmail: "contacto@tiendamate.com.ar",
      currency: "ARS",
      timezone: "America/Argentina/Buenos_Aires",
      taxRate: 21,
      minStockThreshold: 5,
      freeShippingThreshold: 45000,
    };
  }

  return {
    storeName: row.store_name,
    logoUrl: row.logo_url || undefined,
    supportEmail: row.support_email,
    phone: row.phone || undefined,
    address: row.address || undefined,
    currency: row.currency || "ARS",
    timezone: row.timezone || "America/Argentina/Buenos_Aires",
    taxRate: Number(row.tax_rate || 21),
    minStockThreshold: Number(row.min_stock_threshold || 5),
    freeShippingThreshold: Number(row.free_shipping_threshold || 45000),
    announcement: row.announcement || undefined,
    updatedAt: row.updated_at,
  };
}

export function updateStoreSettings(
  tenantId: string,
  data: Partial<StoreSettings>,
  userEmail: string = "admin@tiendamate.com"
): StoreSettings {
  const db = getDatabase();
  const existing = getStoreSettings(tenantId);

  db.exec("BEGIN TRANSACTION;");
  try {
    db.prepare(`
      INSERT INTO store_settings (
        tenant_id, store_name, logo_url, support_email, phone, address,
        currency, timezone, tax_rate, min_stock_threshold, free_shipping_threshold, announcement, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(tenant_id) DO UPDATE SET
        store_name = excluded.store_name,
        logo_url = excluded.logo_url,
        support_email = excluded.support_email,
        phone = excluded.phone,
        address = excluded.address,
        currency = excluded.currency,
        timezone = excluded.timezone,
        tax_rate = excluded.tax_rate,
        min_stock_threshold = excluded.min_stock_threshold,
        free_shipping_threshold = excluded.free_shipping_threshold,
        announcement = excluded.announcement,
        updated_at = datetime('now')
    `).run(
      tenantId,
      data.storeName || existing.storeName,
      data.logoUrl || existing.logoUrl || null,
      data.supportEmail || existing.supportEmail,
      data.phone || existing.phone || null,
      data.address || existing.address || null,
      data.currency || existing.currency,
      data.timezone || existing.timezone,
      data.taxRate !== undefined ? Number(data.taxRate) : existing.taxRate,
      data.minStockThreshold !== undefined ? Number(data.minStockThreshold) : existing.minStockThreshold,
      data.freeShippingThreshold !== undefined ? Number(data.freeShippingThreshold) : existing.freeShippingThreshold,
      data.announcement || existing.announcement || null
    );

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (
        tenant_id, user_email, action, entity_type, entity_id, old_values, new_values
      ) VALUES (?, ?, 'UPDATE_STORE_SETTINGS', 'settings', ?, ?, ?)
    `).run(
      tenantId,
      userEmail,
      tenantId,
      JSON.stringify(existing),
      JSON.stringify({ ...existing, ...data })
    );

    db.exec("COMMIT;");
    return getStoreSettings(tenantId);
  } catch (err) {
    db.exec("ROLLBACK;");
    throw err;
  }
}
