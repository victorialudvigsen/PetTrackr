import { uploadPetPictureToFirebase } from "@/api/imageApi";
import * as petApi from "@/api/petApi";
import AppHeader from "@/components/AppHeader";
import { useAuthSession } from "@/providers/authctx";
import { PetData } from "@/types/pet";
import { pickProfilePicture } from "@/utils/pickProfilePicture";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function PetDetailPage() {
  const router = useRouter();
  const { id, from } = useLocalSearchParams<{
    id: string;
    from?: string;
  }>();
  const { user } = useAuthSession();

  const [pet, setPet] = useState<PetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Edit-mode states
  const [isEditingPetInfo, setIsEditingPetInfo] = useState(false);
  const [isSavingPetInfo, setIsSavingPetInfo] = useState(false);

  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("");

  const [isDeletingPet, setIsDeletingPet] = useState(false);

  // Henter dyr
  async function fetchPet() {
    if (!user?.uid) return;
    setIsLoading(true);

    const result = await petApi.getPetById(user.uid, id);
    setPet(result);
    setIsLoading(false);
  }

  useFocusEffect(
    React.useCallback(() => {
      // Når skjermen får fokus: ikke gjør noe
      return () => {
        // Når skjermen mister fokus (du går til en annen tab/screen):
        setIsEditingPetInfo(false);

        // (valgfritt men anbefalt) reset input-feltene til det som er lagret i pet:
        setEditName(pet?.name ?? "");
        setEditType(pet?.type ?? "");
      };
    }, [pet?.name, pet?.type]),
  );

  // Useeffect
  useEffect(() => {
    fetchPet();
  }, [id, user?.uid]);

  // Når pet lastes/endres, fyll edit-feltene
  useEffect(() => {
    if (!pet) return;
    setEditName(pet.name ?? "");
    setEditType(pet.type ?? "");
  }, [pet?.id]);

  // Laster
  if (isLoading || pet === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Laster pet...</Text>
      </View>
    );
  }

  // brukt for å disable Save
  const hasPetInfoChanges =
    editName.trim() !== (pet.name ?? "").trim() ||
    editType.trim() !== (pet.type ?? "").trim();

  async function onChangePetPhoto() {
    if (!user?.uid) return;
    if (!pet) return;

    const uri = await pickProfilePicture();
    if (!uri) return;

    // 1) Vis nytt bilde med én gang (lokal preview)
    setPet((prev) => (prev ? { ...prev, photoUrl: uri } : prev));

    setIsUploadingPhoto(true);

    try {
      // 2) Upload (overskriver pets/{uid}/{petId}.jpg)
      const downloadUrl = await uploadPetPictureToFirebase(
        uri,
        user.uid,
        pet.id,
      );
      if (!downloadUrl) {
        Alert.alert("Feil", "Kunne ikke laste opp bildet. Prøv igjen.");
        await fetchPet(); // ruller tilbake til det som ligger i databasen
        return;
      }

      // 3) Lagre URL i Firestore
      await petApi.setPetPhotoUrl(user.uid, pet.id, downloadUrl);

      // 4) Oppdater UI med ekte url (så det fungerer etter refresh også)
      setPet((prev) => (prev ? { ...prev, photoUrl: downloadUrl } : prev));
    } catch (e) {
      console.log("Update pet photo failed:", e);
      Alert.alert("Feil", "Noe gikk galt. Prøv igjen.");
      await fetchPet();
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  // Save Basic Info
  async function onSavePetInfo() {
    if (!user?.uid) return;
    if (!pet) return;

    const cleanName = editName.trim();
    const cleanType = editType.trim();

    if (!cleanName || !cleanType) {
      Alert.alert("Mangler info", "Fyll inn navn og type før du lagrer.");
      return;
    }

    setIsSavingPetInfo(true);

    try {
      // Oppdater Firestore (users/{uid}/pets/{petId})
      await petApi.updatePetBasicInfo(user.uid, pet.id, {
        name: cleanName,
        type: cleanType,
      });

      // Oppdater UI direkte
      setPet((prev) =>
        prev ? { ...prev, name: cleanName, type: cleanType } : prev,
      );

      setIsEditingPetInfo(false);
      Alert.alert("Success", "Pet updated!");
    } catch (e) {
      console.log("Update pet info failed:", e);
      Alert.alert("Feil", "Kunne ikke lagre endringene. Prøv igjen.");
      // Rull tilbake til databasen (trygt)
      await fetchPet();
    } finally {
      setIsSavingPetInfo(false);
    }
  }

  // Delete pet
  async function onDeletePet() {
    if (!user?.uid) return;
    if (!pet) return;

    Alert.alert(
      "Delete pet?",
      "Are you sure you want to delete this pet? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeletingPet(true);
            try {
              await petApi.deletePet(user.uid, pet.id);

              // Viktig: gå tilbake til Profile etter slett
              router.replace("/profile");
            } catch (e) {
              console.log("Delete pet failed:", e);
              Alert.alert("Feil", "Kunne ikke slette dyret. Prøv igjen.");
            } finally {
              setIsDeletingPet(false);
            }
          },
        },
      ],
    );
  }

  //** JSX **/
  return (
    <View style={styles.screen}>
      {/* HEADER */}
      <AppHeader
        title={pet.name}
        onBack={() => {
          if (from === "profile") {
            router.replace("/profile");
          } else {
            router.replace("/");
          }
        }}
      />

      {/* CONTENT (SCROLL) */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* "BILDEFELT" (hero) */}
        <View style={styles.heroCard}>
          <View style={styles.heroImageWrap}>
            {/* Foreløpig: viser pet.photoUrl hvis den finnes, ellers en placeholder */}
            {pet.photoUrl ? (
              <Image source={{ uri: pet.photoUrl }} style={styles.heroImage} />
            ) : (
              <View style={styles.heroPlaceholder} />
            )}

            {/* Kameraikon */}
            <Pressable
              style={[
                styles.cameraButton,
                { opacity: isUploadingPhoto ? 0.6 : 1 },
              ]}
              onPress={onChangePetPhoto}
              disabled={isUploadingPhoto}
            >
              {isUploadingPhoto ? (
                <ActivityIndicator size="small" />
              ) : (
                <Feather name="camera" size={18} color="#111" />
              )}
            </Pressable>
          </View>
        </View>

        {/* BASIC INFO CARD */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Basic Info</Text>

            {/* Cancel + Delete + Save/Edit  */}
            <View style={styles.headerActions}>
              {/* Delete + Cancel vises kun når vi redigerer */}
              {isEditingPetInfo && (
                <>
                  {/* DELETE */}
                  <Pressable
                    disabled={isSavingPetInfo || isDeletingPet}
                    style={{
                      opacity: isSavingPetInfo || isDeletingPet ? 0.6 : 1,
                    }}
                    onPress={onDeletePet}
                  >
                    <Text style={styles.deleteLink}>
                      {isDeletingPet ? "Deleting..." : "Delete"}
                    </Text>
                  </Pressable>

                  {/* CANCEL */}
                  <Pressable
                    disabled={isSavingPetInfo || isDeletingPet}
                    style={{
                      opacity: isSavingPetInfo || isDeletingPet ? 0.6 : 1,
                    }}
                    onPress={() => {
                      // Avbryt: forkast endringer
                      setEditName(pet.name ?? "");
                      setEditType(pet.type ?? "");
                      setIsEditingPetInfo(false);
                    }}
                  >
                    <Text style={styles.cancelLink}>Cancel</Text>
                  </Pressable>
                </>
              )}

              {/* SAVE / EDIT */}
              <Pressable
                disabled={
                  isSavingPetInfo ||
                  isDeletingPet ||
                  (isEditingPetInfo && !hasPetInfoChanges)
                }
                style={{
                  opacity:
                    isSavingPetInfo ||
                    isDeletingPet ||
                    (isEditingPetInfo && !hasPetInfoChanges)
                      ? 0.5
                      : 1,
                }}
                onPress={async () => {
                  // 1) gå inn i edit-modus
                  if (!isEditingPetInfo) {
                    setEditName(pet.name ?? "");
                    setEditType(pet.type ?? "");
                    setIsEditingPetInfo(true);
                    return;
                  }

                  // 2) vi er i edit-modus -> lagre
                  await onSavePetInfo();
                }}
              >
                {isEditingPetInfo ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {isSavingPetInfo && <ActivityIndicator size="small" />}
                    <Text style={styles.editLink}>
                      {isSavingPetInfo ? "Lagrer..." : "Save"}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.editLink}>Edit</Text>
                )}
              </Pressable>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Her bruker vi kun feltene vi har nå: name og type */}
          <View style={styles.basicGrid}>
            {/* Name */}
            <View style={styles.basicItem}>
              <View style={styles.basicIconWrap}>
                <Feather name="user" size={16} color="#111" />
              </View>

              <View style={{ flex: 1 }}>
                {isEditingPetInfo ? (
                  <TextInput
                    style={styles.input}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Name"
                    editable={!isSavingPetInfo}
                  />
                ) : (
                  <>
                    <Text style={styles.basicValue} numberOfLines={1}>
                      {pet.name}
                    </Text>
                    <Text style={styles.basicLabel}>Name</Text>
                  </>
                )}
              </View>
            </View>

            {/* Type */}
            <View style={styles.basicItem}>
              <View style={styles.basicIconWrap}>
                <Feather name="tag" size={16} color="#111" />
              </View>

              <View style={{ flex: 1 }}>
                {isEditingPetInfo ? (
                  <TextInput
                    style={styles.input}
                    value={editType}
                    onChangeText={setEditType}
                    placeholder="Type"
                    editable={!isSavingPetInfo}
                  />
                ) : (
                  <>
                    <Text style={styles.basicValue} numberOfLines={1}>
                      {pet.type}
                    </Text>
                    <Text style={styles.basicLabel}>Type</Text>
                  </>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* RECENT ACTIVITY CARD */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.divider} />

          {/* ACTIVITY */}
          <Pressable
            style={styles.activityRow}
            onPress={() =>
              router.push({
                pathname: "/pets/activity/[id]",
                params: { id: pet.id, from: "profile" },
              })
            }
          >
            <View style={styles.activityLeft}>
              <View style={styles.activityIconWrap}>
                <Feather name="activity" size={18} color="#111" />
              </View>

              <View>
                <Text style={styles.activityTitle}>Activity</Text>
                <Text style={styles.activitySubtitle}>Track walks</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={22} color="#111" />
          </Pressable>

          <View style={styles.rowDivider} />

          {/* FOOD */}
          <Pressable
            style={styles.activityRow}
            onPress={() =>
              router.push({
                pathname: "/pets/food/[id]",
                params: { id: pet.id, from: "profile" },
              })
            }
          >
            <View style={styles.activityLeft}>
              <View style={styles.activityIconWrap}>
                <Feather name="shopping-bag" size={18} color="#111" />
              </View>

              <View>
                <Text style={styles.activityTitle}>Food</Text>
                <Text style={styles.activitySubtitle}>Track meals</Text>
              </View>
            </View>

            <Feather name="chevron-right" size={22} color="#111" />
          </Pressable>

          <View style={styles.rowDivider} />

          {/* MEDS */}
          <Pressable
            style={styles.activityRow}
            onPress={() =>
              router.push({
                pathname: "/pets/medic/[id]",
                params: { id: pet.id, from: "profile" },
              })
            }
          >
            <View style={styles.activityLeft}>
              <View style={styles.activityIconWrap}>
                <Feather name="plus-square" size={18} color="#111" />
              </View>

              <View>
                <Text style={styles.activityTitle}>Medication</Text>
                <Text style={styles.activitySubtitle}>
                  Track medication and treatments
                </Text>
              </View>
            </View>

            <Feather name="chevron-right" size={22} color="#111" />
          </Pressable>
        </View>

        {/* NEDRE KORT (som i scroll-bildet) */}
        <View style={styles.card}>
          <Pressable style={styles.simpleRow} onPress={() => {}}>
            <View style={styles.simpleLeft}>
              <View style={styles.simpleIconWrap} />
              <Text style={styles.simpleText}>Medical Records</Text>
            </View>
            <Feather name="chevron-right" size={22} color="#111" />
          </Pressable>

          <View style={styles.rowDivider} />

          <Pressable style={styles.simpleRow} onPress={() => {}}>
            <View style={styles.simpleLeft}>
              <View style={styles.simpleIconWrap} />
              <Text style={styles.simpleText}>Prescriptions</Text>
            </View>
            <Feather name="chevron-right" size={22} color="#111" />
          </Pressable>

          <View style={styles.rowDivider} />

          <Pressable style={styles.simpleRow} onPress={() => {}}>
            <View style={styles.simpleLeft}>
              <View style={styles.simpleIconWrap} />
              <Text style={styles.simpleText}>???</Text>
            </View>
            <Feather name="chevron-right" size={22} color="#111" />
          </Pressable>
        </View>

        {/* Litt luft nederst så det ikke krasjer i tab bar */}
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
    gap: 14,
    paddingBottom: 20,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  // Hero
  heroCard: {
    backgroundColor: "transparent",
  },
  heroImageWrap: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#3E3E3E",
    height: 210,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#3E3E3E",
  },
  cameraButton: {
    position: "absolute",
    right: 12,
    top: 12,
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Card headers
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },
  editLink: {
    fontSize: 14,
    color: "#2B6DEB",
    fontWeight: "600",
  },

  // NEW: samme som på profile.tsx
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cancelLink: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: "#EDEDED",
    marginBottom: 8,
  },
  rowDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
  },

  // Basic info grid
  basicGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    paddingTop: 6,
  },
  basicItem: {
    width: "47%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  basicIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#F3F0EC",
    alignItems: "center",
    justifyContent: "center",
  },
  basicValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
    maxWidth: 140,
  },
  basicLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },

  // NEW: input style (kopiert fra profile.tsx)
  input: {
    fontSize: 14,
    color: "#111",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#E6E6E6",
    borderRadius: 10,
    backgroundColor: "#fff",
  },

  // Recent activity
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
    paddingBottom: 10,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  activityLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },
  activityIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },
  activitySubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },

  // Simple list (Medical Records / Prescriptions)
  simpleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  simpleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  simpleIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "#F3F0EC",
  },
  simpleText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },
  deleteLink: {
    fontSize: 14,
    color: "#E53935",
    fontWeight: "700",
  },
});
