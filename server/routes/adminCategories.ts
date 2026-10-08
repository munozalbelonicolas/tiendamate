import { RequestHandler } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../db/repositories/categoriesRepository";
import { getDatabaseConfig } from "../db/config";

export const handleAdminListCategories: RequestHandler = (req: AuthenticatedRequest, res) => {
  const tenantId = req.tenantId || getDatabaseConfig().tenantId;
  const categories = listCategories(tenantId);
  res.json(categories);
};

export const handleAdminCreateCategory: RequestHandler = (req: AuthenticatedRequest, res) => {
  const tenantId = req.tenantId || getDatabaseConfig().tenantId;
  try {
    const category = createCategory(tenantId, req.body);
    res.status(201).json(category);
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Error al crear categoría." });
  }
};

export const handleAdminUpdateCategory: RequestHandler = (req: AuthenticatedRequest, res) => {
  const tenantId = req.tenantId || getDatabaseConfig().tenantId;
  const id = Number(req.params.id);
  try {
    const category = updateCategory(tenantId, id, req.body);
    res.json(category);
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Error al actualizar categoría." });
  }
};

export const handleAdminDeleteCategory: RequestHandler = (req: AuthenticatedRequest, res) => {
  const tenantId = req.tenantId || getDatabaseConfig().tenantId;
  const id = Number(req.params.id);
  try {
    deleteCategory(tenantId, id);
    res.json({ success: true, message: "Categoría eliminada correctamente." });
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Error al eliminar categoría." });
  }
};
