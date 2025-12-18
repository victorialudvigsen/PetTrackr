import { AuthSessionProvider } from "@/providers/authctx";
import { Slot } from "expo-router";

export default function RootRootLayout() {
  return (
    <AuthSessionProvider>
      <Slot />
    </AuthSessionProvider>
  );
}
