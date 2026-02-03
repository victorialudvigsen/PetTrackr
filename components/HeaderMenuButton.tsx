import { useAuthSession } from "@/providers/authctx";
import AntDesign from "@expo/vector-icons/AntDesign";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  // valgfritt: hvis du vil ha callbacks på menyvalg senere
  onOpenChange?: (open: boolean) => void;
};

export default function HeaderMenuButton({ onOpenChange }: Props) {
  const { signOut } = useAuthSession();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const screenWidth = Dimensions.get("window").width;
  const drawerWidth = Math.min(320, Math.round(screenWidth * 0.82));

  // Animated value: 0 = skjult, 1 = synlig
  const progress = useRef(new Animated.Value(0)).current;

  const translateX = useMemo(() => {
    // Når progress=0 -> +drawerWidth (utenfor skjerm)
    // Når progress=1 -> 0 (på skjerm)
    return progress.interpolate({
      inputRange: [0, 1],
      outputRange: [drawerWidth, 0],
    });
  }, [progress, drawerWidth]);

  const openMenu = () => {
    setOpen(true);
    onOpenChange?.(true);
  };

  const closeMenu = () => {
    // Lukk med animasjon først, så fjern modal
    Animated.timing(progress, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setOpen(false);
      onOpenChange?.(false);
    });
  };

  // Når open blir true -> spill inn animasjon
  useEffect(() => {
    if (!open) return;

    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [open, progress]);

  return (
    <>
      {/* Selve knappen i header (hamburger-ikon) */}
      <Pressable
        onPress={openMenu}
        style={({ pressed }) => [
          styles.iconButton,
          { opacity: pressed ? 0.6 : 1 },
        ]}
        hitSlop={10}
      >
        <AntDesign name="menu" size={18} color="#111" />
      </Pressable>

      {/* “Drop-in” meny */}
      <Modal visible={open} transparent animationType="none">
        <View style={styles.modalRoot}>
          {/* Mørk overlay (trykk for å lukke) */}
          <Pressable style={styles.backdrop} onPress={closeMenu} />

          {/* Drawer */}
          <Animated.View
            style={[
              styles.drawer,
              {
                width: drawerWidth,
                paddingTop: Math.max(insets.top, 16),
                transform: [{ translateX }],
              },
            ]}
          >
            {/* Header inne i menyen */}
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Menu</Text>

              <Pressable
                onPress={closeMenu}
                style={({ pressed }) => [
                  styles.closeButton,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <AntDesign name="close" size={18} color="#111" />
              </Pressable>
            </View>

            <View style={styles.divider} />

            {/* Menypunkter (UI placeholder) */}
            <Pressable style={styles.menuItem} onPress={() => {}}>
              <Text style={styles.menuItemText}>Settings (coming soon)</Text>
            </Pressable>

            <View style={styles.itemDivider} />

            <Pressable style={styles.menuItem} onPress={() => {}}>
              <Text style={styles.menuItemText}>Help (coming soon)</Text>
            </Pressable>

            <View style={styles.itemDivider} />

            <Pressable style={styles.menuItem} onPress={() => {}}>
              <Text style={styles.menuItemText}>About (coming soon)</Text>
            </Pressable>

            <View style={styles.itemDivider} />

            <Pressable
              style={styles.signOutButton}
              onPress={() => {
                closeMenu();
                signOut();
              }}
            >
              <Text style={styles.signOutText}>Sign out</Text>
            </Pressable>

            {/* Litt luft nederst */}
            <View style={{ height: Math.max(insets.bottom, 16) }} />
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  modalRoot: {
    flex: 1,
    flexDirection: "row",
  },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  drawer: {
    height: "100%",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: -6, height: 0 },
    elevation: 6,
    paddingHorizontal: 16,
  },

  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
  },

  drawerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F0EC",
  },

  divider: {
    height: 1,
    backgroundColor: "#EDEDED",
    marginBottom: 10,
  },

  menuItem: {
    paddingVertical: 14,
  },

  menuItemText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },

  itemDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
  },
  signOutButton: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#E53935",
  },

  signOutText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});
