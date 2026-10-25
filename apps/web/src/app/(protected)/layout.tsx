import type { ReactNode } from "react";
import AuthGuard from "@/components/AuthGuard";

// Todas las páginas dentro de (protected) pasan primero por el guardia
export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}