import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Text, View } from "react-native";
import { api } from "../servicios/api";
import { LayoutAutenticado } from "../componentes/layout";
import { Boton, Campo, Estado, Tarjeta, Titulo, TextoTenue } from "../componentes/ui";

const ejerciciosBase = ["lunes", "martes", "miercoles", "jueves", "viernes"].map((dia, indice) => ({
  nombre_personalizado: `Ejercicio ${indice + 1}`,
  dia_semana: dia,
  orden: 1,
  dificultad: "bajo",
  duracion_segundos: 900,
  instrucciones: "Realizar con apoyo cercano y detener ante dolor."
}));

export function PantallaPlanes() {
  const [idAdulto, setIdAdulto] = useState("");
  const [titulo, setTitulo] = useState("Plan semanal personalizado");
  const planes = useQuery({ queryKey: ["planes", idAdulto], queryFn: () => (idAdulto ? api<any[]>(`/planes/adultos/${idAdulto}`) : Promise.resolve([])) });
  const manual = useMutation({
    mutationFn: () =>
      api("/planes", {
        method: "POST",
        body: JSON.stringify({
          id_adulto_mayor: Number(idAdulto),
          titulo,
          objetivo: "Mejorar movilidad, fuerza y seguridad funcional.",
          nivel_dificultad: "bajo",
          ejercicios: ejerciciosBase
        })
      })
  });
  const ia = useMutation({
    mutationFn: () =>
      api("/planes/generar-ia", {
        method: "POST",
        body: JSON.stringify({ id_adulto_mayor: Number(idAdulto), objetivo: "Plan funcional seguro", nivel_dificultad: "bajo" })
      })
  });
  return (
    <LayoutAutenticado>
      <View className="gap-4">
        <Titulo>Planes de ejercicio</Titulo>
        <TextoTenue>Crear planes manuales, generar con Gemini, revisar y asignar.</TextoTenue>
        <Tarjeta className="gap-3">
          <Campo label="ID adulto mayor" value={idAdulto} onChangeText={setIdAdulto} />
          <Campo label="Titulo plan manual" value={titulo} onChangeText={setTitulo} />
          <View className="flex-row flex-wrap gap-2">
            <Boton disabled={!idAdulto || manual.isPending} onPress={() => manual.mutate()}>Crear plan manual</Boton>
            <Boton variante="secundario" disabled={!idAdulto || ia.isPending} onPress={() => ia.mutate()}>Generar plan con IA</Boton>
          </View>
          {manual.error || ia.error ? <Text className="text-peligro">{(manual.error ?? ia.error) instanceof Error ? (manual.error ?? ia.error)?.message : "No fue posible crear plan."}</Text> : null}
        </Tarjeta>
        {(planes.data ?? []).map((plan: any) => (
          <Tarjeta key={plan.id_plan_ejercicio}>
            <Text className="text-lg font-bold text-tinta">{plan.titulo}</Text>
            <TextoTenue>{plan.origen} | {plan.nivel_dificultad}</TextoTenue>
            <Estado valor={plan.estado} />
          </Tarjeta>
        ))}
      </View>
    </LayoutAutenticado>
  );
}
