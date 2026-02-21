import * as petApi from "@/api/petApi";
import AppHeader from "@/components/AppHeader";
import { useAuthSession } from "@/providers/authctx";
import { PetData } from "@/types/pet";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function PetActivityPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthSession();

  const [pet, setPet] = useState<PetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [walks, setWalks] = useState<any[]>([]);
  const [isLoadingWalks, setIsLoadingWalks] = useState(true);

  // Henter pet for å vise navn i header
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

  useFocusEffect(
    React.useCallback(() => {
      async function fetchWalks() {
        if (!user?.uid || !id) return;

        setIsLoadingWalks(true);

        const result = await petApi.getWalks(user.uid, id);
        setWalks(result ?? []);

        setIsLoadingWalks(false);
      }

      fetchWalks();
    }, [user?.uid, id]),
  );

  if (isLoading || !pet) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Loading activity...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* HEADER */}
      <AppHeader
        title={pet.name}
        onBack={() =>
          router.replace({
            pathname: "/pets/[id]",
            params: { id: pet.id, from: "activity" },
          })
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* TITLE */}
        <View style={styles.titleWrap}>
          <Text style={styles.pageTitle}>Activity</Text>
          <Text style={styles.pageSubtitle}>
            Track walks and daily movement
          </Text>
        </View>

        {/* LOG WALK CARD */}
        <View style={styles.card}>
          <View style={styles.logRow}>
            <View style={styles.iconCircle}>
              <Feather name="activity" size={22} color="#111" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.logTitle}>Log a walk</Text>
              <Text style={styles.logSubtitle}>
                Record duration and track activity
              </Text>
            </View>

            <Pressable
              style={styles.addButton}
              onPress={() =>
                router.push({
                  pathname: "/pets/activity/log/[id]",
                  params: { id },
                })
              }
            >
              <Feather name="plus" size={18} color="#111" />
            </Pressable>
          </View>
        </View>

        {/* RECENT WALKS */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Recent Walks</Text>
          <View style={styles.divider} />

          {isLoadingWalks ? (
            <Text style={styles.emptyText}>Loading walks...</Text>
          ) : walks.length === 0 ? (
            <Text style={styles.emptyText}>No walks logged yet.</Text>
          ) : (
            walks.map((walk) => {
              const date = walk.createdAt?.toDate?.() ?? new Date();

              return (
                <View key={walk.id} style={styles.walkRow}>
                  <Text style={styles.walkDuration}>
                    {walk.duration} min walk
                  </Text>
                  <Text style={styles.walkDate}>
                    {date.toLocaleDateString()} •{" "}
                    {date.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              );
            })
          )}
        </View>
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

  walkRow: {
    paddingVertical: 10,
  },

  walkText: {
    fontSize: 14,
    color: "#444",
  },

  rowDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
  },

  walkDuration: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },

  walkDate: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },

  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingVertical: 12,
  },
});
