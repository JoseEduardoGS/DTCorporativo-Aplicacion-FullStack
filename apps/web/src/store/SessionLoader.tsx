"use client";

import { useEffect } from "react";
import { renovarSesion } from "@/lib/api";
import { useAppDispatch } from "@/store/hooks";
import { sesionIniciada, sesionCerrada } from "@/store/authSlice";

// Al cargar la app, intenta recuperar la sesión usando la cookie del refresh token.
// No dibuja nada: solo hace el trabajo y actualiza el estado de Redux.
export default function SessionLoader() {
const dispatch = useAppDispatch();

useEffect(() => {
renovarSesion()
// Había sesión válida: se restaura (estado "autenticado")
.then((datos) => dispatch(sesionIniciada(datos)))
// No había sesión: el usuario queda como anónimo
.catch(() => dispatch(sesionCerrada()));
}, [dispatch]);

return null;
}