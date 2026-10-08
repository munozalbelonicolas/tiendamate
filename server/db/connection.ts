import { DatabaseSync } from "node:sqlite";
import { getDatabaseConfig, DatabaseConfig } from "./config";
import { initializeSchema } from "./schema";
import { seedSystemRolesAndTenant, seedDemoData } from "./seed";

let currentDb: DatabaseSync | null = null;
let currentConfig: DatabaseConfig | null = null;

export function getDatabase(): DatabaseSync {
  if (currentDb) {
    return currentDb;
  }

  const config = getDatabaseConfig();
  currentConfig = config;

  console.log(`[DB] Conectando a SQLite: ${config.dbPath} (Entorno: ${config.appEnv.toUpperCase()})`);

  const db = new DatabaseSync(config.dbPath);
  initializeSchema(db);

  // Always seed system roles, permissions, and tenant
  seedSystemRolesAndTenant(db, config.tenantId, config.initialAdminEmail);

  // In DEMO environment, seed demo data if empty
  if (config.appEnv === "demo") {
    seedDemoData(db, config.tenantId);
  }

  currentDb = db;
  return currentDb;
}

export function getConfig(): DatabaseConfig {
  if (!currentConfig) {
    currentConfig = getDatabaseConfig();
  }
  return currentConfig;
}

export function closeDatabase(): void {
  if (currentDb) {
    currentDb.close();
    currentDb = null;
    currentConfig = null;
  }
}
