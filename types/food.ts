import { Timestamp } from "firebase/firestore";

export type FoodEntryData = {
  id: string;

  type: "meal" | "treat" | "bone";

  grams?: number;
  count?: number;

  note?: string | null;

  createdAt?: Timestamp | null;
};
