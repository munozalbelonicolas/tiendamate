import { getDatabase } from "../connection";
import {
  CustomerProfile,
  CustomerAddress,
  CustomerPortalOrder,
  CustomerPortalOrderItem,
  CustomerFavoriteItem,
  CustomerPortalCoupon,
  CustomerReturnRequest,
  CustomerNotificationItem,
  CustomerSessionItem,
  CustomerDashboardData,
} from "@shared/api";

/**
 * Get or create customer by email
 */
export function getOrCreateCustomerByEmail(
  tenantId: string,
  email: string,
  fullName?: string,
  phone?: string
) {
  const db = getDatabase();
  const normalizedEmail = email.trim().toLowerCase();

  let customer = db
    .prepare("SELECT * FROM customers WHERE tenant_id = ? AND LOWER(email) = ?")
    .get(tenantId, normalizedEmail) as any;

  if (!customer) {
    const parts = (fullName || normalizedEmail.split("@")[0]).trim().split(" ");
    const firstName = parts[0] || "Cliente";
    const lastName = parts.slice(1).join(" ") || "TiendaMate";

    const defaultPrefs = JSON.stringify({
      orderUpdates: true,
      promotions: true,
      emailChannel: true,
      whatsappChannel: true,
      pushChannel: false,
    });

    const info = db
      .prepare(`
        INSERT INTO customers (
          tenant_id, first_name, last_name, email, phone, total_orders, total_spent,
          is_active, notification_preferences, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 0, 0, 1, ?, datetime('now'), datetime('now'))
      `)
      .run(tenantId, firstName, lastName, normalizedEmail, phone || null, defaultPrefs);

    const newId = Number(info.lastInsertRowid);

    // Create welcome notification
    db.prepare(`
      INSERT INTO customer_notifications (customer_id, type, title, message, link, is_read, created_at)
      VALUES (?, 'system', '¡Bienvenido a TiendaMate!', 'Explorá nuestras novedades y disfrutá de la mejor experiencia matera.', '/cuenta', 0, datetime('now'))
    `).run(newId);

    customer = db.prepare("SELECT * FROM customers WHERE id = ?").get(newId);
  }

  return customer;
}

/**
 * Get customer profile
 */
export function getCustomerProfile(tenantId: string, customerId: number): CustomerProfile | null {
  const db = getDatabase();
  const row = db
    .prepare("SELECT * FROM customers WHERE tenant_id = ? AND id = ?")
    .get(tenantId, customerId) as any;

  if (!row) return null;

  let notificationPreferences = {
    orderUpdates: true,
    promotions: true,
    emailChannel: true,
    whatsappChannel: true,
    pushChannel: false,
  };

  if (row.notification_preferences) {
    try {
      notificationPreferences = {
        ...notificationPreferences,
        ...JSON.parse(row.notification_preferences),
      };
    } catch {
      // ignore
    }
  }

  return {
    id: row.id,
    tenantId: row.tenant_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone || undefined,
    birthDate: row.birth_date || undefined,
    idDocument: row.id_document || undefined,
    totalOrders: Number(row.total_orders || 0),
    totalSpent: Number(row.total_spent || 0),
    lastOrderAt: row.last_order_at || undefined,
    notificationPreferences,
    createdAt: row.created_at,
  };
}

/**
 * Update customer profile
 */
export function updateCustomerProfile(
  tenantId: string,
  customerId: number,
  data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    birthDate?: string;
    idDocument?: string;
    notificationPreferences?: any;
  }
) {
  const db = getDatabase();
  const updates: string[] = ["updated_at = datetime('now')"];
  const params: any[] = [];

  if (data.firstName !== undefined) {
    updates.push("first_name = ?");
    params.push(data.firstName.trim());
  }
  if (data.lastName !== undefined) {
    updates.push("last_name = ?");
    params.push(data.lastName.trim());
  }
  if (data.phone !== undefined) {
    updates.push("phone = ?");
    params.push(data.phone ? data.phone.trim() : null);
  }
  if (data.birthDate !== undefined) {
    updates.push("birth_date = ?");
    params.push(data.birthDate ? data.birthDate.trim() : null);
  }
  if (data.idDocument !== undefined) {
    updates.push("id_document = ?");
    params.push(data.idDocument ? data.idDocument.trim() : null);
  }
  if (data.notificationPreferences !== undefined) {
    updates.push("notification_preferences = ?");
    params.push(JSON.stringify(data.notificationPreferences));
  }

  params.push(tenantId, customerId);

  db.prepare(`
    UPDATE customers
    SET ${updates.join(", ")}
    WHERE tenant_id = ? AND id = ?
  `).run(...params);

  return getCustomerProfile(tenantId, customerId);
}

