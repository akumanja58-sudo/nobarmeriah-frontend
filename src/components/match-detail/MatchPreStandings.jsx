'use client';

import { useState, useEffect } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function MatchPreStandings({
  leagueId,
  homeTeamId,
  awayTeamId,
  homeTeam,
  awayTeam,
  homeTeamLogo,
  awayTeamLogo,
  season
}) {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStandings = async () => {
      if (!leagueId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Season football: kalau bulan < 8 (Agustus), pake tahun sebelumnya
        const now = new Date();
        const currentSeason = season || (now.getMonth() + 1 < 8 ? now.getFullYear() - 1 : now.getFullYear());

        console.log('📅 Current month:', now.getMonth() + 1);
        console.log('📅 Current year:', now.getFullYear());
        console.log('📅 Calculated season:', currentSeason);
        console.log('📅 Prop season:', season);

        const url = `${API_BASE_URL}/api/standings?league=${leagueId}&season=${currentSeason}`;
        console.log('🌐 Fetching URL:', url);

        const response = await fetch(url);

        if (!response.ok) throw new Error('Failed to fetch standings');

        const data = await response.json();

        console.log('📊 Standings data:', data);
        console.log('🏠 Home Team ID:', homeTeamId);
        console.log('✈️ Away Team ID:', awayTeamId);

        if (data.success && data.standings) {
          const filteredStandings = data.standings.filter(
            team => team.team?.id === homeTeamId || team.team?.id === awayTeamId
          );

          console.log('✅ Filtered standings:', filteredStandings);

          filteredStandings.sort((a, b) => a.rank - b.rank);
          setStandings(filteredStandings);
        }
      } catch (err) {
        console.error('Error fetching standings:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, [leagueId, homeTeamId, awayTeamId, season]);

  // Render form badges (W/D/L)
  const renderForm = (form) => {
    if (!form) return null;

    const formArray = form.split('').slice(-5); // Last 5 matches

    return (
      <div className="flex gap-0.5">
        {formArray.map((result, idx) => {
          let bgColor = 'bg-gray-300';
          let textColor = 'text-gray-600';

          if (result === 'W') {
            bgColor = 'bg-green-500';
            textColor = 'text-white';
          } else if (result === 'L' || result === 'K') {
            bgColor = 'bg-red-500';
            textColor = 'text-white';
          } else if (result === 'D' || result === 'S') {
            bgColor = 'bg-yellow-400';
            textColor = 'text-gray-800';
          }

          return (
            <span
              key={idx}
              className={`w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded ${bgColor} ${textColor}`}
            >
              {result === 'K' ? 'L' : result === 'S' ? 'D' : result}
            </span>
          );
        })}
      </div>
    );
  };

  // Calculate points per game
  const getPointsPerGame = (team) => {
    const played = team.played || team.all?.played || 0;
    const points = team.points || 0;
    if (played === 0) return '0.00';
    return (points / played).toFixed(2);
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-40 mb-4"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!standings || standings.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="font-semibold text-gray-800 mb-3 font-condensed">Klasemen pra-pertandingan</h3>
        <div className="text-center py-4">
          <span className="text-2xl mb-2 block">📊</span>
          <p className="text-sm text-gray-500 font-condensed">Data klasemen tidak tersedia</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-2">
        <h3 className="font-semibold text-gray-800 font-condensed">Klasemen pra-pertandingan</h3>
      </div>

      {/* Table */}
      <div className="px-4 pb-4">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-400 font-condensed">
              <th className="text-left py-2 font-normal">#</th>
              <th className="text-left py-2 font-normal">Tim</th>
              <th className="text-center py-2 font-normal">Terbaru</th>
              <th className="text-right py-2 font-normal">Poin</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((team, index) => (
              <tr
                key={team.team_id || index}
                className="border-t border-gray-100"
              >
                {/* Rank */}
                <td className="py-3 text-sm font-semibold text-gray-800 font-condensed">
                  {team.rank || index + 1}
                </td>

                {/* Team */}
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    {team.team?.logo ? (
                      <img
                        src={team.team.logo}
                        alt={team.team?.name}
                        className="w-6 h-6 object-contain"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold">
                        {(team.team?.name || '?').charAt(0)}
                      </div>
                    )}
                  </div>
                </td>

                {/* Form */}
                <td className="py-3">
                  <div className="flex justify-center">
                    {renderForm(team.form)}
                  </div>
                </td>

                {/* Points Per Game & Total Points */}
                <td className="py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-xs text-gray-400 bg-yellow-100 px-1.5 py-0.5 rounded font-condensed">
                      {getPointsPerGame(team)}
                    </span>
                    <span className="text-sm font-bold text-gray-800 font-condensed">
                      {team.points || 0}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer - Disclaimer */}
      <div className="px-4 pb-3">
        <p className="text-[10px] text-gray-400 font-condensed">
          * Klasemen sebelum pertandingan dimulai
        </p>
      </div>
    </div>
  );
}
