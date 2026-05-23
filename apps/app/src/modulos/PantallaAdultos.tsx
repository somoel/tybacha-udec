import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Image, Text, View } from "react-native";
import { api } from "../servicios/api";
import { encolarOperacion, sincronizarPendientes } from "../sincronizacion/cola";
import { LayoutAutenticado } from "../componentes/layout";
import { Boton, Campo, Estado, Tarjeta, Titulo, TextoTenue } from "../componentes/ui";

export function PantallaAdultos() {
  const [formulario, setFormulario] = useState<Record<string, string>>({ genero: "no_informa" });
  const [foto, setFoto] = useState<{ uri: string; base64: string; tipo_mime: "image/jpeg" | "image/png" | "image/webp" } | null>(null);
  const queryClient = useQueryClient();
  const adultos = useQuery({ queryKey: ["adultos"], queryFn: () => api<any[]>("/adultos-mayores") });
  const crear = useMutation({
    mutationFn: () => api<{ id_adulto_mayor: number }>("/adultos-mayores", { method: "POST", body: JSON.stringify(formulario) }),
    onSuccess: async (datos) => {
      if (foto) {
        await api(`/adultos-mayores/${datos.id_adulto_mayor}/foto`, { method: "PUT", body: JSON.stringify({ base64: foto.base64, tipo_mime: foto.tipo_mime }) });
      }
      setFormulario({ genero: "no_informa" });
      setFoto(null);
      await queryClient.invalidateQueries({ queryKey: ["adultos"] });
    },
    onError: async () => {
      await encolarOperacion({
        id_local: `adulto-${Date.now()}`,
        entidad: "adulto_mayor",
        accion: "crear",
        payload: formulario,
        requiere_autenticacion: true
      });
    }
  });

  async function seleccionarFoto() {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) return;
    const seleccion = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, base64: false, quality: 1 });
    if (seleccion.canceled) return;
    const manipulada = await ImageManipulator.manipulateAsync(seleccion.assets[0].uri, [{ resize: { width: 720 } }], {
      compress: 0.72,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true
    });
    setFoto({ uri: manipulada.uri, base64: manipulada.base64 ?? "", tipo_mime: "image/jpeg" });
  }

  return (
    <LayoutAutenticado>
      <View className="gap-4">
        <Titulo>Gestion de adultos mayores</Titulo>
        <TextoTenue>Crear fichas, consultar estado, cargar foto y sincronizar operaciones offline.</TextoTenue>
        <Tarjeta className="gap-3">
          <Campo label="Nombres" value={formulario.nombres ?? ""} onChangeText={(v) => setFormulario({ ...formulario, nombres: v })} />
          <Campo label="Apellidos" value={formulario.apellidos ?? ""} onChangeText={(v) => setFormulario({ ...formulario, apellidos: v })} />
          <Campo label="Fecha nacimiento YYYY-MM-DD" value={formulario.fecha_nacimiento ?? ""} onChangeText={(v) => setFormulario({ ...formulario, fecha_nacimiento: v })} />
          <Campo label="Telefono" value={formulario.telefono ?? ""} onChangeText={(v) => setFormulario({ ...formulario, telefono: v })} />
          <Campo label="Direccion" value={formulario.direccion ?? ""} onChangeText={(v) => setFormulario({ ...formulario, direccion: v })} />
          <View className="flex-row flex-wrap gap-2">
            <Boton variante="secundario" onPress={seleccionarFoto}>Seleccionar foto</Boton>
            <Boton onPress={() => crear.mutate()} disabled={crear.isPending}>{crear.isPending ? "Guardando..." : "Crear adulto mayor"}</Boton>
            <Boton variante="secundario" onPress={() => sincronizarPendientes()}>Sincronizar</Boton>
          </View>
          {foto ? <Image source={{ uri: foto.uri }} className="h-28 w-28 rounded-ty" /> : null}
          {crear.error ? <Text className="text-advertencia">No se pudo enviar ahora. La operacion quedo en cola offline.</Text> : null}
        </Tarjeta>
        <View className="gap-3">
          {(adultos.data ?? []).map((adulto: any) => (
            <Tarjeta key={adulto.id_adulto_mayor}>
              <Text className="text-lg font-bold text-tinta">{adulto.nombres} {adulto.apellidos}</Text>
              <TextoTenue>{adulto.fecha_nacimiento} | {adulto.ciudad}</TextoTenue>
              <Estado valor={adulto.estado} />
            </Tarjeta>
          ))}
        </View>
      </View>
    </LayoutAutenticado>
  );
}
