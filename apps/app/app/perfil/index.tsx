import { Text, View } from "react-native";
import { LayoutAutenticado } from "../../src/componentes/layout";
import { Tarjeta, Titulo, TextoTenue } from "../../src/componentes/ui";
import { useSesion } from "../../src/estado/sesion";

export default function Perfil() {
  const usuario = useSesion((s) => s.usuario);
  return (
    <LayoutAutenticado>
      <View className="gap-4">
        <Titulo>Perfil</Titulo>
        <Tarjeta>
          <Text className="text-xl font-bold text-tinta">{usuario?.nombres} {usuario?.apellidos}</Text>
          <TextoTenue>{usuario?.correo}</TextoTenue>
          <TextoTenue>Rol: {usuario?.rol}</TextoTenue>
        </Tarjeta>
      </View>
    </LayoutAutenticado>
  );
}
