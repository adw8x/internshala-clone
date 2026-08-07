"use client";
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { selectuser } from "@/Feature/Userslice";
import api, { authHeaders } from "@/lib/api";

interface CreatePostCardProps {
  onCreatePost?: (content: string, media?: string) => Promise<void>;
}

interface PostModal {
  title: string;
  message: string;
}

const draftKey = (uid: string) => `postDraft_${uid}`;

export default function CreatePostCard({ onCreatePost }: CreatePostCardProps) {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [modal, setModal] = useState<PostModal | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const user = useSelector(selectuser);

  const uid = user?.uid || null;
  const prevUid = useRef<string | null>(null);

  useEffect(() => {
    if (prevUid.current && !uid) {
      if (content.trim()) {
        try {
          localStorage.setItem(
            draftKey(prevUid.current),
            JSON.stringify({ content })
          );
        } catch (e) {
          console.error("Failed to save draft:", e);
        }
      }
      setContent("");
      removeMedia();
    }
    if (!prevUid.current && uid) {
      try {
        const saved = localStorage.getItem(draftKey(uid));
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.content) {
            setContent(parsed.content);
          }
          localStorage.removeItem(draftKey(uid));
        }
      } catch (e) {
        console.error("Failed to restore draft:", e);
      }
    }
    prevUid.current = uid;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const removeMedia = () => {
    setMediaFile(null);
    setPreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !mediaFile) return;

    setIsLoading(true);

    try {
      let mediaUrl = "";
      if (mediaFile) {
        const formData = new FormData();
        formData.append("media", mediaFile);
        const uploadRes = await api.post("/publicspace/upload", formData, {
          headers: {
            ...authHeaders(user),
            "Content-Type": "multipart/form-data",
          },
        });
        mediaUrl = uploadRes.data.url;
      }

      if (onCreatePost) {
        await onCreatePost(content.trim(), mediaUrl || undefined);
      }
      setContent("");
      removeMedia();
    } catch (error: any) {
      console.error("Error creating post:", error);
      const status = error?.response?.status;
      const backendMessage = error?.response?.data?.error;

      if (error?.message === "Please login to post") {
        setModal({
          title: "Login Required",
          message: "Please login to your account to post in Public Space.",
        });
      } else if (status === 403) {
        setModal({
          title: "You can't post yet",
          message:
            backendMessage ||
            "You need at least 1 friend to post in Public Space. Add friends to unlock posting!",
        });
      } else if (status === 429) {
        setModal({
          title: "Daily Posting Limit Reached",
          message:
            backendMessage ||
            "You have reached your daily posting limit. Come back tomorrow!",
        });
      } else {
        setModal({
          title: "Something went wrong",
          message:
            backendMessage || "Failed to create post. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isVideo = mediaFile?.type.startsWith("video/");

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden dark:bg-gray-700">
            {user?.photo ? (
              <img
                src={user.photo}
                alt={user.name || "user"}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <svg
                className="w-5 h-5 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 8a7 7 0 1114-14 7 7 0 01-14 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Create Post
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind? Share your internship experience, job insights, or career advice..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
            rows={3}
          />

          {preview && (
            <div className="relative">
              {isVideo ? (
                <video
                  src={preview}
                  className="h-48 rounded-lg object-cover"
                  controls
                />
              ) : (
                <img
                  src={preview}
                  alt="Media preview"
                  className="h-48 rounded-lg object-cover"
                />
              )}
              <button
                type="button"
                onClick={removeMedia}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                aria-label="Remove media"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
              disabled={isLoading}
              onClick={() => fileInputRef.current?.click()}
            >
              <svg
                className="w-5 h-5 inline mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 013.828 0L16 16m-2-2l1.293-1.293a1 1 0 011.414 0l3.586 3.586M6 20h10a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm">
                {mediaFile ? "Change media" : "Add Photo / Video"}
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="submit"
              disabled={isLoading || (!content.trim() && !mediaFile)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Posting..." : "Post"}
            </button>
          </div>
        </form>
      </div>

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg
                className="w-7 h-7 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {modal.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {modal.message}
            </p>
            <button
              onClick={() => setModal(null)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