/**
 * Customer Dashboard summary
 */
export function getCustomerDashboardData(tenantId: string, customerId: number): CustomerDashboardData {
  const db = getDatabase();
  const profile = getCustomerProfile(tenantId, customerId);
  if (!profile) {
    throw new Error("Perfil de cliente no encontrado");
  }

  // Latest order
  const latestOrderRow = db
    .prepare(`
      SELECT id FROM orders
      WHERE tenant_id = ? AND customer_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `)
    .get(tenantId, customerId) as { id: number } | undefined;

  const latestOrder = latestOrderRow ? getCustomerOrderById(tenantId, customerId, latestOrderRow.id) : null;

  // Active orders count (pending, confirmed, processing, shipped)
  const activeOrdersCountRow = db
    .prepare(`
      SELECT COUNT(*) as count FROM orders
      WHERE tenant_id = ? AND customer_id = ? AND status IN ('pending', 'confirmed', 'processing', 'shipped')
    `)
    .get(tenantId, customerId) as { count: number };

  // Total orders count
  const totalOrdersCountRow = db
    .prepare(`
      SELECT COUNT(*) as count FROM orders
      WHERE tenant_id = ? AND customer_id = ?
    `)
    .get(tenantId, customerId) as { count: number };

  // Favorites count
  const favCountRow = db
    .prepare(`
      SELECT COUNT(*) as count FROM customer_favorites
      WHERE customer_id = ?
    `)
    .get(customerId) as { count: number };

  // Unread notifications count
  const notifCountRow = db
    .prepare(`
      SELECT COUNT(*) as count FROM customer_notifications
      WHERE customer_id = ? AND is_read = 0
    `)
    .get(customerId) as { count: number };

  // Active coupons count
  const couponCountRow = db
    .prepare(`
      SELECT COUNT(*) as count FROM coupons
      WHERE tenant_id = ? AND is_active = 1 AND valid_to >= date('now')
    `)
    .get(tenantId) as { count: number };

  return {
    profile,
    latestOrder,
    activeOrderCount: activeOrdersCountRow?.count || 0,
    totalOrdersCount: totalOrdersCountRow?.count || 0,
    favoritesCount: favCountRow?.count || 0,
    unreadNotificationsCount: notifCountRow?.count || 0,
    availableCouponsCount: couponCountRow?.count || 0,
  };
}

/**
 * List customer orders with simple filters
 */
