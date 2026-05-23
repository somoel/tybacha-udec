import { Link, router } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSesion } from "../estado/sesion";
import { Boton, TextoTenue } from "./ui";

export const queryClient = new QueryClient();

const rutas = [
  ["dashboard", "Dashboard"],
  ["usuarios", "Usuarios"],
  ["profesionales", "Profesionales"],
  ["cuidadores", "Cuidadores"],
  ["adultos-mayores", "Adultos mayores"],
  ["sft", "SFT"],
  ["planes", "Planes"],
  ["seguimiento", "Seguimiento"],
  ["notificaciones", "Notificaciones"],
  ["reportes", "Reportes"],
  ["consentimientos", "Consentimientos"],
  ["auditoria", "Auditoria"],
  ["perfil", "Perfil"]
];

export function ProveedorApp({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export function LayoutAutenticado({ children }: { children: React.ReactNode }) {
  const { usuario, cerrar } = useSesion();
  return (
    <View className="min-h-screen flex-1 bg-fondo md:flex-row">
      <View className="border-linea bg-white/95 p-4 md:w-72 md:border-r">
        <View className="mb-4 flex-row items-center gap-3 border-b border-linea pb-4">
          <View className="h-11 w-11 items-center justify-center rounded-ty bg-primario">
            <Text className="font-bold text-white">TY</Text>
          </View>
          <View>
            <Text className="text-lg font-bold text-tinta">Tybacha</Text>
            <TextoTenue>{usuario?.rol ?? "sesion"}</TextoTenue>
          </View>
        </View>
        <View className="gap-1">
          {rutas.map(([href, label]) => (
            <Link key={href} href={`/${href}` as any} className="rounded-ty px-3 py-2 text-tinta hover:bg-primario-suave">
              {label}
            </Link>
          ))}
        </View>
        <View className="mt-4">
          <Boton
            variante="secundario"
            onPress={async () => {
              await cerrar();
              router.replace("/login");
            }}
          >
            Cerrar sesion
          </Boton>
        </View>
      </View>
      <ScrollView className="flex-1">
        <View className="border-b border-linea bg-fondo/90 p-5">
          <Text className="text-xl font-bold text-tinta">{usuario?.nombres} {usuario?.apellidos}</Text>
          <TextoTenue>{usuario?.correo}</TextoTenue>
        </View>
        <View className="p-4 md:p-6">{children}</View>
      </ScrollView>
    </View>
  );
}
