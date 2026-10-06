import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { api } from "./api";
import type { Session, User } from "./types";

type SessionValue = {
  session: Session | null;
  signIn: (email: string) => Promise<User>;
  signOut: () => void;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);

  const value = useMemo<SessionValue>(
    () => ({
      session,
      async signIn(email: string) {
        const data = await api<{ token: string; user: User }>("/auth/login", {
          method: "POST",
          body: { email },
        });
        setSession({ token: data.token, user: data.user });
        return data.user;
      },
      signOut() {
        setSession(null);
      },
    }),
    [session],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("La sesión no está disponible.");
  return value;
}
