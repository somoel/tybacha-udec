import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const esWeb = Platform.OS === "web";

export async function guardarSeguro(clave: string, valor: string | null) {
  if (esWeb) {
    if (valor === null) await AsyncStorage.removeItem(clave);
    else await AsyncStorage.setItem(clave, valor);
    return;
  }
  if (valor === null) await SecureStore.deleteItemAsync(clave);
  else await SecureStore.setItemAsync(clave, valor);
}

export async function leerSeguro(clave: string) {
  if (esWeb) return AsyncStorage.getItem(clave);
  return SecureStore.getItemAsync(clave);
}
