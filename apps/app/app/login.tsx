import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Text, View } from "react-native";
import { z } from "zod";
import { loginSchema } from "@tybacha/compartido";
import { Boton, Campo, Tarjeta, Titulo, TextoTenue } from "../src/componentes/ui";
import { api } from "../src/servicios/api";
import { useSesion } from "../src/estado/sesion";

type FormularioLogin = z.infer<typeof loginSchema>;

export default function Login() {
  const { iniciar } = useSesion();
  const { control, handleSubmit, formState, setError } = useForm<FormularioLogin>({
    resolver: zodResolver(loginSchema),
    defaultValues: { correo: "admin@tybacha.local", contrasena: "TybachaAdmin123!", dispositivo: "web" }
  });
  async function enviar(datos: FormularioLogin) {
    try {
      const respuesta = await api<{ access_token: string; refresh_token: string; usuario: any }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(datos)
      });
      await iniciar(respuesta.access_token, respuesta.refresh_token, respuesta.usuario);
      router.replace("/dashboard");
    } catch (error) {
      setError("correo", { message: error instanceof Error ? error.message : "No fue posible iniciar sesion." });
    }
  }
  return (
    <View className="min-h-screen flex-1 bg-white md:grid md:grid-cols-2">
      <View className="justify-center gap-6 bg-primario-suave p-8 md:p-12">
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-ty bg-primario"><Text className="font-bold text-white">TY</Text></View>
          <View><Text className="text-xl font-bold text-tinta">Tybacha</Text><TextoTenue>Gestion, seguimiento y monitoreo</TextoTenue></View>
        </View>
        <Text className="max-w-xl text-4xl font-bold text-tinta">Cuidado funcional con seguimiento claro.</Text>
        <TextoTenue>Administra adultos mayores, SFT, planes personalizados, alertas, reportes y auditoria desde flujos reales conectados a la API.</TextoTenue>
      </View>
      <View className="items-center justify-center bg-fondo p-5">
        <Tarjeta className="w-full max-w-md gap-4">
          <Titulo>Iniciar sesion</Titulo>
          <TextoTenue>Usa las credenciales del seed inicial.</TextoTenue>
          <Controller control={control} name="correo" render={({ field }) => <Campo label="Correo" value={field.value} onChangeText={field.onChange} />} />
          <Controller control={control} name="contrasena" render={({ field }) => <Campo label="Contrasena" value={field.value} onChangeText={field.onChange} secureTextEntry />} />
          {formState.errors.correo?.message ? <Text className="text-peligro">{formState.errors.correo.message}</Text> : null}
          <Boton disabled={formState.isSubmitting} onPress={handleSubmit(enviar)}>{formState.isSubmitting ? "Entrando..." : "Entrar"}</Boton>
        </Tarjeta>
      </View>
    </View>
  );
}
