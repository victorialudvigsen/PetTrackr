import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Entypo name="home" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color }) => (
            <FontAwesome name="user" size={24} color={color} />
          ),
        }}
      />

      {/* Skjul pets/addPet fra tab bar */}
      <Tabs.Screen
        name="pets/addPet"
        options={{
          href: null, // fjerner fra tab bar + deep link i tab context
        }}
      />

      {/* Skjul pets/[id] fra tab bar */}
      <Tabs.Screen
        name="pets/[id]"
        options={{
          href: null,
        }}
      />

      {/* Skjul pets/activity/[id] fra tab bar */}
      <Tabs.Screen
        name="pets/activity/[id]"
        options={{
          href: null,
        }}
      />

      {/* Skjul pets/activity/log/[id] fra tab bar */}
      <Tabs.Screen
        name="pets/activity/log/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
