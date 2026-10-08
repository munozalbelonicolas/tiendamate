import { RequestHandler } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import {
  getDashboardMetrics,
  getReportData,
  PeriodType,
} from "../db/repositories/analyticsRepository";
import { getDatabaseConfig } from "../db/config";

export const handleAdminDashboardMetrics: RequestHandler = (req: AuthenticatedRequest, res) => {
  const tenantId = req.tenantId || getDatabaseConfig().tenantId;
  const period = (req.query.period as PeriodType) || "30days";

  try {
    const metrics = getDashboardMetrics(tenantId, period);
    res.json(metrics);
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Error al calcular métricas del dashboard." });
  }
};

export const handleAdminReportData: RequestHandler = (req: AuthenticatedRequest, res) => {
  const tenantId = req.tenantId || getDatabaseConfig().tenantId;
  const type = (req.query.type as any) || "sales";
  const format = req.query.format;

  try {
    const rows = getReportData(tenantId, type);

    if (format === "csv") {
      if (rows.length === 0) {
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="reporte_${type}.csv"`);
        res.send("");
        return;
      }

      const headers = Object.keys(rows[0]);
      const csvLines = [headers.join(",")];

      for (const row of rows) {
        const line = headers.map((h) => {
          const val = (row as any)[h];
          if (val === null || val === undefined) return '""';
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        });
        csvLines.push(line.join(","));
      }

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="reporte_${type}_${Date.now()}.csv"`);
      res.send(csvLines.join("\n"));
      return;
    }

    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Error al generar reporte." });
  }
};
