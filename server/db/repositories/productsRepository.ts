import { getDatabase } from "../connection";
import { Product, ProductVariant } from "@shared/api";

export interface ListProductsOptions {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  stockStatus?: "all" | "in_stock" | "low_stock" | "out_of_stock";
  sortBy?: "name_asc" | "name_desc" | "price_asc" | "price_desc" | "stock_asc" | "stock_desc" | "created_desc";
  includeUnpublished?: boolean;
}

export function listProducts(tenantId: string, options: ListProductsOptions = {}) {
  const db = getDatabase();
  const page = Math.max(1, options.page || 1);
  const limit = Math.max(1, Math.min(100, options.limit || 20));
  const offset = (page - 1) * limit;

  const conditions: string[] = ["p.tenant_id = ?", "p.deleted_at IS NULL"];
  const params: any[] = [tenantId];

  if (!options.includeUnpublished) {
    conditions.push("p.is_published = 1");
  }

  if (options.category && options.category !== "Todos") {
    conditions.push("LOWER(p.category_name) = LOWER(?)");
    params.push(options.category);
  }

  if (options.search && options.search.trim()) {
    conditions.push("(p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)");
    const term = `%${options.search.trim()}%`;
    params.push(term, term, term);
  }

  if (options.stockStatus === "in_stock") {
    conditions.push("p.stock > p.min_stock_alert");
  } else if (options.stockStatus === "low_stock") {
    conditions.push("p.stock > 0 AND p.stock <= p.min_stock_alert");
  } else if (options.stockStatus === "out_of_stock") {
    conditions.push("p.stock <= 0");
  }

  const whereClause = conditions.join(" AND ");

  let orderBy = "p.created_at DESC";
  switch (options.sortBy) {
    case "price_asc":
      orderBy = "p.price ASC";
      break;
    case "price_desc":
      orderBy = "p.price DESC";
      break;
    case "name_asc":
      orderBy = "p.name ASC";
      break;
    case "name_desc":
      orderBy = "p.name DESC";
      break;
    case "stock_asc":
      orderBy = "p.stock ASC";
      break;
    case "stock_desc":
      orderBy = "p.stock DESC";
      break;
  }

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM products p WHERE ${whereClause}`).get(...params) as { total: number };
  const total = countRow ? countRow.total : 0;

  const rows = db.prepare(`
    SELECT p.*, c.name as category_real_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE ${whereClause}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as any[];

  const items: Product[] = rows.map((r) => mapProductRow(r));

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

export function getProductById(tenantId: string, id: number): Product | null {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT p.* FROM products p
    WHERE p.tenant_id = ? AND p.id = ? AND p.deleted_at IS NULL
  `).get(tenantId, id) as any;

  if (!row) return null;
  return mapProductRow(row);
}

export function getProductBySku(tenantId: string, sku: string): Product | null {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT p.* FROM products p
    WHERE p.tenant_id = ? AND p.sku = ? AND p.deleted_at IS NULL
  `).get(tenantId, sku) as any;

  if (!row) return null;
  return mapProductRow(row);
}

export function createProduct(
  tenantId: string,
  data: Partial<Product>,
  userEmail: string = "admin@tiendamate.com"
): Product {
  const db = getDatabase();

  if (!data.name || data.price === undefined) {
    throw new Error("El nombre y el precio del producto son obligatorios.");
  }

  const sku = (data.sku || `SKU-${Date.now().toString(36).toUpperCase()}`).trim();
  const existing = getProductBySku(tenantId, sku);
  if (existing) {
    throw new Error(`Ya existe un producto con el código SKU: ${sku}`);
  }

  const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const stock = Number(data.stock ?? 0);
  const minStockAlert = Number(data.minStockAlert ?? 5);

  db.exec("BEGIN TRANSACTION;");
  try {
    const insert = db.prepare(`
      INSERT INTO products (
        tenant_id, sku, name, slug, description, category_id, category_name,
        price, promo_price, cost, stock, min_stock_alert, is_published, is_featured,
        image_url, specs, seo_title, seo_description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      tenantId,
      sku,
      data.name.trim(),
      slug,
      data.description || "",
      data.categoryId || null,
      data.category || "General",
      Number(data.price),
      data.promoPrice !== undefined && data.promoPrice !== null ? Number(data.promoPrice) : null,
      data.cost !== undefined && data.cost !== null ? Number(data.cost) : null,
      stock,
      minStockAlert,
      data.isPublished !== false ? 1 : 0,
      data.isFeatured ? 1 : 0,
      data.imageUrl || null,
      data.specs ? JSON.stringify(data.specs) : null,
      data.seoTitle || null,
      data.seoDescription || null
    );

    const inserted = db.prepare(`
      SELECT * FROM products WHERE tenant_id = ? AND sku = ?
    `).get(tenantId, sku) as any;

    // Record initial inventory movement
    db.prepare(`
      INSERT INTO inventory_movements (
        tenant_id, product_id, type, quantity, previous_stock, new_stock, reason, user_name
      ) VALUES (?, ?, 'in', ?, 0, ?, 'Alta inicial de producto en catálogo', ?)
    `).run(tenantId, inserted.id, stock, stock, userEmail);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (
        tenant_id, user_email, action, entity_type, entity_id, new_values
      ) VALUES (?, ?, 'CREATE_PRODUCT', 'product', ?, ?)
    `).run(tenantId, userEmail, String(inserted.id), JSON.stringify({ sku, name: data.name, price: data.price, stock }));

    db.exec("COMMIT;");
    return mapProductRow(inserted);
  } catch (err) {
    db.exec("ROLLBACK;");
    throw err;
  }
}

