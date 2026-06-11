import { supabase } from '@/lib/supabase';
import TrendChart from '@/components/TrendChart';
import TweetList from '@/components/TweetList';
import ThemeToggle from '@/components/ThemeToggle';
import Link from 'next/link';
import { notFound } from 'next/navigation';
export const revalidate = 3600;

export default async function TeamProfilePage({ params }) {
  const { id } = await params;

  const fifaToIso = {
    'ARG': 'ar', 'AUS': 'au', 'AUT': 'at', 'BEL': 'be', 'BIH': 'ba', 'BRA': 'br',
    'CAN': 'ca', 'CIV': 'ci', 'CMR': 'cm', 'COD': 'cd', 'COL': 'co', 'CPV': 'cv',
    'CRC': 'cr', 'CRO': 'hr', 'CUW': 'cw', 'CZE': 'cz', 'DEN': 'dk', 'ECU': 'ec',
    'EGY': 'eg', 'ENG': 'gb-eng', 'ESP': 'es', 'FRA': 'fr', 'GER': 'de', 'GHA': 'gh',
    'HAI': 'ht', 'IRN': 'ir', 'IRQ': 'iq', 'ITA': 'it', 'JAM': 'jm', 'JOR': 'jo',
    'JPN': 'jp', 'KOR': 'kr', 'KSA': 'sa', 'MAR': 'ma', 'MEX': 'mx', 'NED': 'nl',
    'NGA': 'ng', 'NOR': 'no', 'NZL': 'nz', 'PAN': 'pa', 'PAR': 'py', 'POR': 'pt',
    'QAT': 'qa', 'RSA': 'za', 'SCO': 'gb-sct', 'SEN': 'sn', 'SRB': 'rs', 'SUI': 'ch',
    'SWE': 'se', 'TUN': 'tn', 'TUR': 'tr', 'URU': 'uy', 'USA': 'us', 'UZB': 'uz',
    'WAL': 'gb-wls', 'ALG': 'dz'
  };

  // 1. Fetch target team data
  const { data: team } = await supabase
    .from('teams')
    .select('*')
    .eq('team_id', id)
    .single();

  if (!team) {
    notFound();
  }

  // 2. Fetch historical sentiment snapshots for the line chart
  const { data: snapshots } = await supabase
    .from('sentiment_snapshots')
    .select('team_id, avg_score, recorded_at')
    .eq('team_id', id);

  // 3. Sub-Query Optimization: Find the timestamp of the absolute latest scrape for this team
  const { data: latestTweetBatch } = await supabase
    .from('tweets')
    .select('created_at')
    .eq('team_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // 4. Fetch only the tweets belonging to that exact latest ingestion run block
  let primaryRecentTweets = [];
  if (latestTweetBatch) {
    const { data: matchingTweets } = await supabase
      .from('tweets')
      .select('*')
      .eq('team_id', id)
      .eq('created_at', latestTweetBatch.created_at);
    primaryRecentTweets = matchingTweets || [];
  }

  const isoCode = fifaToIso[team.fifa_code] || 'un';

  return (
    <main className="min-h-screen p-6 md:p-12 flex flex-col transition-colors duration-300">

      {/* Navigation & Action Header */}
      <header className="mb-10 border-b border-gray-200 dark:border-gray-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={`https://flagcdn.com/w80/${isoCode}.png`}
            alt="Flag"
            className="w-16 h-auto rounded-md shadow-md border border-gray-100 dark:border-gray-800"
          />
          <div>
            <Link href="/" className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors mb-1 group">
              <svg className="w-3. h-3. mr-1 transform group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
              Dashboard
            </Link>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
              {team.country_name} <span className="text-gray-400 font-light text-2xl ml-1">({team.fifa_code})</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Structural Grid Split */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start max-w-7xl w-full mx-auto">

        {/* Historical Line Chart - Spans 2 Columns */}
        <div className="lg:col-span-2 w-full">
          <div className="mb-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
              Sentiment Momentum Analytics
            </h3>
          </div>
          {/* Added hideControls prop to remove the UI on the profile page */}
          <TrendChart teams={[team]} snapshots={snapshots || []} hideControls={true} />
        </div>

        {/* Live Filtered Twitter Stream Container - Spans 1 Column */}
        <div className="w-full lg:sticky lg:top-6">
          <TweetList tweets={primaryRecentTweets} />
        </div>

      </section>

    </main>
  );
}