import { db } from "@/firebaseConfig";
import { UserData } from "@/types/user";
import {
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

// Lagrer profilbilde
export async function editUserAvatarUrl(userId: string, avatarUrl: string) {
  try {
    await setDoc(doc(db, "users", userId), { avatarUrl }, { merge: true });
    console.log("Avatar URL updated for user:", userId);
  } catch (e) {
    console.log("Error editing user avatarUrl", e);
  }
}

// Lagrer telefonnummer (valgfritt)
export async function editUserPhone(userId: string, phone: string | null) {
  try {
    await setDoc(doc(db, "users", userId), { phone }, { merge: true });
    console.log("Phone updated for user:", userId);
  } catch (e) {
    console.log("Error editing user phone", e);
  }
}

// Finner en bruker basert på e-postadresse
export async function getUserByEmail(email: string) {
  try {
    const q = query(collection(db, "users"), where("email", "==", email));

    const snap = await getDocs(q);

    if (snap.empty) {
      return null;
    }

    const userDoc = snap.docs[0];

    return {
      id: userDoc.id,
      ...(userDoc.data() as UserData),
    };
  } catch (e) {
    console.log("Error finding user by email", e);
    return null;
  }
}
