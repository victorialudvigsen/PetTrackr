import * as foodApi from "@/api/foodApi";
import * as petApi from "@/api/petApi";
import AppHeader from "@/components/AppHeader";
import { useAuthSession } from "@/providers/authctx";
import { cardStyles } from "@/styles/cardStyles";
import { colors } from "@/styles/colors";
import { layoutStyles } from "@/styles/layoutStyles";
import { textStyles } from "@/styles/textStyles";
import { PetData } from "@/types/pet";
import { calculateStats } from "@/utils/statsHelpers";
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
    avgPerDay: 0,
    totalMeals: 0,
    streak: 0,
    thisWeek: 0,
    lastWeek: 0,
    weekData: [] as any[],
  });

  useFocusEffect(
    React.useCallback(() => {
      async function fetchData() {
        if (!user?.uid || !id) return;

        setIsLoading(true);

        const petData = await petApi.getPetById(user.uid, id);
        const entries = await foodApi.getFoodEntries(user.uid, id);

        setPet(petData);
        setFoodEntries(entries ?? []);

        const calculated = calculateStats(
          entries,
          (e) => (e.type === "meal" ? (e.grams ?? 0) : (e.count ?? 0)),
          (e) => e.createdAt?.toDate?.() ?? null,
        );

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

        setStats({
          totalGrams: calculated.total,
          avgPerDay: calculated.avgPerDay,
          totalMeals: calculated.totalCount,
          streak: calculated.streak,
          thisWeek: calculated.thisWeek,
          lastWeek: calculated.lastWeek,
          weekData: weekDays,
        });

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

          <Text style={textStyles.pageSubtitle}>Total grams</Text>
          <Text style={textStyles.rowText}>{stats.totalGrams} g</Text>

          <Text style={[textStyles.pageSubtitle, { marginTop: 8 }]}>
            Total meals
          </Text>
          <Text style={textStyles.rowText}>{stats.totalMeals}</Text>
        </View>

        {/* AVERAGE */}
        <View style={cardStyles.card}>
          <Text style={textStyles.sectionTitle}>Average</Text>
          <View style={cardStyles.divider} />

          <Text style={textStyles.pageSubtitle}>Per day</Text>
          <Text style={textStyles.rowText}>{stats.avgPerDay} g</Text>
        </View>

        {/* STREAK */}
        <View style={cardStyles.card}>
          <Text style={textStyles.sectionTitle}>Streak</Text>
          <View style={cardStyles.divider} />

          <Text style={textStyles.pageSubtitle}>Current streak</Text>
          <Text style={textStyles.rowText}>
            🔥 {stats.streak} day{stats.streak !== 1 ? "s" : ""}
          </Text>
        </View>

        {/* WEEK */}
        <View style={cardStyles.card}>
          <Text style={textStyles.sectionTitle}>This Week</Text>
          <View style={cardStyles.divider} />

          <Text style={textStyles.pageSubtitle}>This week</Text>
          <Text style={textStyles.rowText}>{stats.thisWeek} g</Text>

          <Text style={[textStyles.pageSubtitle, { marginTop: 8 }]}>
            Last week
          </Text>
          <Text style={textStyles.rowText}>{stats.lastWeek} g</Text>

          <Text style={[textStyles.pageSubtitle, { marginTop: 8 }]}>
            {stats.thisWeek - stats.lastWeek >= 0 ? "📈" : "📉"}{" "}
            {Math.abs(stats.thisWeek - stats.lastWeek)} g
          </Text>
        </View>

        {/* GRAF */}
        <View style={[cardStyles.card, { marginBottom: 20 }]}>
          <Text style={textStyles.sectionTitle}>Weekly Food</Text>
          <View style={cardStyles.divider} />

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginTop: 10,
            }}
          >
            {stats.weekData.map((day, index) => {
              const max = Math.max(...stats.weekData.map((d) => d.grams), 1);

              const height = (day.grams / max) * 80;

              return (
                <View key={index} style={{ alignItems: "center", flex: 1 }}>
                  <View
                    style={{
                      height,
                      width: 10,
                      backgroundColor: colors.button,
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
        </View>
      </ScrollView>
    </View>
  );
}
