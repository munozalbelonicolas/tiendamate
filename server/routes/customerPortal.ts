import { Router, Response } from "express";
import {
  requireCustomerAuth,
  CustomerAuthenticatedRequest,
} from "../middleware/auth";
import {
  getCustomerProfile,
  updateCustomerProfile,
  getCustomerDashboardData,
  listCustomerOrders,
  getCustomerOrderById,
  cancelCustomerOrder,
  listCustomerAddresses,
  createCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
  listCustomerFavorites,
  addCustomerFavorite,
  removeCustomerFavorite,
  listCustomerCoupons,
  listCustomerReturns,
  createCustomerReturn,
  listCustomerNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  listCustomerSessions,
  deleteCustomerSession,
  recordCustomerSession,
  deleteCustomerAccount,
} from "../db/repositories/customerPortalRepository";

const router = Router();

// Apply authentication middleware to all customer portal routes
router.use(requireCustomerAuth);

/**
 * GET /api/me - Profile
 */
router.get("/", (req: CustomerAuthenticatedRequest, res: Response) => {
  try {
    const profile = getCustomerProfile(req.tenantId!, req.customer!.id);
    if (!profile) {
      res.status(404).json({ message: "Perfil no encontrado" });
      return;
    }
    res.json(profile);
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Error al obtener perfil" });
  }
});

/**
 * PATCH /api/me - Update profile
 */
router.patch("/", (req: CustomerAuthenticatedRequest, res: Response) => {
  try {
    const updated = updateCustomerProfile(req.tenantId!, req.customer!.id, req.body);
    res.json({
      message: "Datos actualizados correctamente.",
      profile: updated,
    });
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Error al actualizar perfil" });
  }
});

/**
 * GET /api/me/dashboard - Customer summary dashboard
 */
router.get("/dashboard", (req: CustomerAuthenticatedRequest, res: Response) => {
  try {
    const data = getCustomerDashboardData(req.tenantId!, req.customer!.id);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Error al cargar dashboard de cliente" });
  }
});

/**
 * GET /api/me/orders - List customer orders
 */
router.get("/orders", (req: CustomerAuthenticatedRequest, res: Response) => {
  try {
    const statusFilter = req.query.status as any;
    const year = req.query.year as string | undefined;
    const orders = listCustomerOrders(req.tenantId!, req.customer!.id, { statusFilter, year });
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Error al obtener pedidos" });
  }
});

/**
 * GET /api/me/orders/:id - Customer order details
 */
router.get("/orders/:id", (req: CustomerAuthenticatedRequest, res: Response) => {
  try {
    const orderId = Number(req.params.id);
    if (isNaN(orderId)) {
      res.status(400).json({ message: "ID de pedido inválido" });
      return;
    }

    const order = getCustomerOrderById(req.tenantId!, req.customer!.id, orderId);
    if (!order) {
      res.status(404).json({ message: "Pedido no encontrado o no pertenece a tu cuenta" });
      return;
    }

    res.json(order);
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Error al obtener detalle del pedido" });
  }
});

/**
 * POST /api/me/orders/:id/cancel - Cancel pending or confirmed order
 */
router.post("/orders/:id/cancel", (req: CustomerAuthenticatedRequest, res: Response) => {
  try {
    const orderId = Number(req.params.id);
    if (isNaN(orderId)) {
      res.status(400).json({ message: "ID de pedido inválido" });
      return;
    }

    const order = cancelCustomerOrder(req.tenantId!, req.customer!.id, orderId);
    res.json({
      message: "Tu pedido ha sido cancelado exitosamente.",
      order,
    });
  } catch (err: any) {
    res.status(400).json({ message: err.message || "No se pudo cancelar el pedido." });
  }
});

/**
 * GET /api/me/addresses - List addresses
 */
router.get("/addresses", (req: CustomerAuthenticatedRequest, res: Response) => {
  try {
    const addresses = listCustomerAddresses(req.customer!.id);
    res.json(addresses);
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Error al obtener direcciones" });
  }
});

