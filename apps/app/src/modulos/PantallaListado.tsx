import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Text, View } from "react-native";
import { api } from "../servicios/api";
import { LayoutAutenticado } from "../componentes/layout";
import { Boton, Campo, Estado, Tarjeta, Titulo, TextoTenue } from "../componentes/ui";

type CampoFormulario = { clave: string; label: string; seguro?: boolean; multiline?: boolean };

export function PantallaListado({
  titulo,
  descripcion,
  ruta,
  campos,
  payloadInicial,
  prepararPayload
}: {
  titulo: string;
  descripcion: string;
  ruta: string;
  campos: CampoFormulario[];
  payloadInicial?: Record<string, unknown>;
  prepararPayload?: (formulario: Record<string, string>) => Record<string, unknown>;
}) {
  const [formulario, setFormulario] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: [ruta], queryFn: () => api<any[]>(ruta) });
  const crear = useMutation({
    mutationFn: () =>
      api(ruta, { method: "POST", body: JSON.stringify(prepararPayload ? prepararPayload(formulario) : { ...payloadInicial, ...formulario }) }),
    onSuccess: async () => {
      setFormulario({});
      await queryClient.invalidateQueries({ queryKey: [ruta] });
    }
  });
  return (
    <LayoutAutenticado>
      <View className="gap-4">
        <Titulo>{titulo}</Titulo>
        <TextoTenue>{descripcion}</TextoTenue>
        <Tarjeta className="gap-3">
          <Text className="font-bold text-tinta">Registrar</Text>
          {campos.map((campo) => (
            <Campo
              key={campo.clave}
              label={campo.label}
              secureTextEntry={campo.seguro}
              multiline={campo.multiline}
              value={formulario[campo.clave] ?? ""}
              onChangeText={(texto) => setFormulario((actual) => ({ ...actual, [campo.clave]: texto }))}
            />
          ))}
          {crear.error ? <Text className="text-peligro">{crear.error instanceof Error ? crear.error.message : "No fue posible guardar."}</Text> : null}
          <Boton disabled={crear.isPending} onPress={() => crear.mutate()}>{crear.isPending ? "Guardando..." : "Guardar"}</Boton>
        </Tarjeta>
        {query.isLoading ? <TextoTenue>Cargando registros...</TextoTenue> : null}
        {query.error ? <Text className="text-peligro">No fue posible cargar datos.</Text> : null}
        <View className="gap-3">
          {(query.data ?? []).length === 0 && !query.isLoading ? <Tarjeta><TextoTenue>Sin registros para mostrar.</TextoTenue></Tarjeta> : null}
          {(query.data ?? []).map((item: any) => (
            <Tarjeta key={String(item.id_usuario ?? item.id_adulto_mayor ?? item.id_plan_ejercicio ?? item.id_notificacion ?? item.id_reporte_generado ?? JSON.stringify(item))}>
              <View className="gap-1">
                <Text className="text-lg font-bold text-tinta">{item.nombres ? `${item.nombres} ${item.apellidos}` : item.titulo ?? item.nombre ?? item.correo ?? "Registro"}</Text>
                <TextoTenue>{item.correo ?? item.telefono ?? item.tipo_reporte ?? item.creado_en ?? item.fecha_actividad ?? ""}</TextoTenue>
                <Estado valor={item.estado ?? item.rol} />
              </View>
            </Tarjeta>
          ))}
        </View>
      </View>
    </LayoutAutenticado>
  );
}
