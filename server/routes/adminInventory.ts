import { RequestHandler } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import {
  listInventoryMovements,
  adjustStock,
  getLowStockProducts,
} from "../db/repositories/inventoryRepository";
import { getDatabaseConfig } from "../db/config";

export const handleAdminListMovements: RequestHandler = (req: AuthenticatedRequest, res) => {
  const tenantId = req.tenantId || getDatabaseConfig().tenantId;
  const { page, limit, productId } = req.query;

  const result = listInventoryMovements(tenantId, {
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 30,
    productId: productId ? Number(productId) : undefined,
  });

  res.json(result);
};

export const handleAdminLowStock: RequestHandler = (req: AuthenticatedRequest, res) => {
  const tenantId = req.tenantId || getDatabaseConfig().tenantId;
  const products = getLowStockProducts(tenantId);
  res.json(products);
};

export const handleAdminAdjustStock: RequestHandler = (req: AuthenticatedRequest, res) => {
  const tenantId = req.tenantId || getDatabaseConfig().tenantId;
  const userEmail = req.user?.email || "admin@tiendamate.com";
  const { productId, delta, reason, type } = req.body;

  if (!productId || delta === undefined || !reason) {
    res.status(400).json({ message: "Producto, cantidad de ajuste y motivo son obligatorios." });
    return;
  }

  try {
    const movement = adjustStock(
      tenantId,
      Number(productId),
      Number(delta),
      String(reason),
      userEmail,
      type || "adjustment"
    );
    res.status(201).json(movement);
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Error al ajustar inventario." });
  }
};
