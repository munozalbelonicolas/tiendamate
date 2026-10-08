import { RequestHandler } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { getStoreSettings, updateStoreSettings } from "../db/repositories/settingsRepository";
import { getDatabaseConfig } from "../db/config";

export const handleAdminGetSettings: RequestHandler = (req: AuthenticatedRequest, res) => {
  const tenantId = req.tenantId || getDatabaseConfig().tenantId;
  const settings = getStoreSettings(tenantId);
  res.json(settings);
};

export const handleAdminUpdateSettings: RequestHandler = (req: AuthenticatedRequest, res) => {
  const tenantId = req.tenantId || getDatabaseConfig().tenantId;
  const userEmail = req.user?.email || "admin@tiendamate.com";

  try {
    const updated = updateStoreSettings(tenantId, req.body, userEmail);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Error al actualizar configuración." });
  }
};
