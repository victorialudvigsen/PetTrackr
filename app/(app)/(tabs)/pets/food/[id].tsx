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
import { calculateFoodStats } from "@/utils/statsHelpers";
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
    meals: 0,
    grams: 0,
    treats: 0,
    bones: 0,
  });
  const [goal, setGoal] = useState(300);
  const [treatGoal, setTreatGoal] = useState(10);
  const [boneGoal, setBoneGoal] = useState(5);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const progress = Math.min(todaySummary.grams / goal, 1);
  let progressColor = "#ff6b6b";
  if (progress > 0.7) progressColor = colors.button;
  else if (progress > 0.3) progressColor = "#ffb300";

  const [foodStats, setFoodStats] = useState({
    thisWeekGrams: 0,
    thisWeekTreats: 0,
    thisWeekBones: 0,

    lastWeekGrams: 0,
    lastWeekTreats: 0,
    lastWeekBones: 0,
  });
  const [selectedTodayType, setSelectedTodayType] = useState<
    "meal" | "treat" | "bone"
  >("meal");
  const [selectedStatsWeek, setSelectedStatsWeek] = useState<"this" | "last">(
    "this",
  );
  const [compareMode, setCompareMode] = useState(false);

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

      if (petResult?.treatGoal) {
        setTreatGoal(petResult.treatGoal);
      }

      if (petResult?.boneGoal) {
        setBoneGoal(petResult.boneGoal);
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

    let meals = 0;
    let grams = 0;
    let treats = 0;
    let bones = 0;

    todayEntries.forEach((e) => {
      if (e.type === "meal") {
        meals++;
        grams += e.grams || 0;
      } else if (e.type === "treat") {
        treats += e.count || 0;
      } else if (e.type === "bone") {
        bones += e.count || 0;
      }
    });

    setTodaySummary({
      meals,
      grams,
      treats,
      bones,
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

        const stats = calculateFoodStats(entries);

        setFoodStats({
          thisWeekGrams: stats.thisWeekGrams,
          thisWeekTreats: stats.thisWeekTreats,
          thisWeekBones: stats.thisWeekBones,

          lastWeekGrams: stats.lastWeekGrams,
          lastWeekTreats: stats.lastWeekTreats,
          lastWeekBones: stats.lastWeekBones,
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

          const stats = calculateFoodStats(updated);

          setFoodStats({
            thisWeekGrams: stats.thisWeekGrams,
            thisWeekTreats: stats.thisWeekTreats,
            thisWeekBones: stats.thisWeekBones,

            lastWeekGrams: stats.lastWeekGrams,
            lastWeekTreats: stats.lastWeekTreats,
            lastWeekBones: stats.lastWeekBones,
          });
        },
      },
    ]);
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
          <Text style={[textStyles.sectionTitle, { marginBottom: 10 }]}>
            Today
          </Text>
          {/* HEADER */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {/* TOGGLE */}
            <View style={{ flexDirection: "row", gap: 16 }}>
              <Text
                onPress={() => setSelectedTodayType("meal")}
                style={{
                  fontWeight: selectedTodayType === "meal" ? "600" : "400",
                  color: selectedTodayType === "meal" ? colors.button : "#888",
                }}
              >
                Meal
              </Text>

              <Text
                onPress={() => setSelectedTodayType("treat")}
                style={{
                  fontWeight: selectedTodayType === "treat" ? "600" : "400",
                  color: selectedTodayType === "treat" ? colors.button : "#888",
                }}
              >
                Treats
              </Text>

              <Text
                onPress={() => setSelectedTodayType("bone")}
                style={{
                  fontWeight: selectedTodayType === "bone" ? "600" : "400",
                  color: selectedTodayType === "bone" ? colors.button : "#888",
                }}
              >
                Bones
              </Text>
            </View>

            <Pressable onPress={() => setShowGoalModal(true)}>
              <Text style={{ color: colors.button, fontWeight: "600" }}>
                Edit
              </Text>
            </Pressable>
          </View>

          <View style={cardStyles.divider} />

          {todaySummary.meals === 0 &&
          todaySummary.treats === 0 &&
          todaySummary.bones === 0 ? (
            <Text style={textStyles.emptyText}>No activity today</Text>
          ) : (
            <>
              {/* PROGRESS LOGIKK */}
              {(() => {
                const value =
                  selectedTodayType === "meal"
                    ? todaySummary.grams
                    : selectedTodayType === "treat"
                      ? todaySummary.treats
                      : todaySummary.bones;

                const max =
                  selectedTodayType === "meal"
                    ? goal
                    : selectedTodayType === "treat"
                      ? treatGoal
                      : boneGoal;

                const progress = Math.min(value / max, 1);

                const progressColor =
                  progress > 0.7
                    ? colors.button
                    : progress > 0.3
                      ? "#ffb300"
                      : "#ff6b6b";

                return (
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

                    {/* DYNAMISK TEKST */}
                    <Text style={[textStyles.pageSubtitle, { marginTop: 10 }]}>
                      {selectedTodayType === "meal"
                        ? `${todaySummary.grams} g / ${goal} g`
                        : selectedTodayType === "treat"
                          ? `${todaySummary.treats} / ${treatGoal} treats`
                          : `${todaySummary.bones} / ${boneGoal} bones`}
                    </Text>

                    <Text style={textStyles.pageSubtitle}>
                      {selectedTodayType === "meal"
                        ? `🍽️ ${todaySummary.meals} meal${
                            todaySummary.meals !== 1 ? "s" : ""
                          }`
                        : selectedTodayType === "treat"
                          ? `🍬 ${todaySummary.treats} treat${
                              todaySummary.treats !== 1 ? "s" : ""
                            }`
                          : `🦴 ${todaySummary.bones} bone${
                              todaySummary.bones !== 1 ? "s" : ""
                            }`}
                    </Text>
                  </>
                );
              })()}
            </>
          )}
        </View>

        {/* STATISTICS */}
        <View style={cardStyles.card}>
          <Text style={textStyles.sectionTitle}>Statistics</Text>

          {/* TOGGLE + COMPARE */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 10,
            }}
          >
            {/* LEFT: TOGGLE */}
            <View style={{ flexDirection: "row", gap: 16 }}>
              <Text
                onPress={() => setSelectedStatsWeek("this")}
                style={{
                  fontWeight: selectedStatsWeek === "this" ? "600" : "400",
                  color: selectedStatsWeek === "this" ? colors.button : "#888",
                }}
              >
                This week
              </Text>

              <Text
                onPress={() => setSelectedStatsWeek("last")}
                style={{
                  fontWeight: selectedStatsWeek === "last" ? "600" : "400",
                  color: selectedStatsWeek === "last" ? colors.button : "#888",
                }}
              >
                Last week
              </Text>
            </View>

            {/* RIGHT: COMPARE BUTTON */}
            <Text
              onPress={() => setCompareMode((prev) => !prev)}
              style={{
                color: colors.button,
                fontWeight: "600",
              }}
            >
              {compareMode ? "Close" : "Compare"}
            </Text>
          </View>

          <View style={cardStyles.divider} />

          {/* MEALS */}
          <Text style={[textStyles.pageSubtitle, { marginTop: 8 }]}>
            🍽️ Meals
          </Text>

          {compareMode ? (
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={textStyles.rowText}>
                {foodStats.thisWeekGrams} g
              </Text>
              <Text style={textStyles.rowText}>
                {foodStats.lastWeekGrams} g
              </Text>
            </View>
          ) : (
            <Text style={textStyles.rowText}>
              {selectedStatsWeek === "this"
                ? foodStats.thisWeekGrams
                : foodStats.lastWeekGrams}{" "}
              g
            </Text>
          )}

          {/* TREATS */}
          <Text style={[textStyles.pageSubtitle, { marginTop: 8 }]}>
            🍬 Treats
          </Text>

          {compareMode ? (
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={textStyles.rowText}>{foodStats.thisWeekTreats}</Text>
              <Text style={textStyles.rowText}>{foodStats.lastWeekTreats}</Text>
            </View>
          ) : (
            <Text style={textStyles.rowText}>
              {selectedStatsWeek === "this"
                ? foodStats.thisWeekTreats
                : foodStats.lastWeekTreats}
            </Text>
          )}

          {/* BONES */}
          <Text style={[textStyles.pageSubtitle, { marginTop: 8 }]}>
            🦴 Bones
          </Text>

          {compareMode ? (
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={textStyles.rowText}>{foodStats.thisWeekBones}</Text>
              <Text style={textStyles.rowText}>{foodStats.lastWeekBones}</Text>
            </View>
          ) : (
            <Text style={textStyles.rowText}>
              {selectedStatsWeek === "this"
                ? foodStats.thisWeekBones
                : foodStats.lastWeekBones}
            </Text>
          )}

          {/* CTA */}
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
            foodEntries.slice(0, 5).map((entry) => (
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

          <Pressable
            onPress={() =>
              router.push({
                pathname: "/pets/food/history/[id]",
                params: { id },
              })
            }
            style={{ marginTop: 10 }}
          >
            <Text
              style={{
                color: colors.button,
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              See all meals →
            </Text>
          </Pressable>
        </View>

        <View style={{ height: 18 }} />
      </ScrollView>
      <GoalModal
        visible={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        onSave={async (value) => {
          if (!user?.uid || !pet?.id) return;

          try {
            await updatePetGoal(user.uid, pet.id, value, selectedTodayType);

            if (selectedTodayType === "meal") {
              setGoal(value);
            } else if (selectedTodayType === "treat") {
              setTreatGoal(value);
            } else {
              setBoneGoal(value);
            }
          } catch (e) {
            console.log("Error saving goal:", e);
          }
        }}
      />
    </View>
  );
}
