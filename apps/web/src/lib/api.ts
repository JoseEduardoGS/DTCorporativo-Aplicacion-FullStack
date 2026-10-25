import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { UsuarioSesion } from "@trituradora/shared";
import type { AppStore } from "@/store/store";
import { sesionCerrada, tokenRenovado } from "@/store/authSlice";

// Dirección del backend (viene del .env.local)
const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// El "mensajero": cliente ya configurado para hablar con nuestro backend.
// withCredentials permite enviar/recibir la cookie del refresh token.
export const api = axios.create({ baseURL, withCredentials: true });

// Referencia al store de Redux. Empieza vacía y se llena con injectStore.
// Es necesaria porque este archivo no es un componente y no puede usar hooks.
let store: AppStore | null = null;

// Lo llama StoreProvider al crear el store, para entregárselo al mensajero.
export function injectStore(s: AppStore) {
  store = s;
}

// Forma de la respuesta de /auth/login y /auth/refresh
export interface RespuestaSesion {
  accessToken: string;
  usuario: UsuarioSesion;
}

// Pide un token nuevo usando la cookie del refresh token.
// Usa axios "normal" (no `api`) a propósito: si el refresh mismo fallara
// con 401, el interceptor intentaría renovar otra vez, y entraría en bucle.
export async function refrescarSesion(): Promise<RespuestaSesion> {
  const { data } = await axios.post<RespuestaSesion>(`${baseURL}/auth/refresh`, null, {
    withCredentials: true,
  });
  return data;
}

// Guarda la renovación en curso. null = nadie está renovando ahora mismo.
// Ahora guarda la respuesta completa (token + usuario), no solo el token.
let refrescando: Promise<RespuestaSesion> | null = null;

// Renueva la sesión con la cookie del refresh token.
// Si ya hay una renovación en curso, reutiliza esa misma en vez de iniciar otra.
export function renovarSesion(): Promise<RespuestaSesion> {
  if (!refrescando) {
    refrescando = refrescarSesion().finally(() => {
      // Al terminar, liberamos para que se pueda renovar en el futuro
      refrescando = null;
    });
  }
  return refrescando;
}


// ANTES de cada petición: pega el token actual en el header Authorization
api.interceptors.request.use((config) => {
  const token = store?.getState().auth.accessToken;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log("se añadio el header");
  }
  return config;
});

// Configuración de petición de axios + un sello para saber si ya se reintentó
type ConfigConReintento = InternalAxiosRequestConfig & { _reintentado?: boolean };

// DESPUÉS de cada respuesta: si es un 401, intenta renovar el token y reintenta
api.interceptors.response.use(
  // Respuesta exitosa: se deja pasar sin tocar
  (respuesta) => respuesta,

  // Respuesta con error
  async (error: AxiosError) => {
    const original = error.config as ConfigConReintento | undefined;
    // Las rutas /auth/* nunca se reintentan (ej. contraseña incorrecta en login)
    const esRutaAuth = original?.url?.startsWith("/auth/");

    // Casos en que NO se reintenta: error distinto de 401, ya se reintentó, o es ruta /auth
    if (error.response?.status !== 401 || !original || original._reintentado || esRutaAuth) {
      return Promise.reject(error);
    }

    // Marcamos la petición para no reintentarla más de una vez
    original._reintentado = true;

    try {
      // Pedimos un token nuevo y lo guardamos en Redux
      const { accessToken: nuevoToken } = await renovarSesion();
      store?.dispatch(tokenRenovado(nuevoToken));

      // Reenviamos la petición original con el token nuevo
      original.headers.Authorization = `Bearer ${nuevoToken}`;
      
      return api(original);
    } catch {
      // No se pudo renovar: la sesión expiró de verdad, se cierra
      store?.dispatch(sesionCerrada());
      return Promise.reject(error);
    }
  }
);