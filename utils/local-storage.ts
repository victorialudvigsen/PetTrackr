// utils/local-storage.ts
import { PostData } from "@/types/post";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "MY_POSTS";

// Lagrer innlegg
export async function savePosts(posts: PostData[]) {
  try {
    const jsonValue = JSON.stringify(posts);
    await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
  } catch (error) {
    console.log("Feil ved lagring av posts:", error);
  }
}

// Henter innlegg
export async function loadPosts(): Promise<PostData[]> {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.log("Feil ved henting av posts:", error);
    return [];
  }
}

// Sletter innlegg
export async function clearPosts() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.log("Feil ved sletting:", error);
  }
}

export async function getPostByLocalId(id: string) {
  try {
    const posts = await loadPosts();
    return posts.find((p) => p.id === id);
  } catch (e) {
    console.log("Feil med getPostByLocalId():", e);
    return undefined;
  }
}
