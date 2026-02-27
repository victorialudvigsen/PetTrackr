import AppHeader from "@/components/AppHeader";
import { useAuthSession } from "@/providers/authctx";
import { PetData } from "@/types/pet";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import * as foodApi from "@/api/foodApi";
import * as petApi from "@/api/petApi";

export default function LogFoodPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthSession();

  const [pet, setPet] = useState<PetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [grams, setGrams] = useState("");

  useEffect(() => {
    async function fetchPet() {
      if (!user?.uid || !id) return;

      setIsLoading(true);
      const result = await petApi.getPetById(user.uid, id);
      setPet(result);
      setIsLoading(false);
    }

    fetchPet();
  }, [user?.uid, id]);

  if (isLoading || !pet) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <AppHeader
        title={`Log Food – ${pet.name}`}
        onBack={() =>
          router.replace({
            pathname: "/pets/food/[id]",
            params: { id },
          })
        }
      />

      <View style={styles.content}>
        <Text style={styles.label}>Grams</Text>

        <TextInput
          style={styles.input}
          value={grams}
          onChangeText={setGrams}
          keyboardType="numeric"
          placeholder="e.g. 200"
        />

        <Pressable
          style={styles.saveButton}
          onPress={async () => {
            if (!user?.uid || !id) return;

            const gramsNumber = Number(grams);

            if (!Number.isFinite(gramsNumber) || gramsNumber <= 0) {
              return;
            }

            try {
              await foodApi.addFoodEntry(user.uid, id, gramsNumber);

              router.replace({
                pathname: "/pets/food/[id]",
                params: { id },
              });
            } catch (e) {
              console.log("Could not save meal", e);
            }
          }}
        >
          <Text style={styles.saveButtonText}>Save Meal</Text>
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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
