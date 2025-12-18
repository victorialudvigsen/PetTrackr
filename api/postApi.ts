import { db } from "@/firebaseConfig";
import { PostData } from "@/types/post";
import { addDoc, collection, doc, getDoc, getDocs } from "firebase/firestore";

export async function createPost(post: PostData) {
  try {
    const docRef = await addDoc(collection(db, "posts"), post);
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.log("Error creating post", e);
  }
}

export async function getAllPosts() {
  try {
    const queryResult = await getDocs(collection(db, "posts"));
    const posts = queryResult.docs.map(
      (doc) =>
        ({
          ...doc.data(),
          id: doc.id,
        } as PostData)
    );
    console.log("Successfully fetched posts: ", posts);
    return posts;
  } catch (e) {
    console.log("Error getting all posts", e);
    return [] as PostData[];
  }
}

export async function getPostById(id: string) {
  try {
    const specificPost = await getDoc(doc(db, "posts", id));
    return {
      ...specificPost.data(),
      id: specificPost.id,
    } as PostData;
  } catch (e) {
    console.log("Error getting document by id: ", e);
    return null;
  }
}
