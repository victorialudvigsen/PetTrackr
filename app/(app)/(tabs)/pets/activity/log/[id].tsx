import * as petApi from "@/api/petApi";
import * as walkApi from "@/api/walkApi";
import AppHeader from "@/components/AppHeader";
import { useAuthSession } from "@/providers/authctx";
import { buttonStyles } from "@/styles/buttonStyles";
import { colors } from "@/styles/colors";
import { inputStyles } from "@/styles/inputStyles";
import { layoutStyles } from "@/styles/layoutStyles";
import { textStyles } from "@/styles/textStyles";
import { PetData } from "@/types/pet";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

export default function LogWalkPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthSession();

  const [pet, setPet] = useState<PetData | null>(null);
  const [duration, setDuration] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [note, setNote] = useState("");
  const [walkType, setWalkType] = useState<
    "none" | "quick" | "long" | "exercise" | "night"
  >("none");
  const [showTypePicker, setShowTypePicker] = useState(false);

  const [mood, setMood] = useState<
    "none" | "happy" | "calm" | "energetic" | "tired"
  >("none");
  const [showMoodPicker, setShowMoodPicker] = useState(false);

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

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={layoutStyles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Duration input */}
          <Text style={textStyles.rowText}>Duration (minutes)</Text>

          <TextInput
            style={inputStyles.input}
            value={duration}
            onChangeText={setDuration}
            keyboardType="numeric"
            placeholder="e.g. 45"
          />

          {/* Walk Type */}
          <Text style={textStyles.rowText}>Walk type</Text>

          <Pressable
            style={buttonStyles.dateButton}
            onPress={() => setShowTypePicker((prev) => !prev)}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Text>
                {walkType === "none" && "🟢"}
                {walkType === "quick" && "⚡"}
                {walkType === "long" && "🗺️"}
                {walkType === "exercise" && "🏃"}
                {walkType === "night" && "🌙"}
              </Text>

              <Text style={buttonStyles.dateButtonText}>
                {walkType === "none" && "None"}
                {walkType === "quick" && "Quick walk"}
                {walkType === "long" && "Long walk"}
                {walkType === "exercise" && "Exercise"}
                {walkType === "night" && "Night walk"}
              </Text>
            </View>
          </Pressable>

          {showTypePicker && (
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              style={{
                backgroundColor: "#fff",
                borderRadius: 8,
                marginTop: -20,
                padding: 6,
                elevation: 2,
              }}
            >
              {[
                { label: "None", value: "none", icon: "🟢" },
                { label: "Quick walk", value: "quick", icon: "⚡" },
                { label: "Long walk", value: "long", icon: "🗺️" },
                { label: "Exercise", value: "exercise", icon: "🏃" },
                { label: "Night walk", value: "night", icon: "🌙" },
              ].map((item) => (
                <Pressable
                  key={item.value}
                  onPress={() => {
                    setWalkType(item.value as any);
                    setShowTypePicker(false);
                  }}
                  style={{
                    padding: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor:
                      walkType === item.value ? "#f8f8f8" : "transparent",
                    borderRadius: 6,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>{item.icon}</Text>

                    <Text
                      style={{
                        fontWeight: walkType === item.value ? "600" : "400",
                        color:
                          walkType === item.value
                            ? colors.button
                            : colors.textPrimary,
                      }}
                    >
                      {item.label}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </Animated.View>
          )}

          {/* MOOD */}
          <Text style={textStyles.rowText}>Mood</Text>

          <Pressable
            style={buttonStyles.dateButton}
            onPress={() => setShowMoodPicker((prev) => !prev)}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Text>
                {mood === "none" && "🟢"}
                {mood === "happy" && "😊"}
                {mood === "calm" && "😌"}
                {mood === "energetic" && "⚡"}
                {mood === "tired" && "😴"}
              </Text>

              <Text style={buttonStyles.dateButtonText}>
                {mood === "none" && "None"}
                {mood === "happy" && "Happy"}
                {mood === "calm" && "Calm"}
                {mood === "energetic" && "Energetic"}
                {mood === "tired" && "Tired"}
              </Text>
            </View>
          </Pressable>
          {showMoodPicker && (
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              style={{
                backgroundColor: "#fff",
                borderRadius: 8,
                marginTop: -20,
                padding: 6,
                elevation: 2,
              }}
            >
              {[
                { label: "None", value: "none", icon: "🟢" },
                { label: "Happy", value: "happy", icon: "😊" },
                { label: "Calm", value: "calm", icon: "😌" },
                { label: "Energetic", value: "energetic", icon: "⚡" },
                { label: "Tired", value: "tired", icon: "😴" },
              ].map((item) => (
                <Pressable
                  key={item.value}
                  onPress={() => {
                    setMood(item.value as any);
                    setShowMoodPicker(false);
                  }}
                  style={{
                    padding: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor:
                      mood === item.value ? "#f8f8f8" : "transparent",
                    borderRadius: 6,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>{item.icon}</Text>

                    <Text
                      style={{
                        fontWeight: mood === item.value ? "600" : "400",
                        color:
                          mood === item.value
                            ? colors.button
                            : colors.textPrimary,
                      }}
                    >
                      {item.label}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </Animated.View>
          )}

          {/* Note */}
          <Text style={textStyles.rowText}>Note (optional)</Text>

          <TextInput
            style={[inputStyles.input, { height: 90 }]}
            value={note}
            onChangeText={setNote}
            placeholder="Optional notes"
            multiline
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

                await walkApi.addWalk(user.uid, id, {
                  duration: minutes,
                  note,
                  type: walkType === "none" ? undefined : walkType,
                  mood: mood === "none" ? undefined : mood,
                });

                setDuration("");
                setNote("");
                setWalkType("none");

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
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
