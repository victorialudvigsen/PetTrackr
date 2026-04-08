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
import { formatFoodSummary } from "@/utils/formatters";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";

export default function FoodHistoryPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthSession();

  const [pet, setPet] = useState<PetData | null>(null);
  const [foodEntries, setFoodEntries] = useState<FoodEntryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /* -------- DELETE -------- */
  async function handleDelete(entryId: string) {
    if (!user?.uid || !pet?.id) return;

    Alert.alert("Delete entry", "Are you sure you want to delete this?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await foodApi.deleteFoodEntry(user.uid, pet.id, entryId);

          const updated = await foodApi.getFoodEntries(user.uid, pet.id);
          setFoodEntries(updated ?? []);
        },
      },
    ]);
  }

  /* -------- FETCH DATA -------- */
  useFocusEffect(
    React.useCallback(() => {
      async function fetchData() {
        if (!user?.uid || !id) return;

        setIsLoading(true);

        const petData = await petApi.getPetById(user.uid, id);
        const entries = await foodApi.getFoodEntries(user.uid, id);

        setPet(petData);
        setFoodEntries(entries ?? []);

        setIsLoading(false);
      }

      fetchData();
    }, [user?.uid, id]),
  );

  if (isLoading || !pet) {
    return (
      <View style={layoutStyles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Loading history...</Text>
      </View>
    );
  }

  /* -------- GROUP BY DATE -------- */
  function groupByDate(entries: FoodEntryData[]) {
    const groups: Record<string, FoodEntryData[]> = {};

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    function getLabel(date: Date) {
      const isToday = date.toDateString() === today.toDateString();
      const isYesterday = date.toDateString() === yesterday.toDateString();

      if (isToday) return "Today";
      if (isYesterday) return "Yesterday";

      return date.toLocaleDateString();
    }

    entries.forEach((entry) => {
      const date = entry.createdAt?.toDate?.() ?? new Date();
      const label = getLabel(date);

      if (!groups[label]) {
        groups[label] = [];
      }

      groups[label].push(entry);
    });

    return groups;
  }

  const grouped = groupByDate(foodEntries);

  return (
    <View style={layoutStyles.screen}>
      <AppHeader
        title={`${pet.name} – Food History`}
        onBack={() =>
          router.replace({
            pathname: "/pets/food/[id]",
            params: { id },
          })
        }
      />

      <ScrollView contentContainerStyle={layoutStyles.content}>
        <Text style={textStyles.pageTitle}>All Meals</Text>

        {foodEntries.length === 0 ? (
          <Text style={textStyles.emptyText}>No meals logged yet.</Text>
        ) : (
          Object.entries(grouped).map(([date, items]) => (
            <View key={date} style={{ marginBottom: 12 }}>
              <View style={cardStyles.card}>
                {/* HEADER */}
                <Text style={[textStyles.sectionTitle, { marginBottom: 4 }]}>
                  {date}
                </Text>

                <View style={cardStyles.divider} />

                {items.map((entry) => {
                  const d = entry.createdAt?.toDate?.() ?? new Date();

                  return (
                    <SwipeDeleteRow
                      key={entry.id}
                      onDelete={() => handleDelete(entry.id)}
                    >
                      <View style={rowStyles.row}>
                        <View style={rowStyles.rowLeft}>
                          <View>
                            {/* SUMMARY */}
                            <Text style={textStyles.rowText}>
                              {formatFoodSummary(entry)}
                            </Text>

                            {/* NOTE */}
                            {entry.note && (
                              <Text style={textStyles.noteText}>
                                Note: {entry.note}
                              </Text>
                            )}

                            {/* TIME */}
                            <Text style={textStyles.dateText}>
                              {d.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </SwipeDeleteRow>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
