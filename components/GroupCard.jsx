import TeamRow from './TeamRow';

export default function GroupCard({ groupLetter, teams }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-lg transition-colors">
      <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Group {groupLetter}</h2>
      </div>
      <div className="flex flex-col">
        {teams.map(team => (
          <TeamRow
            key={team.team_id}
            team={team}
            sentiment={team.sentiment}
          />
        ))}
      </div>
    </div>
  );
}