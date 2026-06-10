export default function TrendsLoading() {
  return (
    <main className="min-h-screen p-6 md:p-12 flex flex-col transition-colors duration-300">

      {/* Header Skeleton */}
      <header className="mb-8 border-b border-gray-200 dark:border-gray-800 pb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-4">
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
          <div className="h-10 w-64 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
          <div className="h-5 w-72 bg-gray-200 dark:bg-gray-800 rounded-md animate-pulse"></div>
        </div>
        <div className="h-10 w-10 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse"></div>
      </header>

      {/* Main Chart Component Skeleton */}
      <section className="flex-grow max-w-5xl mx-auto w-full">
        <div className="w-full h-[32rem] bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl animate-pulse flex flex-col p-6">
          <div className="h-4 w-40 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div>
          <div className="h-12 w-64 bg-gray-200 dark:bg-gray-800 rounded-xl mb-8"></div>
          <div className="flex-grow border-b-2 border-l-2 border-gray-200 dark:border-gray-800/50 rounded-bl-lg"></div>
        </div>
      </section>

    </main>
  );
}