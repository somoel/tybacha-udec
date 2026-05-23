import { describe, expect, it } from "vitest";
import { rolValido } from "@tybacha/compartido";

describe("app Tybacha", () => {
  it("no acepta adulto mayor como rol de sesion", () => {
    expect(rolValido("adulto_mayor")).toBe(false);
  });
});
