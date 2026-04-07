import * as foodApi from "@/api/foodApi";
import * as petApi from "@/api/petApi";
import AppHeader from "@/components/AppHeader";
import { useAuthSession } from "@/providers/authctx";
import { cardStyles } from "@/styles/cardStyles";
import { colors } from "@/styles/colors";
import { layoutStyles } from "@/styles/layoutStyles";
import { textStyles } from "@/styles/textStyles";
import { PetData } from "@/types/pet";
import { calculateFoodStats, getFoodWeekData } from "@/utils/statsHelpers";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

export default function FoodStatsPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthSession();

  const [pet, setPet] = useState<PetData | null>(null);
  const [foodEntries, setFoodEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalGrams: 0,
    totalMeals: 0,
    totalTreats: 0,
    totalBones: 0,

    thisWeekGrams: 0,
    thisWeekTreats: 0,
    thisWeekBones: 0,

    lastWeekGrams: 0,
    lastWeekTreats: 0,
    lastWeekBones: 0,

    avgGramsPerDay: 0,
    avgTreatsPerDay: 0,
    avgBonesPerDay: 0,
  });
  const [weekData, setWeekData] = useState<
    {
      treats: any;
      bones: any;
      label: string;
      date: Date;
      grams: number;
    }[]
  >([]);
  const [selectedType, setSelectedType] = useState<
    "grams" | "treats" | "bones"
  >("grams");
  const [selectedWeek, setSelectedWeek] = useState<"this" | "last">("this");

  useFocusEffect(
    React.useCallback(() => {
      async function fetchData() {
        if (!user?.uid || !id) return;

        setIsLoading(true);

        const petData = await petApi.getPetById(user.uid, id);
        const entries = await foodApi.getFoodEntries(user.uid, id);
        const weekData = getFoodWeekData(entries);
        console.log(weekData);
        setWeekData(weekData);

        setPet(petData);
        setFoodEntries(entries ?? []);

        const stats = calculateFoodStats(entries ?? []);

        /* -------- WEEK DATA (graf) -------- */
        function getStartOfWeek(date: Date) {
          const d = new Date(date);
          const day = d.getDay();
          const diff = day === 0 ? -6 : 1 - day;
          d.setDate(d.getDate() + diff);
          d.setHours(0, 0, 0, 0);
          return d;
        }

        const startOfWeek = getStartOfWeek(new Date());

        const weekDays = Array.from({ length: 7 }).map((_, i) => {
          const d = new Date(startOfWeek);
          d.setDate(startOfWeek.getDate() + i);

          return {
            label: d.toLocaleDateString("en-US", { weekday: "short" }),
            date: d,
            grams: 0,
          };
        });

        entries.forEach((e) => {
          const d = e.createdAt?.toDate?.();
          if (!d) return;

          weekDays.forEach((day) => {
            if (d.toDateString() === day.date.toDateString()) {
              day.grams += e.grams || 0;
            }
          });
        });

        setStats(stats);

        setIsLoading(false);
      }

      fetchData();
    }, [user?.uid, id]),
  );

  if (isLoading || !pet) {
    return (
      <View style={layoutStyles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Loading stats...</Text>
      </View>
    );
  }

  return (
    <View style={layoutStyles.screen}>
      <AppHeader
        title={`${pet.name} – Food Insights`}
        onBack={() =>
          router.replace({
            pathname: "/pets/food/[id]",
            params: { id },
          })
        }
      />

      <ScrollView contentContainerStyle={layoutStyles.content}>
        <Text style={textStyles.pageTitle}>Food Insights</Text>

        {/* TOTAL */}
        <View style={cardStyles.card}>
          <Text style={textStyles.sectionTitle}>Total</Text>
          <View style={cardStyles.divider} />

          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <View style={{ alignItems: "center", flex: 1 }}>
              <Text style={textStyles.pageSubtitle}>Grams</Text>
              <Text style={textStyles.rowText}>{stats.totalGrams} g</Text>
            </View>

            <View style={{ alignItems: "center", flex: 1 }}>
              <Text style={textStyles.pageSubtitle}>Meals</Text>
              <Text style={textStyles.rowText}>{stats.totalMeals}</Text>
            </View>

            <View style={{ alignItems: "center", flex: 1 }}>
              <Text style={textStyles.pageSubtitle}>Treats</Text>
              <Text style={textStyles.rowText}>{stats.totalTreats}</Text>
            </View>

            <View style={{ alignItems: "center", flex: 1 }}>
              <Text style={textStyles.pageSubtitle}>Bones</Text>
              <Text style={textStyles.rowText}>{stats.totalBones}</Text>
            </View>
          </View>
        </View>

        {/* AVERAGE */}
        <View style={cardStyles.card}>
          <Text style={textStyles.sectionTitle}>Average</Text>
          <View style={cardStyles.divider} />

          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <View style={{ alignItems: "center", flex: 1 }}>
              <Text style={textStyles.pageSubtitle}>Grams/day</Text>
              <Text style={textStyles.rowText}>{stats.avgGramsPerDay} g</Text>
            </View>

            <View style={{ alignItems: "center", flex: 1 }}>
              <Text style={textStyles.pageSubtitle}>Treats/day</Text>
              <Text style={textStyles.rowText}>{stats.avgTreatsPerDay}</Text>
            </View>

            <View style={{ alignItems: "center", flex: 1 }}>
              <Text style={textStyles.pageSubtitle}>Bones/day</Text>
              <Text style={textStyles.rowText}>{stats.avgBonesPerDay}</Text>
            </View>
          </View>
        </View>

        {/* THIS WEEK */}
        <View style={cardStyles.card}>
          <Text style={textStyles.sectionTitle}>Weekly stats</Text>
          <View style={{ flexDirection: "row", gap: 16 }}>
            <Text
              onPress={() => setSelectedWeek("this")}
              style={{
                fontWeight: selectedWeek === "this" ? "600" : "400",
                color: selectedWeek === "this" ? colors.button : "#888",
              }}
            >
              This Week
            </Text>

            <Text
              onPress={() => setSelectedWeek("last")}
              style={{
                fontWeight: selectedWeek === "last" ? "600" : "400",
                color: selectedWeek === "last" ? colors.button : "#888",
              }}
            >
              Last Week
            </Text>
          </View>
          <View style={cardStyles.divider} />

          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <View style={{ alignItems: "center", flex: 1 }}>
              <Text style={textStyles.pageSubtitle}>Grams</Text>
              <Text style={textStyles.rowText}>
                {selectedWeek === "this"
                  ? stats.thisWeekGrams
                  : stats.lastWeekGrams}{" "}
                g
              </Text>
            </View>

            <View style={{ alignItems: "center", flex: 1 }}>
              <Text style={textStyles.pageSubtitle}>Treats</Text>
              <Text style={textStyles.rowText}>
                {selectedWeek === "this"
                  ? stats.thisWeekTreats
                  : stats.lastWeekTreats}
              </Text>
            </View>

            <View style={{ alignItems: "center", flex: 1 }}>
              <Text style={textStyles.pageSubtitle}>Bones</Text>
              <Text style={textStyles.rowText}>
                {selectedWeek === "this"
                  ? stats.thisWeekBones
                  : stats.lastWeekBones}
              </Text>
            </View>
          </View>
        </View>

        {/* GRAF */}
        <View style={[cardStyles.card, { marginBottom: 20 }]}>
          <Text style={textStyles.sectionTitle}>Weekly Food</Text>

          {/* TOGGLE */}
          <View style={{ flexDirection: "row", gap: 16, marginTop: 10 }}>
            <Text
              onPress={() => setSelectedType("grams")}
              style={{
                fontWeight: selectedType === "grams" ? "600" : "400",
                color: selectedType === "grams" ? colors.button : "#888",
              }}
            >
              Food
            </Text>

            <Text
              onPress={() => setSelectedType("treats")}
              style={{
                fontWeight: selectedType === "treats" ? "600" : "400",
                color: selectedType === "treats" ? colors.button : "#888",
              }}
            >
              Treats
            </Text>

            <Text
              onPress={() => setSelectedType("bones")}
              style={{
                fontWeight: selectedType === "bones" ? "600" : "400",
                color: selectedType === "bones" ? colors.button : "#888",
              }}
            >
              Bones
            </Text>
          </View>

          <View style={cardStyles.divider} />

          {(() => {
            const max =
              selectedType === "grams"
                ? 500 // juster senere
                : selectedType === "treats"
                  ? 10
                  : 5;

            return (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  marginTop: 10,
                }}
              >
                {weekData.map((day, index) => {
                  const value =
                    selectedType === "grams"
                      ? day.grams
                      : selectedType === "treats"
                        ? day.treats
                        : day.bones;

                  const height = (value / max) * 140;

                  return (
                    <View key={index} style={{ alignItems: "center", flex: 1 }}>
                      {value > 0 && (
                        <Text style={{ fontSize: 10, marginBottom: 4 }}>
                          {value}
                        </Text>
                      )}
                      <View
                        style={{
                          height,
                          width: 10,
                          backgroundColor:
                            selectedType === "grams"
                              ? colors.button
                              : selectedType === "treats"
                                ? "#68a81e"
                                : "#1d6340",
                          borderRadius: 4,
                        }}
                      />
                      <Text style={{ fontSize: 10, marginTop: 4 }}>
                        {day.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            );
          })()}
        </View>
      </ScrollView>
    </View>
  );
}
