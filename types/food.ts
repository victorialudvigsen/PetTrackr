import { Timestamp } from "firebase/firestore";

export type FoodEntryData = {
  id: string;
  grams: number;
  createdAt?: Timestamp | null;
};
