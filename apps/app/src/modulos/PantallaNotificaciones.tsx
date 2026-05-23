import { useMutation, useQuery } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { Text, View } from "react-native";
import { api } from "../servicios/api";
import { LayoutAutenticado } from "../componentes/layout";
import { Boton, Estado, Tarjeta, Titulo, TextoTenue } from "../componentes/ui";

export function PantallaNotificaciones() {
  const query = useQuery({ queryKey: ["notificaciones"], queryFn: () => api<any[]>("/notificaciones") });
  const registrarToken = useMutation({
    mutationFn: async () => {
      const permiso = await Notifications.requestPermissionsAsync();
      if (!permiso.granted) throw new Error("Permiso de notificaciones denegado.");
      const token = await Notifications.getExpoPushTokenAsync();
      return api("/notificaciones/tokens", { method: "POST", body: JSON.stringify({ expo_push_token: token.data, plataforma: "android" }) });
    }
  });
  return (
    <LayoutAutenticado>
      <View className="gap-4">
        <Titulo>Notificaciones</Titulo>
        <TextoTenue>Tokens Expo Push, historial y lectura de mensajes.</TextoTenue>
        <Boton onPress={() => registrarToken.mutate()}>Registrar dispositivo</Boton>
        {registrarToken.error ? <Text className="text-peligro">{registrarToken.error.message}</Text> : null}
        {(query.data ?? []).map((n: any) => (
          <Tarjeta key={n.id_notificacion}>
            <Text className="font-bold text-tinta">{n.titulo}</Text>
            <TextoTenue>{n.mensaje}</TextoTenue>
            <Estado valor={n.estado} />
          </Tarjeta>
        ))}
      </View>
    </LayoutAutenticado>
  );
}
