import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, ApiError, money } from "@/api";
import { Notice } from "@/components";
import { ClientTabs, TopBar } from "@/chrome";
import { useSession } from "@/session";
import { servicePhoto } from "@/photos";
import { fonts, theme, ui } from "@/theme";
import type { Service } from "@/types";

export default function ServiciosScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, signOut } = useSession();
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    let active = true;
    api<Service[]>("/services", { token: session.token })
      .then((rows) => {
        if (active) setServices(rows);
      })
      .catch((cause) => {
        if (active) setError(cause instanceof ApiError ? cause.message : "No se pudo cargar el menú.");
      });
    return () => {
      active = false;
    };
  }, [session]);

  const firstName = session?.user.name.split(" ")[0] ?? "";

  return (
    <View style={ui.screen}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={[ui.content, { paddingTop: insets.top + 12, gap: 16 }]}>
        <TopBar
          action="Salir"
          testID="logout"
          onAction={() => {
            signOut();
            router.replace("/");
          }}
        />
        <View>
          <Text style={ui.title} testID="client-greeting">
            Hola, {firstName}
          </Text>
          <Text style={ui.subtitle}>Elige qué quieres hacerte con Lucía.</Text>
          <Text style={[ui.subtitle, { marginTop: 4 }]}>Lunes a sábado · 10:00 a 18:00 · Roma Norte</Text>
        </View>

        <Text style={{ fontFamily: fonts.body, fontSize: 20, fontWeight: "700", color: theme.ink, marginTop: 8 }}>
          Servicios
        </Text>
        {error ? <Notice text={error} testID="services-error" /> : null}

        <View style={{ gap: 8 }}>
          {services.map((service) => (
            <Pressable
              key={service.id}
              testID={`service-${service.id}`}
              accessibilityRole="button"
              onPress={() => router.push(`/reservar/${service.id}`)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                backgroundColor: theme.surface,
                borderRadius: 20,
                padding: 12,
                opacity: pressed ? 0.92 : 1,
              })}
            >
              <Image
                source={servicePhoto[service.id] ?? servicePhoto["svc-manicure"]}
                style={{ width: 72, height: 72, borderRadius: 16 }}
                resizeMode="cover"
              />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontFamily: fonts.body, fontSize: 16, fontWeight: "700", color: theme.ink }}>
                  {service.name}
                </Text>
                <Text style={{ fontFamily: fonts.body, fontSize: 13, color: theme.muted }} numberOfLines={1}>
                  {service.description}
                </Text>
                <Text style={{ fontFamily: fonts.body, fontSize: 13, color: theme.muted, fontWeight: "600" }}>
                  {service.durationMin} min
                </Text>
              </View>
              <Text style={{ fontFamily: fonts.body, fontWeight: "700", color: theme.ink, fontSize: 15 }}>
                {money(service.priceCents)}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <ClientTabs current="servicios" />
    </View>
  );
}
