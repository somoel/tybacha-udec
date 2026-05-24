import { describe, expect, it } from "vitest";
import { permisoDeRol, rolValido, respuestaGeminiPlanSchema } from "../src/compartido";

describe("reglas principales", () => {
  it("no permite adulto mayor como rol autenticable", () => {
    expect(rolValido("adulto_mayor")).toBe(false);
  });

  it("permite que profesional gestione planes", () => {
    expect(permisoDeRol("profesional", "planes:gestionar")).toBe(true);
  });

  it("valida una respuesta IA con cinco ejercicios", () => {
    const respuesta = respuestaGeminiPlanSchema.parse({
      titulo: "Plan seguro",
      objetivo: "Mejorar movilidad",
      ejercicios: ["lunes", "martes", "miercoles", "jueves", "viernes"].map((dia, indice) => ({
        nombre_personalizado: `Ejercicio ${indice + 1}`,
        dia_semana: dia,
        orden: 1,
        dificultad: "bajo",
        instrucciones: "Realizar con apoyo y detener ante dolor."
      }))
    });
    expect(respuesta.ejercicios).toHaveLength(5);
  });
});
