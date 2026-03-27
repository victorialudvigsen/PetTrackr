import * as petApi from "@/api/petApi";
import { updatePetGoal } from "@/api/petApi";
import * as walkApi from "@/api/walkApi";
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
import { PetData } from "@/types/pet";
import { WalkData } from "@/types/walk";
import { formatWalkSummary } from "@/utils/formatters";
import { calculateStats } from "@/utils/statsHelpers"; // 👈 NY
import { Feather, FontAwesome5 } from "@expo/vector-icons";
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

export default function PetActivityPage() {
  const router = useRouter();
  const { id, from } = useLocalSearchParams<{
    id: string;
    from?: string;
  }>();
  const { user } = useAuthSession();

  const [pet, setPet] = useState<PetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [walks, setWalks] = useState<WalkData[]>([]);
  const [isLoadingWalks, setIsLoadingWalks] = useState(true);

  const [todaySummary, setTodaySummary] = useState({
    count: 0,
    totalMinutes: 0,
    latestWalk: null as WalkData | null,
  });

  /* -------- NY STATE -------- */
  const [weeklyStats, setWeeklyStats] = useState({
    thisWeek: 0,
    streak: 0,
  });

  const [goal, setGoal] = useState(120);
  const [showGoalModal, setShowGoalModal] = useState(false);

  const dailyGoal = goal;
  const progress = Math.min(todaySummary.totalMinutes / dailyGoal, 1);

  let progressColor = "#ff6b6b";
  if (progress > 0.7) progressColor = colors.button;
  else if (progress > 0.3) progressColor = "#ffb300";

  /* -------- DELETE WALK -------- */
  async function handleDelete(walkId: string) {
    if (!user?.uid || !pet?.id) return;

    Alert.alert("Delete walk", "Are you sure you want to delete this walk?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await walkApi.deleteWalk(user.uid, pet.id, walkId);

          const updated = await walkApi.getWalks(user.uid, pet.id);
          setWalks(updated);

          calculateTodaySummary(updated);

          /* 👇 oppdater stats også */
          const calculated = calculateStats(updated);
          setWeeklyStats({
            thisWeek: calculated.thisWeek,
            streak: calculated.streak,
          });
        },
      },
    ]);
  }

  /* -------- FETCH PET -------- */
  useEffect(() => {
    async function fetchPet() {
      if (!user?.uid || !id) return;

      setIsLoading(true);
      const result = await petApi.getPetById(user.uid, id);
      setPet(result);

      if (result?.dailyGoal) setGoal(result.dailyGoal);
      else setGoal(120);

      setIsLoading(false);
    }

    fetchPet();
  }, [user?.uid, id]);

  /* -------- TODAY SUMMARY -------- */
  function calculateTodaySummary(walks: WalkData[]) {
    const today = new Date();

    const isSameDay = (d1: Date, d2: Date) =>
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();

    const todayWalks = walks.filter((walk) => {
      const date = walk.createdAt?.toDate?.();
      return date && isSameDay(date, today);
    });

    const totalMinutes = todayWalks.reduce(
      (sum, w) => sum + (w.duration || 0),
      0,
    );

    setTodaySummary({
      count: todayWalks.length,
      totalMinutes,
      latestWalk: todayWalks[0] ?? null,
    });
  }

  /* -------- FETCH WALKS -------- */
  useFocusEffect(
    React.useCallback(() => {
      async function fetchWalks() {
        if (!user?.uid || !id) return;

        setIsLoadingWalks(true);

        const result: WalkData[] = await walkApi.getWalks(user.uid, id);
        setWalks(result ?? []);

        calculateTodaySummary(result ?? []);

        /* 👇 HELPER BRUK */
        const calculated = calculateStats(result ?? []);
        setWeeklyStats({
          thisWeek: calculated.thisWeek,
          streak: calculated.streak,
        });

        setIsLoadingWalks(false);
      }

      fetchWalks();
    }, [user?.uid, id]),
  );

  if (isLoading || !pet) {
    return (
      <View style={layoutStyles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Loading activity...</Text>
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
          if (from === "index") router.replace("/");
          else
            router.replace({
              pathname: "/pets/[id]",
              params: { id: pet.id },
            });
        }}
      />

      <ScrollView contentContainerStyle={layoutStyles.content}>
        {/* TITLE */}
        <View style={layoutStyles.titleWrap}>
          <Text style={textStyles.pageTitle}>Activity</Text>
          <Text style={textStyles.pageSubtitle}>
            Track walks and daily movement
          </Text>
        </View>

        {/* LOG WALK */}
        <View style={cardStyles.card}>
          <View style={rowStyles.logRow}>
            <View style={buttonStyles.iconCircle}>
              <FontAwesome5 name="dog" size={22} color={colors.button} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={textStyles.logTitle}>Log a walk</Text>
              <Text style={textStyles.logSubtitle}>
                Record duration and track activity
              </Text>
            </View>

            <Pressable
              style={buttonStyles.addButton}
              onPress={() =>
                router.push({
                  pathname: "/pets/activity/log/[id]",
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
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
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
            <Text style={textStyles.emptyText}>No walks today</Text>
          ) : (
            <>
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

              <Text style={[textStyles.pageSubtitle, { marginTop: 10 }]}>
                {todaySummary.totalMinutes} min / {dailyGoal} min
              </Text>

              <Text style={textStyles.pageSubtitle}>
                🐾 {todaySummary.count} walk
                {todaySummary.count > 1 ? "s" : ""}
              </Text>
            </>
          )}
        </View>

        {/* STATS PREVIEW (FIXET) */}
        <View style={cardStyles.card}>
          <Text style={textStyles.sectionTitle}>Statistics</Text>
          <View style={cardStyles.divider} />

          <Text style={textStyles.pageSubtitle}>📊 This week</Text>
          <Text style={textStyles.rowText}>{weeklyStats.thisWeek} min</Text>

          <Text style={[textStyles.pageSubtitle, { marginTop: 8 }]}>
            🔥 Streak
          </Text>
          <Text style={textStyles.rowText}>
            {weeklyStats.streak} day
            {weeklyStats.streak !== 1 ? "s" : ""}
          </Text>

          <Pressable
            onPress={() =>
              router.push({
                pathname: "/pets/activity/stats/[id]",
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
              View insights →
            </Text>
          </Pressable>
        </View>

        {/* RECENT WALKS */}
        <View style={[cardStyles.card, { marginBottom: 15 }]}>
          <Text style={textStyles.sectionTitle}>Recent Walks</Text>
          <View style={cardStyles.divider} />

          {isLoadingWalks ? (
            <Text style={textStyles.emptyText}>Loading walks...</Text>
          ) : walks.length === 0 ? (
            <Text style={textStyles.emptyText}>No walks logged yet.</Text>
          ) : (
            walks.slice(0, 5).map((walk) => {
              const date = walk.createdAt?.toDate?.() ?? new Date();

              return (
                <SwipeDeleteRow
                  key={walk.id}
                  onDelete={() => handleDelete(walk.id)}
                >
                  <View style={rowStyles.row}>
                    <View style={rowStyles.rowLeft}>
                      <View>
                        <Text style={textStyles.rowText}>
                          {formatWalkSummary(walk)}
                        </Text>

                        {walk.note && (
                          <Text style={textStyles.noteText}>
                            Note: {walk.note}
                          </Text>
                        )}

                        <Text style={textStyles.dateText}>
                          {formatDate(date)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </SwipeDeleteRow>
              );
            })
          )}

          <Pressable
            onPress={() =>
              router.push({
                pathname: "/pets/activity/history/[id]",
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
              See all activity →
            </Text>
          </Pressable>
        </View>
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
