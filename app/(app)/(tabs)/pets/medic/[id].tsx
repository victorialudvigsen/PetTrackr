import * as medicApi from "@/api/medicApi";
import * as petApi from "@/api/petApi";
import AppHeader from "@/components/AppHeader";
import SwipeDeleteRow from "@/components/SwipeDeleteRow";
import { useAuthSession } from "@/providers/authctx";
import { buttonStyles } from "@/styles/buttonStyles";
import { cardStyles } from "@/styles/cardStyles";
import { colors } from "@/styles/colors";
import { layoutStyles } from "@/styles/layoutStyles";
import { rowStyles } from "@/styles/rowStyles";
import { textStyles } from "@/styles/textStyles";
import { MedicEntryData } from "@/types/medic";
import { PetData } from "@/types/pet";
import { Feather } from "@expo/vector-icons";
import AntDesign from "@expo/vector-icons/AntDesign";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useFocusEffect } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function MedicPage() {
  const router = useRouter();
  const { id, from } = useLocalSearchParams<{
    id: string;
    from?: string;
  }>();
  const { user } = useAuthSession();

  const [pet, setPet] = useState<PetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [meds, setMeds] = useState<MedicEntryData[]>([]);
  const [isLoadingMeds, setIsLoadingMeds] = useState(true);

  /* -------- HANDLE DELETE -------- */
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
            // Cancel notification først
            if (entry.notificationId) {
              await Notifications.cancelScheduledNotificationAsync(
                entry.notificationId,
              );
            }

            // Sletter fra Firebase
            await medicApi.deleteMedicEntry(user.uid, pet.id, entry.id);

            // Oppdaterer liste
            const updated = await medicApi.getMedicEntries(user.uid, pet.id);
            setMeds(updated);
          },
        },
      ],
    );
  }

  // Henter pet (for navn i header)
  useEffect(() => {
    async function fetchPet() {
      if (!user?.uid || !id) return;

      setIsLoading(true);
      const result = await petApi.getPetById(user.uid, id);
      setPet(result);
      setIsLoading(false);
    }

    fetchPet();
  }, [user?.uid, id]);

  // Henter meds
  useFocusEffect(
    React.useCallback(() => {
      async function fetchMeds() {
        if (!user?.uid || !id) return;

        setIsLoadingMeds(true);
        const result = await medicApi.getMedicEntries(user.uid, id);
        setMeds(result);
        setIsLoadingMeds(false);
      }

      fetchMeds();
    }, [user?.uid, id]),
  );

  if (isLoading || !pet) {
    return (
      <View style={layoutStyles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Loading medication...</Text>
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
          <Text style={textStyles.pageTitle}>Medication</Text>
          <Text style={textStyles.pageSubtitle}>
            Track medication and treatments
          </Text>
        </View>

        {/* LOG MEDIC CARD */}
        <View style={cardStyles.card}>
          <View style={rowStyles.logRow}>
            <View style={buttonStyles.iconCircle}>
              <FontAwesome5 name="pills" size={22} color={colors.button} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={textStyles.logTitle}>Log medication</Text>
              <Text style={textStyles.logSubtitle}>
                Record name, dosage and notes
              </Text>
            </View>

            <Pressable
              style={buttonStyles.addButton}
              onPress={() =>
                router.push({
                  pathname: "/pets/medic/log/[id]",
                  params: { id },
                })
              }
            >
              <Feather name="plus" size={18} color={colors.button} />
            </Pressable>
          </View>
        </View>

        {/* RECENT MEDICATION */}
        <View style={cardStyles.card}>
          <Text style={textStyles.sectionTitle}>Recent medication</Text>
          <View style={cardStyles.divider} />

          {isLoadingMeds ? (
            <Text style={textStyles.emptyText}>Loading medication...</Text>
          ) : meds.length === 0 ? (
            <Text style={textStyles.emptyText}>No medication logged yet.</Text>
          ) : (
            meds.slice(0, 10).map((entry) => {
              const date = entry.createdAt?.toDate?.() ?? new Date();
              const reminderDate = entry.remindAt?.toDate?.();

              return (
                /* SwipeDeleteRow håndterer hele swipe-logikken */
                <SwipeDeleteRow
                  key={entry.id}
                  onDelete={() => handleDelete(entry)}
                >
                  <View style={rowStyles.row}>
                    <View style={rowStyles.rowLeft}>
                      <View style={rowStyles.rowIconWrap}>
                        <AntDesign
                          name="medicine-box"
                          size={16}
                          color="black"
                        />
                      </View>

                      <View>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Text style={textStyles.rowText}>
                            {entry.name} – {entry.dosage}
                          </Text>
                        </View>

                        {/* REMINDER */}
                        {entry.reminderEnabled && reminderDate ? (
                          <Text style={styles.reminderText}>
                            ⏰ {formatDate(reminderDate)}
                          </Text>
                        ) : (
                          <Text style={styles.noReminderText}>No reminder</Text>
                        )}

                        {/* NOTE */}
                        {entry.note ? (
                          <Text style={textStyles.noteText}>
                            Note: {entry.note}
                          </Text>
                        ) : null}

                        {/* ADDED DATE */}
                        <Text style={textStyles.dateText}>
                          Added {date.toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  </View>
                </SwipeDeleteRow>
              );
            })
          )}
        </View>

        <View style={{ height: 18 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  reminderText: {
    fontSize: 13,
    color: colors.button,
    marginTop: 2,
  },

  noReminderText: {
    fontSize: 13,
    color: "#999",
    marginTop: 2,
  },
});
