import { getStorageRef } from "@/firebaseConfig";
import { getDownloadURL, uploadBytesResumable } from "firebase/storage";

export async function uploadImageToFirebase(uri: string) {
  const fetchResponse = await fetch(uri);
  const blob = await fetchResponse.blob();

  const imageName = uri.split("/").pop()?.split(".")[0] ?? "AnonymousPicture";
  console.log(imageName);
  const uploadPath = `images/${imageName}`;
  const imageRef = await getStorageRef(uploadPath);

  try {
    console.log("Starting upload");
    await uploadBytesResumable(imageRef, blob);
    console.log("Image uploaded to firebase");
    return uploadPath;
  } catch (e) {
    console.error("Error uploading image to firebase", e);
    return null;
  }
}

export async function uploadProfilePictureToFirebase(
  uri: string,
  userId: string,
): Promise<string | null> {
  const fetchResponse = await fetch(uri);
  const blob = await fetchResponse.blob();

  // Én fil per bruker (overskrives hver gang)
  const uploadPath = `avatars/${userId}.jpg`;
  const imageRef = await getStorageRef(uploadPath);

  try {
    console.log("Starting profile picture upload...");
    await uploadBytesResumable(imageRef, blob);

    // Henter URL som kan brukes i appen
    const downloadUrl = await getDownloadURL(imageRef);

    console.log("Profile picture uploaded. URL:", downloadUrl);
    return downloadUrl;
  } catch (e) {
    console.error("Error uploading profile picture", e);
    return null;
  }
}

// Laster opp bilder til firebase
export async function uploadPetPictureToFirebase(
  uri: string,
  userId: string,
  petId: string,
) {
  const fetchResponse = await fetch(uri);
  const blob = await fetchResponse.blob();

  const uploadPath = `pets/${userId}/${petId}.jpg`;
  const imageRef = await getStorageRef(uploadPath);

  try {
    console.log("Starting pet image upload...");
    await uploadBytesResumable(imageRef, blob);
    console.log("Pet image uploaded to firebase");

    const downloadUrl = await getDownloadURL(imageRef);
    return downloadUrl;
  } catch (e) {
    console.error("Error uploading pet image to firebase", e);
    return null;
  }
}
