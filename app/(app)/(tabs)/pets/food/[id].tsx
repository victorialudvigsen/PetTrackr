import * as foodApi from "@/api/foodApi";
import * as petApi from "@/api/petApi";
import AppHeader from "@/components/AppHeader";
import SwipeDeleteRow from "@/components/SwipeDeleteRow";
import { useAuthSession } from "@/providers/authctx";
import { cardStyles } from "@/styles/cardStyles";
import { layoutStyles } from "@/styles/layoutStyles";
import { rowStyles } from "@/styles/rowStyles";
import { textStyles } from "@/styles/textStyles";
import { FoodEntryData } from "@/types/food";
import { PetData } from "@/types/pet";
import { Feather } from "@expo/vector-icons";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function FoodPage() {
  const router = useRouter();
  const { id, from } = useLocalSearchParams<{
    id: string;
    from?: string;
  }>();

  const { user } = useAuthSession();

  const [pet, setPet] = useState<PetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [foodEntries, setFoodEntries] = useState<FoodEntryData[]>([]);
  const [isLoadingFood, setIsLoadingFood] = useState(true);

  /* -------- DELETE FUNCTION -------- */

  async function handleDelete(entryId: string) {
    if (!user?.uid || !pet?.id) return;

    Alert.alert("Delete meal", "Are you sure you want to delete this meal?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await foodApi.deleteFoodEntry(user.uid, pet.id, entryId);

          const updated = await foodApi.getFoodEntries(user.uid, pet.id);
          setFoodEntries(updated);
        },
      },
    ]);
  }

  /* -------- FETCH PET + FOOD -------- */

  useEffect(() => {
    async function fetchData() {
      if (!user?.uid || !id) return;

      setIsLoading(true);
      setIsLoadingFood(true);

      const petResult = await petApi.getPetById(user.uid, id);
      setPet(petResult);

      const entries = await foodApi.getFoodEntries(user.uid, id);
      setFoodEntries(entries);

      setIsLoading(false);
      setIsLoadingFood(false);
    }

    fetchData();
  }, [user?.uid, id]);

  /* Oppdaterer listen når siden får fokus igjen */
  useFocusEffect(
    React.useCallback(() => {
      async function fetchFood() {
        if (!user?.uid || !id) return;

        const entries = await foodApi.getFoodEntries(user.uid, id);
        setFoodEntries(entries);
      }

      fetchFood();
    }, [user?.uid, id]),
  );

  if (isLoading || !pet) {
    return (
      <View style={layoutStyles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Loading food...</Text>
      </View>
    );
  }

  return (
    <View style={layoutStyles.screen}>
      <AppHeader
        title={pet.name}
        onBack={() => {
          if (from === "index") {
            router.replace("/");
          } else {
            router.replace({
              pathname: "/pets/[id]",
              params: { id: pet.id },
            });
          }
        }}
      />

      <ScrollView
        contentContainerStyle={layoutStyles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* TITLE */}
        <View style={layoutStyles.titleWrap}>
          <Text style={textStyles.pageTitle}>Food</Text>
          <Text style={textStyles.pageSubtitle}>
            Track food and additional candy
          </Text>
        </View>

        {/* LOG FOOD CARD */}
        <View style={cardStyles.card}>
          <View style={rowStyles.logRow}>
            <View style={rowStyles.iconCircle}>
              <Ionicons name="fast-food-sharp" size={22} color="black" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={textStyles.logTitle}>Log food</Text>
              <Text style={textStyles.logSubtitle}>
                Record grams and track meals
              </Text>
            </View>

            <Pressable
              style={rowStyles.addButton}
              onPress={() =>
                router.push({
                  pathname: "/pets/food/log/[id]",
                  params: { id },
                })
              }
            >
              <Feather name="plus" size={18} color="#111" />
            </Pressable>
          </View>
        </View>

        {/* RECENT MEALS */}
        <View style={cardStyles.card}>
          <Text style={textStyles.sectionTitle}>Recent meals</Text>
          <View style={cardStyles.divider} />

          {isLoadingFood ? (
            <Text style={textStyles.emptyText}>Loading meals...</Text>
          ) : foodEntries.length === 0 ? (
            <Text style={textStyles.emptyText}>No meals logged yet.</Text>
          ) : (
            foodEntries.slice(0, 10).map((entry) => (
              <SwipeDeleteRow
                key={entry.id}
                onDelete={() => handleDelete(entry.id)}
              >
                <View style={rowStyles.row}>
                  <View style={rowStyles.rowLeft}>
                    <View style={rowStyles.rowIconWrap}>
                      <MaterialCommunityIcons
                        name="food-steak"
                        size={16}
                        color="black"
                      />
                    </View>

                    <Text style={textStyles.rowText}>{entry.grams} g</Text>
                  </View>
                </View>
              </SwipeDeleteRow>
            ))
          )}
        </View>

        <View style={{ height: 18 }} />
      </ScrollView>
    </View>
  );
}
