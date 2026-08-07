export default function SkeletonPostCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
      {/* Skeleton Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
          </div>
        </div>
      </div>

      {/* Skeleton Content */}
      <div className="space-y-3 mb-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
      </div>

      {/* Skeleton Stats */}
      <div className="flex items-center space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8" />
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-10" />
        </div>
      </div>
    </div>
  );
}