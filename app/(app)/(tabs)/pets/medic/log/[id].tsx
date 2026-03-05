import * as medicApi from "@/api/medicApi";
import AppHeader from "@/components/AppHeader";
import { useAuthSession } from "@/providers/authctx";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

export default function LogMedicPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthSession();

  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [note, setNote] = useState("");

  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [remindAt, setRemindAt] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<"date" | "time">("date");

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
      reminderEnabled,
      remindAt: reminderEnabled ? remindAt : null,
    });

    setName("");
    setDosage("");
    setNote("");
    setReminderEnabled(false);

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

        <Text style={styles.label}>Set reminder</Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ fontSize: 14 }}>Enable reminder</Text>
          <Switch
            value={reminderEnabled}
            onValueChange={(value) => {
              setReminderEnabled(value);
              if (!value) setRemindAt(null);
            }}
          />
        </View>

        {reminderEnabled ? (
          <>
            <Pressable
              style={styles.dateButton}
              onPress={() => setShowPicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {remindAt
                  ? remindAt.toLocaleDateString() +
                    " • " +
                    remindAt.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Select date & time"}
              </Text>
            </Pressable>

            {showPicker && (
              <DateTimePicker
                value={remindAt ?? new Date()}
                mode={pickerMode}
                display="default"
                onChange={(event, selectedDate) => {
                  if (event.type === "dismissed") {
                    setShowPicker(false);
                    return;
                  }

                  if (!selectedDate) return;

                  if (pickerMode === "date") {
                    // Lagre dato
                    setRemindAt(selectedDate);

                    // Åpne time picker
                    setPickerMode("time");
                    setShowPicker(true);
                  } else {
                    // Kombiner dato + klokkeslett
                    const current = remindAt ?? new Date();
                    const combined = new Date(current);

                    combined.setHours(selectedDate.getHours());
                    combined.setMinutes(selectedDate.getMinutes());

                    setRemindAt(combined);

                    setShowPicker(false);
                    setPickerMode("date");
                  }
                }}
              />
            )}
          </>
        ) : null}
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
  dateButton: {
    marginTop: 8,
    backgroundColor: "#F3F0EC",
    padding: 12,
    borderRadius: 12,
  },

  dateButtonText: {
    fontSize: 14,
    color: "#111",
  },
});
