import { getDatabase } from "../connection";
import { Customer } from "@shared/api";

export function listCustomers(
  tenantId: string,
  options: { page?: number; limit?: number; search?: string } = {}
) {
  const db = getDatabase();
  const page = Math.max(1, options.page || 1);
  const limit = Math.max(1, Math.min(100, options.limit || 20));
  const offset = (page - 1) * limit;

  const conditions: string[] = ["c.tenant_id = ?"];
  const params: any[] = [tenantId];

  if (options.search && options.search.trim()) {
    conditions.push("(c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)");
    const term = `%${options.search.trim()}%`;
    params.push(term, term, term, term);
  }

  const whereClause = conditions.join(" AND ");

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM customers c WHERE ${whereClause}`).get(...params) as { total: number };
  const total = countRow ? countRow.total : 0;

  const rows = db.prepare(`
    SELECT c.*
    FROM customers c
    WHERE ${whereClause}
    ORDER BY c.total_spent DESC, c.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as any[];

  const items: Customer[] = rows.map((r) => ({
    id: r.id,
    tenantId: r.tenant_id,
    firstName: r.first_name,
    lastName: r.last_name,
    email: r.email,
    phone: r.phone || undefined,
    totalOrders: Number(r.total_orders || 0),
    totalSpent: Number(r.total_spent || 0),
    lastOrderAt: r.last_order_at || undefined,
    notes: r.notes || undefined,
    isActive: r.is_active === 1,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export function getCustomerById(tenantId: string, id: number) {
  const db = getDatabase();
  const row = db.prepare("SELECT * FROM customers WHERE tenant_id = ? AND id = ?").get(tenantId, id) as any;
  if (!row) return null;

  // Addresses
  const addresses = db.prepare("SELECT * FROM customer_addresses WHERE customer_id = ?").all(id) as any[];

  // Order history
  const recentOrders = db.prepare(`
    SELECT id, order_number, status, total, created_at
    FROM orders
    WHERE customer_id = ? AND tenant_id = ?
    ORDER BY created_at DESC
    LIMIT 10
  `).all(id, tenantId) as any[];

  return {
    id: row.id,
    tenantId: row.tenant_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone || undefined,
    totalOrders: Number(row.total_orders || 0),
    totalSpent: Number(row.total_spent || 0),
    lastOrderAt: row.last_order_at || undefined,
    notes: row.notes || undefined,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    addresses,
    recentOrders,
  };
}
