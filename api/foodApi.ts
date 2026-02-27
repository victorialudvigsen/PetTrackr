import { db } from "@/firebaseConfig";
import { FoodEntryData } from "@/types/food";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

// Lager path: users/{uid}/pets/{petId}/food
function foodCollection(userId: string, petId: string) {
  return collection(db, "users", userId, "pets", petId, "food");
}

// 1) Legger til food-entry (grams + createdAt)
export async function addFoodEntry(
  userId: string,
  petId: string,
  grams: number,
) {
  try {
    const ref = await addDoc(foodCollection(userId, petId), {
      grams,
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
      foodCollection(userId, petId),
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
