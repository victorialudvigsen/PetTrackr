import { signIn, signOut } from "@/api/authApi";
import { createUserProfile } from "@/api/userApi";
import { auth } from "@/firebaseConfig";
import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile,
  User,
} from "firebase/auth";
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
    displayName: string,
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserSession(user.displayName ?? user.email ?? null);
        setUserAuthSession(user);
      } else {
        setUserSession(null);
        setUserAuthSession(null);
      }

      setIsLoading(false);
    });

    // Rydder opp listener når komponent unmountes
    return unsubscribe;
  }, []);

  // Navigerer automatisk basert på auth-status
  useEffect(() => {
    if (isLoading) return;

    if (userAuthSession) {
      router.replace("/");
    } else {
      router.replace("/authentication");
    }
  }, [isLoading, userAuthSession]);

  // Unngå å rendre app før vi vet auth-status
  if (isLoading) {
    return null;
  }

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
          displayName: string,
        ) => {
          // Oppretter bruker i Firebase
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password,
          );

          // Setter navn direkte i Firebase
          await updateProfile(userCredential.user, {
            displayName: displayName,
          });

          // Lager brukerprofil i Firestore (users/{uid})
          await createUserProfile(userCredential.user.uid, {
            name: displayName,
            email: email,
            bio: "",
          });

          // Setter lokal session med en gang
          setUserSession(displayName);
          setUserAuthSession(userCredential.user);
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
