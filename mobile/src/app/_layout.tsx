import { useEffect } from "react";
import { Platform, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SessionProvider } from "@/session";
import { theme } from "@/theme";

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    const style = document.createElement("style");
    style.textContent = `
      html, body, #root { height: 100%; width: 100%; margin: 0; background: ${theme.bgDeep}; }
      #root { display: flex; flex-direction: column; }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <SessionProvider>
        <StatusBar style="dark" />
        <View style={shell}>
          <View style={phone} testID="app-frame">
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.bg } }} />
          </View>
        </View>
      </SessionProvider>
    </SafeAreaProvider>
  );
}

const shell = {
  flex: 1,
  width: "100%" as const,
  minHeight: "100%" as unknown as number,
  backgroundColor: theme.bgDeep,
  alignItems: "center" as const,
};

const phone = {
  flex: 1,
  width: "100%" as const,
  maxWidth: 430,
  backgroundColor: theme.bg,
};