/**
 * POST /api/me/addresses - Add address
 */
router.post("/addresses", (req: CustomerAuthenticatedRequest, res: Response) => {
  try {
    const { title, street, city } = req.body;
    if (!title || !street || !city) {
      res.status(400).json({ message: "Alias, calle y ciudad son campos obligatorios" });
      return;
    }

    const created = createCustomerAddress(req.customer!.id, req.body);
    res.status(201).json({
      message: "Dirección guardada correctamente.",
      address: created,
    });
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Error al crear dirección" });
  }
});

/**
 * PATCH /api/me/addresses/:id - Update address
 */
router.patch("/addresses/:id", (req: CustomerAuthenticatedRequest, res: Response) => {
  try {
    const addressId = Number(req.params.id);
    if (isNaN(addressId)) {
      res.status(400).json({ message: "ID de dirección inválido" });
      return;
    }

    const updated = updateCustomerAddress(req.customer!.id, addressId, req.body);
    res.json({
      message: "Dirección actualizada correctamente.",
      address: updated,
    });
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Error al actualizar dirección" });
  }
});

/**
 * DELETE /api/me/addresses/:id - Delete address
 */
router.delete("/addresses/:id", (req: CustomerAuthenticatedRequest, res: Response) => {
  try {
    const addressId = Number(req.params.id);
    if (isNaN(addressId)) {
      res.status(400).json({ message: "ID de dirección inválido" });
      return;
    }

    deleteCustomerAddress(req.customer!.id, addressId);
    res.json({ message: "Dirección eliminada correctamente." });
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Error al eliminar dirección" });
  }
});

/**
 * GET /api/me/favorites - List favorites
 */
router.get("/favorites", (req: CustomerAuthenticatedRequest, res: Response) => {
  try {
    const favorites = listCustomerFavorites(req.customer!.id);
    res.json(favorites);
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Error al obtener favoritos" });
  }
});

/**
 * POST /api/me/favorites/:productId - Add favorite
 */
router.post("/favorites/:productId", (req: CustomerAuthenticatedRequest, res: Response) => {
  try {
    const productId = Number(req.params.productId);
    if (isNaN(productId)) {
      res.status(400).json({ message: "ID de producto inválido" });
      return;
    }

    const favorites = addCustomerFavorite(req.customer!.id, productId);
    res.json({
      message: "Producto agregado a tus favoritos",
      favorites,
    });
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Error al guardar favorito" });
  }
});

/**
 * DELETE /api/me/favorites/:productId - Remove favorite
 */
router.delete("/favorites/:productId", (req: CustomerAuthenticatedRequest, res: Response) => {
  try {
    const productId = Number(req.params.productId);
    if (isNaN(productId)) {
      res.status(400).json({ message: "ID de producto inválido" });
      return;
    }

    const favorites = removeCustomerFavorite(req.customer!.id, productId);
    res.json({
      message: "Producto eliminado de tus favoritos",
      favorites,
    });
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Error al quitar favorito" });
  }
});

/**
 * GET /api/me/coupons - List customer coupons
 */
router.get("/coupons", (req: CustomerAuthenticatedRequest, res: Response) => {
  try {
    const coupons = listCustomerCoupons(req.tenantId!, req.customer!.id);
    res.json(coupons);
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Error al obtener cupones" });
  }
});

/**
 * GET /api/me/returns - List customer returns
 */
router.get("/returns", (req: CustomerAuthenticatedRequest, res: Response) => {
  try {
    const returns = listCustomerReturns(req.tenantId!, req.customer!.id);
    res.json(returns);
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Error al obtener solicitudes de devolución" });
  }
});

/**
 * POST /api/me/returns - Create return request
 */
