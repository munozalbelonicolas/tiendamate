import { getDatabase } from "../connection";
import { Coupon } from "@shared/api";

export function listCoupons(tenantId: string): Coupon[] {
  const db = getDatabase();
  const rows = db.prepare("SELECT * FROM coupons WHERE tenant_id = ? ORDER BY created_at DESC").all(tenantId) as any[];

  return rows.map((r) => ({
    id: r.id,
    tenantId: r.tenant_id,
    code: r.code,
    type: r.type,
    value: Number(r.value),
    minPurchase: Number(r.min_purchase || 0),
    maxUses: Number(r.max_uses || 100),
    usedCount: Number(r.used_count || 0),
    validFrom: r.valid_from,
    validTo: r.valid_to,
    isActive: r.is_active === 1,
    createdAt: r.created_at,
  }));
}

export function createCoupon(
  tenantId: string,
  data: {
    code: string;
    type: "percentage" | "fixed";
    value: number;
    minPurchase?: number;
    maxUses?: number;
    validFrom?: string;
    validTo?: string;
  }
): Coupon {
  const db = getDatabase();
  const code = data.code.trim().toUpperCase();

  const existing = db.prepare("SELECT id FROM coupons WHERE tenant_id = ? AND code = ?").get(tenantId, code);
  if (existing) {
    throw new Error(`El código de cupón '${code}' ya existe.`);
  }

  const validFrom = data.validFrom || new Date().toISOString();
  const validTo = data.validTo || new Date(Date.now() + 30 * 86400000).toISOString();

  db.prepare(`
    INSERT INTO coupons (
      tenant_id, code, type, value, min_purchase, max_uses, used_count, valid_from, valid_to, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, 1)
  `).run(
    tenantId,
    code,
    data.type,
    Number(data.value),
    Number(data.minPurchase || 0),
    Number(data.maxUses || 100),
    validFrom,
    validTo
  );

  const row = db.prepare("SELECT * FROM coupons WHERE tenant_id = ? AND code = ?").get(tenantId, code) as any;
  return {
    id: row.id,
    tenantId: row.tenant_id,
    code: row.code,
    type: row.type,
    value: Number(row.value),
    minPurchase: Number(row.min_purchase),
    maxUses: Number(row.max_uses),
    usedCount: Number(row.used_count),
    validFrom: row.valid_from,
    validTo: row.valid_to,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
  };
}

export function toggleCoupon(tenantId: string, id: number, isActive: boolean): void {
  const db = getDatabase();
  db.prepare("UPDATE coupons SET is_active = ? WHERE tenant_id = ? AND id = ?").run(isActive ? 1 : 0, tenantId, id);
}

export function validateCoupon(
  tenantId: string,
  code: string,
  subtotal: number
): { valid: boolean; discount: number; message?: string } {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT * FROM coupons 
    WHERE tenant_id = ? AND UPPER(code) = UPPER(?) AND is_active = 1
  `).get(tenantId, code.trim().toUpperCase()) as any;

  if (!row) {
    return { valid: false, discount: 0, message: "Cupón no válido o inactivo." };
  }

  const now = new Date();
  if (new Date(row.valid_from) > now || new Date(row.valid_to) < now) {
    return { valid: false, discount: 0, message: "Este cupón ha expirado." };
  }

  if (row.used_count >= row.max_uses) {
    return { valid: false, discount: 0, message: "Se ha alcanzado el límite de usos de este cupón." };
  }

  if (subtotal < Number(row.min_purchase)) {
    return {
      valid: false,
      discount: 0,
      message: `El pedido mínimo para aplicar este cupón es de $${row.min_purchase}.`,
    };
  }

  let discount = 0;
  if (row.type === "percentage") {
    discount = Math.round((subtotal * Number(row.value)) / 100);
  } else {
    discount = Math.min(subtotal, Number(row.value));
  }

  return { valid: true, discount, message: "¡Cupón aplicado correctamente!" };
}
