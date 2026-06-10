export default function TeamLoading() {
  return (
    <main className="min-h-screen p-6 md:p-12 flex flex-col transition-colors duration-300">

      {/* Navigation & Action Header Skeleton */}
      <header className="mb-10 border-b border-gray-200 dark:border-gray-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-12 bg-gray-200 dark:bg-gray-800 rounded-md animate-pulse"></div>
          <div className="space-y-3">
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
          </div>
        </div>
        <div className="h-10 w-10 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse self-end sm:self-auto"></div>
      </header>

      {/* Main Structural Grid Split Skeleton */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start max-w-7xl w-full mx-auto">

        {/* Chart Skeleton */}
        <div className="lg:col-span-2 w-full">
          <div className="mb-2 h-4 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
          <div className="w-full h-96 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl animate-pulse"></div>
        </div>

        {/* Tweets List Skeleton */}
        <div className="w-full lg:sticky lg:top-6 space-y-4">
          <div className="h-4 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-xl h-32 animate-pulse"></div>
          ))}
        </div>

      </section>
    </main>
  );
}