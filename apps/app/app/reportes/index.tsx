import { PantallaListado } from "../../src/modulos/PantallaListado";

export default function Reportes() {
  return (
    <PantallaListado
      titulo="Reportes"
      descripcion="Generacion y exportacion basica CSV o JSON."
      ruta="/reportes/generar"
      campos={[
        { clave: "tipo_reporte", label: "Tipo: progreso, actividad, sft, cumplimiento o administrativo" },
        { clave: "formato", label: "Formato: json o csv" }
      ]}
      prepararPayload={(f) => ({ tipo_reporte: f.tipo_reporte || "progreso", formato: f.formato || "json" })}
    />
  );
}
