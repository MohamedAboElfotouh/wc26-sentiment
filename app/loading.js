export default function Loading() {
  return (
    <main className="min-h-screen p-6 md:p-12 flex flex-col transition-colors duration-300">

      {/* Header Skeleton */}
      <header className="mb-8 border-b border-gray-200 dark:border-gray-800 pb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-4">
          <div className="h-10 w-64 md:w-96 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
          <div className="h-5 w-48 md:w-72 bg-gray-200 dark:bg-gray-800 rounded-md animate-pulse"></div>
        </div>
        <div className="h-10 w-40 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse"></div>
      </header>

      {/* Explanatory Banner Skeleton */}
      <section className="mb-12 h-40 w-full bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/40 rounded-2xl animate-pulse"></section>

      {/* Spotlight Insights Skeleton */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="h-36 bg-gray-100 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 animate-pulse"></div>
        <div className="h-36 bg-gray-100 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 animate-pulse"></div>
      </section>

      {/* Main Grid Skeleton */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 flex-grow">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm h-64 flex flex-col">
            <div className="bg-gray-100 dark:bg-gray-800 h-12 w-full border-b border-gray-200 dark:border-gray-700 animate-pulse"></div>
            <div className="flex-grow p-4 space-y-4">
              <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse"></div>
              <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse"></div>
              <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse"></div>
            </div>
          </div>
        ))}
      </section>

    </main>
  );
}