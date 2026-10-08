import { RequestHandler } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkImportProducts,
} from "../db/repositories/productsRepository";
import { getDatabaseConfig } from "../db/config";

export const handleAdminListProducts: RequestHandler = (req: AuthenticatedRequest, res) => {
  const tenantId = req.tenantId || getDatabaseConfig().tenantId;
  const { page, limit, search, category, stockStatus, sortBy, includeUnpublished } = req.query;

  const result = listProducts(tenantId, {
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
    search: search ? String(search) : undefined,
    category: category ? String(category) : undefined,
    stockStatus: stockStatus as any,
    sortBy: sortBy as any,
    includeUnpublished: includeUnpublished === "true" || includeUnpublished === "1",
  });

  res.json(result);
};

export const handleAdminGetProduct: RequestHandler = (req: AuthenticatedRequest, res) => {
  const tenantId = req.tenantId || getDatabaseConfig().tenantId;
  const id = Number(req.params.id);

  const product = getProductById(tenantId, id);
  if (!product) {
    res.status(404).json({ message: "Producto no encontrado." });
    return;
  }

  res.json(product);
};

export const handleAdminCreateProduct: RequestHandler = (req: AuthenticatedRequest, res) => {
  const tenantId = req.tenantId || getDatabaseConfig().tenantId;
  const userEmail = req.user?.email || "admin@tiendamate.com";

  try {
    const product = createProduct(tenantId, req.body, userEmail);
    res.status(201).json(product);
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Error al crear producto." });
  }
};

export const handleAdminUpdateProduct: RequestHandler = (req: AuthenticatedRequest, res) => {
  const tenantId = req.tenantId || getDatabaseConfig().tenantId;
  const id = Number(req.params.id);
  const userEmail = req.user?.email || "admin@tiendamate.com";

  try {
    const product = updateProduct(tenantId, id, req.body, userEmail);
    res.json(product);
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Error al actualizar producto." });
  }
};

export const handleAdminDeleteProduct: RequestHandler = (req: AuthenticatedRequest, res) => {
  const tenantId = req.tenantId || getDatabaseConfig().tenantId;
  const id = Number(req.params.id);
  const userEmail = req.user?.email || "admin@tiendamate.com";

  try {
    deleteProduct(tenantId, id, userEmail);
    res.json({ success: true, message: "Producto eliminado correctamente." });
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Error al eliminar producto." });
  }
};

export const handleAdminBulkImportProducts: RequestHandler = (req: AuthenticatedRequest, res) => {
  const tenantId = req.tenantId || getDatabaseConfig().tenantId;
  const userEmail = req.user?.email || "admin@tiendamate.com";
  const { items, mode } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ message: "Se requiere un array de productos para importar." });
    return;
  }

  try {
    const results = bulkImportProducts(tenantId, items, mode || "upsert", userEmail);
    res.json(results);
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Error en importación masiva." });
  }
};
