import * as petApi from "@/api/petApi";
import * as walkApi from "@/api/walkApi";
import AppHeader from "@/components/AppHeader";
import SwipeDeleteRow from "@/components/SwipeDeleteRow";
import { useAuthSession } from "@/providers/authctx";
import { buttonStyles } from "@/styles/buttonStyles";
import { cardStyles } from "@/styles/cardStyles";
import { layoutStyles } from "@/styles/layoutStyles";
import { rowStyles } from "@/styles/rowStyles";
import { textStyles } from "@/styles/textStyles";
import { PetData } from "@/types/pet";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function PetActivityPage() {
  const router = useRouter();
  const { id, from } = useLocalSearchParams<{
    id: string;
    from?: string;
  }>();
  const { user } = useAuthSession();

  const [pet, setPet] = useState<PetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [walks, setWalks] = useState<any[]>([]);
  const [isLoadingWalks, setIsLoadingWalks] = useState(true);

  /* -------- DELETE WALK -------- */

  async function handleDelete(walkId: string) {
    if (!user?.uid || !pet?.id) return;

    Alert.alert("Delete walk", "Are you sure you want to delete this walk?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await walkApi.deleteWalk(user.uid, pet.id, walkId);

          /* Oppdaterer listen etter sletting */
          const updated = await walkApi.getWalks(user.uid, pet.id);
          setWalks(updated);
        },
      },
    ]);
  }

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

  // Henter walks
  useFocusEffect(
    React.useCallback(() => {
      async function fetchWalks() {
        if (!user?.uid || !id) return;

        setIsLoadingWalks(true);

        const result = await walkApi.getWalks(user.uid, id);
        setWalks(result ?? []);

        setIsLoadingWalks(false);
      }

      fetchWalks();
    }, [user?.uid, id]),
  );

  if (isLoading || !pet) {
    return (
      <View style={layoutStyles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Loading activity...</Text>
      </View>
    );
  }

  return (
    <View style={layoutStyles.screen}>
      {/* HEADER */}
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
          <Text style={textStyles.pageTitle}>Activity</Text>
          <Text style={textStyles.pageSubtitle}>
            Track walks and daily movement
          </Text>
        </View>

        {/* LOG WALK CARD */}
        <View style={cardStyles.card}>
          <View style={rowStyles.logRow}>
            <View style={buttonStyles.iconCircle}>
              <FontAwesome5 name="dog" size={22} color="#111" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={textStyles.logTitle}>Log a walk</Text>
              <Text style={textStyles.logSubtitle}>
                Record duration and track activity
              </Text>
            </View>

            <Pressable
              style={buttonStyles.addButton}
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
        <View style={cardStyles.card}>
          <Text style={textStyles.sectionTitle}>Recent Walks</Text>
          <View style={cardStyles.divider} />

          {isLoadingWalks ? (
            <Text style={textStyles.emptyText}>Loading walks...</Text>
          ) : walks.length === 0 ? (
            <Text style={textStyles.emptyText}>No walks logged yet.</Text>
          ) : (
            walks.map((walk) => {
              const date = walk.createdAt?.toDate?.() ?? new Date();

              return (
                /* SwipeDeleteRow håndterer hele swipe-logikken */
                <SwipeDeleteRow
                  key={walk.id}
                  onDelete={() => handleDelete(walk.id)}
                >
                  <View style={rowStyles.row}>
                    <View style={rowStyles.rowLeft}>
                      <View>
                        <Text style={textStyles.rowText}>
                          {walk.duration} min
                        </Text>

                        <Text style={textStyles.dateText}>
                          {date.toLocaleDateString()} •{" "}
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
        </View>
      </ScrollView>
    </View>
  );
}
