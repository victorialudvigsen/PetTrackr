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
import { cardStyles } from "@/styles/cardStyles";
import { colors } from "@/styles/colors";
import { layoutStyles } from "@/styles/layoutStyles";
import { rowStyles } from "@/styles/rowStyles";
import { textStyles } from "@/styles/textStyles";
import { PetData } from "@/types/pet";
import { useFocusEffect } from "@react-navigation/native";

export default function ProfilePage() {
  const router = useRouter();
  const { signOut, userNameSession, user } = useAuthSession();

  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [phone, setPhone] = useState<string | null>(null);

  // Dummy-data for UI
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

  // Henter bruker
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

  // Oppdater pets når siden får fokus
  useFocusEffect(
    useCallback(() => {
      loadPets();
    }, [loadPets]),
  );

  return (
    <View style={layoutStyles.screen}>
      {/* HEADER */}
      <AppHeader title="Profile" onBack={() => router.replace("/")} />

      {/* CONTENT (SCROLL) */}
      <ScrollView
        contentContainerStyle={layoutStyles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* TOP CARD */}
        <View style={cardStyles.card}>
          <View style={styles.profileRow}>
            <ProfilePicture
              imageUri={profileImageUri}
              isLoading={isUploading}
              onPressEdit={async () => {
                if (!user?.uid) return;

                const uri = await pickProfilePicture();
                if (!uri) return;

                // Viser bildet med en gang
                setProfileImageUri(uri);

                try {
                  setIsUploading(true);

                  // Upload til Storage -> får download URL tilbake
                  const downloadUrl = await uploadProfilePictureToFirebase(
                    uri,
                    user.uid,
                  );
                  if (!downloadUrl) return;

                  // Lagrer URL i Firestore (users/{uid})
                  await editUserAvatarUrl(user.uid, downloadUrl);

                  // Bytter fra lokal uri til ekte URL
                  setProfileImageUri(downloadUrl);
                } finally {
                  setIsUploading(false);
                }
              }}
            />

            <View style={styles.profileTextWrap}>
              <Text style={textStyles.logTitle} numberOfLines={1}>
                {localDisplayName}
              </Text>
              <Text style={textStyles.pageSubtitle} numberOfLines={1}>
                {email}
              </Text>
            </View>
          </View>
        </View>

        {/* USER INFORMATION CARD */}
        <View style={cardStyles.card}>
          <View style={cardStyles.cardHeaderRow}>
            <Text style={textStyles.sectionTitle}>User Information</Text>

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
                  <Text style={textStyles.cancelText}>Cancel</Text>
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
                  // Går inn i edit-modus
                  if (!isEditingUserInfo) {
                    setEditName(localDisplayName);
                    setEditEmail(email);
                    setEditPhone(phone ?? "");
                    setEditPassword("");
                    setIsEditingUserInfo(true);
                    return;
                  }

                  // Er i edit-modus og trykker "Lagre"
                  if (!user) return;

                  setIsSavingUserInfo(true);

                  try {
                    // 1Navn (Firebase Auth)
                    const newName = editName.trim();
                    if (newName && newName !== localDisplayName) {
                      await updateUserDisplayName(user, newName);
                      setLocalDisplayName(newName);
                    }

                    // E-post (Firebase Auth)
                    const newEmail = editEmail.trim();
                    if (newEmail && newEmail !== email) {
                      await updateUserEmail(user, newEmail);
                    }

                    // Passord (Firebase Auth) - kun hvis brukeren skrev noe
                    const newPassword = editPassword.trim();
                    if (newPassword.length > 0) {
                      await updateUserPassword(user, newPassword);
                    }

                    // Telefon (Firestore) - valgfritt
                    const newPhone =
                      editPhone.trim().length > 0 ? editPhone.trim() : null;

                    await editUserPhone(user.uid, newPhone);
                    setPhone(newPhone);

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
                    <Text
                      style={[
                        textStyles.switchText,
                        { textDecorationLine: "none" },
                        { fontWeight: "600" },
                      ]}
                    >
                      {isSavingUserInfo ? "Saving..." : "Save"}
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

          {/* Rows */}
          {/* Name */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Feather name="user" size={18} color={colors.button} />
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

          <View style={cardStyles.divider} />

          {/* Email */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Feather name="mail" size={18} color={colors.button} />
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
              <View style={cardStyles.divider} />

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

          <View style={cardStyles.divider} />

          {/* Phone */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Feather name="phone" size={18} color={colors.button} />
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
        <View style={cardStyles.card}>
          <View style={cardStyles.cardHeaderRow}>
            <Text style={textStyles.sectionTitle}>My Pets</Text>

            <Pressable
              style={styles.circleIconButton}
              onPress={() => router.push("/pets/addPet")}
            >
              <Feather name="plus" size={16} color="#111" />
            </Pressable>
          </View>

          <View style={cardStyles.divider} />

          {/* Hvis ingen pets */}
          {isLoadingPets ? (
            <Text style={textStyles.emptyText}>Loading pets...</Text>
          ) : pets.length === 0 ? (
            <Text style={textStyles.emptyText}>
              You haven’t added any pets yet.
            </Text>
          ) : (
            pets.map((pet, index) => {
              const isLast = index === pets.length - 1;

              return (
                <View key={pet.id}>
                  <Pressable
                    style={rowStyles.row}
                    onPress={() =>
                      router.push({
                        pathname: "/pets/[id]",
                        params: { id: pet.id, from: "profile" },
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
                        <Text style={textStyles.sectionTitle}>{pet.name}</Text>
                        <Text style={textStyles.logSubtitle}>{pet.type}</Text>
                      </View>
                    </View>

                    <Feather name="chevron-right" size={22} color="#111" />
                  </Pressable>

                  {!isLast && <View style={cardStyles.divider} />}
                </View>
              );
            })
          )}
        </View>

        {/* Litt luft nederst så det ikke krasjer i tab bar */}
        <View style={{ height: 18 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Profile header
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
  },
  profileTextWrap: {
    flex: 1,
    gap: 4,
  },

  // Card header

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  // Info rows
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
    color: colors.textPrimary,
  },

  // Buttons
  circleIconButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.textPrimary,
    backgroundColor: "transparent",
  },

  // Pets
  petLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    paddingRight: 10,
  },
  petAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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

  // Form
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.card,
  },
});
