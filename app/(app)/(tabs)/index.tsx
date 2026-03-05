import * as foodApi from "@/api/foodApi";
import * as medicApi from "@/api/medicApi";
import * as petApi from "@/api/petApi";
import * as walkApi from "@/api/walkApi";
import AppHeader from "@/components/AppHeader";
import { useAuthSession } from "@/providers/authctx";
import { FoodEntryData } from "@/types/food";
import { MedicEntryData } from "@/types/medic";
import { PetData } from "@/types/pet";
import { FontAwesome } from "@expo/vector-icons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function HomePage() {
  const router = useRouter();
  const { user, userNameSession } = useAuthSession();

  const [pets, setPets] = useState<PetData[]>([]);
  const [isLoadingPets, setIsLoadingPets] = useState(true);

  const [localDisplayName, setLocalDisplayName] = useState<string | null>(null);

  // Aktiv pet
  const [activePetId, setActivePetId] = useState<string | null>(null);

  // Recent activity (for active pet)
  const [latestWalk, setLatestWalk] = useState<any | null>(null);
  const [latestMeal, setLatestMeal] = useState<FoodEntryData | null>(null);
  const [latestMeds, setLatestMeds] = useState<MedicEntryData | null>(null);

  // Reminders
  const [nextReminder, setNextReminder] = useState<{
    name: string;
    dosage: string;
    remindAt: Date;
  } | null>(null);

  useEffect(() => {
    if (pets.length > 0 && !activePetId) {
      setActivePetId(pets[0].id);
    }
  }, [pets, activePetId]);

  // Henter pets
  useFocusEffect(
    useCallback(() => {
      async function fetchPets() {
        if (!user?.uid) return;

        setIsLoadingPets(true);
        const result = await petApi.getAllPets(user.uid);
        setPets(result ?? []);
        setIsLoadingPets(false);
      }

      fetchPets();
    }, [user?.uid]),
  );

  // Henter brukerinfo
  useFocusEffect(
    useCallback(() => {
      if (user) {
        setLocalDisplayName(user.displayName ?? user.email ?? null);
      }
    }, [user]),
  );

  // Henter siste måltid og tur
  useFocusEffect(
    React.useCallback(() => {
      async function fetchRecentActivity() {
        if (!user?.uid || !activePetId) return;

        // Henter walks
        const walks = await walkApi.getWalks(user.uid, activePetId);
        setLatestWalk(walks.length > 0 ? walks[0] : null);

        // Henter meals
        const meals = await foodApi.getFoodEntries(user.uid, activePetId);
        setLatestMeal(meals.length > 0 ? meals[0] : null);

        // Henter meds
        const meds = await medicApi.getMedicEntries(user.uid, activePetId);
        setLatestMeds(meds.length > 0 ? meds[0] : null);
      }

      fetchRecentActivity();
    }, [user?.uid, activePetId]),
  );

  // Henter neste medication reminder for aktivt dyr
  useFocusEffect(
    React.useCallback(() => {
      async function fetchNextReminder() {
        if (!user?.uid || !activePetId) return;

        const meds = await medicApi.getMedicEntries(user.uid, activePetId);

        const now = new Date();

        const futureReminders = meds
          .filter((m) => m.reminderEnabled && m.remindAt)
          .map((m) => ({
            ...m,
            remindAt: m.remindAt!.toDate(),
          }))
          .filter((m) => m.remindAt > now)
          .sort((a, b) => a.remindAt.getTime() - b.remindAt.getTime());

        setNextReminder(futureReminders.length > 0 ? futureReminders[0] : null);
      }

      fetchNextReminder();
    }, [user?.uid, activePetId]),
  );

  // Aktiv pet basert på ID
  const activePet = pets.find((p) => p.id === activePetId) ?? null;

  // Greeting basert på klokkeslett
  const greeting = useMemo(() => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 11) return "Good morning";
    if (hour >= 11 && hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  return (
    <View style={styles.screen}>
      <AppHeader
        title="Home"
        showBack={false}
        showTitle={false}
        showMenu={true}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* GREETING */}
        <View style={styles.greetingWrap}>
          <Text style={styles.greetingText}>{greeting},</Text>
          <Text style={styles.userName}>{localDisplayName ?? "Friend"} 👋</Text>
          <Text style={styles.subGreeting}>
            {pets.length} pets • All good today
          </Text>
        </View>

        {/* PET SWITCHER */}
        {pets.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.petSwitcher}
          >
            {pets.map((pet) => {
              const isActive = pet.id === activePetId;

              return (
                <Pressable
                  key={pet.id}
                  onPress={() => setActivePetId(pet.id)}
                  style={styles.petSwitchItem}
                >
                  {pet.photoUrl ? (
                    <Image
                      source={{ uri: pet.photoUrl }}
                      style={[
                        styles.petSwitchImage,
                        isActive && styles.petSwitchImageActive,
                      ]}
                    />
                  ) : (
                    <View
                      style={[
                        styles.petSwitchPlaceholder,
                        isActive && styles.petSwitchImageActive,
                      ]}
                    />
                  )}

                  <Text
                    style={[
                      styles.petSwitchName,
                      isActive && styles.petSwitchNameActive,
                    ]}
                    numberOfLines={1}
                  >
                    {pet.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {/* ACTIVE PET CARD */}
        {activePet && (
          <Pressable
            style={({ pressed }) => [
              styles.card,
              { opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() =>
              router.push({
                pathname: "/pets/[id]",
                params: { id: activePet.id, from: "index" },
              })
            }
          >
            {activePet.photoUrl ? (
              <Image
                source={{ uri: activePet.photoUrl }}
                style={styles.petImage}
              />
            ) : (
              <View style={styles.petPlaceholder} />
            )}

            <View style={{ marginTop: 14 }}>
              <Text style={styles.petName}>{activePet.name}</Text>
              <Text style={styles.petType}>{activePet.type}</Text>
            </View>
          </Pressable>
        )}

        {/* QUICK ACTIONS */}
        {activePet && (
          <View style={styles.quickActions}>
            {[
              { icon: "dog", label: "Walk", family: "FontAwesome5" },
              {
                icon: "fast-food-sharp",
                label: "Food",
                family: "Ionicons",
              },
              { icon: "pills", label: "Meds", family: "FontAwesome5" },
              { icon: "bell", label: "Reminder", family: "FontAwesome" },
            ].map((item) => (
              <Pressable
                key={item.label}
                style={styles.quickItem}
                onPress={() => {
                  if (item.label === "Walk") {
                    router.push({
                      pathname: "/pets/activity/[id]",
                      params: { id: activePet.id, from: "index" },
                    });
                  }

                  if (item.label === "Food") {
                    router.push({
                      pathname: "/pets/food/[id]",
                      params: { id: activePet.id, from: "index" },
                    });
                  }

                  if (item.label === "Meds") {
                    router.push({
                      pathname: "/pets/medic/[id]",
                      params: { id: activePet.id, from: "index" },
                    });
                  }

                  if (item.label === "Reminder") {
                    router.push({
                      pathname: "/reminders" as any,
                    });
                  }
                }}
              >
                <View style={styles.quickCircle}>
                  {(() => {
                    switch (item.family) {
                      case "FontAwesome5":
                        return (
                          <FontAwesome5
                            name={item.icon as any}
                            size={20}
                            color="#111"
                          />
                        );

                      case "Ionicons":
                        return (
                          <Ionicons
                            name={item.icon as any}
                            size={20}
                            color="#111"
                          />
                        );

                      case "FontAwesome":
                        return (
                          <FontAwesome
                            name={item.icon as any}
                            size={20}
                            color="#111"
                          />
                        );

                      default:
                        return null;
                    }
                  })()}
                </View>
                <Text style={styles.quickLabel}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* TODAY CARD */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Today</Text>
          <View style={styles.divider} />

          {nextReminder ? (
            <Text style={styles.todayText}>
              • {nextReminder.name} at{" "}
              {nextReminder.remindAt.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          ) : (
            <Text style={styles.todayText}>• No medication reminders</Text>
          )}
          <Text style={styles.todayText}>• No vet visits today</Text>
          <Text style={styles.todayText}>• Everything looks good</Text>
        </View>

        {/* RECENT ACTIVITY */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.divider} />

          {latestWalk ? (
            <Text style={styles.todayText}>
              🐾 Walk – {latestWalk.duration} min
            </Text>
          ) : (
            <Text style={styles.todayText}>🐾 No walks yet</Text>
          )}

          {latestMeal ? (
            <Text style={styles.todayText}>🍖 Food – {latestMeal.grams} g</Text>
          ) : (
            <Text style={styles.todayText}>🍖 No meals yet</Text>
          )}
          {latestMeds ? (
            <Text style={styles.todayText}>💊 Meds – {latestMeds?.name} </Text>
          ) : (
            <Text style={styles.todayText}>💊 No medication yet</Text>
          )}
        </View>

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
    paddingHorizontal: 16,
    paddingTop: 0,
    gap: 16,
  },

  greetingWrap: {
    marginTop: 10,
    marginBottom: 10,
  },

  greetingText: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111",
  },

  userName: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111",
  },

  subGreeting: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },

  /* PET SWITCHER */
  petSwitcher: {
    paddingVertical: 6,
    paddingBottom: 12,
  },

  petSwitchItem: {
    alignItems: "center",
    marginRight: 18,
  },

  petSwitchImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#D9D9D9",
  },

  petSwitchImageActive: {
    borderWidth: 2,
    borderColor: "#111",
  },

  petSwitchPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#3E3E3E",
  },

  petSwitchName: {
    fontSize: 12,
    color: "#666",
    marginTop: 6,
  },

  petSwitchNameActive: {
    color: "#111",
    fontWeight: "700",
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

  petImage: {
    width: "100%",
    height: 190,
    borderRadius: 16,
  },

  petPlaceholder: {
    width: "100%",
    height: 190,
    borderRadius: 16,
    backgroundColor: "#3E3E3E",
  },

  petName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },

  petType: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },

  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  quickItem: {
    alignItems: "center",
    flex: 1,
  },

  quickCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F3F0EC",
    alignItems: "center",
    justifyContent: "center",
  },

  quickLabel: {
    fontSize: 12,
    color: "#111",
    marginTop: 6,
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

  todayText: {
    fontSize: 14,
    color: "#444",
    marginBottom: 6,
  },
});
