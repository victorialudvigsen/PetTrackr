import * as groupApi from "@/api/groupApi";
import { getUserByEmail, getUserProfile } from "@/api/userApi";
import AppHeader from "@/components/AppHeader";
import { useAuthSession } from "@/providers/authctx";
import { buttonStyles } from "@/styles/buttonStyles";
import { cardStyles } from "@/styles/cardStyles";
import { colors } from "@/styles/colors";
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

              <Pressable
                style={{ marginTop: 12 }}
                onPress={async () => {
                  if (!user?.uid || !groupId) return;

                  try {
                    const result = await groupApi.copyUserPetsToGroup(
                      user.uid,
                      groupId,
                    );

                    Alert.alert(
                      "Pets copied",
                      `${result.copiedPets} pet${result.copiedPets !== 1 ? "s" : ""} copied to the group.`,
                    );
                  } catch (e) {
                    console.log("Could not copy pets to group:", e);
                    Alert.alert("Error", "Could not copy pets to group.");
                  }
                }}
              >
                <Text
                  style={{
                    color: colors.button,
                    fontWeight: "600",
                    textAlign: "center",
                  }}
                >
                  Move my pets to group →
                </Text>
              </Pressable>
            </View>

            <View style={cardStyles.card}>
              <Text style={textStyles.sectionTitle}>Members</Text>
              <View style={cardStyles.divider} />

              {members.map((member) => (
                <View key={member.id} style={{ marginBottom: 10 }}>
                  <Text style={textStyles.rowText}>{member.name}</Text>
                  <Text style={textStyles.pageSubtitle}>{member.email}</Text>
                  <Text style={textStyles.dateText}>{member.role}</Text>
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
          />

          <Pressable
            style={buttonStyles.saveButton}
            onPress={async () => {
              if (!groupId || !user?.uid) return;

              const email = inviteEmail.trim().toLowerCase();

              if (!email) {
                Alert.alert("Missing email", "Please enter an email address.");
                return;
              }

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

                Alert.alert(
                  "Invite sent",
                  "The user can now accept the group invite.",
                );

                setInviteEmail("");
              } catch (e) {
                console.log("Could not send invite:", e);
                Alert.alert("Error", "Could not send invite.");
              }
            }}
          >
            <Text style={buttonStyles.saveButtonText}>Send Invite</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
