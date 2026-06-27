import { RequestHandler } from "express";
import { Product } from "@shared/api";

let products: Product[] = [
  {
    id: 1,
    name: "Mate Imperial de Calabaza",
    price: 18500,
    category: "Mates",
    description:
      "Mate artesanal de calabaza seleccionada con virola de alpaca cincelada a mano. Cada pieza es única, curada con aceite natural de lino para preservar su durabilidad. La virola exterior está grabada con motivos florales típicos de la artesanía argentina del Litoral. Ideal tanto para uso diario como para regalo. Incluye curado inicial y su funda de cuero.",
    stock: 15,
    imageUrl:
      "https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?w=800&auto=format&fit=crop&q=80",
    specs: {
      Material: "Calabaza natural curada + virola de alpaca",
      Capacidad: "250 ml",
      Altura: "12 cm",
      Diámetro: "8 cm",
      Acabado: "Aceite de lino natural",
      Origen: "Entre Ríos, Argentina",
      Incluye: "Funda de cuero y bombilla",
    },
  },
  {
    id: 2,
    name: "Termo de Acero Inoxidable 1L",
    price: 32000,
    category: "Termos",
    description:
      "Termo de doble pared de acero inoxidable 304 food-grade con pico cebador de alta precisión. Su sistema de vacío mantiene bebidas calientes hasta 24 horas y frías hasta 48 horas. La tapa es hermética con sistema de rosca de seguridad anti-derrame. Perfecto para el campo, la oficina o viajes largos. Apto para lavar en lavavajillas.",
    stock: 20,
    imageUrl:
      "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80",
    specs: {
      Material: "Acero inoxidable 304 food-grade",
      Capacidad: "1000 ml (1 litro)",
      Altura: "30 cm",
      Temperatura: "Caliente 24hs / Frío 48hs",
      Tapa: "Hermética anti-derrame rosca seguridad",
      Pico: "Cebador de precisión ajustable",
      Limpieza: "Apto lavavajillas",
      Garantía: "12 meses",
    },
  },
  {
    id: 3,
    name: "Bombilla de Alpaca Labrada",
    price: 8500,
    category: "Bombillas",
    description:
      "Bombilla de alpaca pura con filtro desmontable estilo cuchara para fácil limpieza. El tubo es recto con curvatura ergonómica en el mango, grabado a mano con motivos geométricos. El filtro tipo cuchara retiene la yerba con máxima eficiencia sin obstruir el paso del líquido. Compatible con todos los tipos de mate. Incluye cepillo limpiador.",
    stock: 30,
    imageUrl:
      "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80",
    specs: {
      Material: "Alpaca pura (90% cobre, 10% níquel)",
      Largo: "18 cm",
      Tipo: "Cuchara con filtro desmontable",
      Grabado: "Motivos geométricos tallados a mano",
      Compatibilidad: "Todos los tipos de mate",
      Incluye: "Cepillo limpiador de acero",
      Origen: "Córdoba, Argentina",
    },
  },
  {
    id: 4,
    name: "Yerba Mate Premium Orgánica 1kg",
    price: 4500,
    category: "Yerbas",
    description:
      "Yerba mate con estacionamiento natural de 24 meses en silos de madera, blend suave con bajo contenido de polvo. Cultivada en plantaciones orgánicas certificadas de Misiones sin agroquímicos. Su sabor es suave, con notas herbáceas y leve toque ahumado. Rinde entre 30 y 40 cebadas por mate. Ideal para cebadores exigentes y paladares delicados.",
    stock: 50,
    imageUrl:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop&q=80",
    specs: {
      Peso: "1 kg",
      Estacionamiento: "24 meses en silo de madera",
      Cultivo: "Orgánico certificado SENASA",
      Origen: "Misiones, Argentina",
      Blend: "Palo + hoja, bajo polvo",
      Rendimiento: "30-40 cebadas por mate",
      "Sin TACC": "Apto celíacos",
    },
  },
];

export const getProducts: RequestHandler = (_req, res) => {
  res.json(products);
};

export const getProductById: RequestHandler = (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  const product = products.find((p) => p.id === id);
  if (!product) {
    res.status(404).json({ message: "Producto no encontrado" });
    return;
  }
  res.json(product);
};

export const createProduct: RequestHandler = (req, res) => {
  const { name, price, category, description, stock, imageUrl } = req.body;
  
  if (!name || price === undefined) {
    res.status(400).json({ message: "Nombre y precio son obligatorios" });
    return;
  }

  const newProduct: Product = {
    id: products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1,
    name,
    price: Number(price),
    category: category || "General",
    description: description || "",
    stock: stock !== undefined ? Number(stock) : 10,
    imageUrl
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
};

export const updateProduct: RequestHandler = (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  const index = products.findIndex((p) => p.id === id);

  if (index === -1) {
    res.status(404).json({ message: "Producto no encontrado" });
    return;
  }

  const existing = products[index];
  const updatedProduct: Product = {
    ...existing,
    ...req.body,
    id, // Keep original ID
    price: req.body.price !== undefined ? Number(req.body.price) : existing.price,
    stock: req.body.stock !== undefined ? Number(req.body.stock) : existing.stock,
  };

  products[index] = updatedProduct;
  res.json(updatedProduct);
};

export const deleteProduct: RequestHandler = (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  const initialLength = products.length;
  products = products.filter((p) => p.id !== id);

  if (products.length === initialLength) {
    res.status(404).json({ message: "Producto no encontrado" });
    return;
  }

  res.json({ message: "Producto eliminado correctamente" });
};
