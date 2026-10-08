import { RequestHandler } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { listCustomers, getCustomerById } from "../db/repositories/customersRepository";
import { getDatabaseConfig } from "../db/config";

export const handleAdminListCustomers: RequestHandler = (req: AuthenticatedRequest, res) => {
  const tenantId = req.tenantId || getDatabaseConfig().tenantId;
  const { page, limit, search } = req.query;

  const result = listCustomers(tenantId, {
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
    search: search ? String(search) : undefined,
  });

  res.json(result);
};

export const handleAdminGetCustomer: RequestHandler = (req: AuthenticatedRequest, res) => {
  const tenantId = req.tenantId || getDatabaseConfig().tenantId;
  const id = Number(req.params.id);

  const customer = getCustomerById(tenantId, id);
  if (!customer) {
    res.status(404).json({ message: "Cliente no encontrado." });
    return;
  }

  res.json(customer);
};
