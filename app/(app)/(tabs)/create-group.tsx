import * as groupApi from "@/api/groupApi";
import AppHeader from "@/components/AppHeader";
import { useAuthSession } from "@/providers/authctx";
import { buttonStyles } from "@/styles/buttonStyles";
import { inputStyles } from "@/styles/inputStyles";
import { layoutStyles } from "@/styles/layoutStyles";
import { textStyles } from "@/styles/textStyles";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

export default function CreateGroupPage() {
  const router = useRouter();

  const [groupName, setGroupName] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const { user, userNameSession } = useAuthSession();

  return (
    <View style={layoutStyles.screen}>
      <AppHeader
        title="Create Group"
        onBack={() => router.replace("/profile")}
      />

      <View style={layoutStyles.content}>
        <Text style={textStyles.pageTitle}>Create Group</Text>

        <Text style={textStyles.pageSubtitle}>
          Create a shared group for pets, medication, food and activity.
        </Text>

        <Text style={[textStyles.rowText, { marginTop: 20 }]}>Group name</Text>

        <TextInput
          style={inputStyles.input}
          value={groupName}
          onChangeText={setGroupName}
          placeholder="e.g. Lasse & Scott"
          editable={!isCreatingGroup}
        />

        <Pressable
          style={[
            buttonStyles.saveButton,
            { opacity: isCreatingGroup ? 0.6 : 1 },
          ]}
          disabled={isCreatingGroup}
          onPress={async () => {
            if (!user?.uid || !user.email) return;

            if (!groupName.trim()) {
              Alert.alert("Missing group name", "Please enter a group name.");
              return;
            }

            setIsCreatingGroup(true);

            try {
              // Oppretter gruppen og får tilbake groupId
              const newGroupId = await groupApi.createGroup(
                user.uid,
                user.email,
                userNameSession ?? user.email,
                groupName.trim(),
              );

              // Kopierer eksisterende pets/data inn i gruppen automatisk
              await groupApi.copyUserPetsToGroup(user.uid, newGroupId);

              setGroupName("");
              router.replace("/profile");
            } catch (e) {
              console.log("Could not create group:", e);
              Alert.alert("Error", "Could not create group.");
            } finally {
              setIsCreatingGroup(false);
            }
          }}
        >
          {isCreatingGroup ? (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <ActivityIndicator size="small" color="#fff" />
              <Text style={buttonStyles.saveButtonText}>Creating...</Text>
            </View>
          ) : (
            <Text style={buttonStyles.saveButtonText}>Create Group</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
