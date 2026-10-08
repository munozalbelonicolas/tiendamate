import { RequestHandler } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import {
  listTenantMembers,
  inviteOrAddMember,
  updateMemberRole,
  removeMember,
} from "../db/repositories/usersRepository";
import { getDatabaseConfig } from "../db/config";
import { AdminRole } from "@shared/api";

export const handleAdminListUsers: RequestHandler = (req: AuthenticatedRequest, res) => {
  const tenantId = req.tenantId || getDatabaseConfig().tenantId;
  const members = listTenantMembers(tenantId);
  res.json(members);
};

export const handleAdminInviteUser: RequestHandler = (req: AuthenticatedRequest, res) => {
  const tenantId = req.tenantId || getDatabaseConfig().tenantId;
  const invitedBy = req.user?.email || "admin@tiendamate.com";
  const { email, name, role } = req.body;

  if (!email || !role) {
    res.status(400).json({ message: "Email y rol son obligatorios." });
    return;
  }

  try {
    const member = inviteOrAddMember(
      tenantId,
      email,
      name || email.split("@")[0],
      role as AdminRole,
      invitedBy
    );
    res.status(201).json(member);
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Error al invitar usuario." });
  }
};

export const handleAdminUpdateUserRole: RequestHandler = (req: AuthenticatedRequest, res) => {
  const tenantId = req.tenantId || getDatabaseConfig().tenantId;
  const membershipId = String(req.params.id);
  const updatedBy = req.user?.email || "admin@tiendamate.com";
  const { role } = req.body;

  if (!role) {
    res.status(400).json({ message: "El nuevo rol es obligatorio." });
    return;
  }

  try {
    updateMemberRole(tenantId, membershipId, role as AdminRole, updatedBy);
    res.json({ success: true, message: "Rol de usuario actualizado correctamente." });
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Error al actualizar rol." });
  }
};

export const handleAdminRemoveUser: RequestHandler = (req: AuthenticatedRequest, res) => {
  const tenantId = req.tenantId || getDatabaseConfig().tenantId;
  const membershipId = String(req.params.id);
  const removedBy = req.user?.email || "admin@tiendamate.com";

  try {
    removeMember(tenantId, membershipId, removedBy);
    res.json({ success: true, message: "Membresía eliminada correctamente." });
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Error al eliminar membresía." });
  }
};
