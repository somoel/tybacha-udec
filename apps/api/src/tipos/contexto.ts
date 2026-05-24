import type { UsuarioAutenticado } from "../compartido";

export type VariablesContexto = {
  usuario?: UsuarioAutenticado;
  direccionIp?: string;
  agenteUsuario?: string;
};
