import * as medicApi from "@/api/medicApi";
import * as petApi from "@/api/petApi";
import AppHeader from "@/components/AppHeader";
import SwipeDeleteRow from "@/components/SwipeDeleteRow";
import { useAuthSession } from "@/providers/authctx";
import { cardStyles } from "@/styles/cardStyles";
import { layoutStyles } from "@/styles/layoutStyles";
import { rowStyles } from "@/styles/rowStyles";
import { textStyles } from "@/styles/textStyles";
import { MedicEntryData } from "@/types/medic";
import { PetData } from "@/types/pet";
import { Feather } from "@expo/vector-icons";
import AntDesign from "@expo/vector-icons/AntDesign";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
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

            /* Oppdaterer listen etter sletting */
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
            <View style={rowStyles.iconCircle}>
              <FontAwesome5 name="pills" size={22} color="#111" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={textStyles.logTitle}>Log medication</Text>
              <Text style={textStyles.logSubtitle}>
                Record name, dosage and notes
              </Text>
            </View>

            <Pressable
              style={rowStyles.addButton}
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

              return (
                /* SwipeDeleteRow håndterer hele swipe-logikken */
                <SwipeDeleteRow
                  key={entry.id}
                  onDelete={() => handleDelete(entry.id)}
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

                          {entry.reminderEnabled ? (
                            <Feather name="bell" size={14} color="#666" />
                          ) : null}
                        </View>

                        {entry.note ? (
                          <Text style={textStyles.noteText}>{entry.note}</Text>
                        ) : null}

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

        <View style={{ height: 18 }} />
      </ScrollView>
    </View>
  );
}
