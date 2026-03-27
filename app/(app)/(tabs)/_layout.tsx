import { colors } from "@/styles/colors";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function TabsLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.button,
          tabBarInactiveTintColor: colors.textSecondary,
        }}
      >
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
            title: "Profile",
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

        {/* Skjuler pets/medic/[id] fra tab bar */}
        <Tabs.Screen
          name="pets/medic/[id]"
          options={{
            href: null,
          }}
        />

        {/* Skjuler pets/medic/log/[id] fra tab bar */}
        <Tabs.Screen
          name="pets/medic/log/[id]"
          options={{
            href: null,
          }}
        />

        {/* Skjuler reminders/index fra tab bar */}
        <Tabs.Screen
          name="reminders/index"
          options={{
            href: null,
          }}
        />

        {/* Skjuler pets/activity/history/[id] fra tab bar */}
        <Tabs.Screen
          name="pets/activity/history/[id]"
          options={{
            href: null,
          }}
        />

        {/* Skjuler pets/activity/stats/[id] fra tab bar */}
        <Tabs.Screen
          name="pets/activity/stats/[id]"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </GestureHandlerRootView>
  );
}
