import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("admin@tiendamate.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Ingresa tu correo de administrador");
      return;
    }

    try {
      const loggedUser = await login(email, "admin");
      if (loggedUser.role !== "admin") {
        setError("Esta cuenta no cuenta con permisos de administración");
        return;
      }
      navigate("/admin", { replace: true });
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión como administrador");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm font-medium transition mx-auto"
        >
          <ArrowLeft size={16} /> Volver a la Tienda
        </button>
        <div className="flex justify-center">
          <ShieldCheck className="w-14 h-14 text-emerald-400" />
        </div>
        <h2 className="mt-4 text-center text-3xl font-serif font-bold">
          Acceso Administrador
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Portal privado de gestión del catálogo TiendaMate
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800 py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 border border-slate-700">
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 text-red-200 text-sm rounded-md">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-300">
                Correo Administrador
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 block w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 focus:outline-none transition"
              >
                Ingresar al Panel Admin
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
