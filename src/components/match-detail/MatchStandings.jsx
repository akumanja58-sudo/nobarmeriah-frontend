'use client';

import { useState, useEffect } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://nobarmeriah-backend-production.up.railway.app';

export default function MatchStandings({ leagueId, season, homeTeamId, awayTeamId }) {
  const [standings, setStandings] = useState(null);
  const [league, setLeague] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'home', 'away'

  useEffect(() => {
    const fetchStandings = async () => {
      if (!leagueId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        console.log('🔄 Fetching standings for league:', leagueId);

        const currentSeason = season || new Date().getFullYear();
        const response = await fetch(
          `${API_BASE_URL}/api/standings?league=${leagueId}&season=${currentSeason}`
        );

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Standings data received:', data);

          if (data.success) {
            setStandings(data.standings);
            setLeague(data.league);
          } else {
            setError(data.error);
          }
        } else {
          setError('Failed to fetch standings');
        }
      } catch (err) {
        console.error('❌ Error fetching standings:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStandings();
  }, [leagueId, season]);

  const getFormBadge = (result) => {
    switch (result) {
      case 'W':
        return <span className="w-5 h-5 bg-green-500 text-white rounded text-[10px] font-bold flex items-center justify-center">W</span>;
      case 'D':
        return <span className="w-5 h-5 bg-gray-400 text-white rounded text-[10px] font-bold flex items-center justify-center">D</span>;
      case 'L':
        return <span className="w-5 h-5 bg-red-500 text-white rounded text-[10px] font-bold flex items-center justify-center">L</span>;
      default:
        return <span className="w-5 h-5 bg-gray-200 rounded text-[10px]"></span>;
    }
  };

  const getPositionStyle = (rank, description) => {
    // Champions League spots
    if (rank <= 4 || description?.toLowerCase().includes('champions league')) {
      return 'border-l-4 border-blue-500 bg-blue-50';
    }
    // Europa League spots
    if (rank <= 6 || description?.toLowerCase().includes('europa')) {
      return 'border-l-4 border-orange-500 bg-orange-50';
    }
    // Conference League
    if (rank === 7 || description?.toLowerCase().includes('conference')) {
      return 'border-l-4 border-green-500 bg-green-50';
    }
    // Relegation
    if (description?.toLowerCase().includes('relegation')) {
      return 'border-l-4 border-red-500 bg-red-50';
    }
    return '';
  };

  const isHighlightedTeam = (teamId) => {
    return teamId === homeTeamId || teamId === awayTeamId;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="match-standings bg-white rounded-xl shadow-sm p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-3 text-gray-500 font-condensed">Memuat klasemen...</span>
        </div>
      </div>
    );
  }

  // Error or no data state
  if (error || !standings || (Array.isArray(standings) && standings.length === 0)) {
    return (
      <div className="match-standings bg-white rounded-xl shadow-sm p-8 text-center">
        <span className="text-4xl mb-4 block">🏆</span>
        <p className="text-gray-500 font-condensed">Klasemen belum tersedia</p>
        {error && <p className="text-sm text-red-400 font-condensed mt-1">{error}</p>}
      </div>
    );
  }

  return (
    <div className="match-standings bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {league?.logo && (
              <img src={league.logo} alt="" className="w-6 h-6 object-contain" />
            )}
            <h3 className="text-lg font-bold text-gray-800 font-condensed">
              {league?.name || 'Klasemen'}
            </h3>
          </div>
          <span className="text-sm text-gray-500 font-condensed">{league?.season}</span>
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-1">
          {['all', 'home', 'away'].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 text-xs rounded font-condensed ${viewMode === mode
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {mode === 'all' ? 'Semua' : mode === 'home' ? 'Kandang' : 'Tandang'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs">
              <th className="py-2 px-3 text-left font-medium font-condensed">#</th>
              <th className="py-2 px-3 text-left font-medium font-condensed">Tim</th>
              <th className="py-2 px-2 text-center font-medium font-condensed">M</th>
              <th className="py-2 px-2 text-center font-medium font-condensed">M</th>
              <th className="py-2 px-2 text-center font-medium font-condensed">S</th>
              <th className="py-2 px-2 text-center font-medium font-condensed">K</th>
              <th className="py-2 px-2 text-center font-medium font-condensed">+/-</th>
              <th className="py-2 px-2 text-center font-medium font-condensed">SG</th>
              <th className="py-2 px-3 text-center font-medium font-condensed">Poin</th>
              <th className="py-2 px-3 text-center font-medium font-condensed hidden sm:table-cell">Form</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((team, idx) => {
              const stats = viewMode === 'home' ? team.home : viewMode === 'away' ? team.away : {
                played: team.played,
                win: team.win,
                draw: team.draw,
                lose: team.lose,
                goals_for: team.goals_for,
                goals_against: team.goals_against
              };

              const isHighlighted = isHighlightedTeam(team.team?.id);
              const positionStyle = getPositionStyle(team.rank, team.description);

              return (
                <tr
                  key={idx}
                  className={`border-b border-gray-50 ${positionStyle} ${isHighlighted ? 'bg-yellow-50 font-semibold' : 'hover:bg-gray-50'
                    }`}
                >
                  <td className="py-2.5 px-3 text-gray-600 font-condensed">{team.rank}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      {team.team?.logo ? (
                        <img src={team.team.logo} alt="" className="w-5 h-5 object-contain" />
                      ) : (
                        <div className="w-5 h-5 bg-gray-200 rounded"></div>
                      )}
                      <span className={`font-condensed ${isHighlighted ? 'text-green-700' : 'text-gray-800'}`}>
                        {team.team?.name || 'Team'}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-center text-gray-600 font-condensed">
                    {viewMode === 'all' ? stats.played : stats.played}
                  </td>
                  <td className="py-2.5 px-2 text-center text-green-600 font-condensed">{stats.win}</td>
                  <td className="py-2.5 px-2 text-center text-gray-500 font-condensed">{stats.draw}</td>
                  <td className="py-2.5 px-2 text-center text-red-500 font-condensed">{stats.lose}</td>
                  <td className="py-2.5 px-2 text-center text-gray-600 font-condensed text-xs">
                    {stats.goals_for}-{stats.goals_against}
                  </td>
                  <td className="py-2.5 px-2 text-center font-condensed">
                    <span className={team.goal_diff > 0 ? 'text-green-600' : team.goal_diff < 0 ? 'text-red-500' : 'text-gray-500'}>
                      {team.goal_diff > 0 ? '+' : ''}{team.goal_diff}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-gray-800 font-condensed">
                    {viewMode === 'all' ? team.points : '-'}
                  </td>
                  <td className="py-2.5 px-3 hidden sm:table-cell">
                    <div className="flex gap-0.5 justify-center">
                      {team.form ? (
                        team.form.split('').slice(-5).map((f, i) => (
                          <span key={i}>{getFormBadge(f)}</span>
                        ))
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="p-3 bg-gray-50 border-t border-gray-100">
        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-blue-500 rounded"></span>
            <span className="font-condensed">Champions League</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-orange-500 rounded"></span>
            <span className="font-condensed">Europa League</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-green-500 rounded"></span>
            <span className="font-condensed">Conference League</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-red-500 rounded"></span>
            <span className="font-condensed">Degradasi</span>
          </div>
        </div>
      </div>
    </div>
  );
}
