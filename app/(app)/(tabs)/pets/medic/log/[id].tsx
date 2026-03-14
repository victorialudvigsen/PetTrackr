import * as medicApi from "@/api/medicApi";
import AppHeader from "@/components/AppHeader";
import { useAuthSession } from "@/providers/authctx";
import { buttonStyles } from "@/styles/buttonStyles";
import { inputStyles } from "@/styles/inputStyles";
import { layoutStyles } from "@/styles/layoutStyles";
import { textStyles } from "@/styles/textStyles";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, Switch, Text, TextInput, View } from "react-native";

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

  /* -------- HANDLE SAVE -------- */
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
    <View style={layoutStyles.screen}>
      <AppHeader
        title="Log Medication"
        onBack={() =>
          router.replace({
            pathname: "/pets/medic/[id]",
            params: { id },
          })
        }
      />

      <View style={layoutStyles.content}>
        <Text style={textStyles.rowText}>Medication name</Text>
        <TextInput
          style={inputStyles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Rimadyl"
        />

        <Text style={textStyles.rowText}>Dosage</Text>
        <TextInput
          style={inputStyles.input}
          value={dosage}
          onChangeText={setDosage}
          placeholder="e.g. 1 tablet"
        />

        <Text style={textStyles.rowText}>Note (optional)</Text>
        <TextInput
          style={[inputStyles.input, { height: 90 }]}
          value={note}
          onChangeText={setNote}
          placeholder="Optional notes"
          multiline
        />

        <Text style={textStyles.rowText}>Set reminder</Text>

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
              style={buttonStyles.dateButton}
              onPress={() => setShowPicker(true)}
            >
              <Text style={buttonStyles.dateButtonText}>
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
                    // Lagrer dato
                    setRemindAt(selectedDate);

                    // Åpner time picker
                    setPickerMode("time");
                    setShowPicker(true);
                  } else {
                    // Kombinerer dato + klokkeslett
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
        <Pressable style={buttonStyles.saveButton} onPress={handleSave}>
          <Text style={buttonStyles.saveButtonText}>Save Medication</Text>
        </Pressable>
      </View>
    </View>
  );
}
