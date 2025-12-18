import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Button, Text, TouchableOpacity, View } from "react-native";

type SelectImageModalProps = {
  closeModal: VoidFunction;
  setImage: (image: string) => void;
};

export default function SelectImageModal({
  closeModal,
  setImage,
}: SelectImageModalProps) {
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    return <View></View>;
  }

  if (!permission.granted) {
    return (
      <View>
        <Text>We need permission to use the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  async function pickImage() {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      aspect: [4, 3],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      closeModal();
    }
  }

  return (
    <View>
      <CameraView facing="back" />
      <View>
        <TouchableOpacity onPress={() => closeModal()}>
          <Text>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => pickImage()}>
          <Text>Pick Image</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
