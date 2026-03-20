import * as medicApi from "@/api/medicApi";
import AppHeader from "@/components/AppHeader";
import { useAuthSession } from "@/providers/authctx";
import { buttonStyles } from "@/styles/buttonStyles";
import { inputStyles } from "@/styles/inputStyles";
import { layoutStyles } from "@/styles/layoutStyles";
import { textStyles } from "@/styles/textStyles";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Notifications from "expo-notifications";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
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
  const [repeatType, setRepeatType] = useState<"once" | "daily">("once");

  // Ber om tilgang til notifications
  useEffect(() => {
    async function requestPermission() {
      const { status } = await Notifications.requestPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Permission needed", "Please allow notifications");
      }
    }

    requestPermission();
  }, []);

  /* -------- HANDLE SAVE -------- */
  async function handleSave() {
    if (!user?.uid || !id) return;

    if (!name.trim() || !dosage.trim()) {
      Alert.alert("Missing information", "Please add name and dosage.");
      return;
    }

    // Lager notification først
    let notificationId: string | null = null;

    if (reminderEnabled && remindAt) {
      notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Medication Reminder 💊",
          body: `${name} – ${dosage}`,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: remindAt,
        },
      });
    }

    // Lagrer i Firebase
    await medicApi.addMedicEntry(user.uid, id, {
      name: name.trim(),
      dosage: dosage.trim(),
      note: note.trim() || undefined,
      reminderEnabled,
      remindAt: reminderEnabled ? remindAt : null,
      notificationId,
      repeatType,
    });

    // reset
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
    <KeyboardAvoidingView
      style={layoutStyles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <AppHeader
        title="Log Medication"
        onBack={() =>
          router.replace({
            pathname: "/pets/medic/[id]",
            params: { id },
          })
        }
      />

      <ScrollView
        contentContainerStyle={[layoutStyles.content, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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
            {/* DATE & TIME */}
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

            {/* REPEAT */}
            <Text style={[textStyles.rowText, { marginTop: 12 }]}>Repeat</Text>

            <Pressable
              style={buttonStyles.dateButton}
              onPress={() =>
                setRepeatType((prev) => (prev === "once" ? "daily" : "once"))
              }
            >
              <Text style={buttonStyles.dateButtonText}>
                {repeatType === "once" ? "Once" : "Daily"}
              </Text>
            </Pressable>

            {/* DATE PICKER */}
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
                    setRemindAt(selectedDate);
                    setPickerMode("time");
                    setShowPicker(true);
                  } else {
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
