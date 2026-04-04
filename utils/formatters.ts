import { WalkData } from "@/types/walk";

/* -------- ACTIVITY -------- */
export function formatWalkType(type?: string | null) {
  switch (type) {
    case "quick":
      return "Quick walk ⚡";
    case "long":
      return "Long walk 🗺️";
    case "exercise":
      return "Exercise 🏃";
    case "night":
      return "Night walk 🌙";
    default:
      return null;
  }
}

export function formatMood(mood?: string | null) {
  switch (mood) {
    case "happy":
      return "😊 Happy";
    case "calm":
      return "😌 Calm";
    case "energetic":
      return "⚡ Energetic";
    case "tired":
      return "😴 Tired";
    default:
      return null;
  }
}

export function formatWalkSummary(walk: WalkData) {
  const parts: string[] = [];

  // Duration
  parts.push(`${walk.duration} min`);

  // Type
  const type = formatWalkType(walk.type);
  if (type) parts.push(type);

  // Mood
  const mood = formatMood(walk.mood);
  if (mood) parts.push(mood);

  return parts.join(" • ");
}

/* -------- FOOD -------- */
export function formatFoodSummary(entry: { grams: number }) {
  return `${entry.grams} g`;
}
