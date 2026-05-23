import { describe, expect, it } from "vitest";
import { loginSchema, rolValido } from "../index";

describe("validaciones compartidas", () => {
  it("rechaza el rol adulto_mayor", () => {
    expect(rolValido("adulto_mayor")).toBe(false);
  });

  it("normaliza correo de login", () => {
    const datos = loginSchema.parse({ correo: "ADMIN@TYBACHA.LOCAL", contrasena: "secreta" });
    expect(datos.correo).toBe("admin@tybacha.local");
  });
});
