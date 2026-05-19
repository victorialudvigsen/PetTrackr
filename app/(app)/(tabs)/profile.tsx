import {
  updateUserDisplayName,
  updateUserEmail,
  updateUserPassword,
} from "@/api/authApi";
import * as groupApi from "@/api/groupApi";
import { uploadProfilePictureToFirebase } from "@/api/imageApi";
import * as petApi from "@/api/petApi";
import {
  editUserAvatarUrl,
  editUserPhone,
  getUserProfile,
} from "@/api/userApi";
import AppHeader from "@/components/AppHeader";
import ProfilePicture from "@/components/ProfilePicture";
import { useAuthSession } from "@/providers/authctx";
import { cardStyles } from "@/styles/cardStyles";
import { colors } from "@/styles/colors";
import { layoutStyles } from "@/styles/layoutStyles";
import { rowStyles } from "@/styles/rowStyles";
import { textStyles } from "@/styles/textStyles";
import { PetData } from "@/types/pet";
import { pickProfilePicture } from "@/utils/pickProfilePicture";
import { Feather } from "@expo/vector-icons";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

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

  // Group
  const [groupId, setGroupId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState<string | null>(null);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [showInvitesModal, setShowInvitesModal] = useState(false);

  // Loader pets
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

      const invites = await groupApi.getPendingInvitesForUser(user.uid);
      setPendingInvites(invites);

      setGroupId(profile?.groupId ?? null);
      if (profile?.groupId) {
        const group = await groupApi.getGroupById(profile.groupId);
        setGroupName((group?.name as string) ?? null);
      } else {
        setGroupName(null);
      }

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
                    // Navn (Firebase Auth)
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

        {/* GROUP CARD */}
        <View style={cardStyles.card}>
          <View style={cardStyles.cardHeaderRow}>
            <Text style={textStyles.sectionTitle}>Shared Group</Text>

            <Pressable onPress={() => setShowInvitesModal(true)}>
              <Feather
                name="mail"
                size={24}
                color={
                  pendingInvites.length > 0
                    ? colors.button
                    : colors.textSecondary
                }
              />
            </Pressable>
          </View>

          <View style={cardStyles.divider} />

          <Text style={textStyles.pageSubtitle}>
            {groupId ? `Group: ${groupName ?? "Loading..."}` : "No group yet"}
          </Text>

          {groupId ? (
            <Pressable
              style={{ marginTop: 12 }}
              onPress={() => router.push("/manage-group" as any)}
            >
              <Text
                style={{
                  color: colors.button,
                  fontWeight: "600",
                  textAlign: "center",
                }}
              >
                Manage group →
              </Text>
            </Pressable>
          ) : (
            <Pressable
              style={{ marginTop: 12 }}
              onPress={() => router.push("/create-group" as any)}
            >
              <Text
                style={{
                  color: colors.button,
                  fontWeight: "600",
                  textAlign: "center",
                }}
              >
                Create group →
              </Text>
            </Pressable>
          )}
        </View>

        {/* MY PETS CARD */}
        <View style={cardStyles.card}>
          <View style={cardStyles.cardHeaderRow}>
            <Text style={textStyles.sectionTitle}>My Pets</Text>

            <Pressable onPress={() => router.push("/pets/addPet")}>
              <AntDesign name="plus-circle" size={24} color={colors.button} />
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

                    <Feather
                      name="chevron-right"
                      size={22}
                      color={colors.button}
                    />
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
      {/* GROUP INVITES MODAL */}
      <Modal visible={showInvitesModal} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderRadius: 12,
              padding: 20,
            }}
          >
            <Text style={textStyles.sectionTitle}>Group Invitations</Text>

            <View style={cardStyles.divider} />

            {pendingInvites.length === 0 ? (
              <Text style={textStyles.emptyText}>No invitations</Text>
            ) : (
              pendingInvites.map((invite) => (
                <View key={invite.id} style={{ marginBottom: 12 }}>
                  <Text style={textStyles.rowText}>{invite.groupName}</Text>

                  <Text style={textStyles.pageSubtitle}>
                    You have been invited to join this group.
                  </Text>

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginTop: 10,
                    }}
                  >
                    <Pressable
                      onPress={async () => {
                        if (!user?.uid || !user.email) return;

                        try {
                          await groupApi.acceptGroupInvite(
                            invite.id,
                            invite.groupId,
                            user.uid,
                            user.email,
                            userNameSession ?? user.email,
                          );

                          setGroupId(invite.groupId);
                          setGroupName(invite.groupName);
                          setPendingInvites((prev) =>
                            prev.filter((item) => item.id !== invite.id),
                          );

                          Alert.alert("Success", "You joined the group.");
                          setShowInvitesModal(false);
                        } catch (e) {
                          console.log("Could not accept invite:", e);
                          Alert.alert("Error", "Could not accept invite.");
                        }
                      }}
                    >
                      <Text style={{ color: colors.button, fontWeight: "600" }}>
                        Accept
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={async () => {
                        try {
                          await groupApi.declineGroupInvite(invite.id);

                          setPendingInvites((prev) =>
                            prev.filter((item) => item.id !== invite.id),
                          );

                          Alert.alert("Declined", "Invitation declined.");
                        } catch (e) {
                          console.log("Could not decline invite:", e);
                          Alert.alert("Error", "Could not decline invite.");
                        }
                      }}
                    >
                      <Text style={{ color: "#ff6b6b", fontWeight: "600" }}>
                        Decline
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}

            <Pressable
              onPress={() => setShowInvitesModal(false)}
              style={{ marginTop: 12 }}
            >
              <Text
                style={{
                  color: colors.button,
                  fontWeight: "600",
                  textAlign: "center",
                }}
              >
                Close
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
