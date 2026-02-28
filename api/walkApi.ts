import { db } from "@/firebaseConfig";
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

// Lager path: users/{uid}/pets/{petId}/walks
function walkCollection(userId: string, petId: string) {
  return collection(db, "users", userId, "pets", petId, "walks");
}

// 1) Legger til walk (duration + createdAt)
export async function addWalk(userId: string, petId: string, duration: number) {
  try {
    const ref = await addDoc(walkCollection(userId, petId), {
      duration,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  } catch (e) {
    console.log("Error adding walk:", e);
    throw e;
  }
}

// 2) Henter walks (nyeste først)
export async function getWalks(userId: string, petId: string) {
  try {
    const q = query(
      walkCollection(userId, petId),
      orderBy("createdAt", "desc"),
    );

    const snap = await getDocs(q);

    return snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
  } catch (e) {
    console.log("Error getting walks:", e);
    return [];
  }
}

// 3) Sletter en walk
export async function deleteWalk(
  userId: string,
  petId: string,
  walkId: string,
) {
  try {
    await deleteDoc(doc(db, "users", userId, "pets", petId, "walks", walkId));
  } catch (e) {
    console.log("Error deleting walk:", e);
    throw e;
  }
}
