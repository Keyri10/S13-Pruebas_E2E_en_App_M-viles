import { useCallback, useEffect, useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, ApiError, formatWhen, money } from "@/api";
import { Badge, Button, Notice } from "@/components";
import { ClientTabs, TopBar } from "@/chrome";
import { photos, servicePhoto } from "@/photos";
import { useSession } from "@/session";
import { fonts, theme, ui } from "@/theme";
import type { Appointment } from "@/types";

function clock(iso: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Mexico_City",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

export default function CitasScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, signOut } = useSession();
  const [rows, setRows] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    const data = await api<Appointment[]>("/appointments", { token: session.token });
    setRows(data);
  }, [session]);

  useEffect(() => {
    load().catch((cause) => setError(cause instanceof ApiError ? cause.message : "No se pudieron cargar tus citas."));
  }, [load]);

  async function cancel(id: string) {
    if (!session) return;
    setError(null);
    try {
      const updated = await api<Appointment>(`/appointments/${id}`, {
        method: "PATCH",
        token: session.token,
        body: { status: "cancelled" },
      });
      setRows((current) => current.map((row) => (row.id === id ? updated : row)));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "No se pudo cancelar.");
    }
  }

  return (
    <View style={ui.screen}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={[ui.content, { paddingTop: insets.top + 12, gap: 8 }]}>
        <TopBar
          action="Salir"
          testID="logout"
          onAction={() => {
            signOut();
            router.replace("/");
          }}
        />
        <Text style={[ui.title, { marginBottom: 8 }]}>Mis citas</Text>
        {error ? <Notice text={error} /> : null}
        {rows.length === 0 ? (
          <Text style={ui.subtitle}>Todavía no tienes citas. Elige un servicio para reservar.</Text>
        ) : null}
        {rows.map((row) => {
          const open = row.status === "pending" || row.status === "confirmed";
          return (
            <View
              key={row.id}
              style={{
                flexDirection: "row",
                gap: 14,
                backgroundColor: theme.surface,
                borderRadius: 20,
                padding: 14,
                marginBottom: 8,
              }}
            >
              <Image
                source={servicePhoto[row.serviceId] ?? photos.manicure}
                style={{ width: 52, height: 52, borderRadius: 14 }}
                resizeMode="cover"
              />
              <Text style={{ width: 52, fontFamily: fonts.body, fontWeight: "700", color: theme.ink, fontSize: 15 }}>
                {clock(row.startsAt)}
              </Text>
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                  <Text style={{ fontFamily: fonts.body, fontWeight: "700", fontSize: 16, color: theme.ink, flex: 1 }}>
                    {row.serviceName}
                  </Text>
                  <Badge status={row.status} testID={`status-${row.id}`} />
                </View>
                <Text style={{ fontFamily: fonts.body, color: theme.muted, fontSize: 13 }}>{formatWhen(row.startsAt)}</Text>
                <Text style={{ fontFamily: fonts.body, color: theme.muted, fontSize: 13 }}>
                  {row.durationMin} min · {money(row.priceCents)} · {row.professionalName}
                </Text>
                {row.notes ? (
                  <Text style={{ fontFamily: fonts.body, color: theme.muted, fontSize: 13 }}>{row.notes}</Text>
                ) : null}
                {open ? (
                  <View style={{ marginTop: 6 }}>
                    <Button
                      label="Cancelar cita"
                      tone="quiet"
                      testID={`cancel-${row.id}`}
                      onPress={() => cancel(row.id)}
                    />
                  </View>
                ) : null}
              </View>
            </View>
          );
        })}
      </ScrollView>
      <ClientTabs current="citas" />
    </View>
  );
}
