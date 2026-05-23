import { PantallaListado } from "../../src/modulos/PantallaListado";

export default function Profesionales() {
  return (
    <PantallaListado
      titulo="Gestion de profesionales"
      descripcion="Los administradores crean profesionales autenticables."
      ruta="/profesionales"
      campos={[
        { clave: "correo", label: "Correo" },
        { clave: "contrasena", label: "Contrasena inicial", seguro: true },
        { clave: "nombres", label: "Nombres" },
        { clave: "apellidos", label: "Apellidos" },
        { clave: "telefono", label: "Telefono" }
      ]}
      prepararPayload={(f) => ({ correo: f.correo, contrasena: f.contrasena, perfil: { nombres: f.nombres, apellidos: f.apellidos, telefono: f.telefono } })}
    />
  );
}
