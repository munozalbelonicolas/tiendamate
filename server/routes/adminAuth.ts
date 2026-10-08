import { RequestHandler } from "express";
import { AuthenticatedRequest, createSignedSessionToken, verifyGoogleIdToken } from "../middleware/auth";
import { getMembership, inviteOrAddMember } from "../db/repositories/usersRepository";
import { getDatabaseConfig } from "../db/config";
import { getDatabase } from "../db/connection";
import { AdminRole, AuthResponse } from "@shared/api";

export const handleGoogleSession: RequestHandler = async (req, res) => {
  const { idToken, googleIdToken, email: providedEmail, name: providedName } = req.body;

  if (!idToken && !googleIdToken && !providedEmail) {
    res.status(400).json({ error: "missing_token", message: "Token de Google no proporcionado." });
    return;
  }

  let googleUser = null;
  if (googleIdToken) {
    googleUser = await verifyGoogleIdToken(googleIdToken);
  }
  if (!googleUser && idToken) {
    googleUser = await verifyGoogleIdToken(idToken);
  }

  const config = getDatabaseConfig();
  const tenantId = config.tenantId;

  // Fallback for development/demo environment if token was parsed or matching admin email
  if (!googleUser && providedEmail && (config.appEnv === "demo" || process.env.APP_ENV === "demo")) {
    const clean = providedEmail.trim().toLowerCase();
    if (clean === "munozalbelonicolas@gmail.com" || clean === "admin@tiendamate.com") {
      googleUser = {
        email: clean,
        name: providedName || "Nicolás Muñoz",
        sub: "dev_google_user",
      };
    }
  }

  if (!googleUser) {
    res.status(401).json({
      error: "invalid_google_token",
      message: "No se pudo verificar la identidad con Google OAuth.",
    });
    return;
  }

  let membership = getMembership(tenantId, googleUser.email);

  // Initial bootstrap: If email matches configured admin or no members exist yet
  if (!membership) {
    const adminEmails = [
      ...(config.initialAdminEmail ? config.initialAdminEmail.split(",").map((e) => e.trim().toLowerCase()) : []),
      "munozalbelonicolas@gmail.com",
      "admin@tiendamate.com",
    ];

    const isConfiguredAdmin = adminEmails.includes(googleUser.email.toLowerCase());

    const db = getDatabase();
    const membersCount = (
      db.prepare("SELECT COUNT(*) as c FROM tenant_memberships WHERE tenant_id = ?").get(tenantId) as any
    )?.c;

    if (isConfiguredAdmin || membersCount === 0) {
      inviteOrAddMember(
        tenantId,
        googleUser.email,
        googleUser.name,
        "SUPER_ADMIN",
        "system_bootstrap"
      );
      membership = getMembership(tenantId, googleUser.email);
    }
  }

  if (!membership || membership.status !== "active") {
    res.status(403).json({
      authorized: false,
      email: googleUser.email,
      name: googleUser.name,
      message:
        "Tu cuenta de Google fue verificada correctamente, pero no posee permisos de administración en TiendaMate. Contacta al administrador para recibir una invitación.",
    });
    return;
  }

  const token = createSignedSessionToken({
    userId: membership.user.id,
    email: membership.user.email,
    name: membership.user.name,
    role: membership.role,
    tenantId,
  });

  const response: AuthResponse = {
    user: membership.user,
    token,
    role: membership.role,
    permissions: membership.permissions,
  };

  res.json({
    authorized: true,
    ...response,
  });
};

export const handleGetMe: RequestHandler = (req: AuthenticatedRequest, res) => {
  res.json({
    user: req.user,
    role: req.role,
    permissions: req.permissions,
    tenantId: req.tenantId,
  });
};

/**
 * Dev Demo Login: Only permitted when APP_ENV === 'demo'
 */
export const handleDevDemoLogin: RequestHandler = (req, res) => {
  const config = getDatabaseConfig();
  if (config.appEnv !== "demo") {
    res.status(403).json({
      error: "forbidden",
      message: "El acceso directo de prueba sólo está habilitado en entorno DEMO.",
    });
    return;
  }

  const targetEmail = (req.body?.email || "munozalbelonicolas@gmail.com").toLowerCase();
  let membership = getMembership(config.tenantId, targetEmail);
  if (!membership) {
    membership = getMembership(config.tenantId, "admin@tiendamate.com");
  }
  if (!membership) {
    res.status(404).json({ message: "Usuario demo no encontrado" });
    return;
  }

  const token = createSignedSessionToken({
    userId: membership.user.id,
    email: membership.user.email,
    name: membership.user.name,
    role: membership.role,
    tenantId: config.tenantId,
  });

  const response: AuthResponse = {
    user: membership.user,
    token,
    role: membership.role,
    permissions: membership.permissions,
  };

  res.json({
    authorized: true,
    ...response,
  });
};
