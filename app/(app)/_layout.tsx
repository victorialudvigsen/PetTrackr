import { useAuthSession } from "@/providers/authctx";
import { Redirect, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";
import "react-native-reanimated";

export default function RootLayout() {
  const { userNameSession, isLoading } = useAuthSession();

  if (isLoading) {
    return (
      <View>
        <Text>Fetching user...</Text>
      </View>
    );
  }

  if (!userNameSession) {
    return <Redirect href={"/authentication"} />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" />
      <StatusBar style="auto" />
    </Stack>
  );
}
