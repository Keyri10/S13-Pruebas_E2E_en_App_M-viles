import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fonts, theme } from "./theme";

const avatarTints = ["#E7D5CF", "#E4DDD4", "#D9E0DC", "#E7D6C8", "#DDD4DC"];

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const letter = name.trim().charAt(0).toUpperCase() || "?";
  const tint = avatarTints[letter.charCodeAt(0) % avatarTints.length];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: tint,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontFamily: fonts.body, fontWeight: "700", color: theme.ink, fontSize: size * 0.38 }}>
        {letter}
      </Text>
    </View>
  );
}

export function ClientTabs({ current }: { current: "servicios" | "citas" }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const items = [
    { id: "servicios" as const, testID: "tab-servicios", label: "Servicios", href: "/servicios" },
    { id: "citas" as const, testID: "tab-citas", label: "Mis citas", href: "/citas" },
  ];

  return (
    <View
      style={{
        flexDirection: "row",
        paddingTop: 8,
        paddingBottom: Math.max(insets.bottom, 10),
        borderTopWidth: 1,
        borderTopColor: theme.line,
        backgroundColor: theme.surface,
      }}
    >
      {items.map((item) => {
        const active = item.id === current;
        return (
          <Pressable
            key={item.id}
            testID={item.testID}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => router.replace(item.href)}
            style={{ flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", gap: 4 }}
          >
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: item.id === "citas" ? 4 : 9,
                borderWidth: 1.5,
                borderColor: active ? theme.ink : theme.faint,
                backgroundColor: active ? theme.ink : "transparent",
              }}
            />
            <Text
              style={{
                fontFamily: fonts.body,
                fontSize: 11,
                fontWeight: "600",
                color: active ? theme.ink : theme.faint,
              }}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function TopBar({
  action,
  onAction,
  testID,
}: {
  action: string;
  onAction: () => void;
  testID: string;
}) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "flex-end", alignItems: "center" }}>
      <Pressable testID={testID} accessibilityRole="button" onPress={onAction} hitSlop={8}>
        <Text style={{ fontFamily: fonts.body, color: theme.muted, fontWeight: "600", fontSize: 14 }}>{action}</Text>
      </Pressable>
    </View>
  );
}