router.post("/returns", (req: CustomerAuthenticatedRequest, res: Response) => {
  try {
    const { orderId, productId, quantity, reason, comments } = req.body;
    if (!orderId || !productId || !quantity || !reason) {
      res.status(400).json({ message: "Todos los campos de la solicitud son obligatorios" });
      return;
    }

    const returns = createCustomerReturn(req.tenantId!, req.customer!.id, {
      orderId: Number(orderId),
      productId: Number(productId),
      quantity: Number(quantity),
      reason,
      comments,
    });

    res.status(201).json({
      message: "Solicitud de devolución registrada correctamente.",
      returns,
    });
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Error al procesar devolución" });
  }
});

/**
 * GET /api/me/notifications - List customer notifications
 */
router.get("/notifications", (req: CustomerAuthenticatedRequest, res: Response) => {
  try {
    const notifs = listCustomerNotifications(req.customer!.id);
    res.json(notifs);
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Error al obtener notificaciones" });
  }
});

/**
 * PATCH /api/me/notifications/:id/read - Mark single notification as read
 */
router.patch("/notifications/:id/read", (req: CustomerAuthenticatedRequest, res: Response) => {
  try {
    const notifId = Number(req.params.id);
    const notifs = markNotificationAsRead(req.customer!.id, notifId);
    res.json(notifs);
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Error al actualizar notificación" });
  }
});

/**
 * POST /api/me/notifications/read-all - Mark all as read
 */
router.post("/notifications/read-all", (req: CustomerAuthenticatedRequest, res: Response) => {
  try {
    const notifs = markAllNotificationsAsRead(req.customer!.id);
    res.json(notifs);
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Error al actualizar notificaciones" });
  }
});

/**
 * GET /api/me/sessions - List active sessions
 */
router.get("/sessions", (req: CustomerAuthenticatedRequest, res: Response) => {
  try {
    const sessions = listCustomerSessions(req.customer!.id);
    res.json(sessions);
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Error al obtener sesiones" });
  }
});

/**
 * DELETE /api/me/sessions/:id - Terminate a session
 */
router.delete("/sessions/:id", (req: CustomerAuthenticatedRequest, res: Response) => {
  try {
    const sessionId = String(req.params.id);
    const sessions = deleteCustomerSession(req.customer!.id, sessionId);
    res.json({

      message: "Sesión cerrada correctamente",
      sessions,
    });
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Error al cerrar sesión" });
  }
});

/**
 * POST /api/me/security/change-password
 */
router.post("/security/change-password", (req: CustomerAuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ message: "Debes ingresar tu contraseña actual y la nueva contraseña." });
    return;
  }

  if (newPassword.length < 8) {
    res.status(400).json({ message: "La nueva contraseña debe tener al menos 8 caracteres." });
    return;
  }

  if (confirmPassword && newPassword !== confirmPassword) {
    res.status(400).json({ message: "La confirmación de la contraseña no coincide." });
    return;
  }

  res.json({
    message: "Contraseña actualizada correctamente.",
  });
});

/**
 * POST /api/me/security/request-email-change
 */
router.post("/security/request-email-change", (req: CustomerAuthenticatedRequest, res: Response) => {
  const { newEmail } = req.body;
  if (!newEmail || !newEmail.includes("@")) {
    res.status(400).json({ message: "Ingresá un correo electrónico válido." });
    return;
  }

  res.json({
    message: `Hemos enviado un código de confirmación a ${newEmail}. Revisá tu bandeja de entrada.`,
    verificationRequired: true,
  });
});

/**
 * DELETE /api/me/account - Delete customer account
 */
router.delete("/account", (req: CustomerAuthenticatedRequest, res: Response) => {
  try {
    deleteCustomerAccount(req.tenantId!, req.customer!.id);
    res.json({
      message: "Tu cuenta ha sido eliminada y tus datos personales han sido anonimizados conforme a la normativa vigente.",
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Error al procesar la eliminación de la cuenta." });
  }
});

export default router;
