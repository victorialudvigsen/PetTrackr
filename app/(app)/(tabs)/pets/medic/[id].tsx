import AppHeader from "@/components/AppHeader";
import { useAuthSession } from "@/providers/authctx";
import { MedicEntryData } from "@/types/medic";
import { PetData } from "@/types/pet";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
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

import * as medicApi from "@/api/medicApi";
import * as petApi from "@/api/petApi";

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
              <Feather name="plus-square" size={22} color="#111" />
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
            meds.slice(0, 10).map((entry) => (
              <View key={entry.id} style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={styles.rowIconWrap}>
                    <Feather name="heart" size={16} color="#111" />
                  </View>

                  <View>
                    <Text style={styles.rowText}>
                      {entry.name} – {entry.dosage}
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => {
                    Alert.alert(
                      "Delete medication",
                      "Are you sure you want to delete this entry?",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Delete",
                          style: "destructive",
                          onPress: async () => {
                            if (!user?.uid || !pet?.id) return;

                            await medicApi.deleteMedicEntry(
                              user.uid,
                              pet.id,
                              entry.id,
                            );

                            const updated = await medicApi.getMedicEntries(
                              user.uid,
                              pet.id,
                            );
                            setMeds(updated);
                          },
                        },
                      ],
                    );
                  }}
                >
                  <Feather name="trash-2" size={18} color="#B00020" />
                </Pressable>
              </View>
            ))
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
});
