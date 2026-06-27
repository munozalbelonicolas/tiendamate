import "dotenv/config";
import express from "express";
import cors from "cors";
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from "./routes/products";
import { handleLogin, handleRegister } from "./routes/auth";
import { createPreference } from "./routes/checkout";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  // Auth Routes
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/register", handleRegister);

  // Products Routes
  app.get("/api/products", getProducts);
  app.get("/api/products/:id", getProductById);
  app.post("/api/products", createProduct);
  app.put("/api/products/:id", updateProduct);
  app.delete("/api/products/:id", deleteProduct);

  // Mercado Pago Checkout Route
  app.post("/api/checkout/create-preference", createPreference);

  return app;
}
