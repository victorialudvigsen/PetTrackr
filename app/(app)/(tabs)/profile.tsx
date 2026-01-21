import ProfilePicture from "@/components/ProfilePicture";
import { useAuthSession } from "@/providers/authctx";
import { pickProfilePicture } from "@/utils/pickProfilePicture";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function ProfilePage() {
  const router = useRouter();
  const { signOut, userNameSession, user } = useAuthSession();

  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);

  // Midlertidig dummy-data for UI (bytter vi senere til ekte data)
  const displayName = userNameSession ?? "Ingen navn";
  const email = user?.email ?? "Ingen e-post";
  const phone = "+4745890940"; // placeholder (som i figma)

  const pets = [
    { id: "1", name: "Lasse", type: "Dog" },
    { id: "2", name: "Scott", type: "Dog" },
  ];

  return (
    <View style={styles.screen}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.replace("/")}
        >
          <Feather name="chevron-left" size={26} color="#111" />
        </Pressable>

        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      {/* CONTENT (SCROLL) */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* TOP CARD */}
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <ProfilePicture
              imageUri={profileImageUri}
              onPressEdit={async () => {
                const uri = await pickProfilePicture();
                if (uri) setProfileImageUri(uri);
              }}
            />

            <View style={styles.profileTextWrap}>
              <Text style={styles.profileName} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={styles.profileEmail} numberOfLines={1}>
                {email}
              </Text>
            </View>
          </View>
        </View>

        {/* USER INFORMATION CARD */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>User Information</Text>

            <Pressable onPress={() => {}}>
              <Text style={styles.editLink}>Edit</Text>
            </Pressable>
          </View>

          <View style={styles.divider} />

          {/* Rows */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Feather name="user" size={18} color="#111" />
            </View>
            <Text style={styles.infoText} numberOfLines={1}>
              {displayName}
            </Text>
          </View>

          <View style={styles.rowDivider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Feather name="mail" size={18} color="#111" />
            </View>
            <Text style={styles.infoText} numberOfLines={1}>
              {email}
            </Text>
          </View>

          <View style={styles.rowDivider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Feather name="phone" size={18} color="#111" />
            </View>
            <Text style={styles.infoText} numberOfLines={1}>
              {phone}
            </Text>
          </View>
        </View>

        {/* MY PETS CARD */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>My Pets</Text>

            <Pressable style={styles.circleIconButton} onPress={() => {}}>
              <Feather name="plus" size={16} color="#111" />
            </Pressable>
          </View>

          <View style={styles.divider} />

          {pets.map((pet, index) => {
            const isLast = index === pets.length - 1;

            return (
              <View key={pet.id}>
                <Pressable style={styles.petRow} onPress={() => {}}>
                  <View style={styles.petLeft}>
                    <View style={styles.petAvatar} />

                    <View style={styles.petTextWrap}>
                      <Text style={styles.petName}>{pet.name}</Text>
                      <Text style={styles.petType}>{pet.type}</Text>
                    </View>
                  </View>

                  <Feather name="chevron-right" size={22} color="#111" />
                </Pressable>

                {!isLast && <View style={styles.petRowDivider} />}
              </View>
            );
          })}
        </View>

        {/* LOG OUT CARD */}
        <View style={styles.card}>
          <Pressable style={styles.logoutButton} onPress={signOut}>
            <Text style={styles.logoutButtonText}>Logg ut</Text>
          </Pressable>
        </View>

        {/* Litt luft nederst så det ikke krasjer i tab bar */}
        <View style={{ height: 18 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F6F2EE",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111",
    marginLeft: 6,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 14,
    paddingBottom: 20,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#D9D9D9",
  },
  profileTextWrap: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  profileEmail: {
    fontSize: 14,
    color: "#444",
  },

  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },
  editLink: {
    fontSize: 14,
    color: "#2B6DEB",
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: "#EDEDED",
    marginBottom: 8,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 10,
  },
  infoIconWrap: {
    width: 26,
    alignItems: "center",
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#111",
  },
  rowDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
  },

  circleIconButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#111",
    backgroundColor: "transparent",
  },

  petRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  petLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    paddingRight: 10, // så teksten ikke krasjer i chevron
  },
  petAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#D9D9D9",
  },
  petTextWrap: {
    flex: 1,
    gap: 2,
  },
  petName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },
  petType: {
    fontSize: 12,
    color: "#666",
  },
  petRowDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
  },

  logoutButton: {
    backgroundColor: "#E53935",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
});
