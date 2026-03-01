import { Timestamp } from "firebase/firestore";

export type MedicEntryData = {
  id: string;

  name: string;
  dosage: string;
  note?: string;

  createdAt?: Timestamp | null;

  scheduledFor?: Timestamp | null;
};
