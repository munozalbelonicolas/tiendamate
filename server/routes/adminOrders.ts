import { RequestHandler } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import {
  listOrders,
  getOrderById,
  updateOrderStatus,
} from "../db/repositories/ordersRepository";
import { getDatabaseConfig } from "../db/config";

export const handleAdminListOrders: RequestHandler = (req: AuthenticatedRequest, res) => {
  const tenantId = req.tenantId || getDatabaseConfig().tenantId;
  const { page, limit, status, paymentStatus, search, fromDate, toDate } = req.query;

  const result = listOrders(tenantId, {
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
    status: status as any,
    paymentStatus: paymentStatus as any,
    search: search ? String(search) : undefined,
    fromDate: fromDate ? String(fromDate) : undefined,
    toDate: toDate ? String(toDate) : undefined,
  });

  res.json(result);
};

export const handleAdminGetOrder: RequestHandler = (req: AuthenticatedRequest, res) => {
  const tenantId = req.tenantId || getDatabaseConfig().tenantId;
  const id = Number(req.params.id);

  const order = getOrderById(tenantId, id);
  if (!order) {
    res.status(404).json({ message: "Pedido no encontrado." });
    return;
  }

  res.json(order);
};

export const handleAdminUpdateOrderStatus: RequestHandler = (req: AuthenticatedRequest, res) => {
  const tenantId = req.tenantId || getDatabaseConfig().tenantId;
  const id = Number(req.params.id);
  const userEmail = req.user?.email || "admin@tiendamate.com";
  const { status, internalNotes } = req.body;

  if (!status) {
    res.status(400).json({ message: "El nuevo estado del pedido es obligatorio." });
    return;
  }

  try {
    const updated = updateOrderStatus(tenantId, id, status, internalNotes, userEmail);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Error al actualizar estado del pedido." });
  }
};
