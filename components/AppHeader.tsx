import { Feather } from "@expo/vector-icons";
import AntDesign from "@expo/vector-icons/AntDesign";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  title: string;
  onBack?: () => void;
  onMenuPress?: () => void;
  showMenu?: boolean;
};

export default function AppHeader({
  title,
  onBack,
  onMenuPress,
  showMenu,
}: Props) {
  const insets = useSafeAreaInsets();

  // Gir litt ekstra luft under status bar (juster tallet om ønskelig)
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
            // Finjustering for optisk alignment mot teksten
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

      {/* RIGHT SLOT MENY */}
      <View style={styles.rightSlot}>
        {showMenu !== false ? (
          <Pressable onPress={onMenuPress} hitSlop={8}>
            <AntDesign name="menu" size={18} color="#111" />
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
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
    marginLeft: 0,
  },

  rightSlot: {
    width: 40,
    alignItems: "flex-end",
    justifyContent: "center",
    marginRight: 12,
  },
});
