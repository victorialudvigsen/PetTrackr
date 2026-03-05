import AppHeader from "@/components/AppHeader";
import { useAuthSession } from "@/providers/authctx";
import { MedicEntryData } from "@/types/medic";
import { PetData } from "@/types/pet";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import * as medicApi from "@/api/medicApi";
import * as petApi from "@/api/petApi";
import AntDesign from "@expo/vector-icons/AntDesign";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

import type { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";

import Animated, {
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";

/**
 * VIKTIG: Dette må være en komponent (ikke en vanlig funksjon som blir kalt),
 * fordi vi bruker useAnimatedStyle (en hook).
 */
function RightAction({
  progress,
  onPress,
}: {
  progress: any; // progress er SharedValue<number> fra ReanimatedSwipeable
  onPress: () => void;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: interpolate(progress.value, [0, 1], [80, 0]),
        },
      ],
    };
  });

  return (
    <Animated.View style={[styles.deleteContainer, animatedStyle]}>
      <Pressable style={styles.deleteSwipe} onPress={onPress}>
        <Feather name="trash-2" size={18} color="#fff" />
        <Text style={styles.deleteText}>Delete</Text>
      </Pressable>
    </Animated.View>
  );
}

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

  // RefObject per rad (det Swipeable faktisk forventer)
  const swipeRefs = useRef<
    Record<string, React.RefObject<SwipeableMethods | null>>
  >({});
  const openRow = useRef<string | null>(null);

  // Henter/initialiserer ref for en rad, én gang per id
  function getRowRef(rowId: string) {
    if (!swipeRefs.current[rowId]) {
      swipeRefs.current[rowId] = React.createRef<SwipeableMethods>();
    }
    return swipeRefs.current[rowId];
  }

  function closeRow(rowId: string) {
    swipeRefs.current[rowId]?.current?.close();
  }

  function handleSwipeOpen(rowId: string) {
    // Lukk forrige hvis en annen åpnes
    if (openRow.current && openRow.current !== rowId) {
      closeRow(openRow.current);
    }
    openRow.current = rowId;
  }

  async function handleDelete(entryId: string) {
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
            await medicApi.deleteMedicEntry(user.uid, pet.id, entryId);

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

  // Henter meds når siden får fokus
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
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Loading medication...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
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
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* TITLE */}
        <View style={styles.titleWrap}>
          <Text style={styles.pageTitle}>Medication</Text>
          <Text style={styles.pageSubtitle}>
            Track medication and treatments
          </Text>
        </View>

        {/* LOG MEDIC CARD */}
        <View style={styles.card}>
          <View style={styles.logRow}>
            <View style={styles.iconCircle}>
              <FontAwesome5 name="pills" size={22} color="#111" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.logTitle}>Log medication</Text>
              <Text style={styles.logSubtitle}>
                Record name, dosage and notes
              </Text>
            </View>

            <Pressable
              style={styles.addButton}
              onPress={() =>
                router.push({
                  pathname: "/pets/medic/log/[id]",
                  params: { id },
                })
              }
            >
              <Feather name="plus" size={18} color="#111" />
            </Pressable>
          </View>
        </View>

        {/* RECENT MEDICATION */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Recent medication</Text>
          <View style={styles.divider} />

          {isLoadingMeds ? (
            <Text style={styles.emptyText}>Loading medication...</Text>
          ) : meds.length === 0 ? (
            <Text style={styles.emptyText}>No medication logged yet.</Text>
          ) : (
            meds.slice(0, 10).map((entry) => {
              const date = entry.createdAt?.toDate?.() ?? new Date();
              const rowRef = getRowRef(entry.id);

              return (
                <Swipeable
                  key={entry.id}
                  ref={rowRef}
                  friction={2}
                  rightThreshold={40}
                  overshootRight={false}
                  renderRightActions={(progress) => (
                    <RightAction
                      progress={progress}
                      onPress={() => {
                        // Lukk raden før alert (ser mer “pro” ut)
                        closeRow(entry.id);
                        handleDelete(entry.id);
                      }}
                    />
                  )}
                  onSwipeableOpen={(direction) => {
                    // denne signaturen matcher ReanimatedSwipeable typings
                    handleSwipeOpen(entry.id);

                    // FULL SWIPE = DELETE (men fortsatt Alert)
                    // For høyre-actions (swipe til venstre) er direction vanligvis "right"
                    if (direction === "right") {
                      // lukk før alert så det ikke blir hengende
                      closeRow(entry.id);
                      handleDelete(entry.id);
                    }
                  }}
                  onSwipeableClose={() => {
                    if (openRow.current === entry.id) {
                      openRow.current = null;
                    }
                  }}
                >
                  <View style={styles.row}>
                    <View style={styles.rowLeft}>
                      <View style={styles.rowIconWrap}>
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
                          <Text style={styles.rowText}>
                            {entry.name} – {entry.dosage}
                          </Text>

                          {entry.reminderEnabled ? (
                            <Feather name="bell" size={14} color="#666" />
                          ) : null}
                        </View>

                        {entry.note ? (
                          <Text style={styles.notes}>{entry.note}</Text>
                        ) : null}

                        <Text style={styles.dateText}>
                          {date.toLocaleDateString()} •{" "}
                          {date.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Swipeable>
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
  screen: {
    flex: 1,
    backgroundColor: "#F6F2EE",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F6F2EE",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 16,
  },
  titleWrap: {
    marginTop: 8,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111",
  },
  pageSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
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
  logRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F3F0EC",
    alignItems: "center",
    justifyContent: "center",
  },
  logTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  logSubtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F3F0EC",
    alignItems: "center",
    justifyContent: "center",
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
  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingVertical: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
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
  notes: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  dateText: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },

  // Swipe delete styles
  deleteContainer: {
    justifyContent: "center",
    alignItems: "flex-end",
    width: 90,
  },
  deleteSwipe: {
    backgroundColor: "#B00020",
    width: 80,
    height: "85%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    marginRight: 6,
  },
  deleteText: {
    color: "#fff",
    fontSize: 12,
    marginTop: 4,
  },
});
