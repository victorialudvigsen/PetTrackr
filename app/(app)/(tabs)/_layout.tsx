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

      {/* Skjuler pets/addPet fra tab bar */}
      <Tabs.Screen
        name="pets/addPet"
        options={{
          href: null,
        }}
      />

      {/* Skjuler pets/[id] fra tab bar */}
      <Tabs.Screen
        name="pets/[id]"
        options={{
          href: null,
        }}
      />

      {/* Skjuler pets/activity/[id] fra tab bar */}
      <Tabs.Screen
        name="pets/activity/[id]"
        options={{
          href: null,
        }}
      />

      {/* Skjuler pets/activity/log/[id] fra tab bar */}
      <Tabs.Screen
        name="pets/activity/log/[id]"
        options={{
          href: null,
        }}
      />

      {/* Skjuler pets/food/[id] fra tab bar */}
      <Tabs.Screen
        name="pets/food/[id]"
        options={{
          href: null,
        }}
      />

      {/* Skjuler pets/food/log/[id] fra tab bar */}
      <Tabs.Screen
        name="pets/food/log/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
