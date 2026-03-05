import * as medicApi from "@/api/medicApi";
import * as petApi from "@/api/petApi";
import AppHeader from "@/components/AppHeader";
import { useAuthSession } from "@/providers/authctx";
import { MedicEntryData } from "@/types/medic";
import { PetData } from "@/types/pet";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

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

  // Henter reminders
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

  return (
    <View style={styles.screen}>
      <AppHeader title="Reminders" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Upcoming reminders</Text>

        {isLoading ? (
          <View style={styles.card}>
            <Text style={styles.emptyText}>Loading reminders...</Text>
          </View>
        ) : (
          reminders.map(({ pet, meds }) => (
            <View key={pet.id} style={styles.card}>
              <Text style={styles.sectionTitle}>{pet.name}</Text>
              <View style={styles.divider} />

              {meds.length === 0 ? (
                <Text style={styles.emptyText}>No reminders</Text>
              ) : (
                meds.map((entry) => {
                  const date = entry.remindAt?.toDate?.() ?? new Date();

                  return (
                    <View key={entry.id} style={styles.row}>
                      <View style={styles.rowLeft}>
                        <View style={styles.rowIconWrap}>
                          <Feather name="bell" size={16} color="#111" />
                        </View>

                        <View>
                          <Text style={styles.rowText}>
                            {entry.name} – {entry.dosage}
                          </Text>

                          <Text style={styles.dateText}>
                            {formatReminderDate(date)} •{" "}
                            {date.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          ))
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F6F2EE",
  },

  content: {
    padding: 16,
    gap: 16,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
    color: "#111",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
    marginBottom: 8,
  },

  divider: {
    height: 1,
    backgroundColor: "#EDEDED",
    marginBottom: 10,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
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

  dateText: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
});
