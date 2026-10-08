import { RequestHandler } from "express";
import { User, AuthResponse } from "@shared/api";
import { getDatabaseConfig } from "../db/config";
import { getOrCreateCustomerByEmail } from "../db/repositories/customerPortalRepository";
import { createCustomerSessionToken } from "../middleware/auth";

export const handleLogin: RequestHandler = (req, res) => {
  const { email } = req.body;

  if (!email || !email.trim()) {
    res.status(400).json({ message: "El correo electrónico es obligatorio" });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();
  const tenantId = getDatabaseConfig().tenantId;

  // Get or initialize customer in SQLite
  const customer = getOrCreateCustomerByEmail(tenantId, cleanEmail);

  const fullName = `${customer.first_name || ""} ${customer.last_name || ""}`.trim() || cleanEmail.split("@")[0];
  const isAdmin = cleanEmail.includes("admin") || cleanEmail === "munozalbelonicolas@gmail.com";

  const user: User = {
    id: `cust_${customer.id}`,
    name: fullName,
    email: customer.email,
    role: isAdmin ? "admin" : "client",
  };

  const token = createCustomerSessionToken({
    customerId: customer.id,
    email: customer.email,
    name: fullName,
    tenantId,
  });

  const response: AuthResponse = {
    user,
    token,
  };

  res.json(response);
};

export const handleRegister: RequestHandler = (req, res) => {
  const { name, email, role } = req.body;

  if (!email || !email.trim()) {
    res.status(400).json({ message: "El correo electrónico es obligatorio" });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();
  const tenantId = getDatabaseConfig().tenantId;

  // Create customer in SQLite database
  const customer = getOrCreateCustomerByEmail(tenantId, cleanEmail, name);

  const fullName = `${customer.first_name || ""} ${customer.last_name || ""}`.trim() || name || cleanEmail.split("@")[0];

  const user: User = {
    id: `cust_${customer.id}`,
    name: fullName,
    email: customer.email,
    role: role === "admin" ? "admin" : "client",
  };

  const token = createCustomerSessionToken({
    customerId: customer.id,
    email: customer.email,
    name: fullName,
    tenantId,
  });

  const response: AuthResponse = {
    user,
    token,
  };

  res.status(201).json(response);
};
