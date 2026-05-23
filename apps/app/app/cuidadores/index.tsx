import { PantallaListado } from "../../src/modulos/PantallaListado";

export default function Cuidadores() {
  return (
    <PantallaListado
      titulo="Gestion de cuidadores"
      descripcion="Los profesionales crean cuidadores y los asocian a su alcance."
      ruta="/cuidadores"
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