export function listCustomerOrders(
  tenantId: string,
  customerId: number,
  options: {
    statusFilter?: "all" | "active" | "delivered" | "cancelled";
    year?: string;
  } = {}
): CustomerPortalOrder[] {
  const db = getDatabase();
  const conditions: string[] = ["o.tenant_id = ?", "o.customer_id = ?"];
  const params: any[] = [tenantId, customerId];

  if (options.statusFilter === "active") {
    conditions.push("o.status IN ('pending', 'confirmed', 'processing', 'shipped')");
  } else if (options.statusFilter === "delivered") {
    conditions.push("o.status = 'delivered'");
  } else if (options.statusFilter === "cancelled") {
    conditions.push("o.status IN ('cancelled', 'refunded')");
  }

  if (options.year && options.year !== "all") {
    conditions.push("strftime('%Y', o.created_at) = ?");
    params.push(options.year);
  }

  const query = `
    SELECT o.*
    FROM orders o
    WHERE ${conditions.join(" AND ")}
    ORDER BY o.created_at DESC
  `;

  const orderRows = db.prepare(query).all(...params) as any[];

  return orderRows.map((r) => {
    // Get item summaries
    const items = db
      .prepare(`
        SELECT oi.*, p.stock as current_stock, p.price as current_price, p.is_published
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `)
      .all(r.id) as any[];

    let shippingAddress: any = null;
    if (r.shipping_address) {
      try {
        shippingAddress = JSON.parse(r.shipping_address);
      } catch {
        shippingAddress = { street: r.shipping_address };
      }
    }

    return {
      id: r.id,
      orderNumber: r.order_number,
      status: r.status,
      paymentMethod: r.payment_method,
      paymentStatus: r.payment_status,
      subtotal: Number(r.subtotal || 0),
      discount: Number(r.discount || 0),
      shippingCost: Number(r.shipping_cost || 0),
      total: Number(r.total || 0),
      currency: r.currency || "ARS",
      shippingCarrier: r.shipping_carrier || undefined,
      trackingNumber: r.tracking_number || undefined,
      trackingUrl: r.tracking_url || undefined,
      estimatedDelivery: r.estimated_delivery || undefined,
      invoiceUrl: r.invoice_url || undefined,
      shippingAddress,
      items: items.map((i) => ({
        id: i.id,
        productId: i.product_id,
        productName: i.product_name,
        productSku: i.product_sku || undefined,
        unitPrice: Number(i.unit_price || 0),
        quantity: Number(i.quantity || 1),
        totalPrice: Number(i.total_price || 0),
        imageUrl: i.image_url || undefined,
        currentStock: i.current_stock !== null ? Number(i.current_stock) : undefined,
        currentPrice: i.current_price !== null ? Number(i.current_price) : undefined,
        isAvailable: Boolean(i.is_published && i.current_stock > 0),
      })),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  });
}

/**
 * Get customer order by ID with full authorization check
 */
export function getCustomerOrderById(
  tenantId: string,
  customerId: number,
  orderId: number
): CustomerPortalOrder | null {
  const db = getDatabase();
  const r = db
    .prepare("SELECT * FROM orders WHERE tenant_id = ? AND customer_id = ? AND id = ?")
    .get(tenantId, customerId, orderId) as any;

  if (!r) return null;

  const items = db
    .prepare(`
      SELECT oi.*, p.stock as current_stock, p.price as current_price, p.is_published
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `)
    .all(r.id) as any[];

  let shippingAddress: any = null;
  if (r.shipping_address) {
    try {
      shippingAddress = JSON.parse(r.shipping_address);
    } catch {
      shippingAddress = { street: r.shipping_address };
    }
  }

  return {
    id: r.id,
    orderNumber: r.order_number,
    status: r.status,
    paymentMethod: r.payment_method,
    paymentStatus: r.payment_status,
    subtotal: Number(r.subtotal || 0),
    discount: Number(r.discount || 0),
    shippingCost: Number(r.shipping_cost || 0),
    total: Number(r.total || 0),
    currency: r.currency || "ARS",
    shippingCarrier: r.shipping_carrier || undefined,
    trackingNumber: r.tracking_number || undefined,
    trackingUrl: r.tracking_url || undefined,
    estimatedDelivery: r.estimated_delivery || undefined,
    invoiceUrl: r.invoice_url || undefined,
    shippingAddress,
    items: items.map((i) => ({
      id: i.id,
      productId: i.product_id,
      productName: i.product_name,
      productSku: i.product_sku || undefined,
      unitPrice: Number(i.unit_price || 0),
      quantity: Number(i.quantity || 1),
      totalPrice: Number(i.total_price || 0),
      imageUrl: i.image_url || undefined,
      currentStock: i.current_stock !== null ? Number(i.current_stock) : undefined,
      currentPrice: i.current_price !== null ? Number(i.current_price) : undefined,
      isAvailable: Boolean(i.is_published && i.current_stock > 0),
    })),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/**
 * Cancel order if permitted by business rules
 */
export function cancelCustomerOrder(tenantId: string, customerId: number, orderId: number) {
  const db = getDatabase();
  const order = db
    .prepare("SELECT * FROM orders WHERE tenant_id = ? AND customer_id = ? AND id = ?")
    .get(tenantId, customerId, orderId) as any;

  if (!order) {
    throw new Error("Pedido no encontrado o no pertenece a tu cuenta.");
  }

  // Can only cancel pending or confirmed orders
  if (!["pending", "confirmed"].includes(order.status)) {
    throw new Error(
      `El pedido ya se encuentra en estado "${order.status}" y no puede ser cancelado automáticamente. Por favor contactá a soporte.`
    );
  }

  // Restore inventory
  const items = db.prepare("SELECT product_id, quantity FROM order_items WHERE order_id = ?").all(orderId) as Array<{
    product_id: number;
    quantity: number;
  }>;

  for (const item of items) {
    db.prepare("UPDATE products SET stock = stock + ? WHERE id = ?").run(item.quantity, item.product_id);
    db.prepare(`
      INSERT INTO inventory_movements (tenant_id, product_id, type, quantity, reason, created_at)
      VALUES (?, ?, 'in', ?, 'Cancelación de pedido por cliente #${order.order_number}', datetime('now'))
    `).run(tenantId, item.product_id, item.quantity);
  }

  db.prepare(`
    UPDATE orders
    SET status = 'cancelled', updated_at = datetime('now')
    WHERE id = ?
  `).run(orderId);

  // Add customer notification
  db.prepare(`
    INSERT INTO customer_notifications (customer_id, type, title, message, link, is_read, created_at)
    VALUES (?, 'order', 'Pedido cancelado', 'Tu pedido #${order.order_number} ha sido cancelado con éxito.', '/cuenta/pedidos/${orderId}', 0, datetime('now'))
  `).run(customerId);

  return getCustomerOrderById(tenantId, customerId, orderId);
}

/**
 * Customer Addresses CRUD
 */
export function listCustomerAddresses(customerId: number): CustomerAddress[] {
  const db = getDatabase();
  const rows = db
    .prepare("SELECT * FROM customer_addresses WHERE customer_id = ? ORDER BY is_default DESC, created_at DESC")
    .all(customerId) as any[];

  return rows.map((r) => ({
    id: r.id,
    customerId: r.customer_id,
    title: r.title || "Principal",
    recipientName: r.recipient_name || undefined,
    phone: r.phone || undefined,
    street: r.street,
    streetNumber: r.street_number || undefined,
    floorApt: r.floor_apt || undefined,
    city: r.city,
    state: r.state || undefined,
    postalCode: r.postal_code || undefined,
    country: r.country || "Argentina",
    notes: r.notes || undefined,
    isDefault: r.is_default === 1,
    createdAt: r.created_at,
  }));
}

export function createCustomerAddress(
  customerId: number,
  data: {
    title: string;
    recipientName?: string;
    phone?: string;
    street: string;
    streetNumber?: string;
    floorApt?: string;
    city: string;
    state?: string;
    postalCode?: string;
    country?: string;
    notes?: string;
    isDefault?: boolean;
  }
): CustomerAddress {
  const db = getDatabase();

  const countRow = db
    .prepare("SELECT COUNT(*) as count FROM customer_addresses WHERE customer_id = ?")
    .get(customerId) as { count: number };
  const isFirst = (countRow?.count || 0) === 0;
  const isDefault = isFirst || Boolean(data.isDefault);

  if (isDefault) {
    db.prepare("UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ?").run(customerId);
  }

  const info = db
    .prepare(`
      INSERT INTO customer_addresses (
        customer_id, title, recipient_name, phone, street, street_number,
        floor_apt, city, state, postal_code, country, notes, is_default, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `)
    .run(
      customerId,
      data.title.trim(),
      data.recipientName?.trim() || null,
      data.phone?.trim() || null,
      data.street.trim(),
      data.streetNumber?.trim() || null,
      data.floorApt?.trim() || null,
      data.city.trim(),
      data.state?.trim() || "Buenos Aires",
      data.postalCode?.trim() || null,
      data.country?.trim() || "Argentina",
      data.notes?.trim() || null,
      isDefault ? 1 : 0
    );

  const newId = Number(info.lastInsertRowid);
  const addresses = listCustomerAddresses(customerId);
  return addresses.find((a) => a.id === newId)!;
}

export function updateCustomerAddress(
  customerId: number,
  addressId: number,
  data: Partial<CustomerAddress>
): CustomerAddress {
  const db = getDatabase();
  const existing = db
    .prepare("SELECT * FROM customer_addresses WHERE customer_id = ? AND id = ?")
    .get(customerId, addressId);

  if (!existing) {
    throw new Error("Dirección no encontrada");
  }

  if (data.isDefault) {
    db.prepare("UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ?").run(customerId);
  }

  const updates: string[] = [];
  const params: any[] = [];

  if (data.title !== undefined) {
    updates.push("title = ?");
    params.push(data.title.trim());
  }
  if (data.recipientName !== undefined) {
    updates.push("recipient_name = ?");
    params.push(data.recipientName ? data.recipientName.trim() : null);
  }
  if (data.phone !== undefined) {
    updates.push("phone = ?");
    params.push(data.phone ? data.phone.trim() : null);
  }
  if (data.street !== undefined) {
    updates.push("street = ?");
    params.push(data.street.trim());
  }
  if (data.streetNumber !== undefined) {
    updates.push("street_number = ?");
    params.push(data.streetNumber ? data.streetNumber.trim() : null);
  }
  if (data.floorApt !== undefined) {
    updates.push("floor_apt = ?");
    params.push(data.floorApt ? data.floorApt.trim() : null);
  }
  if (data.city !== undefined) {
    updates.push("city = ?");
    params.push(data.city.trim());
  }
  if (data.state !== undefined) {
    updates.push("state = ?");
    params.push(data.state ? data.state.trim() : null);
  }
  if (data.postalCode !== undefined) {
    updates.push("postal_code = ?");
    params.push(data.postalCode ? data.postalCode.trim() : null);
  }
  if (data.country !== undefined) {
    updates.push("country = ?");
    params.push(data.country ? data.country.trim() : "Argentina");
  }
  if (data.notes !== undefined) {
    updates.push("notes = ?");
    params.push(data.notes ? data.notes.trim() : null);
  }
  if (data.isDefault !== undefined) {
    updates.push("is_default = ?");
    params.push(data.isDefault ? 1 : 0);
  }

  if (updates.length > 0) {
    params.push(customerId, addressId);
    db.prepare(`UPDATE customer_addresses SET ${updates.join(", ")} WHERE customer_id = ? AND id = ?`).run(...params);
  }

  const addresses = listCustomerAddresses(customerId);
  return addresses.find((a) => a.id === addressId)!;
}

export function deleteCustomerAddress(customerId: number, addressId: number) {
  const db = getDatabase();
  const address = db
    .prepare("SELECT * FROM customer_addresses WHERE customer_id = ? AND id = ?")
    .get(customerId, addressId) as any;

  if (!address) {
    throw new Error("Dirección no encontrada");
  }

  db.prepare("DELETE FROM customer_addresses WHERE customer_id = ? AND id = ?").run(customerId, addressId);

  // If was default, set next available as default
  if (address.is_default === 1) {
    const next = db
      .prepare("SELECT id FROM customer_addresses WHERE customer_id = ? ORDER BY created_at DESC LIMIT 1")
      .get(customerId) as { id: number } | undefined;
    if (next) {
      db.prepare("UPDATE customer_addresses SET is_default = 1 WHERE id = ?").run(next.id);
    }
  }

  return true;
}

/**
 * Customer Favorites
 */
export function listCustomerFavorites(customerId: number): CustomerFavoriteItem[] {
  const db = getDatabase();
  const rows = db
    .prepare(`
      SELECT cf.id as fav_id, cf.product_id, cf.created_at as fav_created_at,
             p.name, p.slug, p.price, p.stock, p.image_url, p.is_published,
             (CASE WHEN p.is_featured = 1 THEN 'Destacado' ELSE NULL END) as badge,
             c.name as category_name

      FROM customer_favorites cf
      JOIN products p ON cf.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE cf.customer_id = ?
      ORDER BY cf.created_at DESC
    `)
    .all(customerId) as any[];

  return rows.map((r) => ({
    id: r.fav_id,
    productId: r.product_id,
    product: {
      id: r.product_id,
      name: r.name,
      slug: r.slug || undefined,
      price: Number(r.price || 0),
      stock: Number(r.stock || 0),
      imageUrl: r.image_url || undefined,
      isPublished: r.is_published === 1,
      badge: r.badge || undefined,
      categoryName: r.category_name || undefined,
    },
    createdAt: r.fav_created_at,
  }));
}

export function addCustomerFavorite(customerId: number, productId: number) {
  const db = getDatabase();
  db.prepare(`
    INSERT OR IGNORE INTO customer_favorites (customer_id, product_id, created_at)
    VALUES (?, ?, datetime('now'))
  `).run(customerId, productId);

  return listCustomerFavorites(customerId);
}

export function removeCustomerFavorite(customerId: number, productId: number) {
  const db = getDatabase();
  db.prepare("DELETE FROM customer_favorites WHERE customer_id = ? AND product_id = ?").run(customerId, productId);
  return listCustomerFavorites(customerId);
}

/**
 * Customer Coupons
 */
export function listCustomerCoupons(tenantId: string, customerId: number): CustomerPortalCoupon[] {
  const db = getDatabase();
  const rows = db
    .prepare(`
      SELECT * FROM coupons
      WHERE tenant_id = ?
      ORDER BY is_active DESC, valid_to DESC
    `)
    .all(tenantId) as any[];

  const now = new Date();

  return rows.map((c) => {
    let status: "available" | "used" | "expired" = "available";
    const validToDate = new Date(c.valid_to);

    if (c.is_active === 0 || validToDate < now) {
      status = "expired";
    }

    return {
      id: c.id,
      code: c.code,
      type: c.type,
      value: Number(c.value || 0),
      minPurchase: Number(c.min_purchase || 0),
      validTo: c.valid_to,
      status,
      description:
        c.type === "percentage"
          ? `${c.value}% OFF en compras superiores a $${Number(c.min_purchase || 0).toLocaleString("es-AR")}`
          : `$${Number(c.value || 0).toLocaleString("es-AR")} de descuento directo`,
    };
  });
}

/**
 * Customer Returns & Exchanges
 */
export function listCustomerReturns(tenantId: string, customerId: number): CustomerReturnRequest[] {
  const db = getDatabase();
  const rows = db
    .prepare(`
      SELECT cr.*, o.order_number, p.name as product_name, p.image_url as product_image_url
      FROM customer_returns cr
      JOIN orders o ON cr.order_id = o.id
      JOIN products p ON cr.product_id = p.id
      WHERE cr.tenant_id = ? AND cr.customer_id = ?
      ORDER BY cr.created_at DESC
    `)
    .all(tenantId, customerId) as any[];

  return rows.map((r) => ({
    id: r.id,
    orderId: r.order_id,
    orderNumber: r.order_number,
    productId: r.product_id,
    productName: r.product_name,
    productImageUrl: r.product_image_url || undefined,
    quantity: Number(r.quantity || 1),
    reason: r.reason,
    comments: r.comments || undefined,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export function createCustomerReturn(
  tenantId: string,
  customerId: number,
  data: {
    orderId: number;
    productId: number;
    quantity: number;
    reason: "defective" | "wrong_item" | "not_as_expected" | "wrong_size" | "other";
    comments?: string;
  }
) {
  const db = getDatabase();

  // Validate order ownership
  const order = db
    .prepare("SELECT * FROM orders WHERE tenant_id = ? AND customer_id = ? AND id = ?")
    .get(tenantId, customerId, data.orderId) as any;

  if (!order) {
    throw new Error("El pedido indicado no pertenece a tu cuenta.");
  }

  // Validate item in order
  const item = db
    .prepare("SELECT * FROM order_items WHERE order_id = ? AND product_id = ?")
    .get(data.orderId, data.productId) as any;

  if (!item) {
    throw new Error("El producto seleccionado no forma parte de este pedido.");
  }

  if (data.quantity > item.quantity) {
    throw new Error(`La cantidad no puede superar la comprada (${item.quantity}).`);
  }

  const info = db
    .prepare(`
      INSERT INTO customer_returns (
        tenant_id, customer_id, order_id, product_id, quantity, reason, comments,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'submitted', datetime('now'), datetime('now'))
    `)
    .run(
      tenantId,
      customerId,
      data.orderId,
      data.productId,
      data.quantity,
      data.reason,
      data.comments ? data.comments.trim() : null
    );

  // Add notification
  db.prepare(`
    INSERT INTO customer_notifications (customer_id, type, title, message, link, is_read, created_at)
    VALUES (?, 'order', 'Solicitud de devolución recibida', 'Hemos recibido tu solicitud para el pedido #${order.order_number}. El equipo la revisará dentro de las próximas 24hs.', '/cuenta/devoluciones', 0, datetime('now'))
  `).run(customerId);

  return listCustomerReturns(tenantId, customerId);
}

/**
 * Customer Notifications
 */
export function listCustomerNotifications(customerId: number): CustomerNotificationItem[] {
  const db = getDatabase();
  const rows = db
    .prepare(`
      SELECT * FROM customer_notifications
      WHERE customer_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `)
    .all(customerId) as any[];

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    message: r.message,
    link: r.link || undefined,
    isRead: r.is_read === 1,
    createdAt: r.created_at,
  }));
}

export function markNotificationAsRead(customerId: number, notificationId: number) {
  const db = getDatabase();
  db.prepare("UPDATE customer_notifications SET is_read = 1 WHERE customer_id = ? AND id = ?").run(
    customerId,
    notificationId
  );
  return listCustomerNotifications(customerId);
}

export function markAllNotificationsAsRead(customerId: number) {
  const db = getDatabase();
  db.prepare("UPDATE customer_notifications SET is_read = 1 WHERE customer_id = ?").run(customerId);
  return listCustomerNotifications(customerId);
}

/**
 * Customer Sessions & Security
 */
export function listCustomerSessions(customerId: number): CustomerSessionItem[] {
  const db = getDatabase();
  const rows = db
    .prepare(`
      SELECT * FROM customer_sessions
      WHERE customer_id = ?
      ORDER BY last_active_at DESC
    `)
    .all(customerId) as any[];

  if (rows.length === 0) {
    // Ensure at least 1 current session exists
    const defaultSessionId = `sess_curr_${customerId}`;
    db.prepare(`
      INSERT OR REPLACE INTO customer_sessions (id, customer_id, device_name, browser, os, ip_address, last_active_at)
      VALUES (?, ?, 'Navegador Web', 'Chrome', 'macOS', '181.44.120.12', datetime('now'))
    `).run(defaultSessionId, customerId);

    return [
      {
        id: defaultSessionId,
        deviceName: "Navegador Web",
        browser: "Chrome",
        os: "macOS",
        ipAddress: "181.44.120.12",
        lastActiveAt: new Date().toISOString(),
        isCurrent: true,
      },
    ];
  }

  return rows.map((r, idx) => ({
    id: r.id,
    deviceName: r.device_name,
    browser: r.browser || undefined,
    os: r.os || undefined,
    ipAddress: r.ip_address || undefined,
    lastActiveAt: r.last_active_at,
    isCurrent: idx === 0,
  }));
}

export function deleteCustomerSession(customerId: number, sessionId: string) {
  const db = getDatabase();
  db.prepare("DELETE FROM customer_sessions WHERE customer_id = ? AND id = ?").run(customerId, sessionId);
  return listCustomerSessions(customerId);
}

export function recordCustomerSession(customerId: number, userAgent: string, ip?: string) {
  const db = getDatabase();
  const sessionId = `sess_${customerId}_${Date.now()}`;
  let browser = "Chrome";
  let os = "Desktop";

  if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) browser = "Safari";
  else if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Edge")) browser = "Edge";

  if (userAgent.includes("Mac")) os = "macOS";
  else if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) os = "iOS";
  else if (userAgent.includes("Android")) os = "Android";

  db.prepare(`
    INSERT INTO customer_sessions (id, customer_id, device_name, browser, os, ip_address, last_active_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(sessionId, customerId, `${browser} en ${os}`, browser, os, ip || "127.0.0.1");

  return sessionId;
}

/**
 * Anonymize and delete customer account (RGPD / Legal compliance)
 */
export function deleteCustomerAccount(tenantId: string, customerId: number) {
  const db = getDatabase();

  // Anonymize personal customer row, preserving historical accounting orders
  const anonEmail = `anonimizado_${customerId}_${Date.now()}@tiendamate.local`;
  db.prepare(`
    UPDATE customers
    SET first_name = 'Usuario',
        last_name = 'Eliminado',
        email = ?,
        phone = NULL,
        notes = 'Cuenta eliminada a solicitud del usuario',
        is_active = 0,
        updated_at = datetime('now')
    WHERE tenant_id = ? AND id = ?
  `).run(anonEmail, tenantId, customerId);

  // Remove addresses, favorites, notifications, and sessions
  db.prepare("DELETE FROM customer_addresses WHERE customer_id = ?").run(customerId);
  db.prepare("DELETE FROM customer_favorites WHERE customer_id = ?").run(customerId);
  db.prepare("DELETE FROM customer_notifications WHERE customer_id = ?").run(customerId);
  db.prepare("DELETE FROM customer_sessions WHERE customer_id = ?").run(customerId);

  return true;
}
