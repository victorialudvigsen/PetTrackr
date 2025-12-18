import { db } from "@/firebaseConfig";
import { PostData } from "@/types/post";
import { UserData } from "@/types/user";
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

// Oppretter en ny brukerprofil i databasen for gitt userId
export async function createUserProfile(userId: string, user: UserData) {
  try {
    await setDoc(doc(db, "users", userId), user);
    console.log("Document written with ID: ", userId);
  } catch (e) {
    console.log("Error creating user profile", e);
  }
}

// Henter en spesifikk brukerprofil basert på userId
export async function getUserProfile(userId: string) {
  try {
    const querySnapshot = await getDoc(doc(db, "users", userId));
    if (!querySnapshot.exists()) {
      console.log("No such document!");
      return null;
    }
    const user = querySnapshot.data() as UserData;
    console.log("Successfully fetched user: ", user);
    return user;
  } catch (e) {
    console.log("Error getting user profile", e);
    return null;
  }
}

// Oppdaterer bio-feltene til brukeren
export async function editUserBio(userId: string, bio: string) {
  try {
    await updateDoc(doc(db, "users", userId), {
      bio: bio,
    });
    console.log("Document updated with ID: ", userId);
  } catch (e) {
    console.log("Error editing user bio", e);
  }
}

// Henter flere brukere basert på en liste med userId-er
export async function getUsersByIds(userIds: string[]) {
  const users: UserData[] = [];

  for (const id of userIds) {
    const user = await getUserProfile(id);
    if (user) {
      users.push(user);
    }
  }

  return users;
}

// Legger et nytt innlegg til i brukerens favorittliste
export async function addFavorite(userId: string, postId: string) {
  const ref = doc(db, "users", userId);

  return await updateDoc(ref, {
    favorites: arrayUnion(postId),
  });
}

// Fjerner et innlegg fra brukerens favorittliste
export async function removeFavorite(userId: string, postId: string) {
  const ref = doc(db, "users", userId);

  return await updateDoc(ref, {
    favorites: arrayRemove(postId),
  });
}

export async function getFavoritePosts(userId: string) {
  const userSnap = await getDoc(doc(db, "users", userId));

  const data = userSnap.data() as UserData;
  const ids = data.favorites ?? [];

  if (ids.length === 0) return [];

  const postsRef = collection(db, "posts");
  const q = query(postsRef, where("__name__", "in", ids));

  const snap = await getDocs(q);

  return snap.docs.map((doc) => ({
    ...(doc.data() as PostData),
    id: doc.id,
  }));
}
