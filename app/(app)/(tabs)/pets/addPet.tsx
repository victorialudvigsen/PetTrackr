import { uploadPetPictureToFirebase } from "@/api/imageApi";
import * as petApi from "@/api/petApi";
import { useAuthSession } from "@/providers/authctx";
import { buttonStyles } from "@/styles/buttonStyles";
import { cardStyles } from "@/styles/cardStyles";
import { colors } from "@/styles/colors";
import { inputStyles } from "@/styles/inputStyles";
import { layoutStyles } from "@/styles/layoutStyles";
import { textStyles } from "@/styles/textStyles";
import { pickProfilePicture } from "@/utils/pickProfilePicture";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
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
  const [weight, setWeight] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      // RESET FELTER hver gang siden åpnes
      setName("");
      setType("");
      setWeight("");
      setGender("");
      setAge("");
      setPetImageUri(null);
    }, []),
  );

  const onSave = async () => {
    if (!user?.uid) return;

    const cleanName = name.trim();
    const cleanType = type.trim();
    const cleanWeight = weight.trim();
    const cleanGender = gender.trim();
    const cleanAge = age.trim();

    if (!cleanName || !cleanType || !cleanWeight || !cleanGender || !cleanAge) {
      Alert.alert(
        "Missing information",
        "Please complete all required fields before saving.",
      );
      return;
    }

    setIsSaving(true);

    try {
      // Lager pet i Firestore
      const newPetId = await petApi.createPet(user.uid, {
        name: cleanName,
        type: cleanType,
        weight: cleanWeight,
        gender: cleanGender,
        age: cleanAge,
      });

      if (!newPetId) {
        Alert.alert("Error", "Unable to save the animal. Please try again");
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
      Alert.alert("Error", "Something went wrong. Please try again.");
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
          <Feather name="chevron-left" size={26} color={colors.button} />
        </Pressable>

        <Text
          style={[
            textStyles.pageTitle,
            { fontSize: 22 },
            { color: colors.button },
          ]}
        >
          Add Pet
        </Text>

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
                <Feather name="image" size={18} color={colors.textSecondary} />
              </View>
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={textStyles.sectionTitle}>Pet photo</Text>
            <Text style={textStyles.dateTextLarge}>
              {petImageUri ? "Tap to change" : "Tap to add"}
            </Text>
          </View>

          <Feather name="chevron-right" size={20} color={colors.button} />
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

        <Text style={textStyles.label}>Weight</Text>
        <TextInput
          style={[inputStyles.input, { fontSize: 14 }]}
          value={weight}
          onChangeText={setWeight}
          placeholder="e.g. 5 kg"
          editable={!isSaving}
        />

        <Text style={textStyles.label}>Gender</Text>
        <TextInput
          style={[inputStyles.input, { fontSize: 14 }]}
          value={gender}
          onChangeText={setGender}
          placeholder="e.g. Male"
          editable={!isSaving}
        />

        <Text style={textStyles.label}>Age</Text>
        <TextInput
          style={[inputStyles.input, { fontSize: 14 }]}
          value={age}
          onChangeText={setAge}
          placeholder="e.g. 3"
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
