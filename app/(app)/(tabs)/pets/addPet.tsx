import { uploadPetPictureToFirebase } from "@/api/imageApi";
import * as petApi from "@/api/petApi";
import { useAuthSession } from "@/providers/authctx";
import { buttonStyles } from "@/styles/buttonStyles";
import { cardStyles } from "@/styles/cardStyles";
import { inputStyles } from "@/styles/inputStyles";
import { layoutStyles } from "@/styles/layoutStyles";
import { textStyles } from "@/styles/textStyles";
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
    <View style={[layoutStyles.screen, { padding: 16 }]}>
      {/* HEADER */}
      <View style={layoutStyles.header}>
        <Pressable
          style={buttonStyles.backButton}
          onPress={() => router.replace("/profile")}
        >
          <Feather name="chevron-left" size={26} color="#111" />
        </Pressable>

        <Text style={[textStyles.pageTitle, { fontSize: 22 }]}>Add Pet</Text>

        <View style={{ width: 40 }} />
      </View>

      {/* CONTENT */}
      <View style={[cardStyles.card, { gap: 10 }]}>
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
            <Text style={textStyles.sectionTitle}>Pet photo</Text>
            <Text style={textStyles.dateTextLarge}>
              {petImageUri ? "Tap to change" : "Tap to add"}
            </Text>
          </View>

          <Feather name="chevron-right" size={20} color="#111" />
        </Pressable>

        <View style={cardStyles.divider} />

        <Text style={textStyles.label}>Name</Text>
        <TextInput
          style={[inputStyles.input, { fontSize: 14 }]}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Lasse"
          editable={!isSaving}
        />

        <Text style={textStyles.label}>Type</Text>
        <TextInput
          style={[inputStyles.input, { fontSize: 14 }]}
          value={type}
          onChangeText={setType}
          placeholder="e.g. Dog"
          editable={!isSaving}
        />

        <Pressable
          style={[buttonStyles.saveButton, { opacity: isSaving ? 0.7 : 1 }]}
          onPress={onSave}
          disabled={isSaving}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {isSaving && <ActivityIndicator size="small" />}
            <Text style={buttonStyles.saveButtonText}>
              {isSaving ? "Saving..." : "Save pet"}
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
