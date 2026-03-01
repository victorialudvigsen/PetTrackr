import AppHeader from "@/components/AppHeader";
import { useAuthSession } from "@/providers/authctx";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import * as medicApi from "@/api/medicApi";

export default function LogMedicPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthSession();

  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [note, setNote] = useState("");

  async function handleSave() {
    if (!user?.uid || !id) return;

    if (!name.trim() || !dosage.trim()) {
      Alert.alert("Missing information", "Please add name and dosage.");
      return;
    }

    await medicApi.addMedicEntry(user.uid, id, {
      name: name.trim(),
      dosage: dosage.trim(),
      note: note.trim() || undefined,
    });

    router.replace({
      pathname: "/pets/medic/[id]",
      params: { id },
    });
  }

  return (
    <View style={styles.screen}>
      <AppHeader
        title="Log Medication"
        onBack={() =>
          router.replace({
            pathname: "/pets/medic/[id]",
            params: { id },
          })
        }
      />

      <View style={styles.content}>
        <Text style={styles.label}>Medication name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Rimadyl"
        />

        <Text style={styles.label}>Dosage</Text>
        <TextInput
          style={styles.input}
          value={dosage}
          onChangeText={setDosage}
          placeholder="e.g. 1 tablet"
        />

        <Text style={styles.label}>Note (optional)</Text>
        <TextInput
          style={[styles.input, { height: 90 }]}
          value={note}
          onChangeText={setNote}
          placeholder="Optional notes"
          multiline
        />

        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Medication</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F6F2EE",
  },
  content: {
    padding: 16,
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E6E6E6",
  },
  saveButton: {
    backgroundColor: "#2B6DEB",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
});
