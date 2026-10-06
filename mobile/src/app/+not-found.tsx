import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "@/components";
import { ui } from "@/theme";

export default function NotFound() {
  const router = useRouter();
  return (
    <View style={[ui.screen, ui.content, { justifyContent: "center", gap: 12 }]}>
      <Text style={ui.title}>Esta pantalla no existe.</Text>
      <Button label="Volver al inicio" onPress={() => router.replace("/")} />
    </View>
  );
}
