import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { useSession } from "@/session";
import { theme } from "@/theme";

export default function ClienteLayout() {
  const { session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session || session.user.role !== "client") router.replace("/");
  }, [session, router]);

  if (!session || session.user.role !== "client") return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.bg } }} />
  );
}
