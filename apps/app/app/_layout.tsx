import "../global.css";
import { Stack } from "expo-router";
import { ProveedorApp } from "../src/componentes/layout";

export default function LayoutRaiz() {
  return (
    <ProveedorApp>
      <Stack screenOptions={{ headerShown: false }} />
    </ProveedorApp>
  );
}
