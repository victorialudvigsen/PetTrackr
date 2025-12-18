// index.tsx
import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Post from "@/components/Post";
import PostFormModal from "@/components/PostFormModal";
import { PostData } from "@/types/post";

import * as postApi from "@/api/postApi";

export default function HomePage() {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function getPostsFromApi() {
    setIsRefreshing(true);
    const posts = await postApi.getAllPosts();
    setPosts(posts);
    setIsRefreshing(false);
  }

  useEffect(() => {
    (async () => {
      await getPostsFromApi();
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Hjem",
        }}
      />

      <Text style={styles.heading}>Hjemmesiden</Text>

      {/* Knapp for å åpne modalen */}
      <Pressable
        style={styles.addButton}
        onPress={() => setIsModalVisible(true)}
      >
        <Text style={styles.addButtonText}>Legg til nytt innlegg</Text>
      </Pressable>

      <View style={styles.listContainer}>
        <FlatList
          data={posts}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={getPostsFromApi}
            />
          }
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={(itemInfo) => <Post postData={itemInfo.item} />}
        />
      </View>

      {/* Modalen */}
      <PostFormModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onAddPost={async (post) => {
          await postApi.createPost(post);
          await getPostsFromApi();
          setIsModalVisible(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  heading: {
    fontSize: 24,
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  addButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  listContainer: {
    flex: 1,
  },
});
