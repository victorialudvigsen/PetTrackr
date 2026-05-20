import { db } from "@/firebaseConfig";
import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

/* 
  Lager en ny gruppe.
  Foreløpig:
  - oppretter gruppen
  - legger inn eier som medlem
  - lagrer groupId på brukeren
*/
export async function createGroup(
  userId: string,
  userEmail: string,
  userName: string,
  groupName: string,
) {
  try {
    // 1. Lager gruppen
    const groupRef = await addDoc(collection(db, "groups"), {
      name: groupName,
      ownerId: userId,
      createdAt: serverTimestamp(),
    });

    const groupId = groupRef.id;

    // 2. Legger inn brukeren som medlem av gruppen
    await setDoc(doc(db, "groups", groupId, "members", userId), {
      userId,
      email: userEmail,
      name: userName,
      role: "owner",
      joinedAt: serverTimestamp(),
    });

    // 3. Lagrer groupId på brukeren
    await updateDoc(doc(db, "users", userId), {
      groupId,
    });

    return groupId;
  } catch (e) {
    console.log("Error creating group:", e);
    throw e;
  }
}

/* Henter én gruppe basert på groupId */
export async function getGroupById(groupId: string) {
  try {
    const groupDoc = await getDoc(doc(db, "groups", groupId));

    if (!groupDoc.exists()) {
      return null;
    }

    return {
      id: groupDoc.id,
      ...(groupDoc.data() as {
        name: string;
        ownerId: string;
        createdAt?: any;
      }),
    };
  } catch (e) {
    console.log("Error getting group:", e);
    return null;
  }
}

/* Henter alle medlemmer i en gruppe */
export async function getGroupMembers(groupId: string) {
  try {
    const snap = await getDocs(collection(db, "groups", groupId, "members"));

    const members = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as {
        userId: string;
        email: string;
        name: string;
        role: "owner" | "member";
        joinedAt?: any;
      }),
    }));

    return members;
  } catch (e) {
    console.log("Error getting group members:", e);
    return [];
  }
}

// Legger til en registrert bruker som medlem i gruppen
export async function addMemberToGroup(
  groupId: string,
  userId: string,
  userEmail: string,
  userName: string,
) {
  try {
    // Legger brukeren inn i gruppens members-subcollection
    await setDoc(doc(db, "groups", groupId, "members", userId), {
      userId,
      email: userEmail,
      name: userName,
      role: "member",
      joinedAt: serverTimestamp(),
    });

    // Lagrer groupId på brukerprofilen, slik at brukeren vet hvilken gruppe den tilhører
    await updateDoc(doc(db, "users", userId), {
      groupId,
    });
  } catch (e) {
    console.log("Error adding member to group:", e);
    throw e;
  }
}

// Oppretter en invitasjon til en gruppe
// Brukeren må godta invitasjonen senere.
export async function createGroupInvite(
  groupId: string,
  groupName: string,
  invitedEmail: string,
  invitedUserId: string,
  invitedByUserId: string,
) {
  try {
    const inviteRef = await addDoc(collection(db, "groupInvites"), {
      groupId,
      groupName,
      invitedEmail,
      invitedUserId,
      invitedByUserId,
      status: "pending",
      createdAt: serverTimestamp(),
    });

    return inviteRef.id;
  } catch (e) {
    console.log("Error creating group invite:", e);
    throw e;
  }
}

// Henter pending gruppeinvitasjoner for en bruker
export async function getPendingInvitesForUser(userId: string) {
  try {
    const q = query(
      collection(db, "groupInvites"),
      where("invitedUserId", "==", userId),
      where("status", "==", "pending"),
    );

    const snap = await getDocs(q);

    const invites = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as {
        groupId: string;
        groupName: string;
        invitedEmail: string;
        invitedUserId: string;
        invitedByUserId: string;
        status: "pending" | "accepted" | "declined";
        createdAt?: any;
      }),
    }));

    return invites;
  } catch (e) {
    console.log("Error getting pending invites:", e);
    return [];
  }
}

// Godtar en gruppeinvitasjon
export async function acceptGroupInvite(
  inviteId: string,
  groupId: string,
  userId: string,
  userEmail: string,
  userName: string,
) {
  try {
    // Legger brukeren til som medlem
    await addMemberToGroup(groupId, userId, userEmail, userName);

    // Oppdaterer invitasjonen til accepted
    await updateDoc(doc(db, "groupInvites", inviteId), {
      status: "accepted",
    });
  } catch (e) {
    console.log("Error accepting group invite:", e);
    throw e;
  }
}

// Avslår en gruppeinvitasjon
export async function declineGroupInvite(inviteId: string) {
  try {
    await updateDoc(doc(db, "groupInvites", inviteId), {
      status: "declined",
    });
  } catch (e) {
    console.log("Error declining group invite:", e);
    throw e;
  }
}

