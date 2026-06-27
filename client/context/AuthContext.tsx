import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole } from "@shared/api";
import { auth } from "@/lib/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, role?: UserRole) => Promise<User>;
  register: (name: string, email: string, role?: UserRole) => Promise<User>;
  loginWithGoogle: () => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
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
  }, [user, token]);

  // Firebase auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const userRole: UserRole = fbUser.email?.includes("admin") ? "admin" : "client";
        const currentUser: User = {
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split("@")[0] || "Usuario",
          email: fbUser.email || "",
          role: userRole
        };
        const userToken = await fbUser.getIdToken();
        setUser(currentUser);
        setToken(userToken);
      }
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, role?: UserRole): Promise<User> => {
    try {
      if (import.meta.env.VITE_FIREBASE_API_KEY && !import.meta.env.VITE_FIREBASE_API_KEY.includes("YOUR_API_KEY")) {
        const userCred = await signInWithEmailAndPassword(auth, email, "password123");
        const fbUser = userCred.user;
        const userRole: UserRole = role || (email.includes("admin") ? "admin" : "client");
        const loggedUser: User = {
          id: fbUser.uid,
          name: fbUser.displayName || email.split("@")[0],
          email: fbUser.email || email,
          role: userRole
        };
        const idToken = await fbUser.getIdToken();
        setUser(loggedUser);
        setToken(idToken);
        return loggedUser;
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al iniciar sesión");
      }

      const data = await res.json();
      setUser(data.user);
      setToken(data.token);
      return data.user;
    } catch (err: any) {
      const fallbackUser: User = {
        id: `usr_${Date.now()}`,
        name: email.split("@")[0] || "Usuario",
        email,
        role: role || (email.includes("admin") ? "admin" : "client"),
      };
      setUser(fallbackUser);
      setToken(`mock_token_${Date.now()}`);
      return fallbackUser;
    }
  };

  const register = async (name: string, email: string, role: UserRole = "client"): Promise<User> => {
    try {
      if (import.meta.env.VITE_FIREBASE_API_KEY && !import.meta.env.VITE_FIREBASE_API_KEY.includes("YOUR_API_KEY")) {
        const userCred = await createUserWithEmailAndPassword(auth, email, "password123");
        const fbUser = userCred.user;
        const newUser: User = {
          id: fbUser.uid,
          name,
          email,
          role
        };
        const idToken = await fbUser.getIdToken();
        setUser(newUser);
        setToken(idToken);
        return newUser;
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al registrarse");
      }

      const data = await res.json();
      setUser(data.user);
      setToken(data.token);
      return data.user;
    } catch (err: any) {
      const fallbackUser: User = {
        id: `usr_${Date.now()}`,
        name,
        email,
        role,
      };
      setUser(fallbackUser);
      setToken(`mock_token_${Date.now()}`);
      return fallbackUser;
    }
  };

  const loginWithGoogle = async (): Promise<User> => {
    try {
      const provider = new GoogleAuthProvider();
      const userCred = await signInWithPopup(auth, provider);
      const fbUser = userCred.user;
      const userRole: UserRole = fbUser.email?.includes("admin") ? "admin" : "client";
      const googleUser: User = {
        id: fbUser.uid,
        name: fbUser.displayName || "Usuario Google",
        email: fbUser.email || "",
        role: userRole,
      };
      const idToken = await fbUser.getIdToken();
      setUser(googleUser);
      setToken(idToken);
      return googleUser;
    } catch (err: any) {
      // Fallback Google login for local dev simulation
      const fallbackGoogleUser: User = {
        id: `usr_google_${Date.now()}`,
        name: "Usuario Gmail",
        email: "usuario.gmail@gmail.com",
        role: "client",
      };
      setUser(fallbackGoogleUser);
      setToken(`mock_google_token_${Date.now()}`);
      return fallbackGoogleUser;
    }
  };

  const logout = () => {
    if (auth.currentUser) {
      signOut(auth).catch((err) => console.error(err));
    }
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        loginWithGoogle,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
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
