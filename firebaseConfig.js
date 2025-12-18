import { ReactNativeAsyncStorage } from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDownloadURL, getStorage, ref } from "firebase/storage";
import firebaseConfig from "./firebaseEnv";

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

export const db = getFirestore(app);

const storage = getStorage(app);

export const getStorageRef = (path) => ref(storage, path);

export const getDownloadUrl = async (path) => {
  const storageRef = getStorageRef(path);
  const downloadUrl = await getDownloadURL(storageRef);
  return downloadUrl;
};
