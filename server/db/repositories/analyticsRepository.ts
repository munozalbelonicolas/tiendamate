import { getDatabase } from "../connection";
import { DashboardMetrics } from "@shared/api";

export type PeriodType = "today" | "7days" | "30days" | "month" | "all";

export function getDashboardMetrics(tenantId: string, period: PeriodType = "30days"): DashboardMetrics {
  const db = getDatabase();

  let dateFilter = "1=1";
  switch (period) {
    case "today":
      dateFilter = "date(o.created_at) = date('now')";
      break;
    case "7days":
      dateFilter = "date(o.created_at) >= date('now', '-7 days')";
      break;
    case "30days":
      dateFilter = "date(o.created_at) >= date('now', '-30 days')";
      break;
    case "month":
      dateFilter = "strftime('%Y-%m', o.created_at) = strftime('%Y-%m', 'now')";
      break;
    case "all":
      dateFilter = "1=1";
      break;
  }

  // 1. Sales Total, Orders Count, Average Ticket
  const salesSummary = db.prepare(`
    SELECT 
      COALESCE(SUM(total), 0) as sales_total,
      COUNT(id) as orders_count
    FROM orders o
    WHERE o.tenant_id = ? AND o.status NOT IN ('cancelled', 'refunded') AND ${dateFilter}
  `).get(tenantId) as { sales_total: number; orders_count: number };

  const salesTotal = Number(salesSummary?.sales_total || 0);
  const ordersCount = Number(salesSummary?.orders_count || 0);
  const averageTicket = ordersCount > 0 ? Math.round(salesTotal / ordersCount) : 0;

  // 2. Published Products
  const publishedRow = db.prepare(`
    SELECT COUNT(*) as c FROM products WHERE tenant_id = ? AND is_published = 1 AND deleted_at IS NULL
  `).get(tenantId) as { c: number };
  const publishedProducts = Number(publishedRow?.c || 0);

  // 3. Low stock products
  const lowStockRow = db.prepare(`
    SELECT COUNT(*) as c FROM products WHERE tenant_id = ? AND stock <= min_stock_alert AND deleted_at IS NULL
  `).get(tenantId) as { c: number };
  const lowStockProducts = Number(lowStockRow?.c || 0);

  // 4. Pending orders
  const pendingRow = db.prepare(`
    SELECT COUNT(*) as c FROM orders WHERE tenant_id = ? AND status IN ('pending', 'confirmed', 'processing')
  `).get(tenantId) as { c: number };
  const pendingOrders = Number(pendingRow?.c || 0);

  // 5. Shipped orders
  const shippedRow = db.prepare(`
    SELECT COUNT(*) as c FROM orders WHERE tenant_id = ? AND status = 'shipped'
  `).get(tenantId) as { c: number };
  const shippedOrders = Number(shippedRow?.c || 0);

  // 6. Registered Customers
  const custRow = db.prepare(`
    SELECT COUNT(*) as c FROM customers WHERE tenant_id = ?
  `).get(tenantId) as { c: number };
  const registeredCustomers = Number(custRow?.c || 0);

  // 7. Sales Chart (Daily breakdown)
  const salesRows = db.prepare(`
    SELECT 
      strftime('%d/%m', o.created_at) as date_label,
      date(o.created_at) as raw_date,
      SUM(CASE WHEN o.status NOT IN ('cancelled', 'refunded') THEN o.total ELSE 0 END) as sales,
      COUNT(o.id) as orders
    FROM orders o
    WHERE o.tenant_id = ? AND ${dateFilter}
    GROUP BY raw_date
    ORDER BY raw_date ASC
  `).all(tenantId) as any[];

  const salesChart = salesRows.map((r) => ({
    date: r.date_label || r.raw_date,
    sales: Number(r.sales || 0),
    orders: Number(r.orders || 0),
  }));

  // 8. Category Chart
  const categoryRows = db.prepare(`
    SELECT 
      p.category_name as category,
      COUNT(oi.id) as count,
      COALESCE(SUM(oi.total_price), 0) as total
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN products p ON oi.product_id = p.id
    WHERE o.tenant_id = ? AND o.status NOT IN ('cancelled', 'refunded') AND ${dateFilter}
    GROUP BY p.category_name
    ORDER BY total DESC
  `).all(tenantId) as any[];

  const categoryChart = categoryRows.map((r) => ({
    category: r.category || "General",
    count: Number(r.count || 0),
    total: Number(r.total || 0),
  }));

  // 9. Order Status Chart
  const statusLabels: Record<string, string> = {
    pending: "Pendiente",
    confirmed: "Confirmado",
    processing: "En preparación",
    shipped: "Enviado",
    delivered: "Entregado",
    cancelled: "Cancelado",
    refunded: "Reembolsado",
  };

  const statusRows = db.prepare(`
    SELECT status, COUNT(id) as count
    FROM orders o
    WHERE o.tenant_id = ? AND ${dateFilter}
    GROUP BY status
  `).all(tenantId) as any[];

  const orderStatusChart = statusRows.map((r) => ({
    status: r.status,
    label: statusLabels[r.status] || r.status,
    count: Number(r.count || 0),
  }));

  // 10. Top Products
  const topRows = db.prepare(`
    SELECT 
      oi.product_id as id,
      oi.product_name as name,
      oi.product_sku as sku,
      SUM(oi.quantity) as units_sold,
      SUM(oi.total_price) as total_revenue,
      p.stock
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE o.tenant_id = ? AND o.status NOT IN ('cancelled', 'refunded') AND ${dateFilter}
    GROUP BY oi.product_id, oi.product_name
    ORDER BY units_sold DESC
    LIMIT 5
  `).all(tenantId) as any[];

  const topProducts = topRows.map((r) => ({
    id: r.id,
    name: r.name,
    sku: r.sku || "N/A",
    unitsSold: Number(r.units_sold || 0),
    totalRevenue: Number(r.total_revenue || 0),
    stock: Number(r.stock || 0),
  }));

  return {
    salesTotal,
    ordersCount,
    averageTicket,
    publishedProducts,
    lowStockProducts,
    pendingOrders,
    shippedOrders,
    registeredCustomers,
    salesChart,
    categoryChart,
    orderStatusChart,
    topProducts,
  };
}

