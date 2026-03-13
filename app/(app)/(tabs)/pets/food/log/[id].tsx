import AppHeader from "@/components/AppHeader";
import { useAuthSession } from "@/providers/authctx";
import { PetData } from "@/types/pet";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import * as foodApi from "@/api/foodApi";
import * as petApi from "@/api/petApi";
import { buttonStyles } from "@/styles/buttonStyles";
import { inputStyles } from "@/styles/inputStyles";
import { layoutStyles } from "@/styles/layoutStyles";
import { textStyles } from "@/styles/textStyles";

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
      <View style={layoutStyles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={layoutStyles.screen}>
      <AppHeader
        title={`Log Food – ${pet.name}`}
        onBack={() =>
          router.replace({
            pathname: "/pets/food/[id]",
            params: { id },
          })
        }
      />

      <View style={layoutStyles.content}>
        <Text style={textStyles.rowText}>Grams</Text>

        <TextInput
          style={inputStyles.input}
          value={grams}
          onChangeText={setGrams}
          keyboardType="numeric"
          placeholder="e.g. 200"
        />

        <Pressable
          style={buttonStyles.saveButton}
          onPress={async () => {
            if (!user?.uid || !id) return;

            const gramsNumber = Number(grams);

            if (!Number.isFinite(gramsNumber) || gramsNumber <= 0) {
              return;
            }

            try {
              await foodApi.addFoodEntry(user.uid, id, gramsNumber);

              setGrams("");

              router.replace({
                pathname: "/pets/food/[id]",
                params: { id },
              });
            } catch (e) {
              console.log("Could not save meal", e);
            }
          }}
        >
          <Text style={buttonStyles.saveButtonText}>Save Meal</Text>
        </Pressable>
      </View>
    </View>
  );
}
