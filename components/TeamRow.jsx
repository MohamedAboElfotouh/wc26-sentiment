import Link from 'next/link';

export default function TeamRow({ team, sentiment }) {
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

  const getSentimentColor = (score) => {
    if (score > 0.3) return "text-green-700 bg-green-500/20 dark:text-green-400 dark:bg-green-500/10";
    if (score < -0.3) return "text-red-700 bg-red-500/20 dark:text-red-400 dark:bg-red-500/10";
    return "text-gray-700 bg-gray-500/20 dark:text-gray-400 dark:bg-gray-500/10";
  };

  const badgeStyle = getSentimentColor(sentiment?.avg_score || 0);
  const isoCode = fifaToIso[team.fifa_code] || 'un';

  return (
    <Link
      href={`/team/${team.team_id}`}
      className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-800 last:border-0 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
    >
      <div className="flex items-center gap-3">
        <img
          src={`https://flagcdn.com/w40/${isoCode}.png`}
          alt={`${team.country_name} flag`}
          className="w-8 h-auto rounded-sm shadow-sm transition-transform group-hover:scale-105"
        />
        <span className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {team.country_name}
        </span>
      </div>

      <div className={`px-3 py-1 rounded-full text-sm font-semibold ${badgeStyle}`}>
        {sentiment ? (sentiment.avg_score > 0 ? "+" : "") + sentiment.avg_score.toFixed(2) : "N/A"}
      </div>
    </Link>
  );
}