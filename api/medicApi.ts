import { getDataOwner } from "@/api/dataOwnerApi";
import { db } from "@/firebaseConfig";
import { MedicEntryData } from "@/types/medic";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

// Path for bruker eller gruppe
async function medsCollection(userId: string, petId: string) {
  // Finner om data ligger i users/{uid} eller groups/{groupId}
  const dataOwner = await getDataOwner(userId);

  return collection(
    db,
    dataOwner.collectionName,
    dataOwner.ownerId,
    "pets",
    petId,
    "meds",
  );
}

// 1) Legger til medic-entry
export async function addMedicEntry(
  userId: string,
  petId: string,
  data: {
    name: string;
    dosage: string;
    note?: string;
    remindAt?: Date | null;
    reminderEnabled?: boolean;
    notificationId?: string | null;
    repeatType?: "once" | "daily";
  },
) {
  try {
    const ref = await addDoc(await medsCollection(userId, petId), {
      name: data.name,
      dosage: data.dosage,
      note: data.note ?? null,
      createdAt: serverTimestamp(),

      // Reminder (lagres bare hvis sendt inn)
      reminderEnabled: data.reminderEnabled ?? false,
      remindAt: data.remindAt ?? null,
      notificationId: data.notificationId ?? null,
      repeatType: data.repeatType ?? "once",
    });

    return ref.id;
  } catch (e) {
    console.log("Error adding medic entry:", e);
    throw e;
  }
}

// 2) Hent med-entries (nyeste først)
export async function getMedicEntries(userId: string, petId: string) {
  try {
    const q = query(
      await medsCollection(userId, petId),
      orderBy("createdAt", "desc"),
    );
    const snap = await getDocs(q);

    const items = snap.docs.map(
      (d) =>
        ({
          id: d.id,
          ...(d.data() as Omit<MedicEntryData, "id">),
        }) as MedicEntryData,
    );

    return items;
  } catch (e) {
    console.log("Error getting medic entries:", e);
    return [] as MedicEntryData[];
  }
}

// 3) Sletter en medic-entry fra bruker eller gruppe
export async function deleteMedicEntry(
  userId: string,
  petId: string,
  entryId: string,
) {
  try {
    // Finner om data ligger i users/{uid} eller groups/{groupId}
    const dataOwner = await getDataOwner(userId);

    await deleteDoc(
      doc(
        db,
        dataOwner.collectionName,
        dataOwner.ownerId,
        "pets",
        petId,
        "meds",
        entryId,
      ),
    );
  } catch (e) {
    console.log("Error deleting medic entry:", e);
    throw e;
  }
}
