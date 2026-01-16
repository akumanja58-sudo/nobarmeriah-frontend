'use client';

import { useState, useEffect } from 'react';

export default function MatchH2H({ homeTeam, awayTeam, homeTeamId, awayTeamId }) {
  const [h2hData, setH2hData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // API Base URL - PENTING: pastikan ENV ini ada!
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

  useEffect(() => {
    const fetchH2H = async () => {
      if (!homeTeamId || !awayTeamId) {
        console.log('❌ Missing team IDs:', { homeTeamId, awayTeamId });
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Build URL dengan benar
        const url = `${API_BASE_URL}/api/h2h?team1=${homeTeamId}&team2=${awayTeamId}&last=12`;
        console.log('🔄 Fetching H2H from:', url);

        const response = await fetch(url);

        console.log('📡 Response status:', response.status);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ H2H data received:', data);

        if (data.success) {
          setH2hData(data.h2h);
        } else {
          setError(data.error || 'Failed to fetch H2H data');
        }
      } catch (err) {
        console.error('❌ Error fetching H2H:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchH2H();
  }, [homeTeamId, awayTeamId, API_BASE_URL]);

  const getFormBadge = (result) => {
    switch (result) {
      case 'W':
        return <span className="w-6 h-6 bg-green-500 text-white rounded text-xs font-bold flex items-center justify-center">W</span>;
      case 'D':
        return <span className="w-6 h-6 bg-gray-400 text-white rounded text-xs font-bold flex items-center justify-center">D</span>;
      case 'L':
        return <span className="w-6 h-6 bg-red-500 text-white rounded text-xs font-bold flex items-center justify-center">L</span>;
      default:
        return <span className="w-6 h-6 bg-gray-200 rounded"></span>;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="match-h2h bg-white rounded-xl shadow-sm p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-3 text-gray-500 font-condensed">Memuat data H2H...</span>
        </div>
      </div>
    );
  }

  // Error or no data state
  if (error || !h2hData) {
    return (
      <div className="match-h2h bg-white rounded-xl shadow-sm p-8 text-center">
        <span className="text-4xl mb-4 block">⚔️</span>
        <p className="text-gray-500 font-condensed">Data H2H belum tersedia</p>
        {error && <p className="text-sm text-red-400 font-condensed mt-1">{error}</p>}
      </div>
    );
  }

  const { team1, team2, draws, total_matches, matches } = h2hData;
  const totalResults = (team1?.wins || 0) + (team2?.wins || 0) + (draws || 0);

  return (
    <div className="match-h2h bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-800 mb-4 font-condensed">Head to Head</h3>

        {/* Teams Comparison */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {team1?.logo ? (
              <img src={team1.logo} alt="" className="w-8 h-8 object-contain" />
            ) : (
              <div className="w-8 h-8 bg-green-500 rounded-full"></div>
            )}
            <span className="font-semibold text-gray-800 font-condensed">{team1?.name || homeTeam}</span>
          </div>
          <span className="text-sm text-gray-500 font-condensed">{total_matches} pertandingan</span>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800 font-condensed">{team2?.name || awayTeam}</span>
            {team2?.logo ? (
              <img src={team2.logo} alt="" className="w-8 h-8 object-contain" />
            ) : (
              <div className="w-8 h-8 bg-red-500 rounded-full"></div>
            )}
          </div>
        </div>

        {/* Win/Draw/Lose Bar */}
        {totalResults > 0 && (
          <>
            <div className="relative h-8 rounded-lg overflow-hidden flex mb-2">
              {team1?.wins > 0 && (
                <div
                  className="bg-green-500 flex items-center justify-center text-white font-bold text-sm font-condensed"
                  style={{ width: `${(team1.wins / totalResults) * 100}%` }}
                >
                  {team1.wins}
                </div>
              )}
              {draws > 0 && (
                <div
                  className="bg-gray-400 flex items-center justify-center text-white font-bold text-sm font-condensed"
                  style={{ width: `${(draws / totalResults) * 100}%` }}
                >
                  {draws}
                </div>
              )}
              {team2?.wins > 0 && (
                <div
                  className="bg-red-500 flex items-center justify-center text-white font-bold text-sm font-condensed"
                  style={{ width: `${(team2.wins / totalResults) * 100}%` }}
                >
                  {team2.wins}
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 text-sm mb-6">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span className="text-gray-600 font-condensed">Menang</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                <span className="text-gray-600 font-condensed">Seri</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                <span className="text-gray-600 font-condensed">Kalah</span>
              </div>
            </div>
          </>
        )}

        {/* Recent Form */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500 mb-2 font-condensed">Form {team1?.name || homeTeam}</p>
            <div className="flex gap-1">
              {team1?.form && team1.form.length > 0 ? (
                team1.form.map((result, idx) => (
                  <span key={idx}>{getFormBadge(result)}</span>
                ))
              ) : (
                <span className="text-sm text-gray-400 font-condensed">-</span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 mb-2 font-condensed">Form {team2?.name || awayTeam}</p>
            <div className="flex gap-1 justify-end">
              {team2?.form && team2.form.length > 0 ? (
                team2.form.map((result, idx) => (
                  <span key={idx}>{getFormBadge(result)}</span>
                ))
              ) : (
                <span className="text-sm text-gray-400 font-condensed">-</span>
              )}
            </div>
          </div>
        </div>

        {/* Past Matches */}
        <div>
          <h4 className="font-semibold text-gray-800 mb-3 font-condensed">Pertemuan Terakhir</h4>
          <div className="space-y-2">
            {matches && matches.length > 0 ? (
              matches.slice(0, 5).map((match, idx) => {
                const isHomeWin = match.home_score > match.away_score;
                const isAwayWin = match.away_score > match.home_score;
                const isDraw = match.home_score === match.away_score;

                return (
                  <div key={idx} className="flex items-center py-3 border-b border-gray-100 last:border-0">
                    {/* Home Team */}
                    <div className="flex-1 flex items-center gap-2">
                      <span className={`text-sm font-condensed ${isHomeWin ? 'font-bold text-gray-800' : 'text-gray-600'}`}>
                        {match.home_team}
                      </span>
                    </div>

                    {/* Score */}
                    <div className="flex items-center gap-2 px-4">
                      <span className={`text-lg font-bold font-condensed ${isHomeWin ? 'text-green-600' : isDraw ? 'text-gray-600' : 'text-gray-400'}`}>
                        {match.home_score}
                      </span>
                      <span className="text-gray-300">-</span>
                      <span className={`text-lg font-bold font-condensed ${isAwayWin ? 'text-green-600' : isDraw ? 'text-gray-600' : 'text-gray-400'}`}>
                        {match.away_score}
                      </span>
                    </div>

                    {/* Away Team */}
                    <div className="flex-1 flex items-center gap-2 justify-end">
                      <span className={`text-sm font-condensed ${isAwayWin ? 'font-bold text-gray-800' : 'text-gray-600'}`}>
                        {match.away_team}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-400 font-condensed text-center py-4">Tidak ada data pertandingan</p>
            )}
          </div>
        </div>

        {/* Match Dates & Leagues */}
        {matches && matches.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="space-y-2">
              {matches.slice(0, 5).map((match, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs text-gray-500">
                  <span className="font-condensed">{formatDate(match.date)}</span>
                  <span className="font-condensed text-green-600">{match.league}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
