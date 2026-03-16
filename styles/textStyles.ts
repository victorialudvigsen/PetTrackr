import { StyleSheet } from "react-native";
import { colors } from "./colors";

export const textStyles = StyleSheet.create({
  pageTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  pageSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  logSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    paddingVertical: 12,
  },
  rowText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  dateText: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dateTextLarge: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  noteText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  switchText: {
    color: colors.button,
    textDecorationLine: "underline",
    fontSize: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  deleteText: {
    fontSize: 14,
    color: colors.delete,
    fontWeight: "700",
  },
  cancelText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "600",
  },
});
