"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff, GraduationCap, KeyRound, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

const loginSchema = z.object({
  email: z.string().email("Ingresa un email válido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Modal para restablecer / cambiar contraseña directamente
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("juanarosario200018@gmail.com");
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "juanarosario200018@gmail.com",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setAuthError(null);

    const result = await signIn("credentials", {
      email: data.email.trim(),
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setAuthError(
        "Credenciales incorrectas. Si no recuerdas tu contraseña, usa el botón de abajo para cambiarla por una nueva."
      );
      return;
    }

    toast.success("¡Bienvenida a AulaControl!");
    router.push("/dashboard");
    router.refresh();
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim() || !newPassword.trim()) return;

    try {
      setResetting(true);
      setResetSuccess(null);
      const res = await fetch("/api/auth/reset-admin-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetEmail.trim(),
          newPassword: newPassword.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResetSuccess(data.message);
        setValue("email", resetEmail.trim());
        setValue("password", newPassword.trim());
        toast.success("Contraseña actualizada");
        setTimeout(() => {
          setShowResetModal(false);
        }, 2000);
      } else {
        toast.error(data.error || "Error al actualizar");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <GraduationCap className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-blue-900">AulaControl</h1>
          <p className="text-blue-600 mt-1 text-sm">Sistema de Gestión Escolar</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Iniciar sesión
          </h2>

          {/* Auth error */}
          {authError && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-xs text-red-700 leading-relaxed">{authError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1"
              >
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="tu@correo.com"
                {...register("email")}
                className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.email
                    ? "border-red-400 bg-red-50"
                    : "border-gray-300 bg-white hover:border-blue-400"
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-gray-700"
                >
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => setShowResetModal(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
                >
                  ¿Cambiar contraseña?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register("password")}
                  className={`w-full px-4 py-2.5 pr-10 rounded-lg border text-sm transition-colors outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.password
                      ? "border-red-400 bg-red-50"
                      : "border-gray-300 bg-white hover:border-blue-400"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors text-sm shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar sesión"
              )}
            </button>
          </form>

          {/* Botón para cambiar contraseña directo */}
          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-blue-700 font-medium"
            >
              <KeyRound className="w-3.5 h-3.5" />
              ¿Quieres definir tu propia contraseña? Haz clic aquí
            </button>
          </div>

          {/* Register link */}
          <p className="mt-4 text-center text-xs text-gray-500">
            ¿No tienes cuenta?{" "}
            <Link
              href="/registro"
              className="text-blue-600 font-medium hover:underline"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-blue-400 mt-6">
          © {new Date().getFullYear()} AulaControl · República Dominicana
        </p>
      </div>

      {/* Modal Restablecer Contraseña */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md border border-gray-100 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <KeyRound className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-gray-900 text-base">
                Definir o Cambiar tu Contraseña
              </h3>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Ingresa tu correo y la contraseña que deseas utilizar. Se guardará de inmediato en la base de datos para que puedas iniciar sesión.
            </p>

            {resetSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{resetSuccess}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                  Tu correo electrónico
                </label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                  Nueva Contraseña (mínimo 6 caracteres)
                </label>
                <input
                  type="text"
                  placeholder="Escribe la contraseña que prefieras"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  {resetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Guardar y Usar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
