import * as groupApi from "@/api/groupApi";
import { getUserByEmail, getUserProfile } from "@/api/userApi";
import AppHeader from "@/components/AppHeader";
import { useAuthSession } from "@/providers/authctx";
import { buttonStyles } from "@/styles/buttonStyles";
import { cardStyles } from "@/styles/cardStyles";
import { inputStyles } from "@/styles/inputStyles";
import { layoutStyles } from "@/styles/layoutStyles";
import { textStyles } from "@/styles/textStyles";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

export default function ManageGroupPage() {
  const router = useRouter();
  const { user } = useAuthSession();

  const [groupName, setGroupName] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [inviteEmail, setInviteEmail] = useState("");
  const [groupId, setGroupId] = useState<string | null>(null);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [isLeavingGroup, setIsLeavingGroup] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);

  const [currentUserRole, setCurrentUserRole] = useState<
    "owner" | "member" | null
  >(null);

  useFocusEffect(
    React.useCallback(() => {
      async function fetchGroup() {
        if (!user?.uid) return;

        setIsLoading(true);

        const profile = await getUserProfile(user.uid);

        if (!profile?.groupId) {
          setGroupName(null);
          setMembers([]);
          setIsLoading(false);
          return;
        }

        setGroupId(profile.groupId);

        const group = await groupApi.getGroupById(profile.groupId);
        const groupMembers = await groupApi.getGroupMembers(profile.groupId);

        const currentMember = groupMembers.find(
          (member) => member.userId === user.uid,
        );

        setCurrentUserRole(currentMember?.role ?? null);
        setGroupName(group?.name ?? null);
        setMembers(groupMembers);

        setIsLoading(false);
      }

      fetchGroup();
    }, [user?.uid]),
  );

  if (isLoading) {
    return (
      <View style={layoutStyles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Loading group...</Text>
      </View>
    );
  }

  return (
    <View style={layoutStyles.screen}>
      <AppHeader
        title="Manage Group"
        onBack={() => router.replace("/profile")}
      />

      <ScrollView contentContainerStyle={layoutStyles.content}>
        <Text style={textStyles.pageTitle}>Manage Group</Text>

        {!groupName ? (
          <View style={cardStyles.card}>
            <Text style={textStyles.emptyText}>No group found.</Text>
          </View>
        ) : (
          <>
            <View style={cardStyles.card}>
              <Text style={textStyles.sectionTitle}>{groupName}</Text>
              <View style={cardStyles.divider} />

              <Text style={textStyles.pageSubtitle}>
                {members.length} member{members.length !== 1 ? "s" : ""}
              </Text>
              {currentUserRole === "member" && (
                <Pressable
                  style={{ marginTop: 12, opacity: isLeavingGroup ? 0.6 : 1 }}
                  disabled={isLeavingGroup}
                  onPress={() => {
                    if (!user?.uid || !groupId) return;

                    Alert.alert(
                      "Leave group",
                      "Are you sure you want to leave this group?",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Leave",
                          style: "destructive",
                          onPress: async () => {
                            setIsLeavingGroup(true);

                            try {
                              await groupApi.leaveGroup(groupId, user.uid);

                              router.replace("/profile");
                            } catch (e) {
                              console.log("Could not leave group:", e);
                              Alert.alert("Error", "Could not leave group.");
                            } finally {
                              setIsLeavingGroup(false);
                            }
                          },
                        },
                      ],
                    );
                  }}
                >
                  {isLeavingGroup ? (
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      <ActivityIndicator size="small" />
                      <Text
                        style={{
                          color: "#ff6b6b",
                          fontWeight: "600",
                          textAlign: "center",
                        }}
                      >
                        Leaving...
                      </Text>
                    </View>
                  ) : (
                    <Text
                      style={{
                        color: "#ff6b6b",
                        fontWeight: "600",
                        textAlign: "center",
                      }}
                    >
                      Leave group
                    </Text>
                  )}
                </Pressable>
              )}

              {currentUserRole === "owner" && (
                <Pressable
                  style={{
                    marginTop: 12,
                    opacity: isDeletingGroup ? 0.6 : 1,
                  }}
                  disabled={isDeletingGroup}
                  onPress={() => {
                    if (!user?.uid || !groupId) return;

                    Alert.alert(
                      "Delete group",
                      "Are you sure you want to delete this group? You will keep the group data, but other members will lose access.",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Delete",
                          style: "destructive",
                          onPress: async () => {
                            setIsDeletingGroup(true);

                            try {
                              await groupApi.deleteGroup(groupId, user.uid);

                              router.replace("/profile");
                            } catch (e) {
                              console.log("Could not delete group:", e);
                              Alert.alert("Error", "Could not delete group.");
                            } finally {
                              setIsDeletingGroup(false);
                            }
                          },
                        },
                      ],
                    );
                  }}
                >
                  {isDeletingGroup ? (
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <ActivityIndicator size="small" />

                      <Text
                        style={{
                          color: "#ff6b6b",
                          fontWeight: "700",
                          textAlign: "center",
                        }}
                      >
                        Deleting...
                      </Text>
                    </View>
                  ) : (
                    <Text
                      style={{
                        color: "#ff6b6b",
                        fontWeight: "700",
                        textAlign: "center",
                      }}
                    >
                      Delete group
                    </Text>
                  )}
                </Pressable>
              )}
            </View>

            <View style={cardStyles.card}>
              <Text style={textStyles.sectionTitle}>Members</Text>
              <View style={cardStyles.divider} />

              {members.map((member) => (
                <View key={member.id} style={{ marginBottom: 10 }}>
                  <Text style={textStyles.rowText}>{member.name}</Text>
                  <Text style={textStyles.pageSubtitle}>{member.email}</Text>

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text style={textStyles.dateText}>{member.role}</Text>

                    {currentUserRole === "owner" &&
                      member.userId !== user?.uid && (
                        <Pressable
                          disabled={removingMemberId === member.userId}
                          style={{
                            opacity:
                              removingMemberId === member.userId ? 0.6 : 1,
                          }}
                          onPress={() => {
                            if (!groupId) return;

                            Alert.alert(
                              "Remove member",
                              `Remove ${member.name} from the group?`,
                              [
                                { text: "Cancel", style: "cancel" },
                                {
                                  text: "Remove",
                                  style: "destructive",
                                  onPress: async () => {
                                    setRemovingMemberId(member.userId);

                                    try {
                                      await groupApi.removeMemberFromGroup(
                                        groupId,
                                        member.userId,
                                      );

                                      const updatedMembers =
                                        await groupApi.getGroupMembers(groupId);
                                      setMembers(updatedMembers);
                                    } catch (e) {
                                      console.log(
                                        "Could not remove member:",
                                        e,
                                      );

                                      Alert.alert(
                                        "Error",
                                        "Could not remove member.",
                                      );
                                    } finally {
                                      setRemovingMemberId(null);
                                    }
                                  },
                                },
                              ],
                            );
                          }}
                        >
                          <Text
                            style={{
                              color: "#ff6b6b",
                              fontWeight: "600",
                              fontSize: 11,
                            }}
                          >
                            {removingMemberId === member.userId
                              ? "Removing..."
                              : "Remove"}
                          </Text>
                        </Pressable>
                      )}
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={[cardStyles.card, { marginBottom: 20 }]}>
          <Text style={textStyles.sectionTitle}>Invite member</Text>
          <View style={cardStyles.divider} />

          <Text style={textStyles.pageSubtitle}>
            Invite another registered user by email.
          </Text>

          <TextInput
            style={[inputStyles.input, { marginTop: 10 }]}
            value={inviteEmail}
            onChangeText={setInviteEmail}
            placeholder="Email address"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isSendingInvite}
          />

          <Pressable
            style={[
              buttonStyles.saveButton,
              { opacity: isSendingInvite ? 0.6 : 1 },
            ]}
            disabled={isSendingInvite}
            onPress={async () => {
              if (!groupId || !user?.uid) return;

              const email = inviteEmail.trim().toLowerCase();

              if (!email) {
                Alert.alert("Missing email", "Please enter an email address.");
                return;
              }
              setIsSendingInvite(true);
              try {
                const foundUser = await getUserByEmail(email);

                if (!foundUser) {
                  Alert.alert(
                    "User not found",
                    "No registered user found with this email.",
                  );
                  return;
                }

                // Oppretter invitasjon, men legger ikke brukeren til som medlem ennå
                await groupApi.createGroupInvite(
                  groupId,
                  groupName ?? "Shared Group",
                  foundUser.email,
                  foundUser.id,
                  user.uid,
                );

                setInviteEmail("");
              } catch (e) {
                console.log("Could not send invite:", e);
                Alert.alert("Error", "Could not send invite.");
              } finally {
                setIsSendingInvite(false);
              }
            }}
          >
            {isSendingInvite ? (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <ActivityIndicator size="small" color="#fff" />
                <Text style={buttonStyles.saveButtonText}>Sending...</Text>
              </View>
            ) : (
              <Text style={buttonStyles.saveButtonText}>Send Invite</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
