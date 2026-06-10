import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import GroupCard from '@/components/GroupCard';
import ThemeToggle from '@/components/ThemeToggle';

export const dynamic = 'force-dynamic';

export default async function Home() {
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

  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .eq('is_active', true)
    .order('group_stage', { ascending: true });

  const { data: snapshots } = await supabase
    .from('sentiment_snapshots')
    .select('*')
    .order('recorded_at', { ascending: false });

  const latestSentimentsMap = new Map();
  if (snapshots) {
    snapshots.forEach(snapshot => {
      if (!latestSentimentsMap.has(snapshot.team_id)) {
        latestSentimentsMap.set(snapshot.team_id, snapshot);
      }
    });
  }
  const latestSentiments = Array.from(latestSentimentsMap.values());

  // 12-Hour AM/PM Timestamp Formatting
  let formattedLastUpdated = "N/A";
  if (snapshots && snapshots.length > 0) {
    const lastDate = new Date(snapshots[0].recorded_at);
    const day = lastDate.getDate();
    const month = lastDate.toLocaleString('en-US', { month: 'long' });

    let hours = lastDate.getHours();
    const minutes = lastDate.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12; // Convert hour '0' to '12'

    formattedLastUpdated = `${day} ${month} ${hours}:${minutes} ${ampm}`;
  }

  let bestPerformance = null;
  let worstPerformance = null;

  if (teams && latestSentiments.length > 0) {
    const activeSentimentsWithTeams = latestSentiments
      .map(s => {
        const teamObj = teams.find(t => t.team_id === s.team_id);
        return { ...s, team: teamObj };
      })
      .filter(item => item.team !== undefined);

    if (activeSentimentsWithTeams.length > 0) {
      bestPerformance = activeSentimentsWithTeams.reduce((max, item) =>
        item.avg_score > max.avg_score ? item : max, activeSentimentsWithTeams[0]
      );
      worstPerformance = activeSentimentsWithTeams.reduce((min, item) =>
        item.avg_score < min.avg_score ? item : min, activeSentimentsWithTeams[0]
      );
    }
  }

  const groupedTeams = (teams || []).reduce((acc, team) => {
    if (!acc[team.group_stage]) acc[team.group_stage] = [];
    acc[team.group_stage].push(team);
    return acc;
  }, {});

  return (
    <main className="min-h-screen p-6 md:p-12 flex flex-col transition-colors duration-300">
      {/* Header with Theme Toggle */}
      <header className="mb-12 border-b border-gray-200 dark:border-gray-800 pb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-blue-400 dark:to-emerald-400">
            WC26 Sentiment Pulse
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Real-time public perception tracking for all active national teams.</p>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/trends"
            className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-xl shadow-md transition-colors"
          >
            View Historical Trends
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Spotlight Insights Section */}
      {bestPerformance && worstPerformance && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Top Performer Card */}
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 border border-emerald-500/30 rounded-xl p-6 shadow-xl shadow-emerald-900/5 dark:shadow-emerald-950/20 flex items-center justify-between transition-colors">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block mb-2">
                Current Public Favorite
              </span>
              <div className="flex items-center gap-3">
                <img
                  src={`https://flagcdn.com/w40/${fifaToIso[bestPerformance.team.fifa_code] || 'un'}.png`}
                  alt="Flag"
                  className="w-8 h-auto rounded-sm shadow"
                />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{bestPerformance.team.country_name}</h3>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Based on latest automated social scraper pagination run.
              </p>
            </div>
            <div className="text-right">
              <span className="text-4xl font-black text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-xl block border border-emerald-500/20">
                +{bestPerformance.avg_score.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Lowest Performer Card */}
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 border border-red-500/30 rounded-xl p-6 shadow-xl shadow-red-900/5 dark:shadow-red-950/20 flex items-center justify-between transition-colors">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-red-600 dark:text-red-400 block mb-2">
                Under Highest Scrutiny
              </span>
              <div className="flex items-center gap-3">
                <img
                  src={`https://flagcdn.com/w40/${fifaToIso[worstPerformance.team.fifa_code] || 'un'}.png`}
                  alt="Flag"
                  className="w-8 h-auto rounded-sm shadow"
                />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{worstPerformance.team.country_name}</h3>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Based on latest automated social scraper pagination run.
              </p>
            </div>
            <div className="text-right">
              <span className="text-4xl font-black text-red-700 dark:text-red-400 bg-red-500/10 px-4 py-2 rounded-xl block border border-red-500/20">
                {worstPerformance.avg_score.toFixed(2)}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Main Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 flex-grow">
        {Object.keys(groupedTeams).sort().map(groupLetter => (
          <GroupCard
            key={groupLetter}
            groupLetter={groupLetter}
            teams={groupedTeams[groupLetter]}
            sentiments={latestSentiments}
          />
        ))}
      </section>

      {/* Footer / Last Updated Tracker */}
      <footer className="mt-16 pt-6 border-t border-gray-200 dark:border-gray-800 text-center transition-colors">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 rounded-full border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium tracking-wide">
            Last Updated: <span className="text-gray-900 dark:text-gray-200 font-bold">{formattedLastUpdated}</span>
          </p>
        </div>
      </footer>
    </main>
  );
}