export function getReportData(
  tenantId: string,
  type: "sales" | "orders" | "inventory" | "customers"
) {
  const db = getDatabase();

  if (type === "sales") {
    return db.prepare(`
      SELECT 
        o.order_number,
        o.created_at as fecha,
        o.customer_name as cliente,
        o.customer_email as email,
        o.status as estado_pedido,
        o.payment_method as medio_pago,
        o.payment_status as estado_pago,
        o.subtotal,
        o.discount as descuento,
        o.shipping_cost as envio,
        o.total
      FROM orders o
      WHERE o.tenant_id = ?
      ORDER BY o.created_at DESC
    `).all(tenantId);
  }

  if (type === "orders") {
    return db.prepare(`
      SELECT 
        o.order_number,
        o.created_at as fecha,
        o.customer_name as cliente,
        o.customer_email as email,
        o.status as estado,
        COUNT(oi.id) as cantidad_items,
        o.total
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.tenant_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `).all(tenantId);
  }

  if (type === "inventory") {
    return db.prepare(`
      SELECT 
        p.sku,
        p.name as producto,
        p.category_name as categoria,
        p.stock as stock_actual,
        p.min_stock_alert as stock_minimo,
        p.price as precio_venta,
        COALESCE(p.cost, 0) as costo_unitario,
        (p.stock * COALESCE(p.cost, p.price)) as valuacion_total
      FROM products p
      WHERE p.tenant_id = ? AND p.deleted_at IS NULL
      ORDER BY p.stock ASC
    `).all(tenantId);
  }

  // customers
  return db.prepare(`
    SELECT 
      c.first_name || ' ' || c.last_name as cliente,
      c.email,
      c.phone as telefono,
      c.total_orders as compras_realizadas,
      c.total_spent as total_gastado,
      c.last_order_at as ultima_compra,
      c.created_at as fecha_registro
    FROM customers c
    WHERE c.tenant_id = ?
    ORDER BY c.total_spent DESC
  `).all(tenantId);
}
