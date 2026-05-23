import { useQuery } from "@tanstack/react-query";
import { Text, View } from "react-native";
import { LayoutAutenticado } from "../../src/componentes/layout";
import { Estado, Tarjeta, Titulo, TextoTenue } from "../../src/componentes/ui";
import { api } from "../../src/servicios/api";

export default function Auditoria() {
  const cambios = useQuery({ queryKey: ["auditoria", "cambios"], queryFn: () => api<any[]>("/auditoria/cambios") });
  return (
    <LayoutAutenticado>
      <View className="gap-4">
        <Titulo>Auditoria</Titulo>
        <TextoTenue>Trazabilidad de cambios, accesos sensibles y autenticacion.</TextoTenue>
        {(cambios.data ?? []).map((item: any) => (
          <Tarjeta key={item.id_auditoria_cambio}>
            <Text className="font-bold text-tinta">{item.tabla_afectada}</Text>
            <TextoTenue>{item.creado_en} | usuario {item.realizado_por}</TextoTenue>
            <Estado valor={item.accion} />
          </Tarjeta>
        ))}
      </View>
    </LayoutAutenticado>
  );
}
