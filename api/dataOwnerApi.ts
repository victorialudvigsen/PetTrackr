import { getUserProfile } from "@/api/userApi";

/*
  Finner hvor app-data skal hentes fra.

  Hvis brukeren er i en gruppe:
  - data ligger under groups/{groupId}

  Hvis brukeren ikke er i gruppe:
  - data ligger fortsatt under users/{userId}
*/
export async function getDataOwner(userId: string) {
  const profile = await getUserProfile(userId);

  if (profile?.groupId) {
    return {
      collectionName: "groups",
      ownerId: profile.groupId,
      isGroup: true,
    };
  }

  return {
    collectionName: "users",
    ownerId: userId,
    isGroup: false,
  };
}
