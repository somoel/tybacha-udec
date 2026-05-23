import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Text, View } from "react-native";
import { api } from "../servicios/api";
import { encolarOperacion } from "../sincronizacion/cola";
import { LayoutAutenticado } from "../componentes/layout";
import { Boton, Campo, Estado, Tarjeta, Titulo, TextoTenue } from "../componentes/ui";

export function PantallaSeguimiento() {
  const [idAdulto, setIdAdulto] = useState("");
  const [resumen, setResumen] = useState("");
  const queryClient = useQueryClient();
  const seguimiento = useQuery({ queryKey: ["seguimiento", idAdulto], queryFn: () => (idAdulto ? api<any>(`/seguimiento/adultos/${idAdulto}`) : Promise.resolve({ actividades: [], ejercicios: [] })) });
  const registrar = useMutation({
    mutationFn: () =>
      api("/seguimiento/actividades", {
        method: "POST",
        body: JSON.stringify({
          id_adulto_mayor: Number(idAdulto),
          fecha_actividad: new Date().toISOString().slice(0, 10),
          resumen,
          nivel_energia: "medio"
        })
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["seguimiento", idAdulto] }),
    onError: async () =>
      encolarOperacion({
        id_local: `actividad-${Date.now()}`,
        entidad: "registro_actividad_diaria",
        accion: "registrar",
        payload: { id_adulto_mayor: Number(idAdulto), fecha_actividad: new Date().toISOString().slice(0, 10), resumen, nivel_energia: "medio" },
        requiere_autenticacion: true
      })
  });
  return (
    <LayoutAutenticado>
      <View className="gap-4">
        <Titulo>Seguimiento diario</Titulo>
        <TextoTenue>Registrar actividad, revisar bitacora y estados de ejercicios.</TextoTenue>
        <Tarjeta className="gap-3">
          <Campo label="ID adulto mayor" value={idAdulto} onChangeText={setIdAdulto} />
          <Campo label="Resumen de actividad" value={resumen} onChangeText={setResumen} multiline />
          <Boton disabled={!idAdulto || registrar.isPending} onPress={() => registrar.mutate()}>Registrar actividad</Boton>
          {registrar.error ? <Text className="text-advertencia">No se pudo enviar ahora. Quedo en cola offline.</Text> : null}
        </Tarjeta>
        {(seguimiento.data?.actividades ?? []).map((actividad: any) => (
          <Tarjeta key={actividad.id_registro_actividad_diaria}>
            <Text className="font-bold text-tinta">{actividad.fecha_actividad}</Text>
            <TextoTenue>{actividad.resumen}</TextoTenue>
            <Estado valor={actividad.nivel_energia} />
          </Tarjeta>
        ))}
      </View>
    </LayoutAutenticado>
  );
}
