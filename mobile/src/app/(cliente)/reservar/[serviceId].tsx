import { useCallback, useEffect, useState } from "react";
import { Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, ApiError, formatDay, money } from "@/api";
import { Button, Notice } from "@/components";
import { servicePhoto } from "@/photos";
import { useSession } from "@/session";
import { fonts, theme, ui } from "@/theme";
import type { Appointment, Service, Slot } from "@/types";

type Availability = {
  date: string;
  service: Service;
  slots: Slot[];
};

export default function ReservarScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ serviceId: string }>();
  const serviceId = Array.isArray(params.serviceId) ? params.serviceId[0] : params.serviceId;
  const { session } = useSession();
  const [days, setDays] = useState<string[]>([]);
  const [dayIndex, setDayIndex] = useState(0);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [selected, setSelected] = useState<Slot | null>(null);
  const [notes, setNotes] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState<Appointment | null>(null);

  useEffect(() => {
    if (!session) return;
    api<{ days: string[] }>("/calendar", { token: session.token })
      .then((data) => setDays(data.days))
      .catch((cause) => setError(cause instanceof ApiError ? cause.message : "No se pudo abrir la agenda."));
  }, [session]);

  const loadDay = useCallback(
    async (date: string) => {
      if (!session || !serviceId) return;
      setError(null);
      const data = await api<Availability>(
        `/availability?serviceId=${serviceId}&date=${date}`,
        { token: session.token },
      );
      setAvailability(data);
    },
    [session, serviceId],
  );

  useEffect(() => {
    const date = days[dayIndex];
    if (!date) return;
    loadDay(date).catch((cause) =>
      setError(cause instanceof ApiError ? cause.message : "No se pudieron cargar los horarios."),
    );
  }, [days, dayIndex, loadDay]);

  async function confirm() {
    if (!session || !selected) return;
    setPending(true);
    setError(null);
    try {
      const created = await api<Appointment>("/appointments", {
        method: "POST",
        token: session.token,
        body: { serviceId, startsAt: selected.startsAt, notes },
      });
      setSuccess(created);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "No se pudo reservar.");
    } finally {
      setPending(false);
    }
  }

  return (
    <View style={ui.screen}>
      <ScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[ui.content, { paddingTop: insets.top + 16, gap: 16, paddingBottom: insets.bottom + 28 }]}
      >
        <Pressable testID="back" accessibilityRole="button" onPress={() => router.back()} hitSlop={8}>
          <Text style={{ fontFamily: fonts.body, color: theme.muted, fontWeight: "600" }}>Volver</Text>
        </Pressable>

        {success ? (
          <View testID="booking-success" style={[ui.card, { gap: 12, paddingVertical: 22 }]}>
            <Text style={ui.eyebrow}>Listo</Text>
            <Text style={ui.title}>Cita reservada</Text>
            <Text style={ui.subtitle}>
              {success.serviceName} quedó pendiente. Lucía la confirma desde su agenda.
            </Text>
            <Button
              label="Ver mis citas"
              testID="go-to-appointments"
              onPress={() => router.replace("/citas")}
            />
          </View>
        ) : (
          <>
            <View>
              <Text style={ui.eyebrow}>Reservar</Text>
              <Text style={ui.title}>{availability?.service.name ?? "Servicio"}</Text>
              {availability ? (
                <Text style={ui.subtitle}>
                  {availability.service.durationMin} min · {money(availability.service.priceCents)}
                </Text>
              ) : null}
            </View>
            {serviceId && servicePhoto[serviceId] ? (
              <Image
                source={servicePhoto[serviceId]}
                style={{ width: "100%", height: 180, borderRadius: 24 }}
                resizeMode="cover"
              />
            ) : null}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {days.map((day, index) => {
                const active = index === dayIndex;
                return (
                  <Pressable
                    key={day}
                    testID={`date-${index}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => {
                      setDayIndex(index);
                      setSelected(null);
                      setNotice(null);
                    }}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderRadius: 999,
                      backgroundColor: active ? theme.ink : theme.surface,
                    }}
                  >
                    <Text style={{ fontFamily: fonts.body, fontWeight: "600", color: active ? "#F7F4F1" : theme.ink }}>
                      {formatDay(day)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={{ backgroundColor: theme.surface, borderRadius: 24, paddingHorizontal: 16 }}>
              {(availability?.slots ?? []).map((slot) => {
                const isSelected = selected?.startsAt === slot.startsAt;
                return (
                  <Pressable
                    key={slot.startsAt}
                    testID={`slot-${slot.time.replace(":", "")}`}
                    accessibilityRole="button"
                    accessibilityLabel={slot.available ? slot.time : `${slot.time} ocupado`}
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => {
                      if (!slot.available) {
                        setSelected(null);
                        setNotice("Ese horario ya está ocupado.");
                        return;
                      }
                      setNotice(null);
                      setSelected(slot);
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      minHeight: 58,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.line,
                    }}
                  >
                    <Text
                      style={{
                        width: 72,
                        fontFamily: fonts.body,
                        fontWeight: "700",
                        color: isSelected ? theme.ink : theme.muted,
                      }}
                    >
                      {slot.time}
                    </Text>
                    <Text style={{ flex: 1, fontFamily: fonts.body, color: slot.available ? theme.ink : theme.faint }}>
                      {slot.available ? (isSelected ? "Elegido" : "Libre") : "Ocupado"}
                    </Text>
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        borderWidth: 1.5,
                        borderColor: isSelected ? theme.ink : theme.line,
                        backgroundColor: isSelected ? theme.ink : "transparent",
                      }}
                    />
                  </Pressable>
                );
              })}
            </View>

            {notice ? <Notice text={notice} testID="slot-notice" /> : null}
            {error ? <Notice text={error} testID="booking-error" /> : null}

            <View style={{ gap: 8 }}>
              <Text style={{ fontFamily: fonts.body, color: theme.muted, fontWeight: "600" }}>
                Nota para Lucía
              </Text>
              <TextInput
                testID="booking-notes"
                value={notes}
                onChangeText={setNotes}
                placeholder="Color, forma o una idea"
                placeholderTextColor={theme.faint}
                maxLength={200}
                style={{
                  minHeight: 52,
                  borderRadius: 18,
                  backgroundColor: theme.surface,
                  paddingHorizontal: 16,
                  fontFamily: fonts.body,
                  fontSize: 16,
                  color: theme.ink,
                }}
              />
            </View>

            <Button
              label={pending ? "Reservando…" : "Confirmar cita"}
              testID="confirm-booking"
              disabled={!selected || pending}
              onPress={confirm}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}
