"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";

// Protege las páginas que requieren sesión
export default function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const estado = useAppSelector((s) => s.auth.estado);

  useEffect(() => {
    // Si ya sabemos que no hay sesión, mandamos al login.
    // replace (no push) para que "atrás" no regrese a esta página.
    if (estado === "anonimo") {
      router.replace("/login");
    }
  }, [estado, router]);

  // Mientras no sepamos si hay sesión, o mientras redirige, no mostramos la página
  if (estado !== "autenticado") {
    return <p className="p-6 text-gray-600">Cargando...</p>;
  }

  return <>{children}</>;
}