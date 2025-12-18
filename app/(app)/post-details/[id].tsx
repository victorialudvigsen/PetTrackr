import * as postApi from "@/api/postApi";
import { PostData } from "@/types/post";
import { getPostByLocalId } from "@/utils/local-storage";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

export default function PostDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [post, setPost] = useState<PostData | null>(null);

  async function fetchPostFromLocal(inputId: string) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const postLocal = await getPostByLocalId(inputId);
    if (postLocal) {
      setPost(postLocal);
    }
  }

  async function fetchPostFromApi(inputId: string) {
    const post = await postApi.getPostById(inputId);
    setPost(post);
  }

  useEffect(() => {
    fetchPostFromApi(id);
  }, [id]);

  if (post === null) {
    return (
      <View>
        <Text>LASTER</Text>
      </View>
    );
  }

  return (
    <View>
      <Text>
        {post.title}, {post.description}
      </Text>
    </View>
  );
}
