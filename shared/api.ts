/**
 * Shared interfaces and types between client and server for TiendaMate
 */

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'OPERADOR' | 'VIEWER';
export type UserRole = AdminRole | 'client' | 'admin';

export type Permission =
  | 'products.read'
  | 'products.create'
  | 'products.update'
  | 'products.delete'
  | 'orders.read'
  | 'orders.update'
  | 'inventory.manage'
  | 'customers.read'
  | 'reports.read'
  | 'settings.manage'
  | 'users.manage';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  tenantId?: string;
  permissions?: Permission[];
}

export interface TenantMembership {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  role: AdminRole;
  status: 'active' | 'invited' | 'suspended';
  invitedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  productsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductVariant {
  id?: number;
  sku: string;
  name: string;
  price: number;
  stock: number;
  attributes?: Record<string, string>;
}

export interface Product {
  id: number;
  tenantId?: string;
  sku?: string;
  name: string;
  slug?: string;
  price: number;
  promoPrice?: number | null;
  cost?: number | null;
  category?: string;
  categoryId?: number;
  description?: string;
  stock: number;

  minStockAlert?: number;
  imageUrl?: string;
  images?: string[];
  isPublished?: boolean;
  isFeatured?: boolean;
  /** Especificaciones técnicas del producto (clave: valor) */
  specs?: Record<string, string>;
  variants?: ProductVariant[];
  seoTitle?: string;
  seoDescription?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'refunded';
export type PaymentMethod = 'mercadopago' | 'transferencia' | 'efectivo' | 'tarjeta';

export interface OrderItem {
  id?: number;
  productId: number;
  productName: string;
  productSku?: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  imageUrl?: string;
}

export interface ShippingAddress {
  street: string;
  city: string;
  state?: string;
  postalCode?: string;
  notes?: string;
}

export interface Order {
  id: number;
  tenantId?: string;
  orderNumber: string;
  customerId?: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress?: ShippingAddress;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  currency: string;
  items: OrderItem[];
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMovement {
  id: number;
  tenantId?: string;
  productId: number;
  productName?: string;
  productSku?: string;
  type: 'in' | 'out' | 'adjustment' | 'order_sale' | 'order_cancel';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  userName?: string;
  referenceId?: string;
  createdAt: string;
}

export interface Customer {
  id: number;
  tenantId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id: number;
  tenantId?: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase: number;
  maxUses: number;
  usedCount: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  createdAt?: string;
}

export interface StoreSettings {
  storeName: string;
  logoUrl?: string;
  supportEmail: string;
  phone?: string;
  address?: string;
  currency: string;
  timezone: string;
  taxRate: number;
  minStockThreshold: number;
  freeShippingThreshold: number;
  announcement?: string;
  updatedAt?: string;
}

export interface AuditLog {
  id: number;
  tenantId?: string;
  userId?: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: string;
  newValues?: string;
  createdAt: string;
}

export interface DashboardMetrics {
  salesTotal: number;
  ordersCount: number;
  averageTicket: number;
  publishedProducts: number;
  lowStockProducts: number;
  pendingOrders: number;
  shippedOrders: number;
  registeredCustomers: number;
  salesChart: Array<{ date: string; sales: number; orders: number }>;
  categoryChart: Array<{ category: string; count: number; total: number }>;
  orderStatusChart: Array<{ status: string; label: string; count: number }>;
  topProducts: Array<{
    id: number;
    name: string;
    sku?: string;
    unitsSold: number;
    totalRevenue: number;
    stock: number;
  }>;
}

export interface AuthResponse {
  user: User;
  token: string;
  role?: AdminRole;
  permissions?: Permission[];
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password?: string;
  role?: UserRole;
}

export interface EnvironmentInfo {
  appEnv: 'demo' | 'testing' | 'production';
  tenantId: string;
  isDemo: boolean;
  isProduction: boolean;
  isTesting: boolean;
}

// ==========================================
// CUSTOMER ACCOUNT PORTAL TYPES
// ==========================================

export interface CustomerNotificationPreferences {
  orderUpdates: boolean;
  promotions: boolean;
  emailChannel: boolean;
  whatsappChannel: boolean;
  pushChannel: boolean;
}

export interface CustomerProfile {
  id: number;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  birthDate?: string;
  idDocument?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt?: string;
  notificationPreferences?: CustomerNotificationPreferences;
  createdAt: string;
}

export interface CustomerAddress {
  id: number;
  customerId: number;
  title: string;
  recipientName?: string;
  phone?: string;
  street: string;
  streetNumber?: string;
  floorApt?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  notes?: string;
  isDefault: boolean;
  createdAt?: string;
}

export interface CustomerPortalOrderItem {
  id: number;
  productId: number;
  productName: string;
  productSku?: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  imageUrl?: string;
  currentStock?: number;
  currentPrice?: number;
  isAvailable?: boolean;
}

export interface CustomerPortalOrder {
  id: number;
  orderNumber: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  currency: string;
  shippingCarrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  invoiceUrl?: string;
  shippingAddress?: CustomerAddress | any;
  items: CustomerPortalOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomerFavoriteItem {
  id: number;
  productId: number;
  product: {
    id: number;
    name: string;
    slug?: string;
    price: number;
    stock: number;
    imageUrl?: string;
    isPublished: boolean;
    badge?: string;
    categoryName?: string;
  };
  createdAt: string;
}

export interface CustomerPortalCoupon {
  id: number;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase: number;
  validTo: string;
  status: 'available' | 'used' | 'expired';
  description?: string;
}

export interface CustomerReturnRequest {
  id: number;
  orderId: number;
  orderNumber: string;
  productId: number;
  productName: string;
  productImageUrl?: string;
  quantity: number;
  reason: 'defective' | 'wrong_item' | 'not_as_expected' | 'wrong_size' | 'other';
  comments?: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'item_received' | 'refunded';
  createdAt: string;
  updatedAt: string;
}

export interface CustomerNotificationItem {
  id: number;
  type: 'order' | 'promo' | 'security' | 'system';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface CustomerSessionItem {
  id: string;
  deviceName: string;
  browser?: string;
  os?: string;
  ipAddress?: string;
  lastActiveAt: string;
  isCurrent?: boolean;
}

export interface CustomerDashboardData {
  profile: CustomerProfile;
  latestOrder?: CustomerPortalOrder | null;
  activeOrderCount: number;
  totalOrdersCount: number;
  favoritesCount: number;
  unreadNotificationsCount: number;
  availableCouponsCount: number;
}

