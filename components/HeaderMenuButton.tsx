import { useAuthSession } from "@/providers/authctx";
import AntDesign from "@expo/vector-icons/AntDesign";
import { BlurView } from "expo-blur";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  onOpenChange?: (open: boolean) => void;
};

export default function HeaderMenuButton({ onOpenChange }: Props) {
  const { signOut } = useAuthSession();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const screenWidth = Dimensions.get("window").width;
  const drawerWidth = Math.min(320, Math.round(screenWidth * 0.82));

  const progress = useRef(new Animated.Value(0)).current;

  const translateX = useMemo(() => {
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
    Animated.timing(progress, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setOpen(false);
      onOpenChange?.(false);
    });
  };

  useEffect(() => {
    if (!open) return;

    progress.setValue(0);

    Animated.spring(progress, {
      toValue: 1,
      friction: 8,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [open, progress]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },

      onPanResponderMove: (_, gestureState) => {
        const newProgress = 1 - gestureState.dx / drawerWidth;
        progress.setValue(Math.min(Math.max(newProgress, 0), 1));
      },

      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 80) {
          closeMenu();
        } else {
          Animated.spring(progress, {
            toValue: 1,
            friction: 8,
            tension: 80,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  return (
    <>
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

      <Modal
        visible={open}
        transparent
        animationType="none"
        statusBarTranslucent
      >
        <View style={styles.modalRoot}>
          {/* BACKDROP */}
          <View style={{ flex: 1 }}>
            {/* BLUR */}
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                {
                  opacity: progress,
                },
              ]}
            >
              <BlurView
                intensity={70}
                tint="dark"
                experimentalBlurMethod="dimezisBlurView"
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>

            {/* DIM */}
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: "rgba(238,238,238,0.15)",
                  opacity: progress,
                },
              ]}
            />

            <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu} />
          </View>

          {/* DRAWER */}
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.drawer,
              {
                width: drawerWidth,
                paddingTop: Math.max(insets.top, 16),
                transform: [{ translateX }],
              },
            ]}
          >
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

            <Pressable style={styles.menuItem}>
              <Text style={styles.menuItemText}>Settings (coming soon)</Text>
            </Pressable>

            <View style={styles.itemDivider} />

            <Pressable style={styles.menuItem}>
              <Text style={styles.menuItemText}>Help (coming soon)</Text>
            </Pressable>

            <View style={styles.itemDivider} />

            <Pressable style={styles.menuItem}>
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
    backgroundColor: "#F0F0F0",
  },

  signOutText: {
    color: "#111",
    fontWeight: "700",
    fontSize: 14,
  },
});
