import { RequestHandler } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { listAuditLogs } from "../db/repositories/auditRepository";
import { getDatabaseConfig } from "../db/config";

export const handleAdminListAudit: RequestHandler = (req: AuthenticatedRequest, res) => {
  const tenantId = req.tenantId || getDatabaseConfig().tenantId;
  const limit = req.query.limit ? Number(req.query.limit) : 50;

  const logs = listAuditLogs(tenantId, limit);
  res.json(logs);
};
