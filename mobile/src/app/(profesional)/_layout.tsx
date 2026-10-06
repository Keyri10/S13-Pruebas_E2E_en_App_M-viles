import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { useSession } from "@/session";
import { theme } from "@/theme";

export default function ProfesionalLayout() {
  const { session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session || session.user.role !== "professional") router.replace("/");
  }, [session, router]);

  if (!session || session.user.role !== "professional") return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.bg } }} />
  );
}
