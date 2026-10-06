import type { ReactNode } from "react";
import { Pressable, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { fonts, theme, ui } from "./theme";
import { statusLabel } from "./api";
import type { Status } from "./types";

export function Button({
  label,
  onPress,
  testID,
  disabled,
  tone = "primary",
}: {
  label: string;
  onPress: () => void;
  testID?: string;
  disabled?: boolean;
  tone?: "primary" | "quiet";
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        ui.button,
        tone === "primary" ? ui.buttonPrimary : ui.buttonQuiet,
        disabled ? ui.buttonDisabled : null,
        pressed && !disabled ? { opacity: 0.9 } : null,
      ]}
    >
      <Text style={[ui.buttonText, tone === "quiet" ? ui.buttonTextQuiet : null]}>{label}</Text>
    </Pressable>
  );
}

const badgeTone: Record<Status, { color: string; backgroundColor: string }> = {
  pending: { color: theme.warn, backgroundColor: theme.warnBg },
  confirmed: { color: theme.ok, backgroundColor: theme.okBg },
  completed: { color: theme.ink, backgroundColor: theme.neutralBg },
  cancelled: { color: theme.roseDeep, backgroundColor: theme.badBg },
};

export function Badge({ status, testID }: { status: Status; testID?: string }) {
  const tone = badgeTone[status];
  return (
    <Text
      testID={testID}
      style={{
        color: tone.color,
        backgroundColor: tone.backgroundColor,
        overflow: "hidden",
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
        fontSize: 12,
        fontWeight: "700",
        fontFamily: fonts.body,
        alignSelf: "flex-start",
        flexShrink: 0,
      }}
    >
      {statusLabel[status]}
    </Text>
  );
}

export function Notice({
  text,
  testID,
  tone = "bad",
}: {
  text: string;
  testID?: string;
  tone?: "bad" | "ok";
}) {
  return (
    <Text
      testID={testID}
      style={[
        ui.error,
        tone === "ok"
          ? { backgroundColor: theme.okBg, color: theme.ok }
          : null,
      ]}
    >
      {text}
    </Text>
  );
}

export function Panel({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[ui.card, style]}>{children}</View>;
}
