import React, { useRef } from "react";
import { Pressable, StyleSheet } from "react-native";

import type { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";

import Animated, {
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";

import { Feather } from "@expo/vector-icons";

type Props = {
  children: React.ReactNode;
  onDelete: () => void;
};

function RightAction({
  progress,
  onPress,
}: {
  progress: any;
  onPress: () => void;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: interpolate(progress.value, [0, 1], [80, 0]),
        },
      ],
    };
  });

  return (
    <Animated.View style={[styles.deleteContainer, animatedStyle]}>
      <Pressable style={styles.deleteSwipe} onPress={onPress}>
        <Feather name="trash-2" size={18} color="#fff" />
      </Pressable>
    </Animated.View>
  );
}

export default function SwipeDeleteRow({ children, onDelete }: Props) {
  const swipeRef = useRef<SwipeableMethods>(null);

  function closeRow() {
    swipeRef.current?.close();
  }

  return (
    <Swipeable
      ref={swipeRef}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={(progress) => (
        <RightAction
          progress={progress}
          onPress={() => {
            closeRow();
            onDelete();
          }}
        />
      )}
      onSwipeableOpen={(direction) => {
        if (direction === "right") {
          closeRow();
          onDelete();
        }
      }}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  deleteContainer: {
    justifyContent: "center",
    alignItems: "flex-end",
    width: 90,
  },

  deleteSwipe: {
    backgroundColor: "#B00020",
    width: 80,
    height: "85%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    marginRight: 6,
  },
});
