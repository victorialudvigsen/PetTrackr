import HeaderMenuButton from "@/components/HeaderMenuButton";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  title: string;
  onBack?: () => void;
};

export default function AppHeader({ title, onBack }: Props) {
  const insets = useSafeAreaInsets();

  // Litt luft under status bar
  const paddingTop = Math.max(insets.top, 40);

  return (
    <View style={[styles.header, { paddingTop }]}>
      {/* BACK */}
      <Pressable style={styles.backButton} onPress={onBack} hitSlop={8}>
        <Feather
          name="chevron-left"
          size={22}
          color="#111"
          style={{
            marginTop: Platform.select({
              ios: 2,
              android: 4,
            }),
          }}
        />
      </Pressable>

      {/* TITLE */}
      <Text style={styles.headerTitle} numberOfLines={1}>
        {title}
      </Text>

      {/* MENU (hamburger + drawer) */}
      <View style={styles.rightSlot}>
        <HeaderMenuButton />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "#F6F2EE",
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
    marginLeft: 4,
  },

  rightSlot: {
    width: 40,
    alignItems: "flex-end",
    justifyContent: "center",
  },
});
