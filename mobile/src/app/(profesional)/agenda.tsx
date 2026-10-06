import { useCallback, useEffect, useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, ApiError, formatWhen, money } from "@/api";
import { Badge, Button, Notice } from "@/components";
import { Avatar, TopBar } from "@/chrome";
import { photos, servicePhoto } from "@/photos";
import { useSession } from "@/session";
import { fonts, theme, ui } from "@/theme";
import type { Appointment, Status } from "@/types";

const sections: Array<{ title: string; statuses: Status[]; empty: string }> = [
  {
    title: "Por confirmar",
    statuses: ["pending"],
    empty: "No hay citas esperando confirmación.",
  },
  {
    title: "Confirmadas",
    statuses: ["confirmed"],
    empty: "No hay citas confirmadas.",
  },
  {
    title: "Historial",
    statuses: ["completed", "cancelled"],
    empty: "Todavía no hay citas cerradas.",
  },
];

export default function AgendaScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, signOut } = useSession();
  const [rows, setRows] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setRows(await api<Appointment[]>("/appointments", { token: session.token }));
  }, [session]);

  useEffect(() => {
    load().catch((cause) => setError(cause instanceof ApiError ? cause.message : "No se pudo abrir la agenda."));
  }, [load]);

  async function move(id: string, status: Status) {
    if (!session) return;
    setError(null);
    try {
      const updated = await api<Appointment>(`/appointments/${id}`, {
        method: "PATCH",
        token: session.token,
        body: { status },
      });
      setRows((current) => current.map((row) => (row.id === id ? updated : row)));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "No se pudo actualizar la cita.");
    }
  }

  const firstName = session?.user.name.split(" ")[0] ?? "";
  const active = rows.filter((row) => row.status !== "cancelled" && row.status !== "completed");
  const clientCount = new Set(active.map((row) => row.clientId)).size;
  const income = active.reduce((sum, row) => sum + row.priceCents, 0);

  return (
    <ScrollView
      style={ui.screen}
      contentContainerStyle={[ui.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28, gap: 18 }]}
    >
      <TopBar
        action="Salir"
        testID="logout"
        onAction={() => {
          signOut();
          router.replace("/");
        }}
      />
      <View>
        <Text style={ui.title}>Hola, {firstName}</Text>
        <Text style={ui.subtitle}>Agenda de {firstName}</Text>
      </View>

      <View style={{ backgroundColor: theme.dark, borderRadius: 28, padding: 20, gap: 16 }}>
        <Text style={{ fontFamily: fonts.body, color: "#B7AFAA", fontSize: 13 }}>Por atender</Text>
        <Text style={{ fontFamily: fonts.display, color: "#F7F4F1", fontSize: 36, fontWeight: "700", letterSpacing: -1 }}>
          {money(income)}
        </Text>
        <View style={{ flexDirection: "row", gap: 28 }}>
          <View>
            <Text style={{ fontFamily: fonts.body, color: "#F7F4F1", fontSize: 22, fontWeight: "700" }}>{active.length}</Text>
            <Text style={{ fontFamily: fonts.body, color: "#B7AFAA", fontSize: 13 }}>Citas</Text>
          </View>
          <View>
            <Text style={{ fontFamily: fonts.body, color: "#F7F4F1", fontSize: 22, fontWeight: "700" }}>{clientCount}</Text>
            <Text style={{ fontFamily: fonts.body, color: "#B7AFAA", fontSize: 13 }}>Clientas</Text>
          </View>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {[photos.manicure, photos.gel, photos.art, photos.retiro].map((source, index) => (
          <Image
            key={index}
            source={source}
            style={{ width: 132, height: 96, borderRadius: 18 }}
            resizeMode="cover"
          />
        ))}
      </ScrollView>

      <PressableLine testID="refresh" label="Actualizar" onPress={() => load().catch(() => undefined)} />
      {error ? <Notice text={error} testID="agenda-error" /> : null}

      {sections.map((section) => {
        const items = rows.filter((row) => section.statuses.includes(row.status));
        return (
          <View key={section.title} style={{ gap: 8 }}>
            <Text style={{ fontFamily: fonts.body, fontWeight: "700", color: theme.ink, fontSize: 18 }}>
              {section.title}
            </Text>
            {items.length === 0 ? <Text style={{ fontFamily: fonts.body, color: theme.muted }}>{section.empty}</Text> : null}
            {items.map((row) => (
              <View key={row.id} style={{ flexDirection: "row", gap: 12, alignItems: "flex-start", paddingVertical: 8 }}>
                <Text style={{ width: 52, paddingTop: 10, fontFamily: fonts.body, fontWeight: "700", color: theme.ink }}>
                  {clock(row.startsAt)}
                </Text>
                <View style={{ flex: 1, backgroundColor: theme.surface, borderRadius: 20, padding: 14, gap: 8 }}>
                  <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                    <Avatar name={row.clientName} size={40} />
                    <Image
                      source={servicePhoto[row.serviceId] ?? photos.manicure}
                      style={{ width: 40, height: 40, borderRadius: 12 }}
                      resizeMode="cover"
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: fonts.body, fontWeight: "700", fontSize: 16, color: theme.ink }}>
                        {row.clientName}
                      </Text>
                      <Text style={{ fontFamily: fonts.body, color: theme.muted, fontSize: 13 }}>{row.serviceName}</Text>
                    </View>
                    <Badge status={row.status} testID={`status-${row.id}`} />
                  </View>
                  <Text style={{ fontFamily: fonts.body, color: theme.muted, fontSize: 13 }}>
                    {formatWhen(row.startsAt)} · {row.durationMin} min · {money(row.priceCents)}
                  </Text>
                  {row.notes ? (
                    <Text style={{ fontFamily: fonts.body, color: theme.muted, fontSize: 13 }}>{row.notes}</Text>
                  ) : null}
                  {row.status === "pending" ? (
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Button label="Confirmar" testID={`confirm-${row.id}`} onPress={() => move(row.id, "confirmed")} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Button label="Cancelar" tone="quiet" testID={`cancel-${row.id}`} onPress={() => move(row.id, "cancelled")} />
                      </View>
                    </View>
                  ) : null}
                  {row.status === "confirmed" ? (
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Button label="Completar" testID={`complete-${row.id}`} onPress={() => move(row.id, "completed")} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Button label="Cancelar" tone="quiet" testID={`cancel-${row.id}`} onPress={() => move(row.id, "cancelled")} />
                      </View>
                    </View>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

function clock(iso: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Mexico_City",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

function PressableLine({ testID, label, onPress }: { testID: string; label: string; onPress: () => void }) {
  return (
    <Text onPress={onPress} testID={testID} style={{ fontFamily: fonts.body, color: theme.muted, fontWeight: "600" }}>
      {label}
    </Text>
  );
}
