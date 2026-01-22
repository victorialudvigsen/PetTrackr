import { auth } from "@/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateEmail,
  updatePassword,
  updateProfile,
  User,
} from "firebase/auth";

// Logger inn en bruker med e-post og passord
export async function signIn(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    console.log("Bruker logget inn:", userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.log("Kunne ikke logge inn:", error);
    throw error;
  }
}

// Logger ut bruker
export async function signOut() {
  await auth.signOut();
}

// Oppretter en ny konto i Firebase Authentication
export async function createUser(email: string, password: string) {
  try {
    const userCredentials = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    return userCredentials.user;
  } catch (error) {
    console.error("Kunne ikke opprette bruker:", error);
    return null;
  }
}

// Oppdaterer brukeren sitt displayName i Firebase
export async function setUserDisplayName(user: User, displayName: string) {
  try {
    await updateProfile(user, { displayName });
  } catch (error) {
    console.error("Kunne ikke oppdatere displayName:", error);
  }
}

// Oppdaterer displayName (navn) i Firebase Auth
export async function updateUserDisplayName(user: User, displayName: string) {
  try {
    await updateProfile(user, { displayName });
  } catch (error) {
    console.error("Kunne ikke oppdatere displayName:", error);
    throw error;
  }
}

// Oppdaterer e-post i Firebase Auth
export async function updateUserEmail(user: User, email: string) {
  try {
    await updateEmail(user, email);
  } catch (error) {
    console.error("Kunne ikke oppdatere e-post:", error);
    throw error;
  }
}

// Oppdaterer passord i Firebase Auth
export async function updateUserPassword(user: User, password: string) {
  try {
    await updatePassword(user, password);
  } catch (error) {
    console.error("Kunne ikke oppdatere passord:", error);
    throw error;
  }
}
