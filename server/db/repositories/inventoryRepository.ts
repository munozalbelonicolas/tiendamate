import { getDatabase } from "../connection";
import { InventoryMovement } from "@shared/api";
import { getProductById } from "./productsRepository";

export function listInventoryMovements(
  tenantId: string,
  options: { page?: number; limit?: number; productId?: number } = {}
) {
  const db = getDatabase();
  const page = Math.max(1, options.page || 1);
  const limit = Math.max(1, Math.min(100, options.limit || 30));
  const offset = (page - 1) * limit;

  const conditions: string[] = ["im.tenant_id = ?"];
  const params: any[] = [tenantId];

  if (options.productId) {
    conditions.push("im.product_id = ?");
    params.push(options.productId);
  }

  const whereClause = conditions.join(" AND ");

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM inventory_movements im WHERE ${whereClause}`).get(...params) as { total: number };
  const total = countRow ? countRow.total : 0;

  const rows = db.prepare(`
    SELECT im.*, p.name as product_name, p.sku as product_sku
    FROM inventory_movements im
    LEFT JOIN products p ON im.product_id = p.id
    WHERE ${whereClause}
    ORDER BY im.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as any[];

  const items: InventoryMovement[] = rows.map((r) => ({
    id: r.id,
    tenantId: r.tenant_id,
    productId: r.product_id,
    productName: r.product_name || "Producto Eliminado",
    productSku: r.product_sku || "N/A",
    type: r.type,
    quantity: r.quantity,
    previousStock: r.previous_stock,
    newStock: r.new_stock,
    reason: r.reason,
    userName: r.user_name || undefined,
    referenceId: r.reference_id || undefined,
    createdAt: r.created_at,
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

export function adjustStock(
  tenantId: string,
  productId: number,
  delta: number,
  reason: string,
  userEmail: string = "admin@tiendamate.com",
  type: "in" | "out" | "adjustment" = "adjustment"
): InventoryMovement {
  const db = getDatabase();
  const product = getProductById(tenantId, productId);
  if (!product) {
    throw new Error("Producto no encontrado");
  }

  const previousStock = product.stock;
  const newStock = previousStock + delta;

  if (newStock < 0) {
    throw new Error(`Stock insuficiente. Stock actual: ${previousStock}, ajuste solicitado: ${delta}.`);
  }

  db.exec("BEGIN TRANSACTION;");
  try {
    // 1. Update stock
    db.prepare(`
      UPDATE products SET stock = ?, updated_at = datetime('now')
      WHERE tenant_id = ? AND id = ?
    `).run(newStock, tenantId, productId);

    // 2. Insert movement
    const movementInsert = db.prepare(`
      INSERT INTO inventory_movements (
        tenant_id, product_id, type, quantity, previous_stock, new_stock, reason, user_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    movementInsert.run(
      tenantId,
      productId,
      type,
      delta,
      previousStock,
      newStock,
      reason.trim(),
      userEmail
    );

    const movementId = (db.prepare("SELECT last_insert_rowid() as id").get() as any).id;

    // 3. Audit log
    db.prepare(`
      INSERT INTO audit_logs (
        tenant_id, user_email, action, entity_type, entity_id, old_values, new_values
      ) VALUES (?, ?, 'ADJUST_STOCK', 'inventory', ?, ?, ?)
    `).run(
      tenantId,
      userEmail,
      String(productId),
      JSON.stringify({ stock: previousStock }),
      JSON.stringify({ stock: newStock, delta, reason })
    );

    db.exec("COMMIT;");

    return {
      id: movementId,
      tenantId,
      productId,
      productName: product.name,
      productSku: product.sku,
      type,
      quantity: delta,
      previousStock,
      newStock,
      reason,
      userName: userEmail,
      createdAt: new Date().toISOString(),
    };
  } catch (err) {
    db.exec("ROLLBACK;");
    throw err;
  }
}

export function getLowStockProducts(tenantId: string) {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT p.id, p.sku, p.name, p.stock, p.min_stock_alert, p.category_name, p.price, p.image_url
    FROM products p
    WHERE p.tenant_id = ? AND p.stock <= p.min_stock_alert AND p.deleted_at IS NULL
    ORDER BY p.stock ASC
  `).all(tenantId) as any[];

  return rows.map((r) => ({
    id: r.id,
    sku: r.sku,
    name: r.name,
    stock: r.stock,
    minStockAlert: r.min_stock_alert,
    category: r.category_name,
    price: r.price,
    imageUrl: r.image_url,
  }));
}
