import { Timestamp } from "firebase/firestore";

export type MedicEntryData = {
  id: string;

  name: string;
  dosage: string;
  note?: string;

  createdAt?: Timestamp | null;

  remindAt?: Timestamp | null;
  reminderEnabled?: boolean;

  notificationId?: string | null;
};
