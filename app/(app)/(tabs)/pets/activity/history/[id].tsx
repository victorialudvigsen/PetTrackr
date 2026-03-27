import * as petApi from "@/api/petApi";
import * as walkApi from "@/api/walkApi";
import AppHeader from "@/components/AppHeader";
import SwipeDeleteRow from "@/components/SwipeDeleteRow";
import { useAuthSession } from "@/providers/authctx";
import { cardStyles } from "@/styles/cardStyles";
import { layoutStyles } from "@/styles/layoutStyles";
import { rowStyles } from "@/styles/rowStyles";
import { textStyles } from "@/styles/textStyles";
import { PetData } from "@/types/pet";
import { formatWalkSummary } from "@/utils/formatters";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";

export default function ActivityHistoryPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthSession();

  const [pet, setPet] = useState<PetData | null>(null);
  const [walks, setWalks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
          setWalks(updated ?? []);
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
        const walkData = await walkApi.getWalks(user.uid, id);

        setPet(petData);
        setWalks(walkData ?? []);

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

  /* -------- GROUP WALKS BY DATE -------- */
  function groupWalksByDate(walks: any[]) {
    const groups: Record<string, any[]> = {};

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

    walks.forEach((walk) => {
      const date = walk.createdAt?.toDate?.() ?? new Date();
      const label = getLabel(date);

      if (!groups[label]) {
        groups[label] = [];
      }

      groups[label].push(walk);
    });

    return groups;
  }

  const groupedWalks = groupWalksByDate(walks);

  return (
    <View style={layoutStyles.screen}>
      <AppHeader
        title={`${pet.name} – History`}
        onBack={() =>
          router.replace({
            pathname: "/pets/activity/[id]",
            params: { id },
          })
        }
      />

      <ScrollView
        contentContainerStyle={layoutStyles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={textStyles.pageTitle}>All Activity</Text>

        {walks.length === 0 ? (
          <Text style={textStyles.emptyText}>No walks logged yet.</Text>
        ) : (
          Object.entries(groupedWalks).map(([date, walks]) => (
            <View key={date} style={{ marginBottom: 12 }}>
              {/* CARD (nå med header inni) */}
              <View style={cardStyles.card}>
                {/* HEADER */}
                <Text style={[textStyles.sectionTitle, { marginBottom: 4 }]}>
                  {date}
                </Text>
                <View style={cardStyles.divider} />

                {walks.map((walk) => {
                  const d = walk.createdAt?.toDate?.() ?? new Date();

                  return (
                    <SwipeDeleteRow
                      key={walk.id}
                      onDelete={() => handleDelete(walk.id)}
                    >
                      <View style={rowStyles.row}>
                        <View style={rowStyles.rowLeft}>
                          <View>
                            {/* SUMMARY */}
                            <Text style={textStyles.rowText}>
                              {formatWalkSummary(walk)}
                            </Text>

                            {/* NOTE */}
                            {walk.note ? (
                              <Text style={textStyles.noteText}>
                                Note: {walk.note}
                              </Text>
                            ) : null}

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
