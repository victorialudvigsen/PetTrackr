import * as Notifications from "expo-notifications";

// Sørger for at notifications vises
Notifications.setNotificationHandler({
  handleNotification: async () => {
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true, // 🔥 NY
      shouldShowList: true, // 🔥 NY
    };
  },
});

// Be om tillatelse
export async function requestNotificationPermission() {
  const { status } = await Notifications.requestPermissionsAsync();

  if (status !== "granted") {
    alert("Permission for notifications not granted!");
    return false;
  }

  return true;
}
