export default function TeamRow({ team, sentiment }) {
  // Exact ISO Alpha-2 mapping for the 48 World Cup 2026 teams
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
    if (score > 0.3) return "text-green-500 bg-green-500/10";
    if (score < -0.3) return "text-red-500 bg-red-500/10";
    return "text-gray-500 bg-gray-500/10";
  };

  const badgeStyle = getSentimentColor(sentiment?.avg_score || 0);

  // Safely grab the ISO code, fallback to 'un' (United Nations flag) if missing
  const isoCode = fifaToIso[team.fifa_code] || 'un';

  return (
    <div className="flex items-center justify-between p-3 border-b border-gray-800 last:border-0 hover:bg-gray-800/50 transition-colors">
      <div className="flex items-center gap-3">
        <img
          src={`https://flagcdn.com/w40/${isoCode}.png`}
          alt={`${team.country_name} flag`}
          className="w-8 h-auto rounded-sm shadow-sm"
        />
        <span className="font-medium text-gray-100">{team.country_name}</span>
      </div>

      <div className={`px-3 py-1 rounded-full text-sm font-semibold ${badgeStyle}`}>
        {sentiment ? sentiment.avg_score.toFixed(2) : "N/A"}
      </div>
    </div>
  );
}