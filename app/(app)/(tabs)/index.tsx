import * as petApi from "@/api/petApi";
import AppHeader from "@/components/AppHeader";
import { useAuthSession } from "@/providers/authctx";
import { PetData } from "@/types/pet";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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

  // 🐾 Hent pets
  useEffect(() => {
    async function fetchPets() {
      if (!user?.uid) return;
      setIsLoadingPets(true);

      const result = await petApi.getAllPets(user.uid);
      setPets(result ?? []);
      setIsLoadingPets(false);
    }

    fetchPets();
  }, [user?.uid]);

  // 🎯 Aktiv pet = første i listen (midlertidig)
  const activePet = pets.length > 0 ? pets[0] : null;

  // 🌤 Greeting basert på klokkeslett
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
          <Text style={styles.userName}>{userNameSession ?? "Friend"} 👋</Text>
          <Text style={styles.subGreeting}>
            {pets.length} pets • All good today
          </Text>
        </View>

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
              { icon: "activity", label: "Walk" },
              { icon: "shopping-bag", label: "Food" },
              { icon: "plus-square", label: "Meds" },
              { icon: "bar-chart-2", label: "Weight" },
            ].map((item) => (
              <Pressable key={item.label} style={styles.quickItem}>
                <View style={styles.quickCircle}>
                  <Feather name={item.icon as any} size={20} color="#111" />
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

          <Text style={styles.todayText}>• No medication reminders</Text>
          <Text style={styles.todayText}>• No vet visits today</Text>
          <Text style={styles.todayText}>• Everything looks good</Text>
        </View>

        {/* RECENT ACTIVITY */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.divider} />

          <Text style={styles.todayText}>🐾 Walk – 40 min</Text>
          <Text style={styles.todayText}>🍖 Food – 200g</Text>
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
