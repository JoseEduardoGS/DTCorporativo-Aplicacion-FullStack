"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { loginSchema, type LoginInput } from "@trituradora/shared";
import { api, type RespuestaSesion } from "@/lib/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { sesionIniciada } from "@/store/authSlice";


export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const estado = useAppSelector((s) => s.auth.estado);

  // Si ya hay sesión (por login o porque se restauró), va a la página principal
  useEffect(() => {
    if (estado === "autenticado") {
      router.replace("/");
    }
  }, [estado, router]);

  // Mensaje de error que viene del servidor (ej. contraseña incorrecta)
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  // Configura el formulario: valida con el esquema loginSchema antes de enviar
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  // Se ejecuta solo si los datos pasaron la validación
  async function onSubmit(datos: LoginInput) {
    setErrorServidor(null);

    try {
      // Pide el login al backend
      const { data } = await api.post<RespuestaSesion>("/auth/login", datos);

      // Guarda token y usuario en Redux, y va a la página principal
      dispatch(sesionIniciada(data));
    } catch (error) {
      // 401 = credenciales incorrectas; cualquier otra cosa = problema de conexión
      if (isAxiosError(error) && error.response?.status === 401) {
        setErrorServidor("Email o contraseña incorrectos");
      } else {
        setErrorServidor("No se pudo conectar con el servidor. Intenta de nuevo.");
      }
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm space-y-4 rounded-lg bg-white p-6 shadow"
        noValidate
      >
        <h1 className="text-xl font-semibold text-gray-900">Iniciar sesión</h1>

        {/* Campo de email */}
        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900"
            {...register("email")}
          />
          {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
        </div>

        {/* Campo de contraseña */}
        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900"
            {...register("password")}
          />
          {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
        </div>

        {/* Error que viene del servidor */}
        {errorServidor && (
          <p role="alert" className="rounded bg-red-50 p-2 text-sm text-red-700">
            {errorServidor}
          </p>
        )}

        {/* El botón se desactiva mientras se envía, para evitar doble clic */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {isSubmitting ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}