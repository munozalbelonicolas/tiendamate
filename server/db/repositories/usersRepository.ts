import { getDatabase } from "../connection";
import { AdminRole, Permission, TenantMembership, User } from "@shared/api";
import { PERMISSIONS_MAP } from "../seed";

export function listTenantMembers(tenantId: string): TenantMembership[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT tm.*, u.name as user_name, u.email as user_email, u.avatar_url as user_avatar
    FROM tenant_memberships tm
    JOIN users u ON tm.user_id = u.id
    WHERE tm.tenant_id = ?
    ORDER BY tm.created_at ASC
  `).all(tenantId) as any[];

  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    userName: r.user_name,
    userEmail: r.user_email,
    userAvatar: r.user_avatar || undefined,
    role: r.role as AdminRole,
    status: r.status as "active" | "invited" | "suspended",
    invitedBy: r.invited_by || undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export function getMembership(tenantId: string, email: string): {
  user: User;
  role: AdminRole;
  status: string;
  permissions: Permission[];
} | null {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT u.*, tm.role, tm.status
    FROM users u
    JOIN tenant_memberships tm ON u.id = tm.user_id AND tm.tenant_id = ?
    WHERE LOWER(u.email) = LOWER(?)
  `).get(tenantId, email) as any;

  if (!row) return null;

  const role = row.role as AdminRole;
  const permissions = (PERMISSIONS_MAP[role] || []) as Permission[];

  return {
    user: {
      id: row.id,
      name: row.name,
      email: row.email,
      role: role,
      avatarUrl: row.avatar_url || undefined,
      tenantId,
      permissions,
    },
    role,
    status: row.status,
    permissions,
  };
}

export function inviteOrAddMember(
  tenantId: string,
  email: string,
  name: string,
  role: AdminRole,
  invitedBy: string
): TenantMembership {
  const db = getDatabase();
  const cleanEmail = email.trim().toLowerCase();

  if (!["SUPER_ADMIN", "ADMIN", "MANAGER", "OPERADOR", "VIEWER"].includes(role)) {
    throw new Error(`Rol inválido: ${role}`);
  }

  db.exec("BEGIN TRANSACTION;");
  try {
    let existingUser = db.prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?)").get(cleanEmail) as any;

    if (!existingUser) {
      const newUserId = `usr_${Date.now()}`;
      db.prepare(`
        INSERT INTO users (id, email, name, is_active)
        VALUES (?, ?, ?, 1)
      `).run(newUserId, cleanEmail, name || cleanEmail.split("@")[0]);
      existingUser = { id: newUserId, email: cleanEmail, name: name || cleanEmail.split("@")[0] };
    }

    const existingMembership = db.prepare(
      "SELECT id FROM tenant_memberships WHERE tenant_id = ? AND user_id = ?"
    ).get(tenantId, existingUser.id);

    if (existingMembership) {
      throw new Error(`El usuario ${cleanEmail} ya es miembro de este comercio.`);
    }

    const membershipId = `tm_${Date.now()}`;
    db.prepare(`
      INSERT INTO tenant_memberships (id, tenant_id, user_id, role, status, invited_by)
      VALUES (?, ?, ?, ?, 'active', ?)
    `).run(membershipId, tenantId, existingUser.id, role, invitedBy);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (
        tenant_id, user_email, action, entity_type, entity_id, new_values
      ) VALUES (?, ?, 'INVITE_USER', 'membership', ?, ?)
    `).run(tenantId, invitedBy, membershipId, JSON.stringify({ email: cleanEmail, role }));

    db.exec("COMMIT;");

    return {
      id: membershipId,
      userId: existingUser.id,
      userName: existingUser.name,
      userEmail: existingUser.email,
      role,
      status: "active",
      invitedBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (err) {
    db.exec("ROLLBACK;");
    throw err;
  }
}

export function updateMemberRole(
  tenantId: string,
  membershipId: string,
  role: AdminRole,
  updatedBy: string
): void {
  const db = getDatabase();
  const existing = db.prepare("SELECT * FROM tenant_memberships WHERE tenant_id = ? AND id = ?").get(tenantId, membershipId) as any;
  if (!existing) {
    throw new Error("Membresía no encontrada.");
  }

  // Prevent self-demoting the only SUPER_ADMIN if needed
  db.exec("BEGIN TRANSACTION;");
  try {
    db.prepare(`
      UPDATE tenant_memberships SET role = ?, updated_at = datetime('now')
      WHERE tenant_id = ? AND id = ?
    `).run(role, tenantId, membershipId);

    db.prepare(`
      INSERT INTO audit_logs (
        tenant_id, user_email, action, entity_type, entity_id, old_values, new_values
      ) VALUES (?, ?, 'UPDATE_MEMBER_ROLE', 'membership', ?, ?, ?)
    `).run(
      tenantId,
      updatedBy,
      membershipId,
      JSON.stringify({ role: existing.role }),
      JSON.stringify({ role })
    );

    db.exec("COMMIT;");
  } catch (err) {
    db.exec("ROLLBACK;");
    throw err;
  }
}

export function removeMember(
  tenantId: string,
  membershipId: string,
  removedBy: string
): void {
  const db = getDatabase();
  const existing = db.prepare("SELECT * FROM tenant_memberships WHERE tenant_id = ? AND id = ?").get(tenantId, membershipId) as any;
  if (!existing) {
    throw new Error("Membresía no encontrada.");
  }

  db.exec("BEGIN TRANSACTION;");
  try {
    db.prepare("DELETE FROM tenant_memberships WHERE tenant_id = ? AND id = ?").run(tenantId, membershipId);

    db.prepare(`
      INSERT INTO audit_logs (
        tenant_id, user_email, action, entity_type, entity_id, old_values
      ) VALUES (?, ?, 'REMOVE_MEMBER', 'membership', ?, ?)
    `).run(tenantId, removedBy, membershipId, JSON.stringify({ userId: existing.user_id, role: existing.role }));

    db.exec("COMMIT;");
  } catch (err) {
    db.exec("ROLLBACK;");
    throw err;
  }
}
