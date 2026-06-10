"use client";

import { useState, useMemo, useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function TrendChart({ teams, snapshots, hideControls = false }) {
  const [selectedTeams, setSelectedTeams] = useState([teams[0]?.team_id]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);

  const colors = ['#3B82F6', '#10B981', '#F59E0B']; // Blue, Emerald, Amber

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const addTeam = () => {
    if (selectedTeams.length < 3) {
      const unselectedTeam = teams.find(t => !selectedTeams.includes(t.team_id));
      if (unselectedTeam) {
        setSelectedTeams([...selectedTeams, unselectedTeam.team_id]);
      }
    }
  };

  const removeTeam = (index) => {
    const newTeams = [...selectedTeams];
    newTeams.splice(index, 1);
    setSelectedTeams(newTeams);
    setOpenDropdown(null);
  };

  const handleTeamSelect = (index, teamId) => {
    const newTeams = [...selectedTeams];
    newTeams[index] = teamId;
    setSelectedTeams(newTeams);
    setOpenDropdown(null);
  };

  // --- NEW 30-MINUTE CLUSTERING ALGORITHM ---
  const chartData = useMemo(() => {
    if (!selectedTeams.length || !snapshots) return [];

    // Filter relevant teams and sort chronologically strictly by timestamp
    const relevantSnapshots = snapshots.filter(s => selectedTeams.includes(s.team_id));
    relevantSnapshots.sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());

    const buckets = [];
    const TIME_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

    relevantSnapshots.forEach(snapshot => {
      const currentTimestamp = new Date(snapshot.recorded_at).getTime();
      let lastBucket = buckets.length > 0 ? buckets[buckets.length - 1] : null;

      // If no buckets exist, OR the gap between this snapshot and the bucket base is > 30 mins, create a new bucket.
      if (!lastBucket || (currentTimestamp - lastBucket.baseTimestamp) > TIME_THRESHOLD_MS) {
        const dateObj = new Date(snapshot.recorded_at);
        const timeLabel = `${dateObj.getDate()} ${dateObj.toLocaleString('en-US', { month: 'short' })} ${dateObj.getHours() % 12 || 12}:${dateObj.getMinutes().toString().padStart(2, '0')} ${dateObj.getHours() >= 12 ? 'PM' : 'AM'}`;

        lastBucket = {
          timeLabel,
          baseTimestamp: currentTimestamp, // Anchor timestamp for the 30-min window
          timestamp: currentTimestamp,     // Stored for X-Axis chronological plotting
          _tempScores: {}                  // Private object to hold scores for averaging
        };
        buckets.push(lastBucket);
      }

      // Append score to the bucket's temporary team array
      if (!lastBucket._tempScores[snapshot.team_id]) {
        lastBucket._tempScores[snapshot.team_id] = [];
      }
      lastBucket._tempScores[snapshot.team_id].push(snapshot.avg_score);
    });

    // Compute averages and flatten the structure for Recharts
    return buckets.map(bucket => {
      const finalPoint = {
        timeLabel: bucket.timeLabel,
        timestamp: bucket.timestamp
      };

      Object.keys(bucket._tempScores).forEach(teamId => {
        const scores = bucket._tempScores[teamId];
        // Calculate the mean average if multiple scores exist in the 30 min window
        const avg = scores.reduce((sum, val) => sum + val, 0) / scores.length;
        finalPoint[teamId] = parseFloat(avg.toFixed(2));
      });

      return finalPoint;
    });

  }, [selectedTeams, snapshots]);

  // Dynamically mapped Tooltip to support multiple score entries
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-3 rounded-lg shadow-xl min-w-[200px]">
          <p className="text-gray-500 dark:text-gray-400 text-xs mb-3 border-b border-gray-100 dark:border-gray-800 pb-2">{label}</p>
          {payload.map((entry, idx) => {
             const teamObj = teams.find(t => t.team_id === entry.dataKey);
             const score = entry.value;
             const isPositive = score > 0;
             const colorClass = isPositive ? 'text-emerald-500' : score < 0 ? 'text-red-500' : 'text-gray-500';

             return (
               <div key={idx} className="flex items-center justify-between gap-6 mb-2 last:mb-0">
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                   <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{teamObj?.country_name}</span>
                 </div>
                 <span className={`font-bold text-base ${colorClass}`}>
                   {score > 0 ? '+' : ''}{score.toFixed(2)}
                 </span>
               </div>
             );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm transition-colors">

      {/* Dynamic Multi-Select Controls */}
      {!hideControls && (
        <div className="mb-8 relative w-full flex flex-wrap gap-4 items-end" ref={dropdownRef}>

          {selectedTeams.map((selectedId, index) => {
            const activeTeam = teams.find(t => t.team_id === selectedId);
            const activeIsoCode = activeTeam ? fifaToIso[activeTeam.fifa_code] || 'un' : 'un';
            const isLastElement = index === selectedTeams.length - 1;

            return (
              <div key={`dropdown-group-${index}`} className="flex items-center gap-2 relative z-50">

                <div className="w-full md:w-64 relative">
                  {index === 0 && (
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
                      Select Teams to Compare
                    </label>
                  )}
                  <button
                    onClick={() => setOpenDropdown(openDropdown === index ? null : index)}
                    style={{ borderLeftColor: colors[index], borderLeftWidth: '4px' }}
                    className="w-full flex items-center justify-between bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://flagcdn.com/w40/${activeIsoCode}.png`}
                        alt="Flag"
                        className="w-6 h-auto rounded-sm shadow-sm"
                      />
                      <span className="font-bold text-gray-900 dark:text-white truncate max-w-[120px] text-left">
                        {activeTeam?.country_name || "Select Team"}
                      </span>
                    </div>
                    <svg className={`w-5 h-5 text-gray-500 transition-transform ${openDropdown === index ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {openDropdown === index && (
                    <ul className="absolute left-0 w-full mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-h-80 overflow-y-auto custom-scrollbar">
                      {teams.map(team => {
                        const isAlreadySelected = selectedTeams.includes(team.team_id) && team.team_id !== selectedId;
                        if (isAlreadySelected) return null;

                        return (
                          <li
                            key={team.team_id}
                            onClick={() => handleTeamSelect(index, team.team_id)}
                            className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0"
                          >
                            <img
                              src={`https://flagcdn.com/w40/${fifaToIso[team.fifa_code] || 'un'}.png`}
                              alt="Flag"
                              className="w-6 h-auto rounded-sm"
                            />
                            <span className="text-gray-700 dark:text-gray-200 font-medium">{team.country_name}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div className="flex items-center gap-1 ml-1" style={{ marginTop: index === 0 ? '24px' : '0px' }}>
                  {index > 0 && (
                    <button
                      onClick={() => removeTeam(index)}
                      className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                      aria-label="Remove Team"
                    >
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  )}

                  {isLastElement && selectedTeams.length < 3 && (
                    <button
                      onClick={addTeam}
                      className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded-lg transition-colors ml-1"
                      aria-label="Add Team to Compare"
                    >
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Chart Area */}
      <div className="h-96 w-full relative z-0">
        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.3} />
              <XAxis
                dataKey="timeLabel"
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickMargin={10}
                minTickGap={30}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[-1, 1]}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => value.toFixed(1)}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#6B7280" strokeDasharray="3 3" opacity={0.5} />

              {selectedTeams.map((teamId, index) => (
                <Line
                  key={`line-${teamId}`}
                  type="monotone"
                  dataKey={teamId}
                  stroke={colors[index]}
                  strokeWidth={3}
                  connectNulls={true}
                  dot={{ r: 4, fill: colors[index], strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  animationDuration={1500}
                />
              ))}

            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <svg className="w-12 h-12 mb-4 opacity-20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/><path d="M11 11h2v6h-2zm0-4h2v2h-2z"/></svg>
            <p>Gathering more data...</p>
            <p className="text-sm">Historical trends require at least 2 database snapshots.</p>
          </div>
        )}
      </div>
    </div>
  );
}