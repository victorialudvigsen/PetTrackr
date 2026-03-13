import { StyleSheet } from "react-native";
import { colors } from "./colors";

export const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,

    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },

    elevation: 3,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 10,
  },
});
