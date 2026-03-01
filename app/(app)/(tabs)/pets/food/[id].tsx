import AppHeader from "@/components/AppHeader";
import { useAuthSession } from "@/providers/authctx";
import { PetData } from "@/types/pet";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import * as foodApi from "@/api/foodApi";
import * as petApi from "@/api/petApi";
import { FoodEntryData } from "@/types/food";

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
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Loading food...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
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
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* TITLE */}
        <View style={styles.titleWrap}>
          <Text style={styles.pageTitle}>Food</Text>
          <Text style={styles.pageSubtitle}>
            Track food and additional candy
          </Text>
        </View>
        {/* LOG FOOD CARD */}
        <View style={styles.card}>
          <View style={styles.logRow}>
            <View style={styles.iconCircle}>
              <Feather name="shopping-bag" size={22} color="#111" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.logTitle}>Log food</Text>
              <Text style={styles.logSubtitle}>
                Record grams and track meals
              </Text>
            </View>

            <Pressable
              style={styles.addButton}
              onPress={() =>
                router.push({
                  pathname: "/pets/food/log/[id]",
                  params: { id }, // petId
                })
              }
            >
              <Feather name="plus" size={18} color="#111" />
            </Pressable>
          </View>
        </View>

        {/* RECENT MEALS */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Recent meals</Text>
          <View style={styles.divider} />

          {isLoadingFood ? (
            <Text style={styles.emptyText}>Loading meals...</Text>
          ) : foodEntries.length === 0 ? (
            <Text style={styles.emptyText}>No meals logged yet.</Text>
          ) : (
            foodEntries.slice(0, 10).map((entry) => (
              <View key={entry.id} style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={styles.rowIconWrap}>
                    <Feather name="coffee" size={16} color="#111" />
                  </View>
                  <Text style={styles.rowText}>{entry.grams} g</Text>
                </View>

                <Pressable
                  onPress={() => {
                    Alert.alert(
                      "Delete meal",
                      "Are you sure you want to delete this meal?",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Delete",
                          style: "destructive",
                          onPress: async () => {
                            if (!user?.uid || !pet?.id) return;

                            await foodApi.deleteFoodEntry(
                              user.uid,
                              pet.id,
                              entry.id,
                            );

                            // Oppdater listen etter sletting
                            const updated = await foodApi.getFoodEntries(
                              user.uid,
                              pet.id,
                            );
                            setFoodEntries(updated);
                          },
                        },
                      ],
                    );
                  }}
                >
                  <Feather name="trash-2" size={18} color="#B00020" />
                </Pressable>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 18 }} />
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 14,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  logRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F3F0EC",
    alignItems: "center",
    justifyContent: "center",
  },
  logTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },
  logSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E6E6E6",
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
    paddingBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "#EDEDED",
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingVertical: 14,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#F3F0EC",
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },
  rowRightText: {
    fontSize: 12,
    color: "#666",
  },
  titleWrap: {
    marginTop: 8,
  },

  pageTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111",
  },

  pageSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
});
