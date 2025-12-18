import { createUser, setUserDisplayName, signIn, signOut } from "@/api/authApi";
import { auth } from "@/firebaseConfig";
import { useRouter } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

// Typene som blir eksponert via context
type AuthContextType = {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: VoidFunction;
  createUser: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  userNameSession?: string | null;
  isLoading: boolean;
  user: User | null;
};

// Selve context-objektet
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook for å hente context-verdier
export function useAuthSession() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuthSession must be used inside AuthSessionProvider");
  }
  return value;
}

// Hoved-provider som pakker inn hele appen
export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [userSession, setUserSession] = useState<string | null>(null);
  const [userAuthSession, setUserAuthSession] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  // Sjekker med Firebase for login/logut-endringer
  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      setIsLoading(true);

      if (user) {
        setUserSession(user.displayName ?? user.email ?? null);
        setUserAuthSession(user);
      } else {
        setUserSession(null);
        setUserAuthSession(null);
      }

      setIsLoading(false);
    });
  }, []);

  // Navigerer automatisk basert på auth-status
  useEffect(() => {
    if (isLoading) return;

    if (userSession) router.replace("/");
    else router.replace("/authentication");
  }, [isLoading, userSession]);

  return (
    <AuthContext.Provider
      value={{
        signIn: async (email: string, password: string) => {
          await signIn(email, password);
        },
        signOut: () => {
          signOut();
        },
        createUser: async (
          email: string,
          password: string,
          displayName: string
        ) => {
          const newUser = await createUser(email, password);
          if (newUser) {
            await setUserDisplayName(newUser, displayName);
            setUserSession(displayName);
          }
        },
        userNameSession: userSession,
        isLoading,
        user: userAuthSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
