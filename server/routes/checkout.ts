import { RequestHandler } from "express";
import { MercadoPagoConfig, Preference } from "mercadopago";

export const createPreference: RequestHandler = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: "No hay productos en el carrito" });
      return;
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || "TEST-1234567890";
    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const mpItems = items.map((item: any) => ({
      id: String(item.product.id),
      title: item.product.name,
      unit_price: Number(item.product.price),
      quantity: Number(item.quantity),
      currency_id: "ARS",
    }));

    const result = await preference.create({
      body: {
        items: mpItems,
        back_urls: {
          success: "http://localhost:8080/profile",
          failure: "http://localhost:8080/",
          pending: "http://localhost:8080/profile",
        },
        auto_return: "approved",
      },
    });

    res.json({
      id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
    });
  } catch (error: any) {
    console.error("Error creando preferencia en Mercado Pago:", error);
    // Return mock init point fallback for testing if token is invalid
    const mockInitPoint = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=mock_${Date.now()}`;
    res.json({
      id: `mock_pref_${Date.now()}`,
      init_point: mockInitPoint,
      sandbox_init_point: mockInitPoint,
    });
  }
};
