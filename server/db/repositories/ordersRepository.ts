import { getDatabase } from "../connection";
import { Order, OrderItem, OrderStatus, PaymentStatus } from "@shared/api";
import { getProductById } from "./productsRepository";

export interface ListOrdersOptions {
  page?: number;
  limit?: number;
  status?: string;
  paymentStatus?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
}

const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
};

export function listOrders(tenantId: string, options: ListOrdersOptions = {}) {
  const db = getDatabase();
  const page = Math.max(1, options.page || 1);
  const limit = Math.max(1, Math.min(100, options.limit || 20));
  const offset = (page - 1) * limit;

  const conditions: string[] = ["o.tenant_id = ?"];
  const params: any[] = [tenantId];

  if (options.status && options.status !== "all") {
    conditions.push("o.status = ?");
    params.push(options.status);
  }

  if (options.paymentStatus && options.paymentStatus !== "all") {
    conditions.push("o.payment_status = ?");
    params.push(options.paymentStatus);
  }

  if (options.search && options.search.trim()) {
    conditions.push("(o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_email LIKE ?)");
    const term = `%${options.search.trim()}%`;
    params.push(term, term, term);
  }

  if (options.fromDate) {
    conditions.push("date(o.created_at) >= date(?)");
    params.push(options.fromDate);
  }

  if (options.toDate) {
    conditions.push("date(o.created_at) <= date(?)");
    params.push(options.toDate);
  }

  const whereClause = conditions.join(" AND ");

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM orders o WHERE ${whereClause}`).get(...params) as { total: number };
  const total = countRow ? countRow.total : 0;

  const rows = db.prepare(`
    SELECT o.*
    FROM orders o
    WHERE ${whereClause}
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as any[];

  const orderIds = rows.map((r) => r.id);
  const itemsByOrder = new Map<number, OrderItem[]>();

  if (orderIds.length > 0) {
    const placeholders = orderIds.map(() => "?").join(",");
    const itemsRows = db.prepare(`
      SELECT * FROM order_items WHERE order_id IN (${placeholders})
    `).all(...orderIds) as any[];

    for (const item of itemsRows) {
      if (!itemsByOrder.has(item.order_id)) {
        itemsByOrder.set(item.order_id, []);
      }
      itemsByOrder.get(item.order_id)!.push({
        id: item.id,
        productId: item.product_id,
        productName: item.product_name,
        productSku: item.product_sku || undefined,
        unitPrice: Number(item.unit_price),
        quantity: Number(item.quantity),
        totalPrice: Number(item.total_price),
        imageUrl: item.image_url || undefined,
      });
    }
  }

  const items: Order[] = rows.map((r) => mapOrderRow(r, itemsByOrder.get(r.id) || []));

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

export function getOrderById(tenantId: string, id: number): Order | null {
  const db = getDatabase();
  const row = db.prepare("SELECT * FROM orders WHERE tenant_id = ? AND id = ?").get(tenantId, id) as any;
  if (!row) return null;

  const itemRows = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(id) as any[];
  const items: OrderItem[] = itemRows.map((item) => ({
    id: item.id,
    productId: item.product_id,
    productName: item.product_name,
    productSku: item.product_sku || undefined,
    unitPrice: Number(item.unit_price),
    quantity: Number(item.quantity),
    totalPrice: Number(item.total_price),
    imageUrl: item.image_url || undefined,
  }));

  return mapOrderRow(row, items);
}

export function createOrder(
  tenantId: string,
  data: {
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    shippingAddress?: any;
    items: Array<{ productId: number; quantity: number }>;
    paymentMethod?: "mercadopago" | "transferencia" | "efectivo" | "tarjeta";
    discount?: number;
    shippingCost?: number;
    notes?: string;
  }
): Order {
  const db = getDatabase();

  if (!data.customerEmail || !data.customerName) {
    throw new Error("Datos de cliente requeridos (nombre y email).");
  }

  if (!data.items || data.items.length === 0) {
    throw new Error("El pedido debe contener al menos un producto.");
  }

  db.exec("BEGIN TRANSACTION;");
  try {
    // 1. Verify stock and calculate subtotal
    let subtotal = 0;
    const preparedItems: Array<{
      productId: number;
      productName: string;
      productSku: string;
      unitPrice: number;
      quantity: number;
      totalPrice: number;
      imageUrl?: string;
      currentStock: number;
    }> = [];

    for (const item of data.items) {
      const prod = getProductById(tenantId, item.productId);
      if (!prod) {
        throw new Error(`Producto con ID ${item.productId} no encontrado.`);
      }
      if (prod.stock < item.quantity) {
        throw new Error(`Stock insuficiente para '${prod.name}'. Stock disponible: ${prod.stock}, solicitado: ${item.quantity}.`);
      }

      const unitPrice = prod.promoPrice ?? prod.price;
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      preparedItems.push({
        productId: prod.id,
        productName: prod.name,
        productSku: prod.sku || "",
        unitPrice,
        quantity: item.quantity,
        totalPrice: lineTotal,
        imageUrl: prod.imageUrl,
        currentStock: prod.stock,
      });
    }

    const discount = Number(data.discount || 0);
    const shippingCost = Number(data.shippingCost || 0);
    const total = Math.max(0, subtotal - discount + shippingCost);

    // 2. Generate unique order number
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${year}-${randomSuffix}-${Date.now().toString().slice(-4)}`;

    // 3. Find or create customer
    let customerId: number | null = null;
    const existingCust = db.prepare("SELECT id FROM customers WHERE tenant_id = ? AND email = ?").get(tenantId, data.customerEmail) as { id: number } | undefined;
    if (existingCust) {
      customerId = existingCust.id;
    } else {
      const parts = data.customerName.trim().split(" ");
      const firstName = parts[0] || "Cliente";
      const lastName = parts.slice(1).join(" ") || "";
      db.prepare(`
        INSERT INTO customers (tenant_id, first_name, last_name, email, phone)
        VALUES (?, ?, ?, ?, ?)
      `).run(tenantId, firstName, lastName, data.customerEmail, data.customerPhone || null);
      const newCust = db.prepare("SELECT last_insert_rowid() as id").get() as { id: number };
      customerId = newCust.id;
    }

    // 4. Insert order
    const insertOrder = db.prepare(`
      INSERT INTO orders (
        tenant_id, order_number, customer_id, customer_name, customer_email, customer_phone,
        shipping_address, status, payment_method, payment_status, subtotal, discount,
        shipping_cost, total, currency, internal_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, 'approved', ?, ?, ?, ?, 'ARS', ?)
    `);

    insertOrder.run(
      tenantId,
      orderNumber,
      customerId,
      data.customerName,
      data.customerEmail,
      data.customerPhone || null,
      data.shippingAddress ? JSON.stringify(data.shippingAddress) : null,
      data.paymentMethod || "mercadopago",
      subtotal,
      discount,
      shippingCost,
      total,
      data.notes || null
    );

    const orderRow = db.prepare("SELECT last_insert_rowid() as id").get() as { id: number };
    const orderId = orderRow.id;

    // 5. Insert order items & decrement stock
    const insertItem = db.prepare(`
      INSERT INTO order_items (
        order_id, product_id, product_name, product_sku, unit_price, quantity, total_price, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const updateStock = db.prepare(`
      UPDATE products SET stock = stock - ?, updated_at = datetime('now')
      WHERE tenant_id = ? AND id = ?
    `);

    const insertMovement = db.prepare(`
      INSERT INTO inventory_movements (
        tenant_id, product_id, type, quantity, previous_stock, new_stock, reason, reference_id, user_name
      ) VALUES (?, ?, 'order_sale', ?, ?, ?, ?, ?, 'Checkout TiendaMate')
    `);

    for (const item of preparedItems) {
      insertItem.run(
        orderId,
        item.productId,
        item.productName,
        item.productSku,
        item.unitPrice,
        item.quantity,
        item.totalPrice,
        item.imageUrl || null
      );

      // Decrement stock
      updateStock.run(item.quantity, tenantId, item.productId);

      // Log movement
      const newStock = item.currentStock - item.quantity;
      insertMovement.run(
        tenantId,
        item.productId,
        -item.quantity,
        item.currentStock,
        newStock,
        `Venta online pedido #${orderNumber}`,
        String(orderId)
      );
    }

    // 6. Update customer metrics
    if (customerId) {
      db.prepare(`
        UPDATE customers
        SET total_orders = total_orders + 1,
            total_spent = total_spent + ?,
            last_order_at = datetime('now'),
            updated_at = datetime('now')
        WHERE id = ?
      `).run(total, customerId);
    }

    // 7. Audit log
    db.prepare(`
      INSERT INTO audit_logs (
        tenant_id, user_email, action, entity_type, entity_id, new_values
      ) VALUES (?, 'checkout@tiendamate.com', 'CREATE_ORDER', 'order', ?, ?)
    `).run(tenantId, String(orderId), JSON.stringify({ orderNumber, total, itemsCount: preparedItems.length }));

    db.exec("COMMIT;");

    const created = getOrderById(tenantId, orderId);
    return created!;
  } catch (err) {
    db.exec("ROLLBACK;");
    throw err;
  }
}

export function updateOrderStatus(
  tenantId: string,
  id: number,
  status: OrderStatus,
  internalNotes?: string,
  userEmail: string = "admin@tiendamate.com"
): Order {
  const db = getDatabase();
  const existing = getOrderById(tenantId, id);
  if (!existing) {
    throw new Error("Pedido no encontrado.");
  }

  const allowed = VALID_STATUS_TRANSITIONS[existing.status] || [];
  if (!allowed.includes(status) && existing.status !== status) {
    throw new Error(
      `Transición de estado inválida: no es posible pasar de '${existing.status}' a '${status}'.`
    );
  }

  db.exec("BEGIN TRANSACTION;");
  try {
    // If transitioning to cancelled, re-stock products
    if (status === "cancelled" && existing.status !== "cancelled") {
      for (const item of existing.items) {
        const prod = getProductById(tenantId, item.productId);
        if (prod) {
          const prev = prod.stock;
          const next = prev + item.quantity;
          db.prepare(`
            UPDATE products SET stock = stock + ?, updated_at = datetime('now')
            WHERE tenant_id = ? AND id = ?
          `).run(item.quantity, tenantId, item.productId);

          db.prepare(`
            INSERT INTO inventory_movements (
              tenant_id, product_id, type, quantity, previous_stock, new_stock, reason, reference_id, user_name
            ) VALUES (?, ?, 'order_cancel', ?, ?, ?, ?, ?, ?)
          `).run(
            tenantId,
            item.productId,
            item.quantity,
            prev,
            next,
            `Reingreso de stock por cancelación de pedido #${existing.orderNumber}`,
            String(existing.id),
            userEmail
          );
        }
      }
    }

    let notesToSet = existing.internalNotes || "";
    if (internalNotes) {
      notesToSet = notesToSet
        ? `${notesToSet}\n[${new Date().toISOString().slice(0, 10)}] ${internalNotes}`
        : internalNotes;
    }

    db.prepare(`
      UPDATE orders SET
        status = ?,
        internal_notes = ?,
        updated_at = datetime('now')
      WHERE tenant_id = ? AND id = ?
    `).run(status, notesToSet, tenantId, id);

    db.prepare(`
      INSERT INTO audit_logs (
        tenant_id, user_email, action, entity_type, entity_id, old_values, new_values
      ) VALUES (?, ?, 'UPDATE_ORDER_STATUS', 'order', ?, ?, ?)
    `).run(
      tenantId,
      userEmail,
      String(id),
      JSON.stringify({ status: existing.status }),
      JSON.stringify({ status, internalNotes })
    );

    db.exec("COMMIT;");
    const updated = getOrderById(tenantId, id);
    return updated!;
  } catch (err) {
    db.exec("ROLLBACK;");
    throw err;
  }
}

function mapOrderRow(r: any, items: OrderItem[]): Order {
  let addressObj = undefined;
  if (r.shipping_address) {
    try {
      addressObj = typeof r.shipping_address === "string" ? JSON.parse(r.shipping_address) : r.shipping_address;
    } catch {
      addressObj = undefined;
    }
  }

  return {
    id: r.id,
    tenantId: r.tenant_id,
    orderNumber: r.order_number,
    customerId: r.customer_id || undefined,
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    customerPhone: r.customer_phone || undefined,
    shippingAddress: addressObj,
    status: r.status,
    paymentMethod: r.payment_method,
    paymentStatus: r.payment_status,
    subtotal: Number(r.subtotal),
    discount: Number(r.discount || 0),
    shippingCost: Number(r.shipping_cost || 0),
    total: Number(r.total),
    currency: r.currency || "ARS",
    items,
    internalNotes: r.internal_notes || undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}
