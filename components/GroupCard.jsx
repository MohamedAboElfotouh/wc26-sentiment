import TeamRow from './TeamRow';

export default function GroupCard({ groupLetter, teams, sentiments }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg">
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
        <h2 className="text-lg font-bold text-white">Group {groupLetter}</h2>
      </div>
      <div className="flex flex-col">
        {teams.map(team => (
          <TeamRow
            key={team.team_id}
            team={team}
            sentiment={sentiments.find(s => s.team_id === team.team_id)}
          />
        ))}
      </div>
    </div>
  );
}