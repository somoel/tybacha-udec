import { PantallaListado } from "../../src/modulos/PantallaListado";

export default function Sft() {
  return (
    <PantallaListado
      titulo="Pruebas SFT"
      descripcion="Baterias, pruebas, aplicaciones y resultados funcionales."
      ruta="/sft/baterias"
      campos={[
        { clave: "nombre", label: "Nombre de bateria" },
        { clave: "descripcion", label: "Descripcion", multiline: true },
        { clave: "version", label: "Version" }
      ]}
    />
  );
}
