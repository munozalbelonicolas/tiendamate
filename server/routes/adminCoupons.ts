import { RequestHandler } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import {
  listCoupons,
  createCoupon,
  toggleCoupon,
  validateCoupon,
} from "../db/repositories/couponsRepository";
import { getDatabaseConfig } from "../db/config";

export const handleAdminListCoupons: RequestHandler = (req: AuthenticatedRequest, res) => {
  const tenantId = req.tenantId || getDatabaseConfig().tenantId;
  const coupons = listCoupons(tenantId);
  res.json(coupons);
};

export const handleAdminCreateCoupon: RequestHandler = (req: AuthenticatedRequest, res) => {
  const tenantId = req.tenantId || getDatabaseConfig().tenantId;
  try {
    const coupon = createCoupon(tenantId, req.body);
    res.status(201).json(coupon);
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Error al crear cupón." });
  }
};

export const handleAdminToggleCoupon: RequestHandler = (req: AuthenticatedRequest, res) => {
  const tenantId = req.tenantId || getDatabaseConfig().tenantId;
  const id = Number(req.params.id);
  const { isActive } = req.body;

  try {
    toggleCoupon(tenantId, id, !!isActive);
    res.json({ success: true, message: "Estado de cupón actualizado." });
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Error al modificar cupón." });
  }
};

export const handlePublicValidateCoupon: RequestHandler = (req, res) => {
  const tenantId = getDatabaseConfig().tenantId;
  const { code, subtotal } = req.body;

  if (!code || subtotal === undefined) {
    res.status(400).json({ valid: false, discount: 0, message: "Código y subtotal son obligatorios." });
    return;
  }

  const result = validateCoupon(tenantId, code, Number(subtotal));
  res.json(result);
};
