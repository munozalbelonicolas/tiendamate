import { RequestHandler } from "express";
import { getDatabaseConfig } from "../db/config";
import { getDatabase } from "../db/connection";
import { resetDemoData } from "../db/seed";
import { EnvironmentInfo } from "@shared/api";

export const handleGetEnvInfo: RequestHandler = (_req, res) => {
  const config = getDatabaseConfig();
  const info: EnvironmentInfo = {
    appEnv: config.appEnv,
    tenantId: config.tenantId,
    isDemo: config.appEnv === "demo",
    isProduction: config.appEnv === "production",
    isTesting: config.appEnv === "testing",
  };
  res.json(info);
};

export const handleResetDemoData: RequestHandler = (_req, res) => {
  const config = getDatabaseConfig();

  if (config.appEnv === "production") {
    res.status(403).json({
      error: "forbidden_in_production",
      message: "Operación rechazada: Está terminantemente prohibido reiniciar datos en entorno de Producción.",
    });
    return;
  }

  try {
    const db = getDatabase();
    resetDemoData(db, config.tenantId, config.initialAdminEmail);
    res.json({
      success: true,
      message: "Base de datos de demostración restablecida con éxito.",
    });
  } catch (err: any) {
    res.status(500).json({
      error: "reset_failed",
      message: err.message || "Error al reiniciar datos de demostración.",
    });
  }
};
