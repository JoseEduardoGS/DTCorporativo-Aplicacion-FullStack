import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";

export const makeStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
    },
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

// Store único del navegador (empieza vacío)
let storeDelNavegador: AppStore | undefined;

// Devuelve el store que debe usar la app
export function obtenerStore(): AppStore {
  // En el servidor: uno nuevo cada vez, para no mezclar datos entre usuarios
  if (typeof window === "undefined") return makeStore();

  // En el navegador: se crea una sola vez y se reutiliza siempre.
  // Así, aunque React pida el store varias veces, todos reciben el mismo.
  if (!storeDelNavegador) storeDelNavegador = makeStore();
  return storeDelNavegador;
}