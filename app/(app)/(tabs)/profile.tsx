import { useAuthSession } from "@/providers/authctx";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function ProfilePage() {
  const { signOut, userNameSession, user } = useAuthSession();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profilsiden</Text>

      <Text style={styles.text}>
        Logget inn som: {userNameSession ?? "Ingen"}
      </Text>

      <Text style={styles.text}>UID: {user?.uid ?? "Ingen"}</Text>

      <Pressable style={styles.logoutButton} onPress={signOut}>
        <Text style={styles.logoutButtonText}>Logg ut</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  text: {
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: "#E53935",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  logoutButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
});
