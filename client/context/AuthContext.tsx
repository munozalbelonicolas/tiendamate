import React, { createContext, useContext, useState, useEffect } from "react";
import { User, AdminRole, Permission, EnvironmentInfo, UserRole } from "@shared/api";
import { auth } from "@/lib/firebase";
import { 
  signInWithPopup,
  GoogleAuthProvider,
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: AdminRole | null;
  permissions: Permission[];
  hasPermission: (permission: Permission) => boolean;
  loginWithGoogle: () => Promise<User>;
  loginAsDevDemo: (customEmail?: string) => Promise<User>;
  login: (email: string, role?: UserRole) => Promise<User>;
  register: (name: string, email: string, role?: UserRole) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  envInfo: EnvironmentInfo | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("tiendamate_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("tiendamate_token");
  });

  const [role, setRole] = useState<AdminRole | null>(() => {
    return (localStorage.getItem("tiendamate_role") as AdminRole) || null;
  });

  const [permissions, setPermissions] = useState<Permission[]>(() => {
    const saved = localStorage.getItem("tiendamate_permissions");
    return saved ? JSON.parse(saved) : [];
  });

  const [envInfo, setEnvInfo] = useState<EnvironmentInfo | null>(null);

  // Fetch env info on mount
  useEffect(() => {
    fetch("/api/env")
      .then((res) => res.json())
      .then((data: EnvironmentInfo) => setEnvInfo(data))
      .catch((err) => console.error("Error obteniendo entorno:", err));
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem("tiendamate_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("tiendamate_user");
    }

    if (token) {
      localStorage.setItem("tiendamate_token", token);
    } else {
      localStorage.removeItem("tiendamate_token");
    }

    if (role) {
      localStorage.setItem("tiendamate_role", role);
    } else {
      localStorage.removeItem("tiendamate_role");
    }

    if (permissions && permissions.length > 0) {
      localStorage.setItem("tiendamate_permissions", JSON.stringify(permissions));
    } else {
      localStorage.removeItem("tiendamate_permissions");
    }
  }, [user, token, role, permissions]);

  const hasPermission = (perm: Permission): boolean => {
    if (!role) return false;
    if (role === "SUPER_ADMIN" || role === "ADMIN") return true;
    return permissions.includes(perm);
  };

  /**
   * Real Google OAuth Login
   */
  const loginWithGoogle = async (): Promise<User> => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const userCred = await signInWithPopup(auth, provider);
      const fbUser = userCred.user;
      const credential = GoogleAuthProvider.credentialFromResult(userCred);
      const googleIdToken = credential?.idToken;
      const fbIdToken = await fbUser.getIdToken();

      // Exchange with backend for verified tenant membership
      const res = await fetch("/api/admin/auth/google-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken: fbIdToken,
          googleIdToken: googleIdToken || undefined,
          email: fbUser.email,
          name: fbUser.displayName,
          picture: fbUser.photoURL,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.authorized) {
        throw new Error(data.message || "Tu cuenta de Google no tiene permisos autorizados en este comercio.");
      }

      setUser(data.user);
      setToken(data.token);
      setRole(data.role);
      setPermissions(data.permissions || []);
      return data.user;
    } catch (err: any) {
      console.error("Error en login con Google:", err);
      throw err;
    }
  };

  /**
   * Dev Demo Login (only available when APP_ENV === 'demo')
   */
  const loginAsDevDemo = async (customEmail?: string): Promise<User> => {
    const res = await fetch("/api/admin/auth/dev-demo-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: customEmail }),
    });

    const data = await res.json();
    if (!res.ok || !data.authorized) {
      throw new Error(data.message || "Error al ingresar en modo DEMO.");
    }

    setUser(data.user);
    setToken(data.token);
    setRole(data.role);
    setPermissions(data.permissions || []);
    return data.user;
  };

  /**
   * Storefront Client Login
   */
  const login = async (email: string, clientRole: UserRole = "client"): Promise<User> => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role: clientRole }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Error al iniciar sesión");
    }

    setUser(data.user);
    setToken(data.token);
    return data.user;
  };

  /**
   * Storefront Client Register
   */
  const register = async (name: string, email: string, clientRole: UserRole = "client"): Promise<User> => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, role: clientRole }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Error al registrarse");
    }

    setUser(data.user);
    setToken(data.token);
    return data.user;
  };

  const logout = () => {
    if (auth.currentUser) {
      signOut(auth).catch((err) => console.error(err));
    }
    setUser(null);
    setToken(null);
    setRole(null);
    setPermissions([]);
    localStorage.removeItem("tiendamate_user");
    localStorage.removeItem("tiendamate_token");
    localStorage.removeItem("tiendamate_role");
    localStorage.removeItem("tiendamate_permissions");
  };

  const isAdmin = ["SUPER_ADMIN", "ADMIN", "MANAGER", "OPERADOR", "VIEWER"].includes(role || user?.role || "");

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        permissions,
        hasPermission,
        loginWithGoogle,
        loginAsDevDemo,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isAdmin,
        envInfo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
};
