"use client";
import React, { useState } from "react";
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

interface Comment {
  _id: string;
  content: string;
  author?: {
    _id: string;
    name: string;
    avatar?: string;
    photo?: string;
  };
  user?: {
    _id: string;
    name: string;
    avatar?: string;
    photo?: string;
  };
  createdAt: string;
}

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const user = useSelector(selectuser);
  const currentUserId = user?.uid || "";
  const [isLiked, setIsLiked] = useState(
    post.likes?.some((like) => like.userId === currentUserId) || false
  );
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
  const [sharesCount, setSharesCount] = useState(post.sharesCount || 0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState("");

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const handleLike = async () => {
    try {
      const response = await api.post(
        `/publicspace/${post._id}/like`,
        {},
        { headers: authHeaders(user) }
      );
      setIsLiked(!isLiked);
      setLikesCount(response.data.likesCount);
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const toggleComments = async () => {
    setShowComments((prev) => !prev);
    if (!showComments && comments.length === 0) {
      try {
        const response = await api.get(`/publicspace/${post._id}/comments`);
        setComments(response.data || []);
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    try {
      setLoading(true);
      const response = await api.post(
        `/publicspace/${post._id}/comment`,
        { content: commentText.trim() },
        { headers: authHeaders(user) }
      );
      const newComment = response.data;
      if (newComment.author) {
        setComments([...comments, newComment]);
      } else if (newComment.user) {
        setComments([...comments, newComment]);
      } else {
        setComments([
          ...comments,
          {
            ...newComment,
            author: { _id: currentUserId, name: user?.name || "You" },
          },
        ]);
      }
      setCommentsCount((c) => c + 1);
      setCommentText("");
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const response = await api.post(
        `/publicspace/${post._id}/share`,
        {},
        { headers: authHeaders(user) }
      );
      setSharesCount(response.data.sharesCount);
    } catch (error) {
      console.error("Error sharing post:", error);
    }
  };

  const author = post.author || {};

  const isImageUrl = (url: string) => {
    const ext = url.split("?")[0].toLowerCase();
    return (
      ext.endsWith(".jpg") ||
      ext.endsWith(".jpeg") ||
      ext.endsWith(".png") ||
      ext.endsWith(".gif") ||
      ext.endsWith(".webp") ||
      ext.endsWith(".bmp") ||
      ext.endsWith(".svg")
    );
  };

  return (
    <article className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      {/* Post Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            {author.avatar || author.photo ? (
              <img
                src={author.avatar || author.photo}
                alt={author.name || "user"}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                {(author.name || "U").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {author.name || "Unknown User"}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(post.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
          {post.content}
        </p>
        {post.media && post.media.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
            {post.media.map((mediaUrl, index) => (
              <div key={index} className="flex-shrink-0">
                {isImageUrl(mediaUrl) ? (
                  <img
                    src={mediaUrl}
                    alt={`Media ${index + 1}`}
                    className="h-48 rounded-lg object-cover"
                  />
                ) : (
                  <video
                    src={mediaUrl}
                    className="h-48 rounded-lg object-cover"
                    controls
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post Stats */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-2 px-3 py-1 rounded-lg transition-colors ${
              isLiked
                ? "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            <svg
              className="w-5 h-5"
              fill={isLiked ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 10h4.764a2 2 0 011.789 2.902l-7.846 7.896a2 2 0 01-2.894 0l-7.846-7.896a2 2 0 011.789-2.902H10a2 2 0 002-2V10a2 2 0 00-2-2H6a2 2 0 00-2 2v4a2 2 0 002 2h4a2 2 0 002-2v-4a2 2 0 00-2-2H5"
              />
            </svg>
            <span className="text-sm font-medium">{likesCount}</span>
          </button>

          <button
            onClick={toggleComments}
            className="flex items-center space-x-2 px-3 py-1 rounded-lg text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h8m-6 4h.01M12 16h.01M16 12h.01M8 8h.01M12 4h.01M16 4h.01"
              />
            </svg>
            <span className="text-sm font-medium">{commentsCount}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center space-x-2 px-3 py-1 rounded-lg text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.688 13.34 8.693 13.337 8.696 13.334c3.26-1.285 6.581-2.579 9.515-3.878 1.231-.579 2.349-1.313 3.403-2.134L19 14.5l-2.974 2.974A8 8 0 016.336 15.34l-.548-1.005a8.003 8.003 0 01-.590-6.947l3.634-3.634"
              />
            </svg>
            <span className="text-sm font-medium">{sharesCount}</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Comments ({commentsCount})
          </h4>

          {/* Add Comment Input */}
          <div className="mb-3">
            <textarea
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              rows={2}
              disabled={loading}
            />
            <button
              onClick={handleAddComment}
              className="mt-2 px-4 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              disabled={loading || !commentText.trim()}
            >
              {loading ? "Posting..." : "Post Comment"}
            </button>
          </div>

          {/* Comments List */}
          <div className="space-y-3">
            {comments.length === 0 && (
              <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                No comments yet. Be the first to comment!
              </div>
            )}
            {comments.map((comment) => (
              <div
                key={comment._id}
                className="flex items-start space-x-2 bg-gray-50 dark:bg-gray-700 rounded-lg p-3"
              >
                <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                  {(
                    (comment.author?.name || comment.user?.name || "U")
                  ).charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {comment.author?.name || comment.user?.name || "Unknown User"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
