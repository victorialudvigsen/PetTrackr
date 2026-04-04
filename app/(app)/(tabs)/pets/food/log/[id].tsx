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
import { colors } from "@/styles/colors";
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
  const [type, setType] = useState<"meal" | "treat" | "bone">("meal");
  const [count, setCount] = useState("");
  const [note, setNote] = useState("");
  const [showTypePicker, setShowTypePicker] = useState(false);

  // Henter riktig pet
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
        {/* DYNAMIC INPUT */}
        <Text style={textStyles.rowText}>
          {type === "meal" ? "Grams" : "Quantity"}
        </Text>

        <TextInput
          style={inputStyles.input}
          value={type === "meal" ? grams : count}
          onChangeText={(text) =>
            type === "meal" ? setGrams(text) : setCount(text)
          }
          keyboardType="numeric"
          placeholder={type === "meal" ? "e.g. 200" : "e.g. 3"}
        />

        {/* TYPE */}
        <Text style={textStyles.rowText}>Type</Text>
        <Pressable
          style={buttonStyles.dateButton}
          onPress={() => setShowTypePicker((prev) => !prev)}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text>
              {type === "meal" && "🍽️"}
              {type === "treat" && "🍬"}
              {type === "bone" && "🦴"}
            </Text>

            <Text style={buttonStyles.dateButtonText}>
              {type === "meal" && "Meal"}
              {type === "treat" && "Treat"}
              {type === "bone" && "Bone"}
            </Text>
          </View>
        </Pressable>

        {showTypePicker && (
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 8,
              marginTop: -20,
              padding: 6,
              elevation: 2,
            }}
          >
            {[
              { label: "Meal", value: "meal", icon: "🍽️" },
              { label: "Treat", value: "treat", icon: "🍬" },
              { label: "Bone", value: "bone", icon: "🦴" },
            ].map((item) => (
              <Pressable
                key={item.value}
                onPress={() => {
                  setType(item.value as any);
                  setShowTypePicker(false);
                }}
                style={{
                  padding: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor:
                    type === item.value ? "#f8f8f8" : "transparent",
                  borderRadius: 6,
                }}
              >
                <Text style={{ marginRight: 8 }}>{item.icon}</Text>

                <Text
                  style={{
                    fontWeight: type === item.value ? "600" : "400",
                    color:
                      type === item.value ? colors.button : colors.textPrimary,
                  }}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
        {/* NOTE */}
        <Text style={textStyles.rowText}>Note (optional)</Text>
        <TextInput
          style={[inputStyles.input, { height: 90 }]}
          value={note}
          onChangeText={setNote}
          placeholder="Optional notes"
          multiline
        />

        {/* SAVE BUTTON */}
        <Pressable
          style={buttonStyles.saveButton}
          onPress={async () => {
            if (!user?.uid || !id) return;

            const gramsNumber = Number(grams);
            const countNumber = Number(count);

            if (!Number.isFinite(gramsNumber) || gramsNumber <= 0) {
              return;
            }

            try {
              await foodApi.addFoodEntry(user.uid, id, {
                type,
                grams: type === "meal" ? gramsNumber : undefined,
                count: type !== "meal" ? countNumber : undefined,
                note,
              });

              setGrams("");
              setType("meal");
              setNote("");
              setCount("");

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
