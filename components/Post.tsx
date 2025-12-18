import { PostData } from "@/types/post";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

export type PostProps = {
  postData: PostData;
};

export default function Post({ postData }: PostProps) {
  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/post-details/[id]",
          params: { id: postData.id },
        })
      }
    >
      <View>
        <Text>{postData.title}</Text>
        <View>
          <Text>{postData.description}</Text>
        </View>
      </View>
    </Pressable>
  );
}
