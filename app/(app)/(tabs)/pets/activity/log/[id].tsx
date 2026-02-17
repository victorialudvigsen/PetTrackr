import * as petApi from "@/api/petApi";
import AppHeader from "@/components/AppHeader";
import { useAuthSession } from "@/providers/authctx";
import { PetData } from "@/types/pet";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function LogWalkPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthSession();

  const [pet, setPet] = useState<PetData | null>(null);
  const [duration, setDuration] = useState("");

  // 🔥 Hent riktig pet
  useEffect(() => {
    async function fetchPet() {
      if (!user?.uid || !id) return;

      const pets = await petApi.getAllPets(user.uid);
      const foundPet = pets.find((p) => p.id === id);

      if (foundPet) {
        setPet(foundPet);
      }
    }

    fetchPet();
  }, [user?.uid, id]);

  return (
    <View style={styles.screen}>
      <AppHeader
        title={pet ? `Log Walk – ${pet.name}` : "Log Walk"}
        onBack={() => router.back()}
      />

      <View style={styles.content}>
        {/* Duration input */}
        <Text style={styles.label}>Duration (minutes)</Text>

        <TextInput
          style={styles.input}
          value={duration}
          onChangeText={setDuration}
          keyboardType="numeric"
          placeholder="e.g. 45"
        />

        {/* Save button (kun UI nå) */}
        <Pressable
          style={styles.saveButton}
          onPress={() => {
            Alert.alert("Coming soon", "Walk logging will be added next.");
          }}
        >
          <Text style={styles.saveButtonText}>Save Walk</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F6F2EE",
  },

  content: {
    padding: 16,
    gap: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E6E6E6",
  },

  saveButton: {
    backgroundColor: "#2B6DEB",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
  },

  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
});
