"use client";

import { useState, type ReactNode } from "react";
import { Provider } from "react-redux";
import { obtenerStore } from "./store";
import { injectStore } from "@/lib/api";

export default function StoreProvider({ children }: { children: ReactNode }) {
  // En desarrollo React puede ejecutar esta función dos veces (Strict Mode).
  // Como obtenerStore() devuelve siempre el mismo store en el navegador,
  // las dos ejecuciones entregan el mismo y ya no hay dos stores distintos.
  const [store] = useState(() => {
    const s = obtenerStore(); // el store de la app
    injectStore(s); // se lo entregamos al mensajero (api.ts)
    return s; // y es el mismo que usa la pantalla
  });

  return <Provider store={store}>{children}</Provider>;
}