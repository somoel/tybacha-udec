export const roles = ["administrador", "profesional", "cuidador"] as const;

export type Rol = (typeof roles)[number];

export const permisosPorRol: Record<Rol, string[]> = {
  administrador: [
    "dashboard:ver",
    "usuarios:gestionar",
    "profesionales:gestionar",
    "cuidadores:gestionar",
    "adultos_mayores:gestionar",
    "historial_medico:gestionar",
    "sft:gestionar",
    "planes:gestionar",
    "seguimiento:ver",
    "notificaciones:gestionar",
    "reportes:ver",
    "auditoria:ver",
    "consentimientos:gestionar",
    "sincronizacion:gestionar"
  ],
  profesional: [
    "dashboard:ver",
    "cuidadores:gestionar",
    "adultos_mayores:ver",
    "historial_medico:gestionar",
    "sft:gestionar",
    "planes:gestionar",
    "seguimiento:ver",
    "notificaciones:ver",
    "reportes:ver",
    "consentimientos:gestionar"
  ],
  cuidador: [
    "dashboard:ver",
    "adultos_mayores:gestionar_asignados",
    "historial_medico:ver_asignados",
    "planes:ver_asignados",
    "seguimiento:gestionar_asignados",
    "notificaciones:ver",
    "sincronizacion:gestionar"
  ]
};

export function rolValido(rol: string): rol is Rol {
  return roles.includes(rol as Rol);
}

export function permisoDeRol(rol: Rol, permiso: string): boolean {
  return permisosPorRol[rol].includes(permiso);
}
