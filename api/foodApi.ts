import { getDataOwner } from "@/api/dataOwnerApi";
import { db } from "@/firebaseConfig";
import { FoodEntryData } from "@/types/food";
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

async function foodCollection(userId: string, petId: string) {
  // Finner om data ligger i users/{uid} eller groups/{groupId}
  const dataOwner = await getDataOwner(userId);

  return collection(
    db,
    dataOwner.collectionName,
    dataOwner.ownerId,
    "pets",
    petId,
    "food",
  );
}

// 1) Legger til food-entry (grams + createdAt)
export async function addFoodEntry(
  userId: string,
  petId: string,
  data: {
    type: "meal" | "treat" | "bone";
    grams?: number;
    count?: number;
    note?: string;
  },
) {
  try {
    const ref = await addDoc(await foodCollection(userId, petId), {
      type: data.type,
      grams: data.grams ?? null,
      count: data.count ?? null,
      note: data.note ?? null,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  } catch (e) {
    console.log("Error adding food entry:", e);
    throw e;
  }
}

// 2) Henter alle food-entries (nyeste først)
export async function getFoodEntries(userId: string, petId: string) {
  try {
    const q = query(
      await foodCollection(userId, petId),
      orderBy("createdAt", "desc"),
    );
    const snap = await getDocs(q);

    const items = snap.docs.map(
      (d) =>
        ({
          id: d.id,
          ...(d.data() as Omit<FoodEntryData, "id">),
        }) as FoodEntryData,
    );

    return items;
  } catch (e) {
    console.log("Error getting food entries:", e);
    return [] as FoodEntryData[];
  }
}

// 3) Sletter en food-entry fra bruker eller gruppe
export async function deleteFoodEntry(
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
        "food",
        entryId,
      ),
    );
  } catch (e) {
    console.log("Error deleting food entry:", e);
    throw e;
  }
}
