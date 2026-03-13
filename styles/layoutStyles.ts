import { StyleSheet } from "react-native";
import { colors } from "./colors";

export const layoutStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 16,
  },
  titleWrap: {
    marginTop: 8,
  },
});
