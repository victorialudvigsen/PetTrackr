import { colors } from "@/styles/colors";
import { inputStyles } from "@/styles/inputStyles";
import { textStyles } from "@/styles/textStyles";
import React, { useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (value: number) => void;
};

export default function GoalModal({ visible, onClose, onSave }: Props) {
  const [value, setValue] = useState("");

  return (
    <Modal visible={visible} transparent animationType="fade">
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
          <Text style={textStyles.sectionTitle}>Set daily goal</Text>

          <TextInput
            style={[inputStyles.input, { marginTop: 10 }]}
            placeholder="e.g. 120"
            keyboardType="numeric"
            value={value}
            onChangeText={setValue}
          />

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 15,
            }}
          >
            <Pressable onPress={onClose}>
              <Text style={{ color: colors.textSecondary }}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                const num = Number(value);
                if (!num || num <= 0) return;

                onSave(num);
                setValue("");
                onClose();
              }}
            >
              <Text style={{ color: colors.button, fontWeight: "600" }}>
                Save
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
