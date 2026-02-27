// postformmodal.tsx
import { PostData } from "@/types/post";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type PostFormModalProps = {
  visible: boolean; // om modalen er synlig
  onClose: () => void; // lukker modalen (fra parent)
  onAddPost: (post: PostData) => void; // legger til nytt innlegg (i parent)
};

export default function PostFormModal({
  visible,
  onClose,
  onAddPost,
}: PostFormModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSave = () => {
    if (title.trim().length === 0 || description.trim().length === 0) {
      return;
    }

    const newPost: PostData = {
      id: Date.now().toString(), // enkel unik id
      title: title,
      description: description,
    };

    // sender ferdig post opp til parent
    onAddPost(newPost);

    // tømmer feltene til neste gang
    setTitle("");
    setDescription("");
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Nytt innlegg</Text>

          <Text style={styles.label}>Tittel</Text>
          <TextInput
            style={styles.input}
            placeholder="Skriv tittel her..."
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Beskrivelse</Text>
          <TextInput
            style={[styles.input, styles.descriptionInput]}
            placeholder="Skriv beskrivelse her..."
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <View style={styles.buttonRow}>
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Avbryt</Text>
            </Pressable>

            <Pressable
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Lagre innlegg</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  label: {
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: "top",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
    gap: 8,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: "#eee",
  },
  saveButton: {
    backgroundColor: "#007AFF",
  },
  cancelButtonText: {
    color: "#333",
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});
