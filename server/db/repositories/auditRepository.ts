import { getDatabase } from "../connection";
import { AuditLog } from "@shared/api";

export function listAuditLogs(tenantId: string, limit: number = 50): AuditLog[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT * FROM audit_logs
    WHERE tenant_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(tenantId, limit) as any[];

  return rows.map((r) => ({
    id: r.id,
    tenantId: r.tenant_id,
    userId: r.user_id || undefined,
    userEmail: r.user_email,
    action: r.action,
    entityType: r.entity_type,
    entityId: r.entity_id,
    oldValues: r.old_values || undefined,
    newValues: r.new_values || undefined,
    createdAt: r.created_at,
  }));
}

export function logAudit(
  tenantId: string,
  userEmail: string,
  action: string,
  entityType: string,
  entityId: string,
  oldValues?: any,
  newValues?: any
): void {
  const db = getDatabase();
  db.prepare(`
    INSERT INTO audit_logs (
      tenant_id, user_email, action, entity_type, entity_id, old_values, new_values
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    tenantId,
    userEmail,
    action,
    entityType,
    entityId,
    oldValues ? JSON.stringify(oldValues) : null,
    newValues ? JSON.stringify(newValues) : null
  );
}