export function updateProduct(
  tenantId: string,
  id: number,
  data: Partial<Product>,
  userEmail: string = "admin@tiendamate.com"
): Product {
  const db = getDatabase();
  const existing = getProductById(tenantId, id);
  if (!existing) {
    throw new Error("Producto no encontrado");
  }

  if (data.sku && data.sku !== existing.sku) {
    const existingWithSku = getProductBySku(tenantId, data.sku);
    if (existingWithSku && existingWithSku.id !== id) {
      throw new Error(`El código SKU ${data.sku} ya está en uso por otro producto.`);
    }
  }

  db.exec("BEGIN TRANSACTION;");
  try {
    const oldStock = existing.stock;
    const newStock = data.stock !== undefined ? Number(data.stock) : oldStock;

    db.prepare(`
      UPDATE products SET
        sku = COALESCE(?, sku),
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        category_id = COALESCE(?, category_id),
        category_name = COALESCE(?, category_name),
        price = COALESCE(?, price),
        promo_price = ?,
        cost = ?,
        stock = ?,
        min_stock_alert = COALESCE(?, min_stock_alert),
        is_published = COALESCE(?, is_published),
        is_featured = COALESCE(?, is_featured),
        image_url = COALESCE(?, image_url),
        specs = COALESCE(?, specs),
        seo_title = COALESCE(?, seo_title),
        seo_description = COALESCE(?, seo_description),
        updated_at = datetime('now')
      WHERE tenant_id = ? AND id = ?
    `).run(
      data.sku ?? null,
      data.name ?? null,
      data.description ?? null,
      data.categoryId ?? null,
      data.category ?? null,
      data.price !== undefined ? Number(data.price) : null,
      data.promoPrice !== undefined ? (data.promoPrice === null ? null : Number(data.promoPrice)) : existing.promoPrice ?? null,
      data.cost !== undefined ? (data.cost === null ? null : Number(data.cost)) : existing.cost ?? null,
      newStock,
      data.minStockAlert !== undefined ? Number(data.minStockAlert) : null,
      data.isPublished !== undefined ? (data.isPublished ? 1 : 0) : null,
      data.isFeatured !== undefined ? (data.isFeatured ? 1 : 0) : null,
      data.imageUrl ?? null,
      data.specs ? JSON.stringify(data.specs) : null,
      data.seoTitle ?? null,
      data.seoDescription ?? null,
      tenantId,
      id
    );

    // If stock changed directly in edit form, register movement
    if (newStock !== oldStock) {
      const diff = newStock - oldStock;
      db.prepare(`
        INSERT INTO inventory_movements (
          tenant_id, product_id, type, quantity, previous_stock, new_stock, reason, user_name
        ) VALUES (?, ?, 'adjustment', ?, ?, ?, 'Ajuste directo desde edición de producto', ?)
      `).run(tenantId, id, diff, oldStock, newStock, userEmail);
    }

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (
        tenant_id, user_email, action, entity_type, entity_id, old_values, new_values
      ) VALUES (?, ?, 'UPDATE_PRODUCT', 'product', ?, ?, ?)
    `).run(
      tenantId,
      userEmail,
      String(id),
      JSON.stringify({ price: existing.price, stock: existing.stock, name: existing.name }),
      JSON.stringify({ price: data.price ?? existing.price, stock: newStock, name: data.name ?? existing.name })
    );

    db.exec("COMMIT;");
    const updated = getProductById(tenantId, id);
    return updated!;
  } catch (err) {
    db.exec("ROLLBACK;");
    throw err;
  }
}

export function deleteProduct(
  tenantId: string,
  id: number,
  userEmail: string = "admin@tiendamate.com"
): void {
  const db = getDatabase();
  const existing = getProductById(tenantId, id);
  if (!existing) {
    throw new Error("Producto no encontrado");
  }

  db.exec("BEGIN TRANSACTION;");
  try {
    // Soft delete
    db.prepare(`
      UPDATE products SET deleted_at = datetime('now'), is_published = 0, updated_at = datetime('now')
      WHERE tenant_id = ? AND id = ?
    `).run(tenantId, id);

    db.prepare(`
      INSERT INTO audit_logs (
        tenant_id, user_email, action, entity_type, entity_id, old_values
      ) VALUES (?, ?, 'DELETE_PRODUCT', 'product', ?, ?)
    `).run(tenantId, userEmail, String(id), JSON.stringify({ sku: existing.sku, name: existing.name }));

    db.exec("COMMIT;");
  } catch (err) {
    db.exec("ROLLBACK;");
    throw err;
  }
}

export function bulkImportProducts(
  tenantId: string,
  items: Array<{
    sku: string;
    name: string;
    category?: string;
    price: number;
    stock?: number;
    description?: string;
    imageUrl?: string;
  }>,
  mode: "create_only" | "upsert" = "upsert",
  userEmail: string = "admin@tiendamate.com"
) {
  const db = getDatabase();
  const results = {
    total: items.length,
    created: 0,
    updated: 0,
    failed: 0,
    errors: [] as Array<{ row: number; sku: string; error: string }>,
  };

  db.exec("BEGIN TRANSACTION;");
  try {
    items.forEach((item, index) => {
      const rowNum = index + 1;
      try {
        if (!item.sku || !item.name || item.price === undefined || isNaN(Number(item.price))) {
          throw new Error("Faltan campos obligatorios (SKU, nombre, precio válido).");
        }

        const existing = getProductBySku(tenantId, item.sku);

        if (existing) {
          if (mode === "create_only") {
            throw new Error(`SKU duplicado: ${item.sku}`);
          }
          // Update
          updateProduct(tenantId, existing.id, {
            name: item.name,
            category: item.category || existing.category,
            price: Number(item.price),
            stock: item.stock !== undefined ? Number(item.stock) : existing.stock,
            description: item.description || existing.description,
            imageUrl: item.imageUrl || existing.imageUrl,
          }, userEmail);
          results.updated++;
        } else {
          // Create
          createProduct(tenantId, {
            sku: item.sku,
            name: item.name,
            category: item.category || "General",
            price: Number(item.price),
            stock: item.stock !== undefined ? Number(item.stock) : 0,
            description: item.description || "",
            imageUrl: item.imageUrl,
          }, userEmail);
          results.created++;
        }
      } catch (err: any) {
        results.failed++;
        results.errors.push({ row: rowNum, sku: item.sku || "N/A", error: err.message });
      }
    });

    db.exec("COMMIT;");
    return results;
  } catch (err) {
    db.exec("ROLLBACK;");
    throw err;
  }
}

function mapProductRow(r: any): Product {
  let specsObj: Record<string, string> | undefined = undefined;
  if (r.specs) {
    try {
      specsObj = typeof r.specs === "string" ? JSON.parse(r.specs) : r.specs;
    } catch {
      specsObj = undefined;
    }
  }

  return {
    id: r.id,
    tenantId: r.tenant_id,
    sku: r.sku,
    name: r.name,
    slug: r.slug,
    description: r.description || "",
    category: r.category_name || "General",
    categoryId: r.category_id || undefined,
    price: Number(r.price),
    promoPrice: r.promo_price !== null && r.promo_price !== undefined ? Number(r.promo_price) : null,
    cost: r.cost !== null && r.cost !== undefined ? Number(r.cost) : null,
    stock: Number(r.stock),
    minStockAlert: Number(r.min_stock_alert || 5),
    imageUrl: r.image_url || undefined,
    isPublished: r.is_published === 1,
    isFeatured: r.is_featured === 1,
    specs: specsObj,
    seoTitle: r.seo_title || undefined,
    seoDescription: r.seo_description || undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}
