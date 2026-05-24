import { createHash, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import type { Rol, UsuarioAutenticado } from "../compartido";
import { permisosPorRol } from "../compartido";
import { configuracion } from "./configuracion";

const accessSecret = new TextEncoder().encode(configuracion.JWT_ACCESS_SECRET);
const refreshSecret = new TextEncoder().encode(configuracion.JWT_REFRESH_SECRET);

export async function hashContrasena(contrasena: string) {
  return bcrypt.hash(contrasena, configuracion.BCRYPT_SALT_ROUNDS);
}

export async function compararContrasena(contrasena: string, hash: string) {
  return bcrypt.compare(contrasena, hash);
}

export function sha256(valor: string | Buffer) {
  return createHash("sha256").update(valor).digest("hex");
}

export async function crearAccessToken(usuario: UsuarioAutenticado) {
  return new SignJWT({
    correo: usuario.correo,
    rol: usuario.rol,
    permisos: permisosPorRol[usuario.rol]
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(usuario.id_usuario))
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(accessSecret);
}

export async function crearRefreshToken(idUsuario: number, idSesion: number) {
  const identificador = randomUUID();
  const token = await new SignJWT({ sid: idSesion, jti: identificador })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(idUsuario))
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(refreshSecret);
  return { token, hash: sha256(token) };
}

export async function verificarAccessToken(token: string) {
  const verificado = await jwtVerify(token, accessSecret);
  return {
    id_usuario: Number(verificado.payload.sub),
    rol: verificado.payload.rol as Rol,
    permisos: (verificado.payload.permisos as string[]) ?? []
  };
}

export async function verificarRefreshToken(token: string) {
  const verificado = await jwtVerify(token, refreshSecret);
  return {
    id_usuario: Number(verificado.payload.sub),
    id_sesion_usuario: Number(verificado.payload.sid)
  };
}
