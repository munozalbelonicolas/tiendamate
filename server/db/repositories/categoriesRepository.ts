import { getDatabase } from "../connection";
import { Category } from "@shared/api";

export function listCategories(tenantId: string): Category[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT c.*, 
      (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.deleted_at IS NULL) as products_count
    FROM categories c
    WHERE c.tenant_id = ?
    ORDER BY c.sort_order ASC, c.name ASC
  `).all(tenantId) as any[];

  return rows.map((r) => ({
    id: r.id,
    tenantId: r.tenant_id,
    name: r.name,
    slug: r.slug,
    description: r.description || undefined,
    imageUrl: r.image_url || undefined,
    sortOrder: r.sort_order,
    isActive: r.is_active === 1,
    productsCount: Number(r.products_count || 0),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export function createCategory(
  tenantId: string,
  data: { name: string; slug?: string; description?: string; imageUrl?: string }
): Category {
  const db = getDatabase();
  const name = data.name.trim();
  const slug = data.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const existing = db.prepare("SELECT id FROM categories WHERE tenant_id = ? AND slug = ?").get(tenantId, slug);
  if (existing) {
    throw new Error(`Ya existe una categoría con el identificador '${slug}'`);
  }

  const insert = db.prepare(`
    INSERT INTO categories (tenant_id, name, slug, description, image_url, sort_order, is_active)
    VALUES (?, ?, ?, ?, ?, 0, 1)
  `);

  insert.run(tenantId, name, slug, data.description || null, data.imageUrl || null);
  const row = db.prepare("SELECT * FROM categories WHERE tenant_id = ? AND slug = ?").get(tenantId, slug) as any;

  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    slug: row.slug,
    description: row.description || undefined,
    imageUrl: row.image_url || undefined,
    sortOrder: row.sort_order,
    isActive: row.is_active === 1,
    productsCount: 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function updateCategory(
  tenantId: string,
  id: number,
  data: { name?: string; slug?: string; description?: string; imageUrl?: string; isActive?: boolean }
): Category {
  const db = getDatabase();
  const existing = db.prepare("SELECT * FROM categories WHERE tenant_id = ? AND id = ?").get(tenantId, id) as any;
  if (!existing) {
    throw new Error("Categoría no encontrada");
  }

  db.prepare(`
    UPDATE categories SET
      name = COALESCE(?, name),
      slug = COALESCE(?, slug),
      description = COALESCE(?, description),
      image_url = COALESCE(?, image_url),
      is_active = COALESCE(?, is_active),
      updated_at = datetime('now')
    WHERE tenant_id = ? AND id = ?
  `).run(
    data.name ?? null,
    data.slug ?? null,
    data.description ?? null,
    data.imageUrl ?? null,
    data.isActive !== undefined ? (data.isActive ? 1 : 0) : null,
    tenantId,
    id
  );

  const updated = db.prepare("SELECT * FROM categories WHERE tenant_id = ? AND id = ?").get(tenantId, id) as any;
  return {
    id: updated.id,
    tenantId: updated.tenant_id,
    name: updated.name,
    slug: updated.slug,
    description: updated.description || undefined,
    imageUrl: updated.image_url || undefined,
    sortOrder: updated.sort_order,
    isActive: updated.is_active === 1,
    createdAt: updated.created_at,
    updatedAt: updated.updated_at,
  };
}

export function deleteCategory(tenantId: string, id: number): void {
  const db = getDatabase();
  // Check if products are associated
  const count = (db.prepare("SELECT COUNT(*) as c FROM products WHERE tenant_id = ? AND category_id = ? AND deleted_at IS NULL").get(tenantId, id) as any)?.c;
  if (count > 0) {
    throw new Error(`No se puede eliminar la categoría porque tiene ${count} productos asociados.`);
  }

  db.prepare("DELETE FROM categories WHERE tenant_id = ? AND id = ?").run(tenantId, id);
}
