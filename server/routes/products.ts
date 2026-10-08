import { RequestHandler } from "express";
import {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../db/repositories/productsRepository";
import { getDatabaseConfig } from "../db/config";

export const getProducts: RequestHandler = (req, res) => {
  const tenantId = getDatabaseConfig().tenantId;
  const { category, search, page, limit } = req.query;

  const result = listProducts(tenantId, {
    category: category ? String(category) : undefined,
    search: search ? String(search) : undefined,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 50,
    includeUnpublished: false, // Public store only sees published products
  });

  res.json(result.items);
};

export const getProductByIdHandler: RequestHandler = (req, res) => {
  const tenantId = getDatabaseConfig().tenantId;
  const id = parseInt(String(req.params.id), 10);

  if (isNaN(id)) {
    res.status(400).json({ message: "ID de producto inválido." });
    return;
  }

  const product = getProductById(tenantId, id);
  if (!product || !product.isPublished) {
    res.status(404).json({ message: "Producto no encontrado." });
    return;
  }

  res.json(product);
};

export const createProductHandler: RequestHandler = (req, res) => {
  const tenantId = getDatabaseConfig().tenantId;
  try {
    const newProduct = createProduct(tenantId, req.body, "store_admin@tiendamate.com");
    res.status(201).json(newProduct);
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Error al crear producto." });
  }
};

export const updateProductHandler: RequestHandler = (req, res) => {
  const tenantId = getDatabaseConfig().tenantId;
  const id = parseInt(String(req.params.id), 10);

  try {
    const updated = updateProduct(tenantId, id, req.body, "store_admin@tiendamate.com");
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Error al actualizar producto." });
  }
};

export const deleteProductHandler: RequestHandler = (req, res) => {
  const tenantId = getDatabaseConfig().tenantId;
  const id = parseInt(String(req.params.id), 10);

  try {
    deleteProduct(tenantId, id, "store_admin@tiendamate.com");
    res.json({ message: "Producto eliminado correctamente." });
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Error al eliminar producto." });
  }
};
