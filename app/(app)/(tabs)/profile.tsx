import {
  updateUserDisplayName,
  updateUserEmail,
  updateUserPassword,
} from "@/api/authApi";
import { uploadProfilePictureToFirebase } from "@/api/imageApi";
import {
  editUserAvatarUrl,
  editUserPhone,
  getUserProfile,
} from "@/api/userApi";
import ProfilePicture from "@/components/ProfilePicture";
import { useAuthSession } from "@/providers/authctx";
import { pickProfilePicture } from "@/utils/pickProfilePicture";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
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

import * as petApi from "@/api/petApi";
import AppHeader from "@/components/AppHeader";
import { PetData } from "@/types/pet";
import { useFocusEffect } from "@react-navigation/native";

export default function ProfilePage() {
  const router = useRouter();
  const { signOut, userNameSession, user } = useAuthSession();

  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [phone, setPhone] = useState<string | null>(null);

  // Midlertidig dummy-data for UI (bytter vi senere til ekte data)
  const displayName = userNameSession ?? "Ingen navn";
  const email = user?.email ?? "Ingen e-post";

  // Redigeringsstates
  const [isEditingUserInfo, setIsEditingUserInfo] = useState(false);
  const [isSavingUserInfo, setIsSavingUserInfo] = useState(false);

  const [editName, setEditName] = useState(displayName);
  const [editEmail, setEditEmail] = useState(email);
  const [editPhone, setEditPhone] = useState(phone ?? "");
  const [editPassword, setEditPassword] = useState("");
  const [localDisplayName, setLocalDisplayName] = useState(displayName);

  // Sjekker om brukeren faktisk har endret noe (for å disable Save)
  const hasUserInfoChanges =
    editName.trim() !== (localDisplayName ?? "").trim() ||
    editEmail.trim() !== (email ?? "").trim() ||
    editPhone.trim() !== (phone ?? "").trim() ||
    editPassword.trim().length > 0; // passord teller kun hvis brukeren skrev noe

  // My Pets
  const [pets, setPets] = useState<PetData[]>([]);
  const [isLoadingPets, setIsLoadingPets] = useState(false);

  const loadPets = useCallback(async () => {
    if (!user?.uid) return;

    setIsLoadingPets(true);
    const result = await petApi.getAllPets(user.uid);
    setPets(result);
    setIsLoadingPets(false);
  }, [user?.uid]);

  // UseEffect
  useEffect(() => {
    if (!user?.uid) return;

    const loadProfileImage = async () => {
      const profile = await getUserProfile(user.uid);

      if (profile?.avatarUrl) {
        setProfileImageUri(profile.avatarUrl);
      }

      // Telefon er valgfri
      if (profile?.phone) {
        setPhone(profile.phone);
      } else {
        setPhone(null);
      }
    };

    loadProfileImage();
  }, [user?.uid]);

  useEffect(() => {
    setLocalDisplayName(displayName);
  }, [displayName]);

  // Oppdater pets når siden får fokus (f.eks. når du kommer tilbake fra addPet)
  useFocusEffect(
    useCallback(() => {
      loadPets();
    }, [loadPets]),
  );

  //** JSX **/
  return (
    <View style={styles.screen}>
      {/* HEADER */}
      <AppHeader
        title="Profile"
        onBack={() => router.replace("/")}
        onMenuPress={() => {
          console.log("meny");
        }}
      />

      {/* CONTENT (SCROLL) */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* TOP CARD */}
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <ProfilePicture
              imageUri={profileImageUri}
              isLoading={isUploading}
              onPressEdit={async () => {
                if (!user?.uid) return;

                const uri = await pickProfilePicture();
                if (!uri) return;

                // Vis bildet med en gang (lokal preview)
                setProfileImageUri(uri);

                try {
                  setIsUploading(true);

                  // 1) Upload til Storage -> får download URL tilbake
                  const downloadUrl = await uploadProfilePictureToFirebase(
                    uri,
                    user.uid,
                  );
                  if (!downloadUrl) return;

                  // 2) Lagre URL i Firestore (users/{uid})
                  await editUserAvatarUrl(user.uid, downloadUrl);

                  // 3) Bytt fra lokal uri til ekte URL (så det fungerer etter refresh også)
                  setProfileImageUri(downloadUrl);
                } finally {
                  setIsUploading(false);
                }
              }}
            />

            <View style={styles.profileTextWrap}>
              <Text style={styles.profileName} numberOfLines={1}>
                {localDisplayName}
              </Text>
              <Text style={styles.profileEmail} numberOfLines={1}>
                {email}
              </Text>
            </View>
          </View>
        </View>

        {/* USER INFORMATION CARD */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>User Information</Text>

            {/* Høyre side: Avbryt + Save/Edit */}
            <View style={styles.headerActions}>
              {/* Avbryt vises kun i edit-modus */}
              {isEditingUserInfo && (
                <Pressable
                  disabled={isSavingUserInfo}
                  style={{ opacity: isSavingUserInfo ? 0.6 : 1 }}
                  onPress={() => {
                    // Avbryt: forkast endringer og gå ut av edit-modus
                    setEditName(localDisplayName);
                    setEditEmail(email);
                    setEditPhone(phone ?? "");
                    setEditPassword(""); // alltid tomt av sikkerhet
                    setIsEditingUserInfo(false);
                  }}
                >
                  <Text style={styles.cancelLink}>Cancel</Text>
                </Pressable>
              )}

              <Pressable
                disabled={
                  isSavingUserInfo || (isEditingUserInfo && !hasUserInfoChanges)
                }
                style={{
                  opacity:
                    isSavingUserInfo ||
                    (isEditingUserInfo && !hasUserInfoChanges)
                      ? 0.5
                      : 1,
                }}
                onPress={async () => {
                  // 1) Gå INN i edit-modus
                  if (!isEditingUserInfo) {
                    // Vi går INN i edit-modus: fyll feltene med dagens verdier
                    setEditName(localDisplayName);
                    setEditEmail(email);
                    setEditPhone(phone ?? "");
                    setEditPassword(""); // alltid tomt av sikkerhet
                    setIsEditingUserInfo(true);
                    return;
                  }

                  // 2) Vi er i edit-modus og trykker "Lagre"
                  if (!user) return;

                  setIsSavingUserInfo(true);

                  try {
                    // 1) Navn (Firebase Auth)
                    const newName = editName.trim();
                    if (newName && newName !== localDisplayName) {
                      await updateUserDisplayName(user, newName);
                      setLocalDisplayName(newName);
                    }

                    // 2) E-post (Firebase Auth)
                    const newEmail = editEmail.trim();
                    if (newEmail && newEmail !== email) {
                      await updateUserEmail(user, newEmail);
                    }

                    // 3) Passord (Firebase Auth) - kun hvis brukeren skrev noe
                    const newPassword = editPassword.trim();
                    if (newPassword.length > 0) {
                      await updateUserPassword(user, newPassword);
                    }

                    // 4) Telefon (Firestore) - valgfritt
                    const newPhone =
                      editPhone.trim().length > 0 ? editPhone.trim() : null;

                    await editUserPhone(user.uid, newPhone);
                    setPhone(newPhone);

                    // Ferdig -> ut av edit-modus
                    setIsEditingUserInfo(false);

                    Alert.alert("Success", "Userinformation is updated.");
                  } catch (e: any) {
                    console.log("Lagre brukerinfo feilet:", e);

                    const message =
                      e?.code === "auth/requires-recent-login"
                        ? "Av sikkerhetsgrunner må du logge inn på nytt før du kan endre e-post eller passord."
                        : "Kunne ikke lagre endringene. Prøv igjen.";

                    Alert.alert("Feil", message);
                  } finally {
                    setIsSavingUserInfo(false);
                  }
                }}
              >
                {isEditingUserInfo ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {isSavingUserInfo && <ActivityIndicator size="small" />}
                    <Text style={styles.editLink}>
                      {isSavingUserInfo ? "Saving..." : "Save"}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.editLink}>Edit</Text>
                )}
              </Pressable>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Rows */}
          {/* Name */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Feather name="user" size={18} color="#111" />
            </View>

            {isEditingUserInfo ? (
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Name"
              />
            ) : (
              <Text style={styles.infoText} numberOfLines={1}>
                {localDisplayName}
              </Text>
            )}
          </View>

          <View style={styles.rowDivider} />

          {/* Email */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Feather name="mail" size={18} color="#111" />
            </View>

            {isEditingUserInfo ? (
              <TextInput
                style={styles.input}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="E-post"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <Text style={styles.infoText} numberOfLines={1}>
                {email}
              </Text>
            )}
          </View>

          {/* Password - kun i edit-modus */}
          {isEditingUserInfo && (
            <>
              <View style={styles.rowDivider} />

              <View style={styles.infoRow}>
                <View style={styles.infoIconWrap}>
                  <Feather name="lock" size={18} color="#111" />
                </View>

                <TextInput
                  style={styles.input}
                  value={editPassword}
                  onChangeText={setEditPassword}
                  placeholder="New password"
                  secureTextEntry
                />
              </View>
            </>
          )}

          <View style={styles.rowDivider} />

          {/* Phone */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Feather name="phone" size={18} color="#111" />
            </View>

            {isEditingUserInfo ? (
              <TextInput
                style={styles.input}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Phone (optional)"
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.infoText} numberOfLines={1}>
                {phone ?? "Not added"}
              </Text>
            )}
          </View>
        </View>

        {/* MY PETS CARD */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>My Pets</Text>

            <Pressable
              style={styles.circleIconButton}
              onPress={() => router.push("/pets/addPet")}
            >
              <Feather name="plus" size={16} color="#111" />
            </Pressable>
          </View>

          <View style={styles.divider} />

          {/* Hvis ingen pets */}
          {isLoadingPets ? (
            <Text style={styles.emptyText}>Loading pets...</Text>
          ) : pets.length === 0 ? (
            <Text style={styles.emptyText}>
              You haven’t added any pets yet.
            </Text>
          ) : (
            pets.map((pet, index) => {
              const isLast = index === pets.length - 1;

              return (
                <View key={pet.id}>
                  <Pressable
                    style={styles.petRow}
                    onPress={() =>
                      router.push({
                        pathname: "/pets/[id]",
                        params: { id: pet.id },
                      })
                    }
                  >
                    <View style={styles.petLeft}>
                      {/* Avatar */}
                      {pet.photoUrl ? (
                        <Image
                          source={{ uri: pet.photoUrl }}
                          style={styles.petAvatarImg}
                        />
                      ) : (
                        <View style={styles.petAvatar} />
                      )}

                      <View style={styles.petTextWrap}>
                        <Text style={styles.petName}>{pet.name}</Text>
                        <Text style={styles.petType}>{pet.type}</Text>
                      </View>
                    </View>

                    <Feather name="chevron-right" size={22} color="#111" />
                  </Pressable>

                  {!isLast && <View style={styles.petRowDivider} />}
                </View>
              );
            })
          )}
        </View>

        {/* LOG OUT CARD */}
        <View style={styles.card}>
          <Pressable style={styles.logoutButton} onPress={signOut}>
            <Text style={styles.logoutButtonText}>Sign out</Text>
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

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111",
    marginLeft: 6,
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

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#D9D9D9",
  },
  profileTextWrap: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  profileEmail: {
    fontSize: 14,
    color: "#444",
  },

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

  divider: {
    height: 1,
    backgroundColor: "#EDEDED",
    marginBottom: 8,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 10,
  },
  infoIconWrap: {
    width: 26,
    alignItems: "center",
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#111",
  },
  rowDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
  },

  circleIconButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#111",
    backgroundColor: "transparent",
  },

  petRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  petLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    paddingRight: 10, // så teksten ikke krasjer i chevron
  },
  petAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#D9D9D9",
  },
  petAvatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  petTextWrap: {
    flex: 1,
    gap: 2,
  },
  petName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },
  petType: {
    fontSize: 12,
    color: "#666",
  },
  petRowDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
  },

  logoutButton: {
    backgroundColor: "#E53935",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },

  input: {
    flex: 1,
    fontSize: 14,
    color: "#111",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#E6E6E6",
    borderRadius: 10,
    backgroundColor: "#fff",
  },
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
  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingVertical: 16,
  },
});
