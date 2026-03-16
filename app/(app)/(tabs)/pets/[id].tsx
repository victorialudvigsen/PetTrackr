import { uploadPetPictureToFirebase } from "@/api/imageApi";
import * as petApi from "@/api/petApi";
import AppHeader from "@/components/AppHeader";
import { useAuthSession } from "@/providers/authctx";
import { buttonStyles } from "@/styles/buttonStyles";
import { cardStyles } from "@/styles/cardStyles";
import { colors } from "@/styles/colors";
import { inputStyles } from "@/styles/inputStyles";
import { layoutStyles } from "@/styles/layoutStyles";
import { rowStyles } from "@/styles/rowStyles";
import { textStyles } from "@/styles/textStyles";
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
      return () => {
        setIsEditingPetInfo(false);

        setEditName(pet?.name ?? "");
        setEditType(pet?.type ?? "");
      };
    }, [pet?.name, pet?.type]),
  );

  // Henter pet
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
      <View style={layoutStyles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Laster pet...</Text>
      </View>
    );
  }

  // Disable Save
  const hasPetInfoChanges =
    editName.trim() !== (pet.name ?? "").trim() ||
    editType.trim() !== (pet.type ?? "").trim();

  async function onChangePetPhoto() {
    if (!user?.uid) return;
    if (!pet) return;

    const uri = await pickProfilePicture();
    if (!uri) return;

    // Vis nytt bilde med én gang
    setPet((prev) => (prev ? { ...prev, photoUrl: uri } : prev));

    setIsUploadingPhoto(true);

    try {
      // Upload (overskriver pets/{uid}/{petId}.jpg)
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

      // Lagrer URL i Firestore
      await petApi.setPetPhotoUrl(user.uid, pet.id, downloadUrl);

      // Oppdaterer UI med ekte url
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
      // Oppdaterer Firestore (users/{uid}/pets/{petId})
      await petApi.updatePetBasicInfo(user.uid, pet.id, {
        name: cleanName,
        type: cleanType,
      });

      // Oppdaterer UI direkte
      setPet((prev) =>
        prev ? { ...prev, name: cleanName, type: cleanType } : prev,
      );

      setIsEditingPetInfo(false);
      Alert.alert("Success", "Pet updated!");
    } catch (e) {
      console.log("Update pet info failed:", e);
      Alert.alert("Feil", "Kunne ikke lagre endringene. Prøv igjen.");

      await fetchPet();
    } finally {
      setIsSavingPetInfo(false);
    }
  }

  /* -------- DELETE PET -------- */
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

  return (
    <View style={layoutStyles.screen}>
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
        contentContainerStyle={layoutStyles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* "BILDEFELT" (hero) */}
        <View style={styles.heroCard}>
          <View style={styles.heroImageWrap}>
            {/* Viser pet.photoUrl hvis den finnes, ellers en placeholder */}
            {pet.photoUrl ? (
              <Image source={{ uri: pet.photoUrl }} style={styles.heroImage} />
            ) : (
              <View style={styles.heroPlaceholder} />
            )}

            {/* Kameraikon */}
            <Pressable
              style={[
                buttonStyles.cameraButton,
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
        <View style={cardStyles.card}>
          <View style={cardStyles.cardHeaderRow}>
            <Text style={[textStyles.sectionTitle]}>Basic Info</Text>

            {/* Cancel + Delete + Save/Edit  */}
            <View style={rowStyles.logRow}>
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
                    <Text style={textStyles.deleteText}>
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
                    <Text style={textStyles.cancelText}>Cancel</Text>
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
                  // Går inn i edit-modus
                  if (!isEditingPetInfo) {
                    setEditName(pet.name ?? "");
                    setEditType(pet.type ?? "");
                    setIsEditingPetInfo(true);
                    return;
                  }

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
                    <Text
                      style={[
                        textStyles.switchText,
                        { textDecorationLine: "none" },
                        { fontWeight: "600" },
                      ]}
                    >
                      {isSavingPetInfo ? "Lagrer..." : "Save"}
                    </Text>
                  </View>
                ) : (
                  <Text
                    style={[
                      textStyles.switchText,
                      { textDecorationLine: "none" },
                      { fontWeight: "600" },
                    ]}
                  >
                    Edit
                  </Text>
                )}
              </Pressable>
            </View>
          </View>

          <View style={cardStyles.divider} />

          <View style={styles.basicGrid}>
            {/* Name */}
            <View style={styles.basicItem}>
              <View style={rowStyles.rowIconWrap}>
                <Feather name="user" size={16} color={colors.button} />
              </View>

              <View style={{ flex: 1 }}>
                {isEditingPetInfo ? (
                  <TextInput
                    style={[
                      inputStyles.input,
                      { fontSize: 14 },
                      { padding: 8 },
                    ]}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Name"
                    editable={!isSavingPetInfo}
                  />
                ) : (
                  <>
                    <Text style={textStyles.sectionTitle} numberOfLines={1}>
                      {pet.name}
                    </Text>
                    <Text
                      style={[
                        { fontSize: 12 },
                        { color: colors.textSecondary },
                        { marginBottom: 2 },
                      ]}
                    >
                      Name
                    </Text>
                  </>
                )}
              </View>
            </View>

            {/* Type */}
            <View style={styles.basicItem}>
              <View style={rowStyles.rowIconWrap}>
                <Feather name="tag" size={16} color={colors.button} />
              </View>

              <View style={{ flex: 1 }}>
                {isEditingPetInfo ? (
                  <TextInput
                    style={[
                      inputStyles.input,
                      { fontSize: 14 },
                      { padding: 8 },
                    ]}
                    value={editType}
                    onChangeText={setEditType}
                    placeholder="Type"
                    editable={!isSavingPetInfo}
                  />
                ) : (
                  <>
                    <Text style={textStyles.sectionTitle} numberOfLines={1}>
                      {pet.type}
                    </Text>
                    <Text
                      style={[
                        { fontSize: 12 },
                        { color: colors.textSecondary },
                        { marginBottom: 2 },
                      ]}
                    >
                      Type
                    </Text>
                  </>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* RECENT ACTIVITY CARD */}
        <View style={cardStyles.card}>
          <Text style={[textStyles.sectionTitle, { paddingBottom: 10 }]}>
            Recent Activity
          </Text>
          <View style={cardStyles.divider} />

          {/* ACTIVITY */}
          <Pressable
            style={rowStyles.row}
            onPress={() =>
              router.push({
                pathname: "/pets/activity/[id]",
                params: { id: pet.id, from: "profile" },
              })
            }
          >
            <View style={rowStyles.rowLeft}>
              <View style={rowStyles.rowIconWrap}>
                <Feather name="activity" size={18} color={colors.button} />
              </View>

              <View>
                <Text style={textStyles.sectionTitle}>Activity</Text>
                <Text style={textStyles.dateTextLarge}>Track walks</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={22} color={colors.button} />
          </Pressable>

          <View style={cardStyles.divider} />

          {/* FOOD */}
          <Pressable
            style={rowStyles.row}
            onPress={() =>
              router.push({
                pathname: "/pets/food/[id]",
                params: { id: pet.id, from: "profile" },
              })
            }
          >
            <View style={rowStyles.rowLeft}>
              <View style={rowStyles.rowIconWrap}>
                <Feather name="shopping-bag" size={18} color={colors.button} />
              </View>

              <View>
                <Text style={textStyles.sectionTitle}>Food</Text>
                <Text style={textStyles.dateTextLarge}>Track meals</Text>
              </View>
            </View>

            <Feather name="chevron-right" size={22} color={colors.button} />
          </Pressable>

          <View style={cardStyles.divider} />

          {/* MEDS */}
          <Pressable
            style={rowStyles.row}
            onPress={() =>
              router.push({
                pathname: "/pets/medic/[id]",
                params: { id: pet.id, from: "profile" },
              })
            }
          >
            <View style={rowStyles.rowLeft}>
              <View style={rowStyles.rowIconWrap}>
                <Feather name="plus-square" size={18} color={colors.button} />
              </View>

              <View>
                <Text style={textStyles.sectionTitle}>Medication</Text>
                <Text style={textStyles.dateTextLarge}>
                  Track medication and treatments
                </Text>
              </View>
            </View>

            <Feather name="chevron-right" size={22} color={colors.button} />
          </Pressable>
        </View>

        {/* NEDRE KORT  */}
        <View style={cardStyles.card}>
          <Text style={[textStyles.sectionTitle, { paddingBottom: 10 }]}>
            Other
          </Text>
          <View style={cardStyles.divider} />
          <Pressable style={rowStyles.row} onPress={() => {}}>
            <View style={rowStyles.rowLeft}>
              <View style={rowStyles.rowIconWrap} />
              <View>
                <Text style={textStyles.sectionTitle}>Medical Records</Text>
                <Text style={textStyles.dateTextLarge}>
                  Track medical records (Coming soon)
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={22} color={colors.button} />
          </Pressable>

          <View style={cardStyles.divider} />

          <Pressable style={rowStyles.row} onPress={() => {}}>
            <View style={rowStyles.rowLeft}>
              <View style={rowStyles.rowIconWrap} />
              <View>
                <Text style={textStyles.sectionTitle}>Prescriptions</Text>
                <Text style={textStyles.dateTextLarge}>
                  Track prescriptions (Coming soon)
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={22} color={colors.button} />
          </Pressable>

          <View style={cardStyles.divider} />

          <Pressable style={rowStyles.row} onPress={() => {}}>
            <View style={rowStyles.rowLeft}>
              <View style={rowStyles.rowIconWrap} />
              <Text style={textStyles.sectionTitle}>???</Text>
            </View>
            <Feather name="chevron-right" size={22} color={colors.button} />
          </Pressable>
        </View>

        {/* Litt luft nederst så det ikke krasjer i tab bar */}
        <View style={{ height: 18 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
