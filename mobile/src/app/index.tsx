import { useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ApiError } from "@/api";
import { Notice } from "@/components";
import { useSession } from "@/session";
import { photos } from "@/photos";
import { fonts, theme } from "@/theme";

const demos = [
  {
    testID: "demo-client",
    email: "ana@lumina.app",
    name: "Ana Gómez",
    role: "Cliente",
    action: "Quiero una cita",
    tone: "fill" as const,
  },
  {
    testID: "demo-professional",
    email: "lucia@lumina.app",
    name: "Lucía Navarro",
    role: "Nail artist",
    action: "Ver mi agenda",
    tone: "ghost" as const,
  },
];

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, signIn } = useSession();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!session) return;
    router.replace(session.user.role === "client" ? "/servicios" : "/agenda");
  }, [session, router]);

  async function enter(nextEmail: string) {
    setPending(true);
    setError(null);
    try {
      await signIn(nextEmail.trim());
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "No se pudo entrar.");
    } finally {
      setPending(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.dark }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar style="light" />
      <ScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 28,
          paddingBottom: insets.bottom + 28,
          paddingHorizontal: 24,
          justifyContent: "flex-end",
        }}
      >
        <View style={{ flex: 1, minHeight: 280, borderRadius: 28, overflow: "hidden", marginBottom: 22 }}>
          <Image source={photos.estudio} style={{ width: "100%", height: "100%", minHeight: 280 }} resizeMode="cover" />
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              padding: 18,
              backgroundColor: "rgba(16,16,16,0.55)",
            }}
          >
            <Text style={{ fontFamily: fonts.body, color: "#E7C9C4", fontSize: 13, fontWeight: "600", letterSpacing: 1.2 }}>
              LÚMINA
            </Text>
            <Text style={{ fontFamily: fonts.display, color: "#F7F4F1", fontSize: 40, lineHeight: 44, fontWeight: "700", letterSpacing: -1, marginTop: 4 }}>
              Lúmina
            </Text>
            <Text style={{ fontFamily: fonts.body, color: "#E6E0DA", fontSize: 16, lineHeight: 22, marginTop: 6 }}>
              Tu estudio. Tus clientas. Tu agenda.
            </Text>
          </View>
        </View>

        <View style={{ gap: 10 }}>
          {demos.map((demo) => (
            <Pressable
              key={demo.email}
              testID={demo.testID}
              accessibilityRole="button"
              disabled={pending}
              onPress={() => enter(demo.email)}
              style={({ pressed }) => ({
                minHeight: 56,
                borderRadius: 28,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: demo.tone === "fill" ? theme.blush : "transparent",
                borderWidth: demo.tone === "ghost" ? 1 : 0,
                borderColor: "rgba(255,255,255,0.28)",
                opacity: pressed ? 0.88 : 1,
              })}
            >
              <Text style={{ fontFamily: fonts.body, fontWeight: "700", fontSize: 16, color: demo.tone === "fill" ? theme.ink : "#F7F4F1" }}>
                {demo.action}
              </Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 12, color: demo.tone === "fill" ? "#5C534E" : "#B7AFAA", marginTop: 2 }}>
                {demo.name} · {demo.role}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={{ fontFamily: fonts.body, color: "#B7AFAA", marginTop: 22, marginBottom: 8, fontSize: 13 }}>
          o con tu correo
        </Text>
        <TextInput
          testID="login-email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="ana@lumina.app"
          placeholderTextColor="#8A847E"
          style={{
            backgroundColor: "#242424",
            borderRadius: 18,
            minHeight: 52,
            paddingHorizontal: 16,
            fontFamily: fonts.body,
            fontSize: 16,
            color: "#F7F4F1",
          }}
        />
        {error ? (
          <View style={{ marginTop: 12 }}>
            <Notice text={error} testID="login-error" />
          </View>
        ) : null}
        <Pressable
          testID="login-submit"
          accessibilityRole="button"
          accessibilityState={{ disabled: pending || email.trim().length === 0 }}
          disabled={pending || email.trim().length === 0}
          onPress={() => enter(email)}
          style={{
            marginTop: 12,
            minHeight: 52,
            borderRadius: 28,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#F7F4F1",
            opacity: pending || email.trim().length === 0 ? 0.4 : 1,
          }}
        >
          <Text style={{ fontFamily: fonts.body, fontWeight: "700", color: theme.ink, fontSize: 16 }}>
            {pending ? "Entrando…" : "Entrar"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
