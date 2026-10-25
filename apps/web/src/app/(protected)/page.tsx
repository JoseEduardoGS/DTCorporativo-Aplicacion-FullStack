"use client";

import { api } from "@/lib/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { sesionCerrada } from "@/store/authSlice";

export default function InicioPage() {
  const dispatch = useAppDispatch();
  const usuario = useAppSelector((s) => s.auth.usuario);

  async function cerrarSesion() {
    try {
      // Le pide al backend que borre la cookie del refresh token
      await api.post("/auth/logout");
    } catch {
      // Si falla la petición, igual cerramos la sesión en este navegador
    }
    // Limpia la sesión en Redux; el guardia nos manda al login
    dispatch(sesionCerrada());
  }

  return (
    <main className="space-y-4 p-6">
      <h1 className="text-xl font-semibold text-gray-900">Inicio</h1>
      <p className="text-gray-700">
        Hola, {usuario?.nombre} ({usuario?.rol})
      </p>
      <button
        onClick={cerrarSesion}
        className="rounded bg-gray-800 px-4 py-2 text-white"
      >
        Cerrar sesión
      </button>
    </main>
  );
}