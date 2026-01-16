'use client';

import { useState } from 'react';

export default function MatchLineup({ lineups, homeTeam, awayTeam, homeTeamLogo, awayTeamLogo }) {
  const [showSubstitutions, setShowSubstitutions] = useState(false);
  const [viewMode, setViewMode] = useState('lineup'); // 'lineup' or 'stats'

  // Parse lineups data from API
  const homeLineup = lineups?.[0] || null;
  const awayLineup = lineups?.[1] || null;

  const homeFormation = homeLineup?.formation || '4-4-2';
  const awayFormation = awayLineup?.formation || '4-4-2';

  const homeStartXI = homeLineup?.startXI || [];
  const awayStartXI = awayLineup?.startXI || [];

  const homeSubstitutes = homeLineup?.substitutes || [];
  const awaySubstitutes = awayLineup?.substitutes || [];

  const homeCoach = homeLineup?.coach || null;
  const awayCoach = awayLineup?.coach || null;

  // Calculate player positions based on formation
  const getPlayerPositions = (formation, isHome) => {
    const positions = [];
    const lines = formation.split('-').map(Number);

    // GK always at back
    positions.push({ x: 50, y: isHome ? 90 : 10 });

    let currentY = isHome ? 75 : 25;
    const yStep = isHome ? -15 : 15;

    lines.forEach((playersInLine, lineIndex) => {
      const spacing = 80 / (playersInLine + 1);
      for (let i = 0; i < playersInLine; i++) {
        positions.push({
          x: 10 + spacing * (i + 1),
          y: currentY
        });
      }
      currentY += yStep;
    });

    return positions;
  };

  const getRatingColor = (rating) => {
    if (!rating) return 'bg-gray-400';
    if (rating >= 8) return 'bg-green-500';
    if (rating >= 7) return 'bg-green-400';
    if (rating >= 6) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  const renderPlayer = (player, position, isHome, index) => {
    const playerData = player?.player || player;
    const rating = playerData?.rating;

    return (
      <div
        key={playerData?.id || index}
        className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`
        }}
      >
        <div className={`w-8 h-8 ${getRatingColor(rating)} rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white`}>
          {rating ? parseFloat(rating).toFixed(1) : playerData?.number || '?'}
        </div>
        <span className="text-[10px] text-white font-medium mt-1 bg-black/60 px-1.5 py-0.5 rounded whitespace-nowrap font-condensed max-w-[80px] truncate">
          {playerData?.number}. {playerData?.name?.split(' ').pop() || 'Player'}
        </span>
      </div>
    );
  };

  // No lineups available
  if (!lineups || lineups.length === 0) {
    return (
      <div className="match-lineup bg-white rounded-xl shadow-sm p-8 text-center">
        <span className="text-4xl mb-4 block">👥</span>
        <p className="text-gray-500 font-condensed">Lineup belum tersedia</p>
        <p className="text-sm text-gray-400 font-condensed mt-1">Lineup biasanya tersedia 1 jam sebelum kickoff</p>
      </div>
    );
  }

  const homePositions = getPlayerPositions(homeFormation, true);
  const awayPositions = getPlayerPositions(awayFormation, false);

  return (
    <div className="match-lineup bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Sub-tabs */}
      <div className="flex items-center border-b border-gray-100">
        <button
          onClick={() => setViewMode('lineup')}
          className={`flex-1 py-3 text-sm font-medium font-condensed ${viewMode === 'lineup'
              ? 'text-green-600 bg-green-50 border-b-2 border-green-600'
              : 'text-gray-500 hover:bg-gray-50'
            }`}
        >
          Lineup
        </button>
        <button
          onClick={() => setViewMode('stats')}
          className={`flex-1 py-3 text-sm font-medium font-condensed ${viewMode === 'stats'
              ? 'text-green-600 bg-green-50 border-b-2 border-green-600'
              : 'text-gray-500 hover:bg-gray-50'
            }`}
        >
          Stat pemain
        </button>
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center gap-2 p-3 bg-gray-50 border-b border-gray-100 overflow-x-auto">
        {['Performa', 'Klub', 'Usia', 'Harga pasar', 'Tinggi badan'].map((filter, idx) => (
          <button
            key={filter}
            className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap font-condensed ${idx === 0
                ? 'bg-gray-800 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
          >
            {filter} {idx === 0 && '▼'}
          </button>
        ))}
      </div>

      {/* Team Headers with Formation */}
      <div className="flex items-center justify-between px-4 py-3 bg-white">
        <div className="flex items-center gap-3">
          {homeTeamLogo ? (
            <img src={homeTeamLogo} alt="" className="w-6 h-6 object-contain" />
          ) : (
            <div className="w-6 h-6 bg-green-500 rounded"></div>
          )}
          <span className="font-semibold text-gray-800 font-condensed">{homeTeam || 'Home'}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-800 font-condensed">{homeFormation}</span>
          <span className="text-sm font-medium text-gray-800 font-condensed">{awayFormation}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-800 font-condensed">{awayTeam || 'Away'}</span>
          {awayTeamLogo ? (
            <img src={awayTeamLogo} alt="" className="w-6 h-6 object-contain" />
          ) : (
            <div className="w-6 h-6 bg-red-500 rounded"></div>
          )}
        </div>
      </div>

      {/* Football Pitch */}
      <div className="relative mx-4 mb-4">
        <div className="relative w-full aspect-[3/4] bg-gradient-to-b from-green-600 to-green-700 rounded-lg overflow-hidden">
          {/* Pitch Markings */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Center Line */}
            <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
            {/* Center Circle */}
            <circle cx="50" cy="50" r="10" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="1" fill="rgba(255,255,255,0.5)" />

            {/* Top Penalty Area */}
            <rect x="20" y="0" width="60" height="18" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
            <rect x="30" y="0" width="40" height="8" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
            <circle cx="50" cy="12" r="1" fill="rgba(255,255,255,0.5)" />

            {/* Bottom Penalty Area */}
            <rect x="20" y="82" width="60" height="18" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
            <rect x="30" y="92" width="40" height="8" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
            <circle cx="50" cy="88" r="1" fill="rgba(255,255,255,0.5)" />
          </svg>

          {/* Home Team Players (Bottom Half) */}
          {homeStartXI.map((player, index) => {
            const position = homePositions[index] || { x: 50, y: 50 };
            return renderPlayer(player, position, true, index);
          })}

          {/* Away Team Players (Top Half) */}
          {awayStartXI.map((player, index) => {
            const position = awayPositions[index] || { x: 50, y: 50 };
            return renderPlayer(player, position, false, index);
          })}

          {/* Substitution toggle */}
          <div className="absolute top-2 left-2 flex gap-1">
            <label className="flex items-center gap-1 text-xs text-white/80 bg-black/30 px-2 py-1 rounded">
              <input
                type="checkbox"
                checked={showSubstitutions}
                onChange={() => setShowSubstitutions(!showSubstitutions)}
                className="w-3 h-3"
              />
              <span className="font-condensed">Pergantian</span>
            </label>
          </div>
        </div>
      </div>

      {/* Substitutes */}
      {showSubstitutions && (
        <div className="px-4 pb-4">
          <h4 className="font-semibold text-gray-800 mb-3 font-condensed">Pemain Cadangan</h4>
          <div className="grid grid-cols-2 gap-4">
            {/* Home Substitutes */}
            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-condensed">{homeTeam}</p>
              {homeSubstitutes.slice(0, 7).map((sub, idx) => {
                const player = sub?.player || sub;
                return (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold">
                      {player?.number || '-'}
                    </span>
                    <span className="text-gray-700 font-condensed truncate">{player?.name || 'Player'}</span>
                  </div>
                );
              })}
            </div>

            {/* Away Substitutes */}
            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-condensed text-right">{awayTeam}</p>
              {awaySubstitutes.slice(0, 7).map((sub, idx) => {
                const player = sub?.player || sub;
                return (
                  <div key={idx} className="flex items-center gap-2 text-sm justify-end">
                    <span className="text-gray-700 font-condensed truncate">{player?.name || 'Player'}</span>
                    <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold">
                      {player?.number || '-'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Coaches */}
      <div className="px-4 pb-4 border-t border-gray-100 pt-4">
        <h4 className="font-semibold text-gray-800 mb-3 font-condensed">Manajer</h4>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {homeCoach?.photo ? (
              <img src={homeCoach.photo} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-lg">👤</span>
              </div>
            )}
            <div>
              <p className="font-medium text-gray-800 font-condensed">{homeCoach?.name || 'Manager'}</p>
              <p className="text-xs text-green-600 font-condensed">Manajer</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-medium text-gray-800 font-condensed">{awayCoach?.name || 'Manager'}</p>
              <p className="text-xs text-green-600 font-condensed">Manajer</p>
            </div>
            {awayCoach?.photo ? (
              <img src={awayCoach.photo} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-lg">👤</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
