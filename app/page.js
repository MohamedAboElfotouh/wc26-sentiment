import { supabase } from '@/lib/supabase';
import GroupCard from '@/components/GroupCard';

// Revalidate this page every hour to ensure data stays fresh
export const revalidate = 3600;

export default async function Home() {
  // 1. Fetch active teams
  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .eq('is_active', true)
    .order('group_stage', { ascending: true });

  // 2. Fetch the absolute latest sentiment snapshot for each team
  // Using a raw SQL RPC call or clever view is best here, but for simplicity:
  const { data: snapshots } = await supabase
    .from('sentiment_snapshots')
    .select('*')
    .order('recorded_at', { ascending: false });

  // Deduplicate to keep only the most recent snapshot per team_id
  const latestSentiments = snapshots.filter((v, i, a) => a.findIndex(t => (t.team_id === v.team_id)) === i);

  // 3. Group teams by their group_stage letter (A through L)
  const groupedTeams = teams.reduce((acc, team) => {
    if (!acc[team.group_stage]) acc[team.group_stage] = [];
    acc[team.group_stage].push(team);
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-black text-gray-100 p-6 md:p-12 font-sans">
      <header className="mb-12 border-b border-gray-800 pb-6">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
          WC26 Sentiment Pulse
        </h1>
        <p className="text-gray-400 mt-2 text-lg">Real-time public perception tracking for all active national teams.</p>
      </header>

      {/* CSS Grid for Groups: 1 col on mobile, 2 on tablet, 3 on desktop, 4 on wide screens */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Object.keys(groupedTeams).sort().map(groupLetter => (
          <GroupCard
            key={groupLetter}
            groupLetter={groupLetter}
            teams={groupedTeams[groupLetter]}
            sentiments={latestSentiments}
          />
        ))}
      </section>
    </main>
  );
}