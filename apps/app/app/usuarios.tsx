import { PantallaListado } from "../src/modulos/PantallaListado";

export default function Usuarios() {
  return (
    <PantallaListado
      titulo="Gestion de usuarios"
      descripcion="Administracion de usuarios autenticables. Adultos mayores no aparecen aqui."
      ruta="/usuarios"
      campos={[
        { clave: "correo", label: "Correo" },
        { clave: "contrasena", label: "Contrasena inicial", seguro: true },
        { clave: "rol", label: "Rol: administrador, profesional o cuidador" },
        { clave: "nombres", label: "Nombres" },
        { clave: "apellidos", label: "Apellidos" }
      ]}
      prepararPayload={(f) => ({ correo: f.correo, contrasena: f.contrasena, rol: f.rol, perfil: { nombres: f.nombres, apellidos: f.apellidos } })}
    />
  );
}
