import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ShieldCheck, ArrowLeft, AlertCircle, Sparkles, Truck } from "lucide-react";

export default function AdminLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { loginWithGoogle, loginAsDevDemo, envInfo } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate("/admin", { replace: true });
    } catch (err: any) {
      setError(
        err.message ||
          "Error al autenticar con Google. Asegúrate de tener permisos administrativos asignados."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDemoQuickAccess = async () => {
    setError("");
    setLoading(true);
    try {
      await loginAsDevDemo();
      navigate("/admin", { replace: true });
    } catch (err: any) {
      setError(err.message || "Error al ingresar en modo DEMO.");
    } finally {
      setLoading(false);
    }
  };

  const isDemo = envInfo?.isDemo ?? true;

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#241F1E] flex flex-col justify-between font-sans selection:bg-[#BD532B] selection:text-white relative">
      {/* ── Top Announcement Bar (Terracota Tradicional) ── */}
      <div className="bg-[#BD532B] text-white text-xs py-2 px-4 border-b border-[#A7441E]">
        <div className="container mx-auto flex justify-between items-center text-center sm:text-left">
          <div className="flex items-center gap-2 font-medium">
            <Truck size={14} className="text-white/90" />
            <span>Portal Seguro de Administración — TiendaMate</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 font-medium text-white/95">
            <Sparkles size={14} className="text-white/90" />
            <span>Productos que mantienen viva nuestra tradición</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Back button */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-[#7A6F68] hover:text-[#BD532B] mb-6 text-xs font-semibold transition mx-auto px-3.5 py-1.5 rounded-full bg-white border border-[#EFE8DF] shadow-sm hover:shadow"
          >
            <ArrowLeft size={14} /> Volver a la Tienda
          </button>

          {/* Logo Brand "Úno más | ESPACIO NATIVO" */}
          <div className="flex flex-col items-center justify-center text-center select-none mb-2">
            <div className="flex items-baseline leading-none">
              <span className="font-script text-5xl text-[#0E6365] font-bold tracking-tight">
                Úno
              </span>
              <span className="font-serif font-bold text-3xl text-[#BD532B] ml-1 tracking-tight">
                más
              </span>
            </div>
            <span className="text-[9.5px] uppercase tracking-[0.24em] font-semibold text-[#8C7D73] mt-1">
              ESPACIO NATIVO • TIENDAMATE
            </span>
          </div>

          <h2 className="mt-3 text-center text-xl font-serif font-bold text-[#241F1E]">
            Panel de Administración
          </h2>
          <p className="mt-1 text-center text-xs text-[#7A6F68] max-w-xs mx-auto">
            Acceso privado y seguro con autenticación corporativa de Google.
          </p>

          {isDemo && (
            <div className="mt-3 flex justify-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#BD532B]/10 text-[#BD532B] border border-[#BD532B]/30">
                <Sparkles size={12} /> Entorno de Demostración Activo
              </span>
            </div>
          )}
        </div>

        {/* Login Card */}
        <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-6 sm:px-10 shadow-[0_4px_20px_rgba(36,31,30,0.06)] rounded-3xl border border-[#EFE8DF]">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-red-900">Acceso restringido</p>
                  <p className="text-red-700 mt-0.5 leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Continuar con Google */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border border-[#E5DDD0] bg-white hover:bg-[#FAF7F2] text-[#241F1E] font-semibold text-xs shadow-sm hover:shadow transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-[#BD532B] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>{loading ? "Verificando credenciales..." : "Continuar con Google"}</span>
              </button>

              {/* Botón rápido para munozalbelonicolas@gmail.com */}
              <div className="pt-4 border-t border-[#EFE8DF] space-y-2">
                <button
                  type="button"
                  onClick={async () => {
                    setError("");
                    setLoading(true);
                    try {
                      await loginAsDevDemo("munozalbelonicolas@gmail.com");
                      navigate("/admin", { replace: true });
                    } catch (err: any) {
                      setError(err.message || "Error al acceder como munozalbelonicolas@gmail.com");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-[#BD532B] hover:bg-[#A7441E] text-white font-bold text-xs shadow-sm transition active:scale-[0.99]"
                >
                  <ShieldCheck size={14} className="text-white" />
                  <span>Ingresar como munozalbelonicolas@gmail.com</span>
                </button>

                {isDemo && (
                  <button
                    type="button"
                    onClick={handleDemoQuickAccess}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-2xl bg-[#0E6365]/10 hover:bg-[#0E6365]/20 text-[#0E6365] font-semibold text-xs border border-[#0E6365]/20 transition active:scale-[0.99]"
                  >
                    <Sparkles size={13} />
                    <span>Acceso Alternativo (admin@tiendamate.com)</span>
                  </button>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#EFE8DF] text-center">
              <p className="text-[11px] text-[#8C7D73] leading-relaxed">
                Solo colaboradores autorizados de TiendaMate. Todas las operaciones comerciales quedan registradas en auditoría.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer minimalista */}
      <footer className="py-4 text-center text-xs text-[#8C7D73] border-t border-[#EFE8DF]">
        © 2026 TiendaMate • Úno más | Espacio Nativo. Todos los derechos reservados.
      </footer>
    </div>
  );
}
