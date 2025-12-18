import { getStorageRef } from "@/firebaseConfig";
import { uploadBytesResumable } from "firebase/storage";

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
