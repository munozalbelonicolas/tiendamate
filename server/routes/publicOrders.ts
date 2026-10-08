import { RequestHandler } from "express";
import { createOrder } from "../db/repositories/ordersRepository";
import { getDatabaseConfig } from "../db/config";

export const handleCreateStorefrontOrder: RequestHandler = (req, res) => {
  const tenantId = getDatabaseConfig().tenantId;
  const { customerName, customerEmail, customerPhone, shippingAddress, items, paymentMethod, discount, notes } = req.body;

  try {
    const order = createOrder(tenantId, {
      customerName: customerName || "Cliente Web",
      customerEmail: customerEmail || "cliente@tiendamate.com",
      customerPhone,
      shippingAddress,
      items: items.map((i: any) => ({
        productId: Number(i.productId || i.product?.id),
        quantity: Number(i.quantity || 1),
      })),
      paymentMethod: paymentMethod || "mercadopago",
      discount: discount ? Number(discount) : 0,
      notes,
    });

    res.status(201).json(order);
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Error al registrar pedido." });
  }
};
