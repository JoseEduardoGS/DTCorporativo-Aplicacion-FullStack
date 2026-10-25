import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { UsuarioSesion } from "@trituradora/shared";

export type EstadoSesion = "desconocido" | "autenticado" | "anonimo";

interface AuthState {
  accessToken: string | null;
  usuario: UsuarioSesion | null;
  estado: EstadoSesion;
}

const initialState: AuthState = {
  accessToken: null,
  usuario: null,
  estado: "desconocido",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    sesionIniciada(
      state,
      action: PayloadAction<{ accessToken: string; usuario: UsuarioSesion }>
    ) {
      state.accessToken = action.payload.accessToken;
      console.log(action.payload.accessToken);
      state.usuario = action.payload.usuario;
      state.estado = "autenticado";
    },
    tokenRenovado(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
    },
    sesionCerrada(state) {
      state.accessToken = null;
      state.usuario = null;
      state.estado = "anonimo";
    },
  },
});

export const { sesionIniciada, tokenRenovado, sesionCerrada } = authSlice.actions;
export default authSlice.reducer;