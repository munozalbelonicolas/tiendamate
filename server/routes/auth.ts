import { RequestHandler } from "express";
import { User, AuthResponse } from "@shared/api";

const mockUsers: User[] = [
  {
    id: "usr_admin",
    name: "Administrador TiendaMate",
    email: "admin@tiendamate.com",
    role: "admin"
  },
  {
    id: "usr_client",
    name: "Juan Pérez",
    email: "cliente@gmail.com",
    role: "client"
  }
];

export const handleLogin: RequestHandler = (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    res.status(400).json({ message: "El correo electrónico es obligatorio" });
    return;
  }

  // Find existing mock user or auto-login with role determination
  let user = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    // If logging in with admin email prefix or domain, set admin role
    const isAdmin = email.toLowerCase().includes("admin");
    user = {
      id: `usr_${Date.now()}`,
      name: email.split("@")[0],
      email,
      role: isAdmin ? "admin" : "client"
    };
    mockUsers.push(user);
  }

  const response: AuthResponse = {
    user,
    token: `mock_jwt_token_${user.id}_${Date.now()}`
  };

  res.json(response);
};

export const handleRegister: RequestHandler = (req, res) => {
  const { name, email, role } = req.body;

  if (!name || !email) {
    res.status(400).json({ message: "Nombre y correo electrónico son obligatorios" });
    return;
  }

  const existing = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    res.status(400).json({ message: "El usuario ya se encuentra registrado" });
    return;
  }

  const newUser: User = {
    id: `usr_${Date.now()}`,
    name,
    email,
    role: role === "admin" ? "admin" : "client"
  };

  mockUsers.push(newUser);

  const response: AuthResponse = {
    user: newUser,
    token: `mock_jwt_token_${newUser.id}_${Date.now()}`
  };

  res.status(201).json(response);
};
