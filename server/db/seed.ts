import type { DatabaseSync } from "node:sqlite";

export const PERMISSIONS_MAP: Record<string, string[]> = {
  SUPER_ADMIN: [
    "products.read", "products.create", "products.update", "products.delete",
    "orders.read", "orders.update",
    "inventory.manage",
    "customers.read",
    "reports.read",
    "settings.manage",
    "users.manage",
  ],
  ADMIN: [
    "products.read", "products.create", "products.update", "products.delete",
    "orders.read", "orders.update",
    "inventory.manage",
    "customers.read",
    "reports.read",
    "settings.manage",
    "users.manage",
  ],
  MANAGER: [
    "products.read", "products.create", "products.update",
    "orders.read", "orders.update",
    "inventory.manage",
    "customers.read",
    "reports.read",
  ],
  OPERADOR: [
    "products.read",
    "orders.read", "orders.update",
    "inventory.manage",
  ],
  VIEWER: [
    "products.read",
    "orders.read",
    "customers.read",
    "reports.read",
  ],
};

export function seedSystemRolesAndTenant(
  db: DatabaseSync,
  tenantId: string,
  initialAdminEmail: string
): void {
  // 1. Default Tenant
  const checkTenant = db.prepare("SELECT id FROM tenants WHERE id = ?").get(tenantId);
  if (!checkTenant) {
    db.prepare(`
      INSERT INTO tenants (id, name, slug, is_active)
      VALUES (?, ?, ?, 1)
    `).run(tenantId, "TiendaMate Oficial", tenantId);
  }

  // 2. Roles
  const insertRole = db.prepare(`
    INSERT OR REPLACE INTO roles (id, name, description, permissions)
    VALUES (?, ?, ?, ?)
  `);

  insertRole.run(
    "SUPER_ADMIN",
    "Super Administrador",
    "Acceso total a la plataforma y todos los comercios",
    JSON.stringify(PERMISSIONS_MAP.SUPER_ADMIN)
  );
  insertRole.run(
    "ADMIN",
    "Administrador de Comercio",
    "Gestión integral del catálogo, pedidos, clientes y configuración",
    JSON.stringify(PERMISSIONS_MAP.ADMIN)
  );
  insertRole.run(
    "MANAGER",
    "Gerente Operativo",
    "Gestión comercial y operativa sin permisos de usuarios ni configuraciones críticas",
    JSON.stringify(PERMISSIONS_MAP.MANAGER)
  );
  insertRole.run(
    "OPERADOR",
    "Operador Logístico",
    "Gestión de preparación de pedidos e inventario",
    JSON.stringify(PERMISSIONS_MAP.OPERADOR)
  );
  insertRole.run(
    "VIEWER",
    "Observador / Auditor",
    "Acceso de solo lectura a métricas, pedidos y catálogo",
    JSON.stringify(PERMISSIONS_MAP.VIEWER)
  );

  // 3. Initial Admin Users & Memberships
  const adminEmails = [
    ...(initialAdminEmail ? initialAdminEmail.split(",").map((e) => e.trim().toLowerCase()) : []),
    "munozalbelonicolas@gmail.com",
    "admin@tiendamate.com",
  ].filter((v, i, a) => v && a.indexOf(v) === i);

  for (const email of adminEmails) {
    const existingUser = db.prepare("SELECT id FROM users WHERE LOWER(email) = LOWER(?)").get(email) as { id: string } | undefined;
    let userId = existingUser?.id;

    if (!userId) {
      userId = `usr_admin_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const displayName = email.includes("munoz") ? "Nicolás Muñoz" : "Administrador TiendaMate";
      db.prepare(`
        INSERT INTO users (id, email, name, avatar_url, is_active)
        VALUES (?, ?, ?, ?, 1)
      `).run(
        userId,
        email,
        displayName,
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120"
      );
    }

    const checkMembership = db.prepare(
      "SELECT id FROM tenant_memberships WHERE tenant_id = ? AND user_id = ?"
    ).get(tenantId, userId);

    if (!checkMembership) {
      db.prepare(`
        INSERT INTO tenant_memberships (id, tenant_id, user_id, role, status)
        VALUES (?, ?, ?, 'SUPER_ADMIN', 'active')
      `).run(`tm_${Date.now()}_${Math.floor(Math.random() * 1000)}`, tenantId, userId);
    }
  }

  // 4. Default Store Settings if not exists
  const checkSettings = db.prepare("SELECT tenant_id FROM store_settings WHERE tenant_id = ?").get(tenantId);
  if (!checkSettings) {
    db.prepare(`
      INSERT INTO store_settings (
        tenant_id, store_name, logo_url, support_email, phone, address,
        currency, timezone, tax_rate, min_stock_threshold, free_shipping_threshold, announcement
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      tenantId,
      "TiendaMate Argentina",
      "/images/logo.png",
      "contacto@tiendamate.com.ar",
      "+54 11 4567-8900",
      "Av. Corrientes 1234, CABA, Argentina",
      "ARS",
      "America/Argentina/Buenos_Aires",
      21.0,
      5,
      45000.0,
      "¡Envíos gratis a todo el país en compras superiores a $45.000!"
    );
  }
}

export function seedDemoData(db: DatabaseSync, tenantId: string): void {
  // Check if categories or products exist already
  const prodCount = (db.prepare("SELECT COUNT(*) as c FROM products WHERE tenant_id = ?").get(tenantId) as { c: number })?.c;
  if (prodCount > 0) {
    return; // Already seeded
  }

  db.exec("BEGIN TRANSACTION;");

  try {
    // 1. Categories
    const insertCat = db.prepare(`
      INSERT INTO categories (tenant_id, name, slug, description, image_url, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);

    insertCat.run(tenantId, "Mates", "mates", "Mates de calabaza, madera, cerámica y alpaca", "/images/mate-imperial-calabaza.jpg", 1);
    insertCat.run(tenantId, "Termos", "termos", "Termos de acero inoxidable y alta retención térmica", "/images/termo-acero-inoxidable.jpg", 2);
    insertCat.run(tenantId, "Bombillas", "bombillas", "Bombillas de alpaca cincelada y acero quirúrgico", "/images/bombilla-alpaca-labrada.jpg", 3);
    insertCat.run(tenantId, "Yerbas", "yerbas", "Yerbas estacionadas, blends artesanales y orgánicas", "/images/yerba-organica-1kg.jpg", 4);
    insertCat.run(tenantId, "Accesorios", "accesorios", "Materas de cuero, porta yerbas, cepillos y fundas", "/images/matera-cuero-portatermo.jpg", 5);

    const categories = db.prepare("SELECT id, name, slug FROM categories WHERE tenant_id = ?").all(tenantId) as Array<{ id: number; name: string; slug: string }>;
    const catMap = new Map(categories.map((c) => [c.slug, c.id]));

    // 2. Products
    const insertProduct = db.prepare(`
      INSERT INTO products (
        tenant_id, sku, name, slug, description, category_id, category_name,
        price, promo_price, cost, stock, min_stock_alert, is_published, is_featured,
        image_url, specs, seo_title, seo_description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const productsSeed = [
      {
        sku: "MAT-IMP-01",
        name: "Mate Imperial de Calabaza",
        slug: "mate-imperial-calabaza",
        description: "Mate artesanal de calabaza seleccionada con virola de alpaca cincelada a mano. Cada pieza es única, curada con aceite natural de lino para preservar su durabilidad.",
        categorySlug: "mates",
        categoryName: "Mates",
        price: 24500,
        promoPrice: 22000,
        cost: 11000,
        stock: 18,
        minStockAlert: 5,
        isPublished: 1,
        isFeatured: 1,
        imageUrl: "/images/mate-imperial-calabaza.jpg",
        specs: JSON.stringify({
          Material: "Calabaza natural curada + virola de alpaca",
          Capacidad: "250 ml",
          Altura: "12 cm",
          Diámetro: "8 cm",
          Origen: "Entre Ríos, Argentina",
        }),
        seoTitle: "Mate Imperial de Calabaza Artesanal | TiendaMate",
        seoDescription: "Mate imperial clásico cincelado a mano en alpaca pura.",
      },
      {
        sku: "MAT-CAM-02",
        name: "Mate Camionero Cuero Vaqueta",
        slug: "mate-camionero-cuero",
        description: "Mate camionero forrado en cuero vacuno pespunteado a mano con base reforzada para máxima estabilidad.",
        categorySlug: "mates",
        categoryName: "Mates",
        price: 19800,
        promoPrice: null,
        cost: 9200,
        stock: 25,
        minStockAlert: 6,
        isPublished: 1,
        isFeatured: 1,
        imageUrl: "/images/mate-camionero-cuero.jpg",
        specs: JSON.stringify({
          Material: "Calabaza gruesa + Cuero vaqueta",
          Capacidad: "280 ml",
          Boca: "Ancha 9 cm",
          Color: "Marrón Suela",
        }),
        seoTitle: "Mate Camionero Cuero Vaqueta | TiendaMate",
        seoDescription: "Mate camionero resistente de boca ancha con base firme.",
      },
      {
        sku: "TER-ACE-01",
        name: "Termo de Acero Inoxidable 1L",
        slug: "termo-acero-inoxidable-1l",
        description: "Termo de doble pared de acero inoxidable 304 con pico cebador de alta precisión. Mantiene caliente 24 horas y frío 48 horas.",
        categorySlug: "termos",
        categoryName: "Termos",
        price: 38500,
        promoPrice: 35000,
        cost: 19000,
        stock: 14,
        minStockAlert: 5,
        isPublished: 1,
        isFeatured: 1,
        imageUrl: "/images/termo-acero-inoxidable.jpg",
        specs: JSON.stringify({
          Capacidad: "1000 ml",
          Material: "Acero Inox 304 food-grade",
          Retención: "24hs caliente / 48hs frío",
          Pico: "Cebador regulable 360°",
        }),
        seoTitle: "Termo Acero Inoxidable 1 Litro Pico Cebador",
        seoDescription: "Termo matero de 1L con pico cebador de precisión.",
      },
      {
        sku: "TER-BAL-02",
        name: "Termo Bala Media Manija 1.2L",
        slug: "termo-bala-media-manija",
        description: "Termo clásico de media manija con aislamiento al vacío y recubrimiento texturado anti-rayas.",
        categorySlug: "termos",
        categoryName: "Termos",
        price: 44000,
        promoPrice: null,
        cost: 22000,
        stock: 4, // Low stock on purpose for testing alerts
        minStockAlert: 5,
        isPublished: 1,
        isFeatured: 0,
        imageUrl: "/images/termo-bala-manija.jpg",
        specs: JSON.stringify({
          Capacidad: "1200 ml",
          Manija: "Plegable reforzada",
          Color: "Verde Militar Mate",
        }),
        seoTitle: "Termo Bala Media Manija 1.2 Litros",
        seoDescription: "Termo con manija plegable para camping y viajes.",
      },
      {
        sku: "BOM-ALP-01",
        name: "Bombilla de Alpaca Labrada",
        slug: "bombilla-alpaca-labrada",
        description: "Bombilla de alpaca pura con filtro desmontable estilo cuchara para fácil limpieza profunda.",
        categorySlug: "bombillas",
        categoryName: "Bombillas",
        price: 9500,
        promoPrice: 8500,
        cost: 4100,
        stock: 35,
        minStockAlert: 8,
        isPublished: 1,
        isFeatured: 1,
        imageUrl: "/images/bombilla-alpaca-labrada.jpg",
        specs: JSON.stringify({
          Material: "Alpaca maciza",
          Largo: "19 cm",
          Filtro: "Cuchara desmontable con rosca",
        }),
        seoTitle: "Bombilla de Alpaca Labrada Cuchara",
        seoDescription: "Bombilla tradicional de alpaca con filtro desmontable.",
      },
      {
        sku: "BOM-RES-02",
        name: "Bombilla Pico de Loro Resorte",
        slug: "bombilla-pico-de-loro-resorte",
        description: "Bombilla ergonómica pico de loro con resorte regulable de acero quirúrgico anti-obstrucción.",
        categorySlug: "bombillas",
        categoryName: "Bombillas",
        price: 7200,
        promoPrice: null,
        cost: 3000,
        stock: 3, // Low stock on purpose
        minStockAlert: 5,
        isPublished: 1,
        isFeatured: 0,
        imageUrl: "/images/bombilla-pico-loro.jpg",
        specs: JSON.stringify({
          Material: "Acero quirúrgico 316",
          Largo: "18 cm",
          Tipo: "Pico de loro con resorte",
        }),
        seoTitle: "Bombilla Pico de Loro Resorte Acero",
        seoDescription: "Bombilla anti-obstrucción para yerbas con mucho polvo.",
      },
      {
        sku: "YER-ORG-01",
        name: "Yerba Mate Premium Orgánica 1kg",
        slug: "yerba-mate-premium-organica-1kg",
        description: "Yerba mate con estacionamiento natural de 24 meses en silos de madera, blend suave con bajo contenido de polvo certificada SENASA.",
        categorySlug: "yerbas",
        categoryName: "Yerbas",
        price: 5200,
        promoPrice: 4800,
        cost: 2100,
        stock: 60,
        minStockAlert: 10,
        isPublished: 1,
        isFeatured: 1,
        imageUrl: "/images/yerba-organica-1kg.jpg",
        specs: JSON.stringify({
          Peso: "1 kg",
          Estacionamiento: "24 meses natural",
          Certificación: "Orgánica USDA / SENASA",
          Contenido: "Sin TACC",
        }),
        seoTitle: "Yerba Mate Orgánica Certificada 1kg",
        seoDescription: "Yerba mate misionera con estacionamiento prolongado y bajo polvo.",
      },
      {
        sku: "YER-BAR-02",
        name: "Yerba Mate Selección Especial Barbacuá 500g",
        slug: "yerba-mate-barbacua-500g",
        description: "Yerba mate secada con el tradicional método barbacuá con humo de maderas nobles nativas. Sabor intenso y ahumado.",
        categorySlug: "yerbas",
        categoryName: "Yerbas",
        price: 3600,
        promoPrice: null,
        cost: 1500,
        stock: 45,
        minStockAlert: 8,
        isPublished: 1,
        isFeatured: 0,
        imageUrl: "/images/yerba-barbacua-500g.jpg",
        specs: JSON.stringify({
          Peso: "500 gr",
          Secado: "Barbacuá a leña de monte",
          Sabor: "Ahumado equilibrado",
        }),
        seoTitle: "Yerba Mate Barbacuá Artesanal 500g",
        seoDescription: "Yerba tradicional secada en barbacuá artesanal.",
      },
      {
        sku: "ACC-MAT-01",
        name: "Matera Portatermo de Cuero",
        slug: "matera-portatermo-cuero",
        description: "Matera cilíndrica de cuero vacuno legítimo seleccionado, cosida a mano con costuras enceradas reforzadas y correa con hombrera.",
        categorySlug: "accesorios",
        categoryName: "Accesorios",
        price: 29000,
        promoPrice: 26500,
        cost: 13000,
        stock: 12,
        minStockAlert: 4,
        isPublished: 1,
        isFeatured: 1,
        imageUrl: "/images/matera-cuero-portatermo.jpg",
        specs: JSON.stringify({
          Material: "Cuero vacuno flor curtido vegetal",
          Capacidad: "Termo 1.2L + mate + yerbera",
          Herrajes: "Bronce macizo envejecido",
        }),
        seoTitle: "Matera Portatermo de Cuero Vacuno",
        seoDescription: "Bolso matero de cuero para termo, mate y accesorios.",
      },
      {
        sku: "ACC-DES-02",
        name: "Despolvillador de Yerba Mate Portátil",
        slug: "despolvillador-yerba-mate",
        description: "Vaso despolvillador con malla micrométrica de acero inoxidable para separar el exceso de polvo de la yerba en segundos.",
        categorySlug: "accesorios",
        categoryName: "Accesorios",
        price: 8900,
        promoPrice: null,
        cost: 3600,
        stock: 22,
        minStockAlert: 5,
        isPublished: 1,
        isFeatured: 0,
        imageUrl: "/images/despolvillador-yerba.jpg",
        specs: JSON.stringify({
          Material: "Polímero libre de BPA + Malla acero",
          Capacidad: "400 gr de yerba",
        }),
        seoTitle: "Despolvillador de Yerba Mate Portátil",
        seoDescription: "Accesorio ideal para evitar la acidez en el mate.",
      },
    ];

    for (const p of productsSeed) {
      const catId = catMap.get(p.categorySlug) || null;
      insertProduct.run(
        tenantId,
        p.sku,
        p.name,
        p.slug,
        p.description,
        catId,
        p.categoryName,
        p.price,
        p.promoPrice,
        p.cost,
        p.stock,
        p.minStockAlert,
        p.isPublished,
        p.isFeatured,
        p.imageUrl,
        p.specs,
        p.seoTitle,
        p.seoDescription
      );
    }

    const insertedProds = db.prepare("SELECT id, sku, name, stock FROM products WHERE tenant_id = ?").all(tenantId) as Array<{
      id: number;
      sku: string;
      name: string;
      stock: number;
    }>;
    const prodMap = new Map(insertedProds.map((p) => [p.sku, p]));

    // 3. Initial Inventory Movements
    const insertMovement = db.prepare(`
      INSERT INTO inventory_movements (
        tenant_id, product_id, type, quantity, previous_stock, new_stock, reason, user_name, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-30 days'))
    `);

    for (const prod of insertedProds) {
      insertMovement.run(
        tenantId,
        prod.id,
        "in",
        prod.stock,
        0,
        prod.stock,
        "Carga de inventario inicial - Apertura de catálogo DEMO",
        "Sistema Automático"
      );
    }

    // 4. Realistic Customers
    const insertCustomer = db.prepare(`
      INSERT INTO customers (
        tenant_id, first_name, last_name, email, phone, total_orders, total_spent, last_order_at, notes, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now', '-25 days'))
    `);

    const insertAddress = db.prepare(`
      INSERT INTO customer_addresses (
        customer_id, title, street, city, state, postal_code, country, is_default
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const customersSeed = [
      { firstName: "Nicolás", lastName: "Muñoz", email: "munozalbelonicolas@gmail.com", phone: "+54 9 11 3456-7890", city: "CABA", street: "Av. Santa Fe 3421, 4B" },
      { firstName: "Facundo", lastName: "González", email: "facundo.gonzalez@gmail.com", phone: "+54 9 11 5432-1100", city: "CABA", street: "Av. Santa Fe 3421, 4B" },
      { firstName: "Mariana", lastName: "Rossi", email: "mariana.rossi@outlook.com", phone: "+54 9 351 456-7890", city: "Córdoba Capital", street: "Chacabuco 820" },
      { firstName: "Luciano", lastName: "Pérez", email: "luciano.perez@yahoo.com.ar", phone: "+54 9 341 654-3210", city: "Rosario", street: "Bv. Oroño 1450" },
      { firstName: "Sofía", lastName: "Alonso", email: "sofia.alonso@gmail.com", phone: "+54 9 261 789-0123", city: "Mendoza", street: "San Martín 1020" },
      { firstName: "Agustín", lastName: "Fernández", email: "agustin.f@gmail.com", phone: "+54 9 223 321-4567", city: "Mar del Plata", street: "Guemes 2840" },
      { firstName: "Camila", lastName: "Sánchez", email: "camila.s@hotmail.com", phone: "+54 9 11 6789-4321", city: "San Isidro", street: "Belgrano 410" },
    ];


    for (const c of customersSeed) {
      insertCustomer.run(tenantId, c.firstName, c.lastName, c.email, c.phone, 0, 0, null, "Cliente registrado verificado");
      const lastCust = db.prepare("SELECT id FROM customers WHERE tenant_id = ? AND email = ?").get(tenantId, c.email) as { id: number };
      insertAddress.run(lastCust.id, "Casa", c.street, c.city, "Buenos Aires", "1425", "Argentina");
    }

    const nicoCust = db.prepare("SELECT id, first_name, last_name, email, phone FROM customers WHERE tenant_id = ? AND email = ?").get(tenantId, "munozalbelonicolas@gmail.com") as any;
    const customers = db.prepare("SELECT id, first_name, last_name, email, phone FROM customers WHERE tenant_id = ? ORDER BY id ASC").all(tenantId) as Array<{
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
    }>;

    // 5. Realistic Orders distributed over the last 30 days
    const insertOrder = db.prepare(`
      INSERT INTO orders (
        tenant_id, order_number, customer_id, customer_name, customer_email, customer_phone,
        shipping_address, status, payment_method, payment_status, subtotal, discount,
        shipping_cost, total, currency, shipping_carrier, tracking_number, tracking_url,
        estimated_delivery, invoice_url, internal_notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ARS', ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertOrderItem = db.prepare(`
      INSERT INTO order_items (
        order_id, product_id, product_name, product_sku, unit_price, quantity, total_price, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertPayment = db.prepare(`
      INSERT INTO payments (
        tenant_id, order_id, provider, transaction_id, status, amount, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const ordersSeed = [
      {
        orderNumber: "ORD-2026-10582",
        customer: nicoCust || customers[0],
        status: "shipped",
        paymentMethod: "mercadopago",
        paymentStatus: "approved",

        daysAgo: 1,
        shippingCarrier: "Andreani",
        trackingNumber: "AND-84920481",
        trackingUrl: "https://www.andreani.com/#!/informacionEnvio/AND-84920481",
        estimatedDelivery: "Mañana entre las 10:00 y 16:00 hs",
        invoiceUrl: "/invoices/FAC-A-0001-000010582.pdf",
        items: [
          { sku: "MAT-IMP-01", qty: 1 },
          { sku: "BOM-ALP-01", qty: 1 },
        ],
        shippingCost: 0,
        discount: 2500,
        notes: "Despachado en sucursal Andreani Centro.",
      },
      {
        orderNumber: "ORD-2026-1001",
        customer: nicoCust || customers[0],
        status: "delivered",
        paymentMethod: "mercadopago",
        paymentStatus: "approved",
        daysAgo: 15,
        shippingCarrier: "Andreani",
        trackingNumber: "AND-78219011",
        trackingUrl: "https://www.andreani.com/#!/informacionEnvio/AND-78219011",
        estimatedDelivery: "Entregado el 24 de Septiembre",
        invoiceUrl: "/invoices/FAC-A-0001-00001001.pdf",
        items: [
          { sku: "YER-ORG-01", qty: 3 },
          { sku: "ACC-MAT-01", qty: 1 },
        ],
        shippingCost: 0,
        discount: 1000,
        notes: "Entregado a tiempo. Cliente conforme.",
      },
      {
        orderNumber: "ORD-2026-1002",
        customer: customers[1],
        status: "delivered",
        paymentMethod: "mercadopago",
        paymentStatus: "approved",
        daysAgo: 18,
        shippingCarrier: "Correo Argentino",
        trackingNumber: "CA-94821034AR",
        trackingUrl: "https://www.correoargentino.com.ar/seguimiento-envios",
        estimatedDelivery: "Entregado",
        invoiceUrl: "/invoices/FAC-A-0001-00001002.pdf",
        items: [
          { sku: "TER-ACE-01", qty: 1 },
          { sku: "ACC-MAT-01", qty: 1 },
        ],
        shippingCost: 0,
        discount: 0,
        notes: "Despacho con tracking número CA-94821034AR.",
      },
      {
        orderNumber: "ORD-2026-1003",
        customer: customers[2],
        status: "shipped",
        paymentMethod: "mercadopago",
        paymentStatus: "approved",
        daysAgo: 8,
        shippingCarrier: "Correo Argentino",
        trackingNumber: "CA-88912344AR",
        items: [
          { sku: "MAT-CAM-02", qty: 1 },
          { sku: "YER-BAR-02", qty: 3 },
          { sku: "ACC-DES-02", qty: 1 },
        ],
        shippingCost: 3500,
        discount: 1500,
        notes: "En tránsito con Correo Argentino.",
      },
      {
        orderNumber: "ORD-2026-1004",
        customer: customers[3],
        status: "processing",
        paymentMethod: "transferencia",
        paymentStatus: "approved",
        daysAgo: 3,
        items: [
          { sku: "TER-BAL-02", qty: 1 },
          { sku: "MAT-IMP-01", qty: 1 },
        ],
        shippingCost: 0,
        discount: 4000,
        notes: "Comprobante de transferencia bancaria verificado por administración.",
      },
      {
        orderNumber: "ORD-2026-1005",
        customer: nicoCust || customers[0],
        status: "confirmed",
        paymentMethod: "mercadopago",
        paymentStatus: "approved",
        daysAgo: 0,
        items: [
          { sku: "MAT-CAM-02", qty: 1 },
          { sku: "BOM-ALP-01", qty: 1 },
        ],
        shippingCost: 0,

        discount: 0,
        notes: "Listo para armar en depósito.",
      },
      {
        orderNumber: "ORD-2026-1006",
        customer: customers[4],
        status: "pending",
        paymentMethod: "mercadopago",
        paymentStatus: "pending",
        daysAgo: 0, // Today
        items: [
          { sku: "YER-ORG-01", qty: 4 },
          { sku: "BOM-RES-02", qty: 1 },
        ],
        shippingCost: 3200,
        discount: 0,
        notes: "Esperando confirmación del webhook de Mercado Pago.",
      },
    ];

    for (const o of ordersSeed) {
      let subtotal = 0;
      const orderItemsToInsert: any[] = [];

      for (const item of o.items) {
        const prod = prodMap.get(item.sku);
        if (prod) {
          const unitPrice = (prod as any).price || 20000;
          const lineTotal = unitPrice * item.qty;
          subtotal += lineTotal;
          orderItemsToInsert.push({
            productId: prod.id,
            name: prod.name,
            sku: prod.sku,
            unitPrice,
            qty: item.qty,
            totalPrice: lineTotal,
            imageUrl: (prod as any).imageUrl,
          });
        }
      }

      const total = subtotal - o.discount + o.shippingCost;

      const addressJson = JSON.stringify({
        title: "Casa",
        street: "Av. Santa Fe 3421",
        streetNumber: "3421",
        floorApt: "Piso 4 Depto B",
        city: "Palermo, CABA",
        state: "Buenos Aires",
        postalCode: "1425",
        country: "Argentina",
      });

      insertOrder.run(
        tenantId,
        o.orderNumber,
        o.customer.id,
        `${o.customer.first_name} ${o.customer.last_name}`,
        o.customer.email,
        o.customer.phone,
        addressJson,
        o.status,
        o.paymentMethod,
        o.paymentStatus,
        subtotal,
        o.discount,
        o.shippingCost,
        total,
        (o as any).shippingCarrier || null,
        (o as any).trackingNumber || null,
        (o as any).trackingUrl || null,
        (o as any).estimatedDelivery || null,
        (o as any).invoiceUrl || null,
        o.notes,
        new Date(Date.now() - o.daysAgo * 86400000).toISOString(),
        new Date(Date.now() - o.daysAgo * 86400000).toISOString()
      );


      const orderRow = db.prepare("SELECT id FROM orders WHERE tenant_id = ? AND order_number = ?").get(tenantId, o.orderNumber) as { id: number };

      for (const oi of orderItemsToInsert) {
        insertOrderItem.run(
          orderRow.id,
          oi.productId,
          oi.name,
          oi.sku,
          oi.unitPrice,
          oi.qty,
          oi.totalPrice,
          oi.imageUrl || null
        );
      }

      insertPayment.run(
        tenantId,
        orderRow.id,
        o.paymentMethod,
        `mp_trx_${Date.now()}_${orderRow.id}`,
        o.paymentStatus,
        total,
        new Date(Date.now() - o.daysAgo * 86400000).toISOString()
      );

      // Update customer total spend and orders
      if (o.paymentStatus === "approved") {
        db.prepare(`
          UPDATE customers
          SET total_orders = total_orders + 1,
              total_spent = total_spent + ?,
              last_order_at = datetime('now', '-${o.daysAgo} days')
          WHERE id = ?
        `).run(total, o.customer.id);
      }
    }

    // 6. Coupons
    const insertCoupon = db.prepare(`
      INSERT INTO coupons (
        tenant_id, code, type, value, min_purchase, max_uses, used_count, valid_from, valid_to, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertCoupon.run(
      tenantId,
      "BIENVENIDA10",
      "percentage",
      10,
      15000,
      200,
      38,
      new Date(Date.now() - 30 * 86400000).toISOString(),
      new Date(Date.now() + 60 * 86400000).toISOString(),
      1
    );

    insertCoupon.run(
      tenantId,
      "MATERO2026",
      "fixed",
      5000,
      40000,
      50,
      12,
      new Date(Date.now() - 10 * 86400000).toISOString(),
      new Date(Date.now() + 20 * 86400000).toISOString(),
      1
    );

    // 7. Audit Log Seed
    const insertAudit = db.prepare(`
      INSERT INTO audit_logs (
        tenant_id, user_email, action, entity_type, entity_id, old_values, new_values, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '-30 days'))
    `);

    insertAudit.run(
      tenantId,
      "sistema@tiendamate.com",
      "INITIAL_SEED",
      "system",
      "tenant_tiendamate",
      null,
      JSON.stringify({ status: "DEMO_ENVIRONMENT_INITIALIZED" })
    );

    // 8. Seed Rich Customer Portal Data for Nicolas and Facundo
    const targetEmails = ["munozalbelonicolas@gmail.com", "facundo.gonzalez@gmail.com"];
    for (const email of targetEmails) {
      let cust = db.prepare("SELECT * FROM customers WHERE tenant_id = ? AND email = ?").get(tenantId, email) as any;
      if (!cust) {
        const parts = email.split("@")[0].split(".");
        const firstName = parts[0] === "munozalbelonicolas" ? "Nicolás" : "Facundo";
        const lastName = parts[0] === "munozalbelonicolas" ? "Muñoz" : "González";
        db.prepare(`
          INSERT INTO customers (tenant_id, first_name, last_name, email, phone, birth_date, id_document, is_active, created_at)
          VALUES (?, ?, ?, ?, '+54 9 11 3456-7890', '1992-05-14', '36.840.129', 1, datetime('now', '-30 days'))
        `).run(tenantId, firstName, lastName, email);
        cust = db.prepare("SELECT * FROM customers WHERE tenant_id = ? AND email = ?").get(tenantId, email) as any;
      }

      if (cust) {
        // Customer Addresses
        db.prepare("DELETE FROM customer_addresses WHERE customer_id = ?").run(cust.id);
        db.prepare(`
          INSERT INTO customer_addresses (customer_id, title, recipient_name, phone, street, street_number, floor_apt, city, state, postal_code, country, notes, is_default)
          VALUES (?, 'Casa', 'Nicolás Muñoz', '+54 9 11 3456-7890', 'Av. Santa Fe', '3421', 'Piso 4 Depto B', 'Palermo, CABA', 'Buenos Aires', '1425', 'Argentina', 'Tocar timbre 4B, conserjería abierta 24hs.', 1)
        `).run(cust.id);

        db.prepare(`
          INSERT INTO customer_addresses (customer_id, title, recipient_name, phone, street, street_number, floor_apt, city, state, postal_code, country, notes, is_default)
          VALUES (?, 'Oficina', 'Nicolás Muñoz (Recepción)', '+54 9 11 4872-9900', 'Av. Corrientes', '1234', 'Piso 8', 'San Nicolás, CABA', 'Buenos Aires', '1043', 'Argentina', 'Entregar en recepción de 9:00 a 18:00 hs.', 0)
        `).run(cust.id);

        // Link existing products as favorites
        const prods = db.prepare("SELECT id FROM products WHERE tenant_id = ? LIMIT 4").all(tenantId) as Array<{ id: number }>;
        db.prepare("DELETE FROM customer_favorites WHERE customer_id = ?").run(cust.id);
        for (const p of prods) {
          db.prepare("INSERT OR IGNORE INTO customer_favorites (customer_id, product_id, created_at) VALUES (?, ?, datetime('now'))").run(cust.id, p.id);
        }

        // Seed Customer Notifications
        db.prepare("DELETE FROM customer_notifications WHERE customer_id = ?").run(cust.id);
        db.prepare(`
          INSERT INTO customer_notifications (customer_id, type, title, message, link, is_read, created_at)
          VALUES (?, 'order', 'Tu pedido #10582 está en camino 🚚', 'Andreani despachó tu compra. Seguimiento AND-84920481.', '/cuenta/pedidos', 0, datetime('now', '-2 hours'))
        `).run(cust.id);

        db.prepare(`
          INSERT INTO customer_notifications (customer_id, type, title, message, link, is_read, created_at)
          VALUES (?, 'promo', '¡Nuevo beneficio para vos: MATERO2026! 🧉', 'Disfrutá de 15% OFF en yerbas y accesorios seleccionados.', '/cuenta/cupones', 0, datetime('now', '-1 day'))
        `).run(cust.id);

        db.prepare(`
          INSERT INTO customer_notifications (customer_id, type, title, message, link, is_read, created_at)
          VALUES (?, 'order', 'Pago aprobado para tu compra #10430', 'El pago fue acreditado correctamente vía Mercado Pago.', '/cuenta/pedidos', 1, datetime('now', '-10 days'))
        `).run(cust.id);

        // Ensure active in-transit order with tracking for customer
        const activeOrderNumber = "ORD-2026-10582";
        const existingActiveOrder = db.prepare("SELECT id FROM orders WHERE tenant_id = ? AND order_number = ?").get(tenantId, activeOrderNumber) as any;
        if (!existingActiveOrder && prods.length > 0) {
          const firstProd = db.prepare("SELECT * FROM products WHERE id = ?").get(prods[0].id) as any;
          const secondProd = prods.length > 1 ? (db.prepare("SELECT * FROM products WHERE id = ?").get(prods[1].id) as any) : firstProd;

          const ordSubtotal = (firstProd.price || 45000) + (secondProd.price || 18000);
          const ordTotal = ordSubtotal;

          const insOrd = db.prepare(`
            INSERT INTO orders (
              tenant_id, order_number, customer_id, customer_name, customer_email, customer_phone,
              shipping_address, status, payment_method, payment_status, subtotal, discount,
              shipping_cost, total, currency, shipping_carrier, tracking_number, tracking_url,
              estimated_delivery, invoice_url, internal_notes, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'shipped', 'mercadopago', 'approved', ?, 0, 0, ?, 'ARS', 'Andreani', 'AND-84920481', 'https://www.andreani.com/#!/informacionEnvio/AND-84920481', 'Mañana entre las 10:00 y 16:00 hs', '/invoices/FAC-A-0001-000010582.pdf', 'Despacho prioritario en curso', datetime('now', '-1 day'), datetime('now'))
          `).run(
            tenantId,
            activeOrderNumber,
            cust.id,
            `${cust.first_name} ${cust.last_name}`,
            cust.email,
            cust.phone,
            JSON.stringify({
              street: "Av. Santa Fe 3421, Piso 4 Depto B",
              city: "CABA",
              postalCode: "1425",
              country: "Argentina",
            }),
            ordSubtotal,
            ordTotal
          );

          const ordId = Number(insOrd.lastInsertRowid);
          db.prepare(`
            INSERT INTO order_items (order_id, product_id, product_name, product_sku, unit_price, quantity, total_price, image_url)
            VALUES (?, ?, ?, ?, ?, 1, ?, ?)
          `).run(ordId, firstProd.id, firstProd.name, firstProd.sku, firstProd.price, firstProd.price, firstProd.image_url);

          if (secondProd && secondProd.id !== firstProd.id) {
            db.prepare(`
              INSERT INTO order_items (order_id, product_id, product_name, product_sku, unit_price, quantity, total_price, image_url)
              VALUES (?, ?, ?, ?, ?, 1, ?, ?)
            `).run(ordId, secondProd.id, secondProd.name, secondProd.sku, secondProd.price, secondProd.price, secondProd.image_url);
          }

          // Sample Return request for delivered order
          db.prepare("DELETE FROM customer_returns WHERE customer_id = ?").run(cust.id);
          db.prepare(`
            INSERT INTO customer_returns (tenant_id, customer_id, order_id, product_id, quantity, reason, comments, status, created_at)
            VALUES (?, ?, ?, ?, 1, 'not_as_expected', 'El color de la virola es diferente a lo solicitado.', 'approved', datetime('now', '-3 days'))
          `).run(tenantId, cust.id, ordId, firstProd.id);
        }

        // Sessions
        db.prepare("DELETE FROM customer_sessions WHERE customer_id = ?").run(cust.id);
        db.prepare(`
          INSERT INTO customer_sessions (id, customer_id, device_name, browser, os, ip_address, last_active_at, created_at)
          VALUES (?, ?, 'MacBook Pro 16\"', 'Chrome 122', 'macOS Sonoma', '181.44.120.12 (Buenos Aires, AR)', datetime('now'), datetime('now', '-5 days'))
        `).run(`sess_${cust.id}_mac`, cust.id);
        db.prepare(`
          INSERT INTO customer_sessions (id, customer_id, device_name, browser, os, ip_address, last_active_at, created_at)
          VALUES (?, ?, 'iPhone 15 Pro', 'Mobile Safari', 'iOS 17.4', '181.44.120.12 (Buenos Aires, AR)', datetime('now', '-2 hours'), datetime('now', '-2 days'))
        `).run(`sess_${cust.id}_ios`, cust.id);
      }
    }


    db.exec("COMMIT;");

  } catch (err) {
    db.exec("ROLLBACK;");
    throw err;
  }
}

export function resetDemoData(db: DatabaseSync, tenantId: string, initialAdminEmail: string): void {
  // STRICT SAFETY CHECK: Never allow in production
  const envRaw = (process.env.APP_ENV || "demo").toLowerCase();
  if (envRaw === "production") {
    throw new Error("ACCION BLOQUEADA: No se permite reiniciar datos en entorno de Producción.");
  }

  // Delete demo commercial tables safely
  db.prepare("DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE tenant_id = ?)").run(tenantId);
  db.prepare("DELETE FROM payments WHERE tenant_id = ?").run(tenantId);
  db.prepare("DELETE FROM orders WHERE tenant_id = ?").run(tenantId);
  db.prepare("DELETE FROM customer_addresses WHERE customer_id IN (SELECT id FROM customers WHERE tenant_id = ?)").run(tenantId);
  db.prepare("DELETE FROM customer_favorites WHERE customer_id IN (SELECT id FROM customers WHERE tenant_id = ?)").run(tenantId);
  db.prepare("DELETE FROM customer_notifications WHERE customer_id IN (SELECT id FROM customers WHERE tenant_id = ?)").run(tenantId);
  db.prepare("DELETE FROM customer_returns WHERE tenant_id = ?").run(tenantId);
  db.prepare("DELETE FROM customer_sessions WHERE customer_id IN (SELECT id FROM customers WHERE tenant_id = ?)").run(tenantId);
  db.prepare("DELETE FROM customers WHERE tenant_id = ?").run(tenantId);
  db.prepare("DELETE FROM inventory_movements WHERE tenant_id = ?").run(tenantId);
  db.prepare("DELETE FROM product_images WHERE product_id IN (SELECT id FROM products WHERE tenant_id = ?)").run(tenantId);
  db.prepare("DELETE FROM product_variants WHERE product_id IN (SELECT id FROM products WHERE tenant_id = ?)").run(tenantId);
  db.prepare("DELETE FROM products WHERE tenant_id = ?").run(tenantId);
  db.prepare("DELETE FROM categories WHERE tenant_id = ?").run(tenantId);
  db.prepare("DELETE FROM coupons WHERE tenant_id = ?").run(tenantId);
  db.prepare("DELETE FROM audit_logs WHERE tenant_id = ?").run(tenantId);

  // Re-seed system roles & demo data
  seedSystemRolesAndTenant(db, tenantId, initialAdminEmail);
  seedDemoData(db, tenantId);
}

