import React from 'react';

interface EmptyStateProps {
  onCreatePost?: () => void;
}

export default function EmptyState({ onCreatePost }: EmptyStateProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
      <div className="max-w-md mx-auto">
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg 
            className="w-10 h-10 text-gray-400 dark:text-gray-500" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 11a7 7 0 109-7 7 7 0 00-9-7zM12 9v8m-3-4h6" 
            />
          </svg>
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No posts yet
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Be the first to share your thoughts, experiences, or insights with the community!
        </p>
        
        {onCreatePost && (
          <button
            onClick={onCreatePost}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Create Your First Post
          </button>
        )}
      </div>
    </div>
  );
}