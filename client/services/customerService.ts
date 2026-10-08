import {
  CustomerProfile,
  CustomerAddress,
  CustomerPortalOrder,
  CustomerFavoriteItem,
  CustomerPortalCoupon,
  CustomerReturnRequest,
  CustomerNotificationItem,
  CustomerSessionItem,
  CustomerDashboardData,
} from "@shared/api";

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("tiendamate_token");
  const userJson = localStorage.getItem("tiendamate_user");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      if (user.email) {
        headers["x-customer-email"] = user.email;
      }
    } catch {
      // ignore
    }
  }

  return headers;
}

export const customerService = {
  /**
   * Get Customer Dashboard summary
   */
  async getDashboard(): Promise<CustomerDashboardData> {
    const res = await fetch("/api/me/dashboard", {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || "No pudimos cargar el resumen de tu cuenta.");
    }
    return res.json();
  },

  /**
   * Get Customer Profile
   */
  async getProfile(): Promise<CustomerProfile> {
    const res = await fetch("/api/me", {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || "No pudimos cargar tus datos de perfil.");
    }
    return res.json();
  },

  /**
   * Update Customer Profile
   */
  async updateProfile(data: Partial<CustomerProfile>): Promise<{ message: string; profile: CustomerProfile }> {
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || "No pudimos guardar los cambios.");
    }
    return res.json();
  },

  /**
   * List Customer Orders with filters
   */
  async getOrders(statusFilter = "all", year?: string): Promise<CustomerPortalOrder[]> {
    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
    if (year && year !== "all") params.append("year", year);

    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`/api/me/orders${query}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || "No pudimos cargar tus pedidos.");
    }
    return res.json();
  },

  /**
   * Get Order detail by ID
   */
  async getOrder(id: number | string): Promise<CustomerPortalOrder> {
    const res = await fetch(`/api/me/orders/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || "No pudimos encontrar el detalle del pedido.");
    }
    return res.json();
  },

  /**
   * Cancel Order
   */
  async cancelOrder(id: number | string): Promise<{ message: string; order: CustomerPortalOrder }> {
    const res = await fetch(`/api/me/orders/${id}/cancel`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || "No se pudo cancelar el pedido.");
    }
    return res.json();
  },

  /**
   * Addresses CRUD
   */
  async getAddresses(): Promise<CustomerAddress[]> {
    const res = await fetch("/api/me/addresses", {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || "No pudimos cargar tus direcciones.");
    }
    return res.json();
  },

  async createAddress(data: Partial<CustomerAddress>): Promise<{ message: string; address: CustomerAddress }> {
    const res = await fetch("/api/me/addresses", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || "No se pudo guardar la dirección.");
    }
    return res.json();
  },

  async updateAddress(
    id: number,
    data: Partial<CustomerAddress>
  ): Promise<{ message: string; address: CustomerAddress }> {
    const res = await fetch(`/api/me/addresses/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || "No se pudo actualizar la dirección.");
    }
    return res.json();
  },

  async deleteAddress(id: number): Promise<{ message: string }> {
    const res = await fetch(`/api/me/addresses/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || "No se pudo eliminar la dirección.");
    }
    return res.json();
  },

  /**
   * Favorites
   */
  async getFavorites(): Promise<CustomerFavoriteItem[]> {
    const res = await fetch("/api/me/favorites", {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || "No pudimos cargar tus favoritos.");
    }
    return res.json();
  },

  async addFavorite(productId: number): Promise<{ message: string; favorites: CustomerFavoriteItem[] }> {
    const res = await fetch(`/api/me/favorites/${productId}`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || "No se pudo agregar a favoritos.");
    }
    return res.json();
  },

  async removeFavorite(productId: number): Promise<{ message: string; favorites: CustomerFavoriteItem[] }> {
    const res = await fetch(`/api/me/favorites/${productId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || "No se pudo quitar de favoritos.");
    }
    return res.json();
  },

  /**
   * Coupons
   */
  async getCoupons(): Promise<CustomerPortalCoupon[]> {
    const res = await fetch("/api/me/coupons", {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || "No pudimos cargar tus cupones.");
    }
    return res.json();
  },

  /**
   * Returns
   */
  async getReturns(): Promise<CustomerReturnRequest[]> {
    const res = await fetch("/api/me/returns", {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || "No pudimos cargar tus solicitudes de devolución.");
    }
    return res.json();
  },

  async createReturn(data: {
    orderId: number;
    productId: number;
    quantity: number;
    reason: string;
    comments?: string;
  }): Promise<{ message: string; returns: CustomerReturnRequest[] }> {
    const res = await fetch("/api/me/returns", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || "No se pudo registrar la solicitud de devolución.");
    }
    return res.json();
  },

  /**
   * Notifications
   */
  async getNotifications(): Promise<CustomerNotificationItem[]> {
    const res = await fetch("/api/me/notifications", {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || "No pudimos cargar tus notificaciones.");
    }
    return res.json();
  },

  async markNotificationRead(id: number): Promise<CustomerNotificationItem[]> {
    const res = await fetch(`/api/me/notifications/${id}/read`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error("No se pudo actualizar la notificación.");
    }
    return res.json();
  },

  async markAllNotificationsRead(): Promise<CustomerNotificationItem[]> {
    const res = await fetch("/api/me/notifications/read-all", {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      throw new Error("No se pudo actualizar las notificaciones.");
    }
    return res.json();
  },

  /**
   * Sessions & Security
   */
  async getSessions(): Promise<CustomerSessionItem[]> {
    const res = await fetch("/api/me/sessions", {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || "No pudimos cargar tus sesiones.");
    }
    return res.json();
  },

  async deleteSession(id: string): Promise<{ message: string; sessions: CustomerSessionItem[] }> {
    const res = await fetch(`/api/me/sessions/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || "No se pudo cerrar la sesión.");
    }
    return res.json();
  },

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<{ message: string }> {
    const res = await fetch("/api/me/security/change-password", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || "Error al actualizar la contraseña.");
    }
    return res.json();
  },

  async requestEmailChange(newEmail: string): Promise<{ message: string; verificationRequired: boolean }> {
    const res = await fetch("/api/me/security/request-email-change", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ newEmail }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || "Error al solicitar cambio de email.");
    }
    return res.json();
  },

  async deleteAccount(): Promise<{ message: string }> {
    const res = await fetch("/api/me/account", {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || "Error al eliminar la cuenta.");
    }
    return res.json();
  },
};
