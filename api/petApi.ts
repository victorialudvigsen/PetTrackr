import { db } from "@/firebaseConfig";
import { PetData } from "@/types/pet";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";

// Lager et nytt dyr for en bruker (users/{uid}/pets)
export async function createPet(userId: string, pet: Omit<PetData, "id">) {
  try {
    const docRef = await addDoc(collection(db, "users", userId, "pets"), pet);
    console.log("Pet created with ID:", docRef.id);
    return docRef.id;
  } catch (e) {
    console.log("Error creating pet", e);
    return null;
  }
}

// Henter alle pets for en bruker
export async function getAllPets(userId: string) {
  try {
    const queryResult = await getDocs(collection(db, "users", userId, "pets"));
    const pets = queryResult.docs.map(
      (d) =>
        ({
          ...d.data(),
          id: d.id,
        }) as PetData,
    );
    console.log("Successfully fetched pets:", pets);
    return pets;
  } catch (e) {
    console.log("Error getting all pets", e);
    return [] as PetData[];
  }
}

// Henter én pet by id
export async function getPetById(userId: string, petId: string) {
  try {
    const petDoc = await getDoc(doc(db, "users", userId, "pets", petId));
    if (!petDoc.exists()) return null;

    return {
      ...petDoc.data(),
      id: petDoc.id,
    } as PetData;
  } catch (e) {
    console.log("Error getting pet by id:", e);
    return null;
  }
}

// Oppdaterer photoUrl etter upload
export async function setPetPhotoUrl(
  userId: string,
  petId: string,
  photoUrl: string,
) {
  try {
    await setDoc(
      doc(db, "users", userId, "pets", petId),
      { photoUrl },
      { merge: true },
    );
    console.log("Pet photoUrl updated:", petId);
  } catch (e) {
    console.log("Error updating pet photoUrl", e);
  }
}

// Oppdaterer pet info
export async function updatePetBasicInfo(
  userId: string,
  petId: string,
  data: {
    name: string;
    type: string;
    weight: string;
    gender: string;
    age: string;
  },
) {
  try {
    await setDoc(doc(db, "users", userId, "pets", petId), data, {
      merge: true,
    });
    console.log("Pet basic info updated:", petId);
  } catch (e) {
    console.log("Error updating pet basic info", e);
    throw e;
  }
}

// Sletter pet
export async function deletePet(userId: string, petId: string) {
  try {
    await deleteDoc(doc(db, "users", userId, "pets", petId));
    console.log("Pet deleted:", petId);
  } catch (e) {
    console.log("Error deleting pet", e);
    throw e;
  }
}

// Oppdaterer progressbar
export async function updatePetGoal(
  userId: string,
  petId: string,
  goal: number,
) {
  try {
    const ref = doc(db, "users", userId, "pets", petId);

    await updateDoc(ref, {
      dailyGoal: goal,
    });
  } catch (e) {
    console.log("Error updating goal:", e);
    throw e;
  }
}
