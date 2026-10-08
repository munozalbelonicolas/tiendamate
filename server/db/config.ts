import path from "node:path";
import fs from "node:fs";

export type AppEnvironment = "demo" | "testing" | "production";

export interface DatabaseConfig {
  appEnv: AppEnvironment;
  tenantId: string;
  dbPath: string;
  initialAdminEmail: string;
}

export function getDatabaseConfig(): DatabaseConfig {
  const envRaw = (process.env.APP_ENV || "demo").toLowerCase();
  const validEnvs: AppEnvironment[] = ["demo", "testing", "production"];
  const appEnv: AppEnvironment = validEnvs.includes(envRaw as AppEnvironment)
    ? (envRaw as AppEnvironment)
    : "demo";

  const tenantId = process.env.TENANT_ID || "tiendamate";
  const initialAdminEmail = process.env.INITIAL_ADMIN_EMAIL || "admin@tiendamate.com";

  // Ensure data directory exists
  const dataDir = path.resolve(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.resolve(dataDir, `tiendamate_${appEnv}.sqlite`);

  return {
    appEnv,
    tenantId,
    dbPath,
    initialAdminEmail,
  };
}
