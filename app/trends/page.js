import { supabase } from '@/lib/supabase';
import TrendChart from '@/components/TrendChart';
import ThemeToggle from '@/components/ThemeToggle';
import Link from 'next/link';
export const revalidate = 3600;

export default async function TrendsPage() {
  // Fetch active teams
  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .order('country_name', { ascending: true }); // Alphabetical order for the dropdown

  // Fetch all historical sentiment snapshots
  const { data: snapshots } = await supabase
    .from('sentiment_snapshots')
    .select('team_id, avg_score, recorded_at')
    .limit(5000);

  return (
    <main className="min-h-screen p-6 md:p-12 flex flex-col transition-colors duration-300">

      {/* Header Area with Navigation */}
      <header className="mb-8 border-b border-gray-200 dark:border-gray-800 pb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <Link href="/" className="inline-flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors mb-4 group">
            <svg className="w-4 h-4 mr-1 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Historical Trends
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Track emotional volatility and public perception over time.</p>
        </div>
        <ThemeToggle />
      </header>

      {/* Main Chart Component */}
      <section className="flex-grow max-w-5xl mx-auto w-full">
        <TrendChart teams={teams || []} snapshots={snapshots || []} />
      </section>

    </main>
  );
}