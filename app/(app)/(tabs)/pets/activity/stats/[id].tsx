import * as petApi from "@/api/petApi";
import * as walkApi from "@/api/walkApi";
import AppHeader from "@/components/AppHeader";
import { useAuthSession } from "@/providers/authctx";
import { cardStyles } from "@/styles/cardStyles";
import { colors } from "@/styles/colors";
import { layoutStyles } from "@/styles/layoutStyles";
import { textStyles } from "@/styles/textStyles";
import { PetData } from "@/types/pet";
import { calculateStats } from "@/utils/statsHelpers"; // 👈 NY
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

export default function ActivityStatsPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthSession();

  const [pet, setPet] = useState<PetData | null>(null);
  const [walks, setWalks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [stats, setStats] = useState({
    totalMinutes: 0,
    avgPerDay: 0,
    totalWalks: 0,
    streak: 0,
    thisWeek: 0,
    lastWeek: 0,
    weekData: [] as any[],
  });

  /* -------- FETCH DATA -------- */
  useFocusEffect(
    React.useCallback(() => {
      async function fetchData() {
        if (!user?.uid || !id) return;

        setIsLoading(true);

        const petData = await petApi.getPetById(user.uid, id);
        const walkData = await walkApi.getWalks(user.uid, id);

        setPet(petData);
        setWalks(walkData ?? []);

        const allWalks = walkData ?? [];

        /* -------- USE HELPER -------- */
        const calculated = calculateStats(allWalks);

        /* -------- WEEK GRAPH DATA (beholdes her) -------- */
        function getStartOfWeek(date: Date) {
          const d = new Date(date);
          const day = d.getDay();

          const diff = day === 0 ? -6 : 1 - day;
          d.setDate(d.getDate() + diff);

          d.setHours(0, 0, 0, 0);
          return d;
        }

        const now = new Date();
        const startOfThisWeek = getStartOfWeek(now);

        function getWeekDays() {
          const days = [];
          const start = new Date(startOfThisWeek);

          for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);

            days.push({
              label: d.toLocaleDateString("en-US", { weekday: "short" }),
              date: d,
              minutes: 0,
            });
          }

          return days;
        }

        const weekDays = getWeekDays();

        allWalks.forEach((w) => {
          const d = w.createdAt?.toDate?.();
          if (!d) return;

          weekDays.forEach((day) => {
            if (d.toDateString() === day.date.toDateString()) {
              day.minutes += w.duration || 0;
            }
          });
        });

        /* -------- SET STATE -------- */
        setStats({
          ...calculated,
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
        title={`${pet.name} – Insights`}
        onBack={() =>
          router.replace({
            pathname: "/pets/activity/[id]",
            params: { id },
          })
        }
      />

      <ScrollView contentContainerStyle={layoutStyles.content}>
        <Text style={textStyles.pageTitle}>Activity Insights</Text>

        {/* TOTAL */}
        <View style={cardStyles.card}>
          <Text style={textStyles.sectionTitle}>Total</Text>
          <View style={cardStyles.divider} />

          <Text style={textStyles.pageSubtitle}>Total minutes</Text>
          <Text style={textStyles.rowText}>{stats.totalMinutes} min</Text>

          <Text style={[textStyles.pageSubtitle, { marginTop: 8 }]}>
            Total walks
          </Text>
          <Text style={textStyles.rowText}>{stats.totalWalks}</Text>
        </View>

        {/* AVERAGE */}
        <View style={cardStyles.card}>
          <Text style={textStyles.sectionTitle}>Average</Text>
          <View style={cardStyles.divider} />

          <Text style={textStyles.pageSubtitle}>Per day</Text>
          <Text style={textStyles.rowText}>{stats.avgPerDay} min</Text>
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

        {/* THIS WEEK */}
        <View style={cardStyles.card}>
          <Text style={textStyles.sectionTitle}>This Week</Text>
          <View style={cardStyles.divider} />

          <Text style={textStyles.pageSubtitle}>This week</Text>
          <Text style={textStyles.rowText}>{stats.thisWeek} min</Text>

          <Text style={[textStyles.pageSubtitle, { marginTop: 8 }]}>
            Last week
          </Text>
          <Text style={textStyles.rowText}>{stats.lastWeek} min</Text>

          <Text style={[textStyles.pageSubtitle, { marginTop: 8 }]}>
            {stats.thisWeek - stats.lastWeek >= 0 ? "📈" : "📉"}{" "}
            {Math.abs(stats.thisWeek - stats.lastWeek)} min
          </Text>
        </View>

        {/* GRAF */}
        <View style={[cardStyles.card, { marginBottom: 20 }]}>
          <Text style={textStyles.sectionTitle}>Weekly Activity</Text>
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
              const max = Math.max(...stats.weekData.map((d) => d.minutes), 1);

              const height = (day.minutes / max) * 80;

              return (
                <View
                  key={index}
                  style={{
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  <View
                    style={{
                      height: height,
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
