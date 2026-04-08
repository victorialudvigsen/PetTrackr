import * as medicApi from "@/api/medicApi";
import * as petApi from "@/api/petApi";
import AppHeader from "@/components/AppHeader";
import SwipeDeleteRow from "@/components/SwipeDeleteRow";
import { useAuthSession } from "@/providers/authctx";
import { cardStyles } from "@/styles/cardStyles";
import { colors } from "@/styles/colors";
import { layoutStyles } from "@/styles/layoutStyles";
import { rowStyles } from "@/styles/rowStyles";
import { textStyles } from "@/styles/textStyles";
import { MedicEntryData } from "@/types/medic";
import { PetData } from "@/types/pet";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

export default function RemindersPage() {
  const router = useRouter();
  const { user } = useAuthSession();

  const [pets, setPets] = useState<PetData[]>([]);
  const [reminders, setReminders] = useState<
    { pet: PetData; meds: MedicEntryData[] }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  function formatReminderDate(date: Date) {
    const today = new Date();
    const tomorrow = new Date();

    tomorrow.setDate(today.getDate() + 1);

    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    const isTomorrow =
      date.getDate() === tomorrow.getDate() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getFullYear() === tomorrow.getFullYear();

    if (isToday) return "Today";
    if (isTomorrow) return "Tomorrow";

    return date.toLocaleDateString();
  }

  /* -------- HENTER REMINDERS -------- */
  useFocusEffect(
    React.useCallback(() => {
      async function loadReminders() {
        if (!user?.uid) return;

        setIsLoading(true);

        const petsData: PetData[] = await petApi.getAllPets(user.uid);
        setPets(petsData);

        const result: { pet: PetData; meds: MedicEntryData[] }[] = [];

        const now = new Date();

        for (const pet of petsData) {
          const meds = await medicApi.getMedicEntries(user.uid, pet.id);

          const reminders = meds
            .filter((m) => m.reminderEnabled && m.remindAt)
            .filter((m) => {
              const date = m.remindAt?.toDate?.();
              return date && date > now;
            })
            .sort((a, b) => {
              const dateA = a.remindAt?.toDate?.() ?? new Date();
              const dateB = b.remindAt?.toDate?.() ?? new Date();
              return dateA.getTime() - dateB.getTime();
            });

          result.push({
            pet,
            meds: reminders,
          });
        }

        setReminders(result);
        setIsLoading(false);
      }

      loadReminders();
    }, [user?.uid]),
  );

  /* -------- HANDLE DELETE -------- */
  async function handleDelete(petId: string, entry: MedicEntryData) {
    if (!user?.uid) return;

    Alert.alert(
      "Delete reminder",
      "Are you sure you want to delete this reminder?",
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

            await medicApi.deleteMedicEntry(user.uid, petId, entry.id);

            const petsData: PetData[] = await petApi.getAllPets(user.uid);
            const result: { pet: PetData; meds: MedicEntryData[] }[] = [];
            const now = new Date();

            for (const pet of petsData) {
              const meds = await medicApi.getMedicEntries(user.uid, pet.id);

              const reminders = meds
                .filter((m) => m.reminderEnabled && m.remindAt)
                .filter((m) => {
                  const date = m.remindAt?.toDate?.();
                  return date && date > now;
                })
                .sort((a, b) => {
                  const dateA = a.remindAt?.toDate?.() ?? new Date();
                  const dateB = b.remindAt?.toDate?.() ?? new Date();
                  return dateA.getTime() - dateB.getTime();
                });

              result.push({
                pet,
                meds: reminders,
              });
            }

            setReminders(result);
          },
        },
      ],
    );
  }
  return (
    <View style={layoutStyles.screen}>
      <AppHeader title="Reminders" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={layoutStyles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={textStyles.pageTitle}>Upcoming reminders</Text>

        {isLoading ? (
          <View style={cardStyles.card}>
            <Text style={textStyles.emptyText}>Loading reminders...</Text>
          </View>
        ) : (
          reminders.map(({ pet, meds }) => (
            <View key={pet.id} style={cardStyles.card}>
              <Text style={textStyles.sectionTitle}>{pet.name}</Text>
              <View style={cardStyles.divider} />

              {meds.length === 0 ? (
                <Text style={textStyles.emptyText}>No reminders set</Text>
              ) : (
                meds.map((entry) => {
                  const date = entry.remindAt?.toDate?.() ?? new Date();

                  return (
                    <SwipeDeleteRow
                      key={entry.id}
                      onDelete={() => handleDelete(pet.id, entry)}
                    >
                      <View style={rowStyles.row}>
                        <View style={rowStyles.rowLeft}>
                          <View style={rowStyles.rowIconWrap}>
                            <Feather
                              name="bell"
                              size={16}
                              color={colors.button}
                            />
                          </View>

                          <View>
                            <Text style={textStyles.rowText}>
                              {entry.name} – {entry.dosage}
                            </Text>

                            <Text style={textStyles.dateTextLarge}>
                              {formatReminderDate(date)} •{" "}
                              {date.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
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
                    pathname: "/pets/medic/log/[id]",
                    params: {
                      id: pet.id,
                      from: "reminders",
                    },
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
                  Add reminder →
                </Text>
              </Pressable>
            </View>
          ))
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}
