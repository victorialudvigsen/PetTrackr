import { uploadPetPictureToFirebase } from "@/api/imageApi";
import * as petApi from "@/api/petApi";
import { useAuthSession } from "@/providers/authctx";
import { pickProfilePicture } from "@/utils/pickProfilePicture";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function AddPetPage() {
  const router = useRouter();
  const { user } = useAuthSession();

  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [petImageUri, setPetImageUri] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  const onSave = async () => {
    if (!user?.uid) return;

    const cleanName = name.trim();
    const cleanType = type.trim();

    if (!cleanName || !cleanType) {
      Alert.alert("Mangler info", "Fyll inn navn og type før du lagrer.");
      return;
    }

    setIsSaving(true);

    try {
      // Lager pet i Firestore
      const newPetId = await petApi.createPet(user.uid, {
        name: cleanName,
        type: cleanType,
      });

      if (!newPetId) {
        Alert.alert("Feil", "Kunne ikke lagre dyret. Prøv igjen.");
        return;
      }

      // Hvis vi har bilde -> upload til Storage + lagre photoUrl på pet
      if (petImageUri) {
        const downloadUrl = await uploadPetPictureToFirebase(
          petImageUri,
          user.uid,
          newPetId,
        );

        if (downloadUrl) {
          await petApi.setPetPhotoUrl(user.uid, newPetId, downloadUrl);
        }
      }

      Alert.alert("Success", "Pet added!");
      router.replace("/profile");
    } catch (e) {
      console.log("Create pet failed:", e);
      Alert.alert("Feil", "Noe gikk galt. Prøv igjen.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.replace("/profile")}
        >
          <Feather name="chevron-left" size={26} color="#111" />
        </Pressable>

        <Text style={styles.headerTitle}>Add Pet</Text>

        <View style={{ width: 40 }} />
      </View>

      {/* CONTENT */}
      <View style={styles.card}>
        {/* PHOTO PICKER */}
        <Pressable
          style={styles.photoRow}
          onPress={async () => {
            const uri = await pickProfilePicture();
            if (!uri) return;
            setPetImageUri(uri);
          }}
          disabled={isSaving}
        >
          <View style={styles.photoPreview}>
            {petImageUri ? (
              <Image source={{ uri: petImageUri }} style={styles.photoImg} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Feather name="image" size={18} color="#666" />
              </View>
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.photoTitle}>Pet photo</Text>
            <Text style={styles.photoSubtitle}>
              {petImageUri ? "Tap to change" : "Tap to add"}
            </Text>
          </View>

          <Feather name="chevron-right" size={20} color="#111" />
        </Pressable>

        <View style={styles.divider} />

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Lasse"
          editable={!isSaving}
        />

        <Text style={styles.label}>Type</Text>
        <TextInput
          style={styles.input}
          value={type}
          onChangeText={setType}
          placeholder="e.g. Dog"
          editable={!isSaving}
        />

        <Pressable
          style={[styles.saveButton, { opacity: isSaving ? 0.7 : 1 }]}
          onPress={onSave}
          disabled={isSaving}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {isSaving && <ActivityIndicator size="small" />}
            <Text style={styles.saveButtonText}>
              {isSaving ? "Saving..." : "Save pet"}
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F6F2EE",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 18,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: "700",
    color: "#111",
    textAlign: "center",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    gap: 10,
  },

  photoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
  },
  photoPreview: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#EFEFEF",
  },
  photoImg: {
    width: "100%",
    height: "100%",
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  photoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },
  photoSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },

  divider: {
    height: 1,
    backgroundColor: "#EDEDED",
    marginVertical: 6,
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111",
    marginTop: 4,
  },
  input: {
    fontSize: 14,
    color: "#111",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#E6E6E6",
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  saveButton: {
    marginTop: 10,
    backgroundColor: "#2B6DEB",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
});
