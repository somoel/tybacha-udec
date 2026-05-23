import { PantallaListado } from "../../src/modulos/PantallaListado";

export default function Consentimientos() {
  return (
    <PantallaListado
      titulo="Consentimientos"
      descripcion="Registro, consulta de vigente, revocacion e historial."
      ruta="/consentimientos"
      campos={[
        { clave: "id_adulto_mayor", label: "ID adulto mayor" },
        { clave: "tipo_consentimiento", label: "Tipo consentimiento" },
        { clave: "otorgado_por_nombre", label: "Otorgado por" }
      ]}
      prepararPayload={(f) => ({
        id_adulto_mayor: Number(f.id_adulto_mayor),
        tipo_consentimiento: f.tipo_consentimiento || "tratamiento_datos",
        estado: "vigente",
        otorgado_por_nombre: f.otorgado_por_nombre
      })}
    />
  );
}
