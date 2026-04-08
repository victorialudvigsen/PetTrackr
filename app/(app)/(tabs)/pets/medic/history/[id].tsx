import * as medicApi from "@/api/medicApi";
import * as petApi from "@/api/petApi";
import AppHeader from "@/components/AppHeader";
import SwipeDeleteRow from "@/components/SwipeDeleteRow";
import { useAuthSession } from "@/providers/authctx";
import { cardStyles } from "@/styles/cardStyles";
import { layoutStyles } from "@/styles/layoutStyles";
import { rowStyles } from "@/styles/rowStyles";
import { textStyles } from "@/styles/textStyles";
import { MedicEntryData } from "@/types/medic";
import { PetData } from "@/types/pet";
import { useFocusEffect } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";

export default function MedicHistoryPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthSession();

  const [pet, setPet] = useState<PetData | null>(null);
  const [meds, setMeds] = useState<MedicEntryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /* -------- DELETE -------- */
  async function handleDelete(entry: MedicEntryData) {
    if (!user?.uid || !pet?.id) return;

    Alert.alert(
      "Delete medication",
      "Are you sure you want to delete this entry?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (entry.notificationId) {
              await Notifications.cancelScheduledNotificationAsync(
                entry.notificationId,
              );
            }

            await medicApi.deleteMedicEntry(user.uid, pet.id, entry.id);

            const updated = await medicApi.getMedicEntries(user.uid, pet.id);
            setMeds(updated ?? []);
          },
        },
      ],
    );
  }

  /* -------- FETCH -------- */
  useFocusEffect(
    React.useCallback(() => {
      async function fetchData() {
        if (!user?.uid || !id) return;

        setIsLoading(true);

        const petData = await petApi.getPetById(user.uid, id);
        const medicData = await medicApi.getMedicEntries(user.uid, id);

        setPet(petData);
        setMeds(medicData ?? []);

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
  function groupByDate(entries: MedicEntryData[]) {
    const groups: Record<string, MedicEntryData[]> = {};

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    function getLabel(date: Date) {
      if (date.toDateString() === today.toDateString()) return "Today";
      if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
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

  const grouped = groupByDate(meds);

  return (
    <View style={layoutStyles.screen}>
      <AppHeader
        title={`${pet.name} – History`}
        onBack={() =>
          router.replace({
            pathname: "/pets/medic/[id]",
            params: { id },
          })
        }
      />

      <ScrollView contentContainerStyle={layoutStyles.content}>
        <Text style={textStyles.pageTitle}>All Medication</Text>

        {meds.length === 0 ? (
          <Text style={textStyles.emptyText}>No medication logged yet.</Text>
        ) : (
          Object.entries(grouped).map(([date, entries]) => (
            <View key={date} style={{ marginBottom: 12 }}>
              <View style={cardStyles.card}>
                <Text style={[textStyles.sectionTitle, { marginBottom: 4 }]}>
                  {date}
                </Text>
                <View style={cardStyles.divider} />

                {entries.map((entry) => {
                  const created = entry.createdAt?.toDate?.() ?? new Date();
                  const reminder = entry.remindAt?.toDate?.();

                  return (
                    <SwipeDeleteRow
                      key={entry.id}
                      onDelete={() => handleDelete(entry)}
                    >
                      <View style={rowStyles.row}>
                        <View style={rowStyles.rowLeft}>
                          <View>
                            {/* NAME */}
                            <Text style={textStyles.rowText}>
                              {entry.name} – {entry.dosage}
                            </Text>

                            {/* REMINDER */}
                            {entry.reminderEnabled && reminder ? (
                              <Text style={textStyles.noteText}>
                                ⏰{" "}
                                {entry.repeatType === "daily"
                                  ? `Daily • ${reminder.toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}`
                                  : `${reminder.toLocaleDateString()} • ${reminder.toLocaleTimeString(
                                      [],
                                      {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      },
                                    )}`}
                              </Text>
                            ) : (
                              <Text style={textStyles.noteText}>
                                No reminder
                              </Text>
                            )}

                            {/* NOTE */}
                            {entry.note && (
                              <Text style={textStyles.noteText}>
                                Note: {entry.note}
                              </Text>
                            )}

                            {/* DATE */}
                            <Text style={textStyles.dateText}>
                              Added {created.toLocaleDateString()}
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
