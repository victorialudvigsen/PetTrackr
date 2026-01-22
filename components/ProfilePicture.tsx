import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

type Props = {
  imageUri?: string | null; // URL/uri til bilde (kan være null foreløpig)
  size?: number; // størrelse på sirkelen (default 54)
  onPressEdit: () => void; // hva som skjer når du trykker på edit-ikonet
  isLoading?: boolean;
};

export default function ProfilePicture({
  imageUri,
  size = 54,
  onPressEdit,
  isLoading = false,
}: Props) {
  const borderRadius = size / 2;

  return (
    <View style={[styles.wrapper, { width: size, height: size, borderRadius }]}>
      {/* Hvis vi har bilde: vis det, ellers vis grå sirkel */}
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={{ width: size, height: size, borderRadius }}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            { width: size, height: size, borderRadius },
          ]}
        />
      )}

      {/* Loading overlay */}
      {isLoading && (
        <View style={[styles.loadingOverlay, { borderRadius }]}>
          <ActivityIndicator />
        </View>
      )}

      {/* Edit-badge */}
      <Pressable
        onPress={onPressEdit}
        disabled={isLoading}
        style={[
          styles.editBadge,
          isLoading && styles.editBadgeDisabled,
          { borderRadius: 14 },
        ]}
        hitSlop={10}
      >
        <Feather name="edit-2" size={14} color="#111" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
  },
  placeholder: {
    backgroundColor: "#D9D9D9",
  },
  editBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E6E6E6",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  editBadgeDisabled: {
    opacity: 0.6,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
});
