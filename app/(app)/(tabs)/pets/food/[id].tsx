import * as foodApi from "@/api/foodApi";
import * as petApi from "@/api/petApi";
import { updatePetGoal } from "@/api/petApi";
import AppHeader from "@/components/AppHeader";
import GoalModal from "@/components/GoalModal";
import SwipeDeleteRow from "@/components/SwipeDeleteRow";
import { useAuthSession } from "@/providers/authctx";
import { buttonStyles } from "@/styles/buttonStyles";
import { cardStyles } from "@/styles/cardStyles";
import { colors } from "@/styles/colors";
import { layoutStyles } from "@/styles/layoutStyles";
import { rowStyles } from "@/styles/rowStyles";
import { textStyles } from "@/styles/textStyles";
import { FoodEntryData } from "@/types/food";
import { PetData } from "@/types/pet";
import { formatFoodSummary } from "@/utils/formatters";
import { calculateStats } from "@/utils/statsHelpers";
import { Feather } from "@expo/vector-icons";
import Ionicons from "@expo/vector-icons/Ionicons";
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

  const [todaySummary, setTodaySummary] = useState({
    count: 0,
    totalGrams: 0,
  });
  const [goal, setGoal] = useState(300);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const progress = Math.min(todaySummary.totalGrams / goal, 1);
  let progressColor = "#ff6b6b";
  if (progress > 0.7) progressColor = colors.button;
  else if (progress > 0.3) progressColor = "#ffb300";

  const [foodStats, setFoodStats] = useState({
    thisWeek: 0,
    streak: 0,
  });

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
          calculateTodayFood(updated);

          const stats = calculateStats(
            updated,
            (e) => (e.type === "meal" ? (e.grams ?? 0) : (e.count ?? 0)),
            (e) => e.createdAt?.toDate?.() ?? null,
          );

          setFoodStats({
            thisWeek: stats.thisWeek,
            streak: stats.streak,
          });
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
      calculateTodayFood(entries);

      setIsLoading(false);
      setIsLoadingFood(false);

      if (petResult?.dailyGoal) {
        setGoal(petResult.dailyGoal);
      }
    }

    fetchData();
  }, [user?.uid, id]);

  /* -------- TODAY SUMMARY -------- */
  function calculateTodayFood(entries: FoodEntryData[]) {
    const today = new Date();

    const isSameDay = (d1: Date, d2: Date) =>
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();

    const todayEntries = entries.filter((entry) => {
      const date = entry.createdAt?.toDate?.();
      return date && isSameDay(date, today);
    });

    const totalGrams = todayEntries.reduce(
      (sum: number, e: FoodEntryData) => sum + (e.grams || 0),
      0,
    );

    setTodaySummary({
      count: todayEntries.length,
      totalGrams,
    });
  }

  /* Oppdaterer listen når siden får fokus igjen */
  useFocusEffect(
    React.useCallback(() => {
      async function fetchFood() {
        if (!user?.uid || !id) return;

        const entries = await foodApi.getFoodEntries(user.uid, id);
        setFoodEntries(entries);
        calculateTodayFood(entries);

        const stats = calculateStats(
          entries,
          (e) => (e.type === "meal" ? (e.grams ?? 0) : (e.count ?? 0)),
          (e) => e.createdAt?.toDate?.() ?? null,
        );

        setFoodStats({
          thisWeek: stats.thisWeek,
          streak: stats.streak,
        });
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

  /* -------- FORMAT DATE -------- */
  function formatDate(date: Date) {
    const today = new Date();
    const tomorrow = new Date();

    tomorrow.setDate(today.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const time = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (isToday) return `Today • ${time}`;
    if (isTomorrow) return `Tomorrow • ${time}`;

    return `${date.toLocaleDateString()} • ${time}`;
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
            <View style={buttonStyles.iconCircle}>
              <Ionicons
                name="fast-food-sharp"
                size={22}
                color={colors.button}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={textStyles.logTitle}>Log food</Text>
              <Text style={textStyles.logSubtitle}>
                Record grams and track meals
              </Text>
            </View>

            <Pressable
              style={buttonStyles.addButton}
              onPress={() =>
                router.push({
                  pathname: "/pets/food/log/[id]",
                  params: { id },
                })
              }
            >
              <Feather name="plus" size={18} color={colors.button} />
            </Pressable>
          </View>
        </View>

        {/* TODAY */}
        <View style={cardStyles.card}>
          {/* HEADER */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={textStyles.sectionTitle}>Today</Text>

            <Pressable onPress={() => setShowGoalModal(true)}>
              <Text style={{ color: colors.button, fontWeight: "600" }}>
                Edit
              </Text>
            </Pressable>
          </View>

          <View style={cardStyles.divider} />

          {todaySummary.count === 0 ? (
            <Text style={textStyles.emptyText}>No meals today</Text>
          ) : (
            <>
              {/* PROGRESS BAR */}
              <View
                style={{
                  height: 10,
                  backgroundColor: "#eee",
                  borderRadius: 6,
                  overflow: "hidden",
                  marginTop: 10,
                }}
              >
                <View
                  style={{
                    width: `${progress * 100}%`,
                    height: "100%",
                    backgroundColor: progressColor,
                  }}
                />
              </View>

              {/* STATS */}
              <Text style={[textStyles.pageSubtitle, { marginTop: 10 }]}>
                {todaySummary.totalGrams} g / {goal} g
              </Text>

              <Text style={textStyles.pageSubtitle}>
                🍽️ {todaySummary.count} meal
                {todaySummary.count !== 1 ? "s" : ""}
              </Text>
            </>
          )}
        </View>

        {/* STATS PREVIEW */}
        <View style={cardStyles.card}>
          <Text style={textStyles.sectionTitle}>Statistics</Text>
          <View style={cardStyles.divider} />

          {/* THIS WEEK */}
          <Text style={textStyles.pageSubtitle}>📊 This week</Text>
          <Text style={textStyles.rowText}>{foodStats.thisWeek} g</Text>

          {/* STREAK */}
          <Text style={[textStyles.pageSubtitle, { marginTop: 8 }]}>
            🔥 Streak
          </Text>
          <Text style={textStyles.rowText}>
            {foodStats.streak} day{foodStats.streak !== 1 ? "s" : ""}
          </Text>

          <Pressable
            style={{ marginTop: 10 }}
            onPress={() =>
              router.push({
                pathname: "/pets/food/stats/[id]",
                params: { id },
              })
            }
          >
            <Text
              style={{
                color: colors.button,
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              View insights →
            </Text>
          </Pressable>
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
                    <View>
                      {/* SUMMARY */}
                      <Text style={textStyles.rowText}>
                        {formatFoodSummary(entry)}
                      </Text>

                      {/* NOTE */}
                      {entry.note ? (
                        <Text style={textStyles.noteText}>
                          Note: {entry.note}
                        </Text>
                      ) : null}

                      {/* DATE */}
                      <Text style={textStyles.dateText}>
                        {formatDate(entry.createdAt?.toDate?.() ?? new Date())}
                      </Text>
                    </View>
                  </View>
                </View>
              </SwipeDeleteRow>
            ))
          )}
        </View>

        <View style={{ height: 18 }} />
      </ScrollView>
      <GoalModal
        visible={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        onSave={async (value) => {
          if (!user?.uid || !pet?.id) return;

          try {
            await updatePetGoal(user.uid, pet.id, value);
            setGoal(value);
          } catch (e) {
            console.log("Error saving goal:", e);
          }
        }}
      />
    </View>
  );
}
