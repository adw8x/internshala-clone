"use client";
import React, { useState, useEffect } from "react";
import CreatePostCard from "@/Components/CreatePostCard";
import PostCard from "@/Components/PostCard";
import SkeletonPostCard from "@/Components/SkeletonPostCard";
import EmptyState from "@/Components/EmptyState";
import ErrorState from "@/Components/ErrorState";
import api, { authHeaders } from "@/lib/api";
import { useSelector } from "react-redux";
import { selectuser } from "@/Feature/Userslice";

interface Post {
  _id: string;
  content: string;
  media?: string[];
  author: {
    _id: string;
    name: string;
    avatar?: string;
    photo?: string;
  };
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  likes?: { userId: string }[];
}

export default function PublicSpacePage() {
  const user = useSelector(selectuser);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await api.get("/publicspace");

      if (!response.data) {
        throw new Error("No data received");
      }

      setPosts(response.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch posts");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (content: string, media?: string) => {
    if (!user?.uid) {
      throw new Error("Please login to post");
    }
    try {
      const newPost = {
        content,
        media: media ? [media] : [],
      };

      const response = await api.post("/publicspace", newPost, {
        headers: authHeaders(user),
      });
      setPosts((prev) => [response.data, ...prev]);
    } catch (err) {
      console.error("Error creating post:", err);
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-4xl mx-auto px-4 py-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Public Space
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Share and discover public posts from the community
          </p>
        </header>

        <div data-create-post-card>
          {user?.uid ? (
            <CreatePostCard onCreatePost={handleCreatePost} />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Login to share your thoughts, experiences, or insights with the
                community.
              </p>
              <button
                onClick={() =>
                  (window.location.href = "/")
                }
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Login to Post
              </button>
            </div>
          )}
        </div>

        {loading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <SkeletonPostCard key={i} />
            ))}
          </div>
        )}

        {!loading && error && (
          <ErrorState message={error} onRetry={fetchPosts} />
        )}

        {!loading && !error && posts.length === 0 && (
          <EmptyState
            onCreatePost={() => {
              const postCard = document.querySelector("[data-create-post-card]");
              postCard?.scrollIntoView({ behavior: "smooth" });
            }}
          />
        )}

        {!loading && !error && posts.length > 0 && (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