// Kopierer brukerens eksisterende pets og underdata til gruppen
// Viktig: Dette SLETTER IKKE gammel data fra users/{uid}
export async function copyUserPetsToGroup(userId: string, groupId: string) {
  try {
    const petsSnap = await getDocs(collection(db, "users", userId, "pets"));

    if (petsSnap.empty) {
      return { copiedPets: 0 };
    }

    const batch = writeBatch(db);

    for (const petDoc of petsSnap.docs) {
      const petId = petDoc.id;
      const petData = petDoc.data();

      // Kopierer selve pet-dokumentet
      const groupPetRef = doc(db, "groups", groupId, "pets", petId);
      batch.set(groupPetRef, petData);

      // Kopierer food
      const foodSnap = await getDocs(
        collection(db, "users", userId, "pets", petId, "food"),
      );

      foodSnap.forEach((foodDoc) => {
        const ref = doc(
          db,
          "groups",
          groupId,
          "pets",
          petId,
          "food",
          foodDoc.id,
        );

        batch.set(ref, foodDoc.data());
      });

      // Kopierer walks
      const walksSnap = await getDocs(
        collection(db, "users", userId, "pets", petId, "walks"),
      );

      walksSnap.forEach((walkDoc) => {
        const ref = doc(
          db,
          "groups",
          groupId,
          "pets",
          petId,
          "walks",
          walkDoc.id,
        );

        batch.set(ref, walkDoc.data());
      });

      // Kopierer meds
      const medsSnap = await getDocs(
        collection(db, "users", userId, "pets", petId, "meds"),
      );

      medsSnap.forEach((medDoc) => {
        const ref = doc(
          db,
          "groups",
          groupId,
          "pets",
          petId,
          "meds",
          medDoc.id,
        );

        batch.set(ref, medDoc.data());
      });
    }

    await batch.commit();

    return { copiedPets: petsSnap.size };
  } catch (e) {
    console.log("Error copying pets to group:", e);
    throw e;
  }
}

// Lar en bruker forlate en gruppe
// Dette sletter bare brukerens medlemskap og groupId på brukeren.
// Selve gruppen og gruppedata blir værende.
export async function leaveGroup(groupId: string, userId: string) {
  try {
    // Fjerner brukeren fra members-listen i gruppen
    await deleteDoc(doc(db, "groups", groupId, "members", userId));

    // Fjerner groupId fra brukerprofilen
    await updateDoc(doc(db, "users", userId), {
      groupId: deleteField(),
    });
  } catch (e) {
    console.log("Error leaving group:", e);
    throw e;
  }
}

// Fjerner et medlem fra en gruppe
// Brukes av owner for å fjerne andre medlemmer.
// Sletter medlemskapet og fjerner groupId fra brukerprofilen.
export async function removeMemberFromGroup(
  groupId: string,
  memberUserId: string,
) {
  try {
    // Fjerner medlemmet fra gruppens members-liste
    await deleteDoc(doc(db, "groups", groupId, "members", memberUserId));

    // Fjerner groupId fra brukerprofilen
    await updateDoc(doc(db, "users", memberUserId), {
      groupId: deleteField(),
    });
  } catch (e) {
    console.log("Error removing member from group:", e);
    throw e;
  }
}

// Kopierer gruppens pets og underdata tilbake til owner sin private brukerdata
// Brukes før owner sletter en gruppe, slik at owner beholder dataen.
export async function copyGroupPetsToOwner(groupId: string, ownerId: string) {
  try {
    const groupPetsSnap = await getDocs(
      collection(db, "groups", groupId, "pets"),
    );

    if (groupPetsSnap.empty) {
      return { copiedPets: 0 };
    }

    const batch = writeBatch(db);

    for (const petDoc of groupPetsSnap.docs) {
      const petId = petDoc.id;
      const petData = petDoc.data();

      // Kopierer pet-dokumentet tilbake til users/{ownerId}/pets/{petId}
      const ownerPetRef = doc(db, "users", ownerId, "pets", petId);
      batch.set(ownerPetRef, petData);

      // Kopierer food
      const foodSnap = await getDocs(
        collection(db, "groups", groupId, "pets", petId, "food"),
      );

      foodSnap.forEach((foodDoc) => {
        batch.set(
          doc(db, "users", ownerId, "pets", petId, "food", foodDoc.id),
          foodDoc.data(),
        );
      });

      // Kopierer walks
      const walksSnap = await getDocs(
        collection(db, "groups", groupId, "pets", petId, "walks"),
      );

      walksSnap.forEach((walkDoc) => {
        batch.set(
          doc(db, "users", ownerId, "pets", petId, "walks", walkDoc.id),
          walkDoc.data(),
        );
      });

      // Kopierer meds
      const medsSnap = await getDocs(
        collection(db, "groups", groupId, "pets", petId, "meds"),
      );

      medsSnap.forEach((medDoc) => {
        batch.set(
          doc(db, "users", ownerId, "pets", petId, "meds", medDoc.id),
          medDoc.data(),
        );
      });
    }

    await batch.commit();

    return { copiedPets: groupPetsSnap.size };
  } catch (e) {
    console.log("Error copying group pets to owner:", e);
    throw e;
  }
}

// Sletter en gruppe.
// Viktig:
// - Owner får først gruppedata kopiert tilbake til sin private users/{ownerId}/pets
// - Alle medlemmer mister groupId
// - Gruppen slettes til slutt
export async function deleteGroup(groupId: string, ownerId: string) {
  try {
    // 1. Kopierer gruppedata tilbake til owner
    await copyGroupPetsToOwner(groupId, ownerId);

    // 2. Henter alle medlemmer
    const membersSnap = await getDocs(
      collection(db, "groups", groupId, "members"),
    );

    const batch = writeBatch(db);

    membersSnap.forEach((memberDoc) => {
      const memberId = memberDoc.id;

      // Fjerner groupId fra hver bruker
      batch.update(doc(db, "users", memberId), {
        groupId: deleteField(),
      });

      // Sletter medlemmet fra gruppen
      batch.delete(doc(db, "groups", groupId, "members", memberId));
    });

    // 3. Sletter selve group-dokumentet
    batch.delete(doc(db, "groups", groupId));

    await batch.commit();
  } catch (e) {
    console.log("Error deleting group:", e);
    throw e;
  }
}
