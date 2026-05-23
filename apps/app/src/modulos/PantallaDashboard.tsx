import { useQuery } from "@tanstack/react-query";
import { Text, View } from "react-native";
import { api } from "../servicios/api";
import { Tarjeta, Titulo, TextoTenue } from "../componentes/ui";
import { LayoutAutenticado } from "../componentes/layout";

export function PantallaDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => ({
      adultos: await api<any[]>("/adultos-mayores?limite=5"),
      notificaciones: await api<any[]>("/notificaciones"),
      reportes: await api<any[]>("/reportes").catch(() => [])
    })
  });
  return (
    <LayoutAutenticado>
      <View className="gap-4">
        <Titulo>Dashboard principal</Titulo>
        <TextoTenue>Metricas operativas de seguimiento, notificaciones y gestion clinica.</TextoTenue>
        {isLoading ? <TextoTenue>Cargando informacion...</TextoTenue> : null}
        {error ? <Text className="text-peligro">No fue posible cargar el dashboard.</Text> : null}
        <View className="grid gap-4 md:grid-cols-3">
          <Tarjeta><Text className="text-3xl font-bold text-primario">{data?.adultos?.length ?? 0}</Text><TextoTenue>Adultos visibles</TextoTenue></Tarjeta>
          <Tarjeta><Text className="text-3xl font-bold text-info">{data?.notificaciones?.length ?? 0}</Text><TextoTenue>Notificaciones</TextoTenue></Tarjeta>
          <Tarjeta><Text className="text-3xl font-bold text-acento">{data?.reportes?.length ?? 0}</Text><TextoTenue>Reportes generados</TextoTenue></Tarjeta>
        </View>
      </View>
    </LayoutAutenticado>
  );
}
