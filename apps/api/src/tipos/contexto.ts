import type { UsuarioAutenticado } from "@tybacha/compartido";

export type VariablesContexto = {
  usuario?: UsuarioAutenticado;
  direccionIp?: string;
  agenteUsuario?: string;
};
