import { getDataOwner } from "@/api/dataOwnerApi";
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

// Lager et nytt dyr for bruker eller gruppe
export async function createPet(userId: string, pet: Omit<PetData, "id">) {
  try {
    // Finner om data skal lagres i users/{uid} eller groups/{groupId}
    const dataOwner = await getDataOwner(userId);

    const docRef = await addDoc(
      collection(db, dataOwner.collectionName, dataOwner.ownerId, "pets"),
      pet,
    );

    console.log("Pet created with ID:", docRef.id);
    return docRef.id;
  } catch (e) {
    console.log("Error creating pet", e);
    return null;
  }
}

// Henter alle pets for en bruker eller gruppe
export async function getAllPets(userId: string) {
  try {
    // Finner om data skal hentes fra users/{uid} eller groups/{groupId}
    const dataOwner = await getDataOwner(userId);

    const queryResult = await getDocs(
      collection(db, dataOwner.collectionName, dataOwner.ownerId, "pets"),
    );

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

// Henter én pet by id fra bruker eller gruppe
export async function getPetById(userId: string, petId: string) {
  try {
    // Finner om data skal hentes fra users/{uid} eller groups/{groupId}
    const dataOwner = await getDataOwner(userId);

    const petDoc = await getDoc(
      doc(db, dataOwner.collectionName, dataOwner.ownerId, "pets", petId),
    );

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

// Oppdaterer photoUrl etter upload for bruker eller gruppe
export async function setPetPhotoUrl(
  userId: string,
  petId: string,
  photoUrl: string,
) {
  try {
    // Finner om data ligger i users/{uid} eller groups/{groupId}
    const dataOwner = await getDataOwner(userId);

    await setDoc(
      doc(db, dataOwner.collectionName, dataOwner.ownerId, "pets", petId),
      { photoUrl },
      { merge: true },
    );

    console.log("Pet photoUrl updated:", petId);
  } catch (e) {
    console.log("Error updating pet photoUrl", e);
  }
}

// Oppdaterer pet info for bruker eller gruppe
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
    // Finner om data ligger i users/{uid} eller groups/{groupId}
    const dataOwner = await getDataOwner(userId);

    await setDoc(
      doc(db, dataOwner.collectionName, dataOwner.ownerId, "pets", petId),
      data,
      { merge: true },
    );

    console.log("Pet basic info updated:", petId);
  } catch (e) {
    console.log("Error updating pet basic info", e);
    throw e;
  }
}

// Sletter pet fra bruker eller gruppe
export async function deletePet(userId: string, petId: string) {
  try {
    // Finner om data ligger i users/{uid} eller groups/{groupId}
    const dataOwner = await getDataOwner(userId);

    await deleteDoc(
      doc(db, dataOwner.collectionName, dataOwner.ownerId, "pets", petId),
    );

    console.log("Pet deleted:", petId);
  } catch (e) {
    console.log("Error deleting pet", e);
    throw e;
  }
}

// Oppdaterer progressbar for bruker eller gruppe
export async function updatePetGoal(
  userId: string,
  petId: string,
  goal: number,
  type?: "meal" | "treat" | "bone",
) {
  try {
    // Finner om data ligger i users/{uid} eller groups/{groupId}
    const dataOwner = await getDataOwner(userId);

    const ref = doc(
      db,
      dataOwner.collectionName,
      dataOwner.ownerId,
      "pets",
      petId,
    );

    let field = "dailyGoal"; // default: activity + meal

    if (type === "treat") {
      field = "treatGoal";
    } else if (type === "bone") {
      field = "boneGoal";
    }

    await updateDoc(ref, {
      [field]: goal,
    });
  } catch (e) {
    console.log("Error updating goal:", e);
    throw e;
  }
}
