'use client';

export default function MatchStats({ statistics, homeTeam, awayTeam }) {

  // Parse statistics from API
  // API format: [{ team: {...}, statistics: [{type, value}] }, ...]
  const homeStats = statistics?.[0]?.statistics || [];
  const awayStats = statistics?.[1]?.statistics || [];

  // Map stats to unified format
  const getStatValue = (stats, type) => {
    const stat = stats.find(s => s.type === type);
    if (!stat) return 0;

    // Handle percentage values
    if (typeof stat.value === 'string' && stat.value.includes('%')) {
      return parseInt(stat.value.replace('%', '')) || 0;
    }
    return parseInt(stat.value) || 0;
  };

  // Stats to display with Indonesian labels
  const statTypes = [
    { key: 'Ball Possession', label: 'Penguasaan Bola', unit: '%' },
    { key: 'Total Shots', label: 'Total Tembakan', unit: '' },
    { key: 'Shots on Goal', label: 'Tembakan ke Gawang', unit: '' },
    { key: 'Shots off Goal', label: 'Tembakan Meleset', unit: '' },
    { key: 'Blocked Shots', label: 'Tembakan Diblok', unit: '' },
    { key: 'Shots insidebox', label: 'Tembakan dari Kotak Penalti', unit: '' },
    { key: 'Shots outsidebox', label: 'Tembakan dari Luar Kotak', unit: '' },
    { key: 'Corner Kicks', label: 'Tendangan Sudut', unit: '' },
    { key: 'Offsides', label: 'Offside', unit: '' },
    { key: 'Fouls', label: 'Pelanggaran', unit: '' },
    { key: 'Yellow Cards', label: 'Kartu Kuning', unit: '' },
    { key: 'Red Cards', label: 'Kartu Merah', unit: '' },
    { key: 'Goalkeeper Saves', label: 'Penyelamatan Kiper', unit: '' },
    { key: 'Total passes', label: 'Total Operan', unit: '' },
    { key: 'Passes accurate', label: 'Operan Akurat', unit: '' },
    { key: 'Passes %', label: 'Akurasi Operan', unit: '%' },
  ];

  // Build stats array with real values
  const matchStats = statTypes.map(statType => ({
    name: statType.label,
    home: getStatValue(homeStats, statType.key),
    away: getStatValue(awayStats, statType.key),
    unit: statType.unit
  })).filter(stat => stat.home > 0 || stat.away > 0); // Only show stats with values

  const getBarWidth = (home, away) => {
    const total = home + away;
    if (total === 0) return { home: 50, away: 50 };
    return {
      home: (home / total) * 100,
      away: (away / total) * 100
    };
  };

  // No statistics available
  if (!statistics || statistics.length === 0 || matchStats.length === 0) {
    return (
      <div className="match-stats bg-white rounded-xl shadow-sm p-8 text-center">
        <span className="text-4xl mb-4 block">📊</span>
        <p className="text-gray-500 font-condensed">Statistik belum tersedia</p>
        <p className="text-sm text-gray-400 font-condensed mt-1">Statistik akan tersedia setelah pertandingan dimulai</p>
      </div>
    );
  }

  return (
    <div className="match-stats bg-white rounded-xl shadow-sm p-4">
      <h3 className="text-lg font-bold text-gray-800 mb-4 font-condensed">Statistik Pertandingan</h3>

      {/* Team Headers */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <span className="font-semibold text-gray-800 font-condensed">{homeTeam || 'Home'}</span>
        <span className="font-semibold text-gray-800 font-condensed">{awayTeam || 'Away'}</span>
      </div>

      <div className="space-y-4">
        {matchStats.map((stat, index) => {
          const widths = getBarWidth(stat.home, stat.away);
          const homeWins = stat.home > stat.away;
          const awayWins = stat.away > stat.home;

          return (
            <div key={index} className="stat-row">
              {/* Values */}
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-bold font-condensed ${homeWins ? 'text-green-600' : 'text-gray-700'}`}>
                  {stat.home}{stat.unit}
                </span>
                <span className="text-xs text-gray-500 font-condensed text-center flex-1 px-2">{stat.name}</span>
                <span className={`text-sm font-bold font-condensed ${awayWins ? 'text-green-600' : 'text-gray-700'}`}>
                  {stat.away}{stat.unit}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center gap-0.5 h-2">
                <div
                  className={`h-full rounded-l transition-all ${homeWins ? 'bg-green-500' : 'bg-gray-300'}`}
                  style={{ width: `${widths.home}%` }}
                ></div>
                <div
                  className={`h-full rounded-r transition-all ${awayWins ? 'bg-green-500' : 'bg-gray-300'}`}
                  style={{ width: `${widths.away}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
