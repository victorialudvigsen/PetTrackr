import * as petApi from "@/api/petApi";
import * as walkApi from "@/api/walkApi";
import AppHeader from "@/components/AppHeader";
import { useAuthSession } from "@/providers/authctx";
import { buttonStyles } from "@/styles/buttonStyles";
import { inputStyles } from "@/styles/inputStyles";
import { layoutStyles } from "@/styles/layoutStyles";
import { textStyles } from "@/styles/textStyles";
import { PetData } from "@/types/pet";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";

export default function LogWalkPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthSession();

  const [pet, setPet] = useState<PetData | null>(null);
  const [duration, setDuration] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Henter riktig pet
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
    <View style={layoutStyles.screen}>
      <AppHeader
        title={pet ? `Log Walk – ${pet.name}` : "Log Walk"}
        onBack={() =>
          router.replace({
            pathname: "/pets/activity/[id]",
            params: { id },
          })
        }
      />

      <View style={layoutStyles.content}>
        {/* Duration input */}
        <Text style={textStyles.rowText}>Duration (minutes)</Text>

        <TextInput
          style={inputStyles.input}
          value={duration}
          onChangeText={setDuration}
          keyboardType="numeric"
          placeholder="e.g. 45"
        />

        {/* Save button */}
        <Pressable
          style={[buttonStyles.saveButton, { opacity: isSaving ? 0.6 : 1 }]}
          disabled={isSaving}
          onPress={async () => {
            if (!user?.uid || !id) return;

            const minutes = Number(duration);

            if (!minutes || minutes <= 0) {
              Alert.alert(
                "Invalid input",
                "Please enter a valid number of minutes.",
              );
              return;
            }

            try {
              setIsSaving(true);

              await walkApi.addWalk(user.uid, id, minutes);

              setDuration("");

              router.replace(`/pets/activity/${id}`);
            } catch (e) {
              Alert.alert("Error", "Could not save walk.");
            } finally {
              setIsSaving(false);
            }
          }}
        >
          <Text style={buttonStyles.saveButtonText}>
            {isSaving ? "Saving..." : "Save Walk"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
