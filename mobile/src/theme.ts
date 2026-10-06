import { Platform, StyleSheet } from "react-native";

export const theme = {
  bg: "#F6F3F0",
  bgDeep: "#E7E1DB",
  surface: "#FFFFFF",
  ink: "#1C1C1C",
  muted: "#8E8782",
  faint: "#B7AFAA",
  line: "#EFEAE6",
  blush: "#E7C9C4",
  blushDeep: "#D9B3AD",
  rose: "#E7C9C4",
  roseDeep: "#1C1C1C",
  brass: "#8E8782",
  ok: "#2E6B4F",
  okBg: "#E7F3EC",
  warn: "#8A6230",
  warnBg: "#F8F1E6",
  badBg: "#F8ECEA",
  neutralBg: "#F1EEEB",
  dark: "#161616",
};

export const fonts = {
  display: Platform.select({
    web: "Segoe UI, Helvetica Neue, Arial, sans-serif",
    ios: "System",
    android: "sans-serif",
    default: "sans-serif",
  }),
  body: Platform.select({
    web: "Segoe UI, Helvetica Neue, Arial, sans-serif",
    ios: "System",
    android: "sans-serif",
    default: "sans-serif",
  }),
};

export const ui = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  eyebrow: {
    fontFamily: fonts.body,
    color: theme.muted,
    fontSize: 13,
    fontWeight: "500",
  },
  title: {
    fontFamily: fonts.display,
    color: theme.ink,
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "700",
    letterSpacing: -0.6,
    marginTop: 4,
  },
  subtitle: {
    fontFamily: fonts.body,
    color: theme.muted,
    fontSize: 15,
    lineHeight: 21,
    marginTop: 6,
  },
  card: {
    backgroundColor: theme.surface,
    borderRadius: 22,
    padding: 16,
  },
  button: {
    minHeight: 54,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  buttonPrimary: {
    backgroundColor: theme.blush,
  },
  buttonQuiet: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.line,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontFamily: fonts.body,
    color: theme.ink,
    fontSize: 16,
    fontWeight: "600",
  },
  buttonTextQuiet: {
    color: theme.ink,
  },
  error: {
    backgroundColor: theme.badBg,
    color: "#6E3A34",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    overflow: "hidden",
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
});
