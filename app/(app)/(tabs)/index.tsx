import * as foodApi from "@/api/foodApi";
import * as medicApi from "@/api/medicApi";
import * as petApi from "@/api/petApi";
import * as walkApi from "@/api/walkApi";
import AppHeader from "@/components/AppHeader";
import { useAuthSession } from "@/providers/authctx";
import { buttonStyles } from "@/styles/buttonStyles";
import { cardStyles } from "@/styles/cardStyles";
import { colors } from "@/styles/colors";
import { layoutStyles } from "@/styles/layoutStyles";
import { rowStyles } from "@/styles/rowStyles";
import { textStyles } from "@/styles/textStyles";
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
    if (pets.length > 0) {
      // Hvis aktivt dyr ikke finnes i lista → sett nytt
      const exists = pets.find((p) => p.id === activePetId);

      if (!exists) {
        setActivePetId(pets[0].id);
      }
    } else {
      // Hvis alle dyr er slettet
      setActivePetId(null);
    }
  }, [pets]);

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
        setLocalDisplayName(
          user.displayName || user.email?.split("@")[0] || null,
        );
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
    <View style={layoutStyles.screen}>
      <AppHeader
        title="Home"
        showBack={false}
        showTitle={false}
        showMenu={true}
      />

      <ScrollView
        contentContainerStyle={layoutStyles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* GREETING */}
        <View style={styles.greetingWrap}>
          <Text
            style={[
              textStyles.pageTitle,
              { fontSize: 26 },
              { color: colors.button },
            ]}
          >
            {greeting},
          </Text>
          <Text
            style={[
              textStyles.pageTitle,
              { fontSize: 26 },
              { color: colors.button },
            ]}
          >
            {localDisplayName ?? "Friend"} 🐕
          </Text>
          <Text
            style={[
              textStyles.pageSubtitle,
              { marginTop: 0 },
              { marginBottom: 8 },
            ]}
          >
            {pets.length === 0
              ? "No pets"
              : `${pets.length} ${pets.length === 1 ? "pet" : "pets"}`}
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
                      textStyles.logSubtitle,
                      { fontSize: 12 },
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
              cardStyles.card,
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
              <Text style={[textStyles.sectionTitle, { fontSize: 16 }]}>
                {activePet.name}
              </Text>
              <Text style={textStyles.pageSubtitle}>{activePet.type}</Text>
            </View>
          </Pressable>
        )}

        {/* QUICK ACTIONS */}
        {activePet && (
          <View style={[rowStyles.row, { paddingVertical: 2 }]}>
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
                style={[{ alignItems: "center" }, { flex: 1 }]}
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
                <View style={buttonStyles.iconCircle}>
                  {(() => {
                    switch (item.family) {
                      case "FontAwesome5":
                        return (
                          <FontAwesome5
                            name={item.icon as any}
                            size={20}
                            color={colors.button}
                          />
                        );

                      case "Ionicons":
                        return (
                          <Ionicons
                            name={item.icon as any}
                            size={20}
                            color={colors.button}
                          />
                        );

                      case "FontAwesome":
                        return (
                          <FontAwesome
                            name={item.icon as any}
                            size={20}
                            color={colors.button}
                          />
                        );

                      default:
                        return null;
                    }
                  })()}
                </View>
                <Text style={textStyles.logSubtitle}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {pets.length === 0 && (
          <View style={cardStyles.card}>
            <Text
              style={[
                textStyles.sectionTitle,
                { marginBottom: 6 },
                { textAlign: "center" },
              ]}
            >
              No pets yet
            </Text>

            <Text
              style={[
                textStyles.pageSubtitle,
                { textAlign: "center" },
                { marginBottom: 14 },
              ]}
            >
              You haven’t added any pets yet. Tap below to get started.
            </Text>

            <Pressable
              style={buttonStyles.saveButton}
              onPress={() => router.push("/pets/addPet")}
            >
              <Text style={buttonStyles.saveButtonText}>Add Pet</Text>
            </Pressable>
          </View>
        )}

        {/* TODAY CARD */}
        {pets.length > 0 && (
          <View style={cardStyles.card}>
            <Text style={[textStyles.sectionTitle, { marginBottom: 8 }]}>
              Today
            </Text>
            <View style={cardStyles.divider} />

            {nextReminder ? (
              <Text
                style={[
                  textStyles.pageSubtitle,
                  { marginTop: 0 },
                  { marginBottom: 8 },
                ]}
              >
                • {nextReminder.name} at{" "}
                {nextReminder.remindAt.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            ) : (
              <Text
                style={[
                  textStyles.pageSubtitle,
                  { marginTop: 0 },
                  { marginBottom: 8 },
                ]}
              >
                • No medication reminders
              </Text>
            )}
            <Text
              style={[
                textStyles.pageSubtitle,
                { marginTop: 0 },
                { marginBottom: 8 },
              ]}
            >
              • No vet visits today (Coming soon)
            </Text>
          </View>
        )}

        {/* RECENT ACTIVITY */}
        {pets.length > 0 && (
          <View style={cardStyles.card}>
            <Text style={[textStyles.sectionTitle, { marginBottom: 8 }]}>
              Recent Activity
            </Text>
            <View style={cardStyles.divider} />

            {latestWalk ? (
              <Text
                style={[
                  textStyles.pageSubtitle,
                  { marginTop: 0, marginBottom: 8 },
                ]}
              >
                🐾 Walk – {latestWalk.duration} min
              </Text>
            ) : (
              <Text
                style={[
                  textStyles.pageSubtitle,
                  { marginTop: 0, marginBottom: 8 },
                ]}
              >
                🐾 No walks yet
              </Text>
            )}

            {latestMeal ? (
              <Text
                style={[
                  textStyles.pageSubtitle,
                  { marginTop: 0, marginBottom: 8 },
                ]}
              >
                🍖 Food – {latestMeal.grams} g
              </Text>
            ) : (
              <Text
                style={[
                  textStyles.pageSubtitle,
                  { marginTop: 0, marginBottom: 8 },
                ]}
              >
                🍖 No meals yet
              </Text>
            )}

            {latestMeds ? (
              <Text
                style={[
                  textStyles.pageSubtitle,
                  { marginTop: 0, marginBottom: 8 },
                ]}
              >
                💊 Meds – {latestMeds?.name}
              </Text>
            ) : (
              <Text
                style={[
                  textStyles.pageSubtitle,
                  { marginTop: 0, marginBottom: 8 },
                ]}
              >
                💊 No medication yet
              </Text>
            )}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  greetingWrap: {
    marginTop: 10,
    marginBottom: 10,
  },

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
    borderColor: colors.button,
  },

  petSwitchPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.placeholder,
  },

  petSwitchNameActive: {
    color: colors.button,
    fontWeight: "700",
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
    backgroundColor: colors.placeholder,
  },
});
