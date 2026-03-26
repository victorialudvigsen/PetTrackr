import { Timestamp } from "firebase/firestore";

export type WalkType = "quick" | "long" | "exercise" | "night";

export type WalkData = {
  id: string;
  duration: number;
  note?: string | null;
  type: WalkType | null;
  mood?: "happy" | "calm" | "energetic" | "tired" | null;
  createdAt?: Timestamp | null;
};
