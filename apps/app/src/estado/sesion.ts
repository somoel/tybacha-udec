import { create } from "zustand";
import type { UsuarioAutenticado } from "@tybacha/compartido";
import { guardarSeguro, leerSeguro } from "../lib/plataforma";

type EstadoSesion = {
  accessToken: string | null;
  usuario: UsuarioAutenticado | null;
  cargando: boolean;
  iniciar: (accessToken: string, refreshToken: string | null, usuario: UsuarioAutenticado) => Promise<void>;
  fijarAccessToken: (token: string | null) => void;
  fijarUsuario: (usuario: UsuarioAutenticado | null) => void;
  cerrar: () => Promise<void>;
  cargarRefreshToken: () => Promise<string | null>;
};

export const useSesion = create<EstadoSesion>((set) => ({
  accessToken: null,
  usuario: null,
  cargando: false,
  iniciar: async (accessToken, refreshToken, usuario) => {
    if (refreshToken) await guardarSeguro("tybacha_refresh", refreshToken);
    set({ accessToken, usuario });
  },
  fijarAccessToken: (accessToken) => set({ accessToken }),
  fijarUsuario: (usuario) => set({ usuario }),
  cerrar: async () => {
    await guardarSeguro("tybacha_refresh", null);
    set({ accessToken: null, usuario: null });
  },
  cargarRefreshToken: () => leerSeguro("tybacha_refresh")
}));
