import type { ReactNode } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

export function Tarjeta({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <View className={`rounded-ty border border-linea bg-superficie p-4 shadow-sm ${className}`}>{children}</View>;
}

export function Titulo({ children }: { children: ReactNode }) {
  return <Text className="text-2xl font-bold text-tinta">{children}</Text>;
}

export function TextoTenue({ children }: { children: ReactNode }) {
  return <Text className="text-sm text-tenue">{children}</Text>;
}

export function Boton({
  children,
  onPress,
  variante = "primario",
  disabled = false
}: {
  children: ReactNode;
  onPress?: () => void;
  variante?: "primario" | "secundario" | "peligro";
  disabled?: boolean;
}) {
  const clases =
    variante === "primario"
      ? "bg-primario"
      : variante === "peligro"
        ? "bg-peligro"
        : "bg-white border border-linea";
  const texto = variante === "secundario" ? "text-tinta" : "text-white";
  return (
    <Pressable disabled={disabled} onPress={onPress} className={`min-h-11 items-center justify-center rounded-ty px-4 ${clases} ${disabled ? "opacity-50" : ""}`}>
      <Text className={`font-semibold ${texto}`}>{children}</Text>
    </Pressable>
  );
}

export function Campo({
  label,
  value,
  onChangeText,
  secureTextEntry,
  placeholder,
  multiline
}: {
  label: string;
  value?: string;
  onChangeText?: (texto: string) => void;
  secureTextEntry?: boolean;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <View className="gap-1">
      <Text className="text-sm font-semibold text-tinta">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        placeholder={placeholder}
        multiline={multiline}
        className="min-h-11 rounded-ty border border-linea bg-white px-3 py-2 text-tinta"
      />
    </View>
  );
}

export function Estado({ valor }: { valor?: string }) {
  const texto = valor ?? "sin_estado";
  const color = texto.includes("activo") || texto.includes("vigente") || texto.includes("completado") ? "bg-exito/10 text-exito" : texto.includes("inactivo") || texto.includes("fallida") ? "bg-peligro/10 text-peligro" : "bg-advertencia/10 text-advertencia";
  return <Text className={`self-start rounded-full px-2 py-1 text-xs font-bold ${color}`}>{texto}</Text>;
}
