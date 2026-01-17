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

  // Team colors (bisa di-customize berdasarkan team)
  const homeColor = homeLineup?.team?.colors?.player?.primary || '#dc2626'; // red
  const awayColor = awayLineup?.team?.colors?.player?.primary || '#2563eb'; // blue

  // Get player positions for HORIZONTAL layout (left to right)
  const getHorizontalPositions = (formation, isHome) => {
    const positions = [];
    const lines = formation.split('-').map(Number);

    const totalLines = lines.length + 1; // +1 for GK

    if (isHome) {
      // HOME TEAM: Left side (0% - 48%)
      // GK at 5%, defenders spread towards 45%
      const xStart = 5;
      const xEnd = 45;
      const xStep = (xEnd - xStart) / totalLines;

      // GK
      positions.push({ x: xStart, y: 50 });

      // Field players (defenders → midfielders → forwards)
      lines.forEach((playersInLine, lineIndex) => {
        const xPos = xStart + xStep * (lineIndex + 1);

        const verticalMargin = 10;
        const availableHeight = 100 - (verticalMargin * 2);
        const ySpacing = availableHeight / (playersInLine + 1);

        for (let i = 0; i < playersInLine; i++) {
          positions.push({
            x: xPos,
            y: verticalMargin + ySpacing * (i + 1)
          });
        }
      });
    } else {
      // AWAY TEAM: Right side (52% - 100%)
      // GK at 95%, defenders spread towards 55%
      const xStart = 95;
      const xEnd = 55;
      const xStep = (xStart - xEnd) / totalLines;

      // GK
      positions.push({ x: xStart, y: 50 });

      // Field players (defenders → midfielders → forwards)
      lines.forEach((playersInLine, lineIndex) => {
        const xPos = xStart - xStep * (lineIndex + 1);

        const verticalMargin = 10;
        const availableHeight = 100 - (verticalMargin * 2);
        const ySpacing = availableHeight / (playersInLine + 1);

        for (let i = 0; i < playersInLine; i++) {
          positions.push({
            x: xPos,
            y: verticalMargin + ySpacing * (i + 1)
          });
        }
      });
    }

    return positions;
  };

  const getRatingColor = (rating) => {
    if (!rating) return 'bg-gray-500';
    const r = parseFloat(rating);
    if (r >= 8) return 'bg-blue-500';
    if (r >= 7) return 'bg-green-500';
    if (r >= 6) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const renderPlayerHorizontal = (player, position, isHome, teamColor, index) => {
    const playerData = player?.player || player;
    const rating = playerData?.rating;
    const number = playerData?.number || '?';
    const name = playerData?.name?.split(' ').pop() || 'Player';

    return (
      <div
        key={playerData?.id || index}
        className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group"
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`
        }}
        title={`${number}. ${playerData?.name || 'Player'}`}
      >
        {/* Rating badge (if available) */}
        {rating && (
          <div className={`absolute -top-0.5 -right-0.5 w-3.5 h-3.5 ${getRatingColor(rating)} rounded text-[7px] font-bold text-white flex items-center justify-center z-10 border border-white/50`}>
            {parseFloat(rating).toFixed(1)}
          </div>
        )}

        {/* Player circle - smaller */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-md border-2 border-white/60"
          style={{ backgroundColor: isHome ? '#dc2626' : '#facc15', color: isHome ? 'white' : '#1f2937' }}
        >
          {number}
        </div>

        {/* Player name - only show on hover */}
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity px-1 py-0.5 bg-black/80 rounded text-[8px] text-white font-medium whitespace-nowrap z-20">
          {name}
        </div>
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

  const homePositions = getHorizontalPositions(homeFormation, true);
  const awayPositions = getHorizontalPositions(awayFormation, false);

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

      {viewMode === 'lineup' ? (
        <>
          {/* Filter Buttons */}
          <div className="flex items-center gap-2 p-3 bg-gray-50 border-b border-gray-100 overflow-x-auto">
            {['Performa', 'Kewarganegaraan', 'Usia', 'Nilai Pasar', 'Tinggi Badan'].map((filter, idx) => (
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

          {/* Team Headers with Formation - Better mobile layout */}
          <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-white border-b border-gray-100">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
              {homeTeamLogo ? (
                <img src={homeTeamLogo} alt="" className="w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0" />
              ) : (
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-red-500 rounded-full flex-shrink-0"></div>
              )}
              <span className="font-semibold text-gray-800 font-condensed text-xs sm:text-sm truncate">{homeTeam || 'Home'}</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 px-2">
              <span className="text-[10px] sm:text-xs text-gray-500 bg-gray-100 px-1.5 sm:px-2 py-0.5 rounded font-condensed">{homeFormation}</span>
              <span className="text-[10px] sm:text-xs text-gray-500 bg-gray-100 px-1.5 sm:px-2 py-0.5 rounded font-condensed">{awayFormation}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 justify-end">
              <span className="font-semibold text-gray-800 font-condensed text-xs sm:text-sm truncate">{awayTeam || 'Away'}</span>
              {awayTeamLogo ? (
                <img src={awayTeamLogo} alt="" className="w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0" />
              ) : (
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-yellow-500 rounded-full flex-shrink-0"></div>
              )}
            </div>
          </div>

          {/* Horizontal Football Pitch - Taller */}
          <div className="relative mx-3 my-3">
            {/* Pergantian Toggle */}
            <div className="absolute top-2 left-2 z-20">
              <label className="flex items-center gap-1.5 text-[10px] text-white bg-black/50 px-2 py-1 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSubstitutions}
                  onChange={() => setShowSubstitutions(!showSubstitutions)}
                  className="w-3 h-3 rounded"
                />
                <span className="font-condensed">Pergantian</span>
              </label>
            </div>

            <div className="relative w-full aspect-[5/3] bg-gradient-to-r from-green-600 via-green-500 to-green-600 rounded-lg overflow-hidden">
              {/* Pitch Markings - Horizontal */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
                {/* Outer border */}
                <rect x="1" y="1" width="98" height="48" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" />

                {/* Center Line */}
                <line x1="50" y1="1" x2="50" y2="49" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" />

                {/* Center Circle */}
                <circle cx="50" cy="25" r="8" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" />
                <circle cx="50" cy="25" r="0.8" fill="rgba(255,255,255,0.5)" />

                {/* Left Penalty Area (Home) */}
                <rect x="1" y="13" width="12" height="24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" />
                <rect x="1" y="18" width="5" height="14" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" />
                {/* Left Goal */}
                <rect x="0" y="20" width="1" height="10" fill="rgba(255,255,255,0.3)" />

                {/* Right Penalty Area (Away) */}
                <rect x="87" y="13" width="12" height="24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" />
                <rect x="94" y="18" width="5" height="14" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" />
                {/* Right Goal */}
                <rect x="99" y="20" width="1" height="10" fill="rgba(255,255,255,0.3)" />

                {/* Corner arcs */}
                <path d="M 1 4 Q 4 4 4 1" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" />
                <path d="M 1 46 Q 4 46 4 49" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" />
                <path d="M 99 4 Q 96 4 96 1" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" />
                <path d="M 99 46 Q 96 46 96 49" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" />
              </svg>

              {/* Pitch markings only - no formation labels inside pitch */}

              {/* Home Team Players (Left Side 0-48%) */}
              {homeStartXI.map((player, index) => {
                const position = homePositions[index] || { x: 25, y: 50 };
                return renderPlayerHorizontal(player, position, true, homeColor, index);
              })}

              {/* Away Team Players (Right Side 52-100%) */}
              {awayStartXI.map((player, index) => {
                const position = awayPositions[index] || { x: 75, y: 50 };
                return renderPlayerHorizontal(player, position, false, awayColor, index);
              })}
            </div>
          </div>

          {/* Starting XI & Substitutes Lists - Like API-Football */}
          <div className="border-t border-gray-100">
            {/* Team Headers - Hidden on mobile (already shown above pitch) */}
            <div className="hidden sm:grid grid-cols-2">
              {/* Home Team Header */}
              <div className="p-3 border-r border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  {homeTeamLogo ? (
                    <img src={homeTeamLogo} alt="" className="w-6 h-6 object-contain" />
                  ) : (
                    <div className="w-6 h-6 bg-red-500 rounded-full"></div>
                  )}
                  <div>
                    <span className="font-bold text-gray-800 font-condensed text-sm">{homeTeam || 'Home'}</span>
                    <span className="text-xs text-gray-500 ml-2 font-condensed">{homeFormation}</span>
                  </div>
                </div>
              </div>

              {/* Away Team Header */}
              <div className="p-3 bg-gray-50">
                <div className="flex items-center gap-2">
                  {awayTeamLogo ? (
                    <img src={awayTeamLogo} alt="" className="w-6 h-6 object-contain" />
                  ) : (
                    <div className="w-6 h-6 bg-yellow-500 rounded-full"></div>
                  )}
                  <div>
                    <span className="font-bold text-gray-800 font-condensed text-sm">{awayTeam || 'Away'}</span>
                    <span className="text-xs text-gray-500 ml-2 font-condensed">{awayFormation}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Coach Row */}
            <div className="grid grid-cols-2 border-t border-gray-100">
              <div className="px-3 py-2 border-r border-gray-100">
                <p className="text-[10px] text-gray-400 font-condensed uppercase tracking-wide">Coach</p>
                <p className="text-xs sm:text-sm text-gray-700 font-condensed truncate">{homeCoach?.name || 'Manager'}</p>
              </div>
              <div className="px-3 py-2">
                <p className="text-[10px] text-gray-400 font-condensed uppercase tracking-wide">Coach</p>
                <p className="text-xs sm:text-sm text-gray-700 font-condensed truncate">{awayCoach?.name || 'Manager'}</p>
              </div>
            </div>

            {/* Starting XI Label */}
            <div className="grid grid-cols-2 border-t border-gray-100 bg-slate-700">
              <div className="px-2 sm:px-3 py-1.5 border-r border-slate-600">
                <p className="text-[10px] sm:text-xs text-white font-condensed font-semibold">STARTING XI</p>
              </div>
              <div className="px-2 sm:px-3 py-1.5">
                <p className="text-[10px] sm:text-xs text-white font-condensed font-semibold">STARTING XI</p>
              </div>
            </div>

            {/* Starting XI Players */}
            <div className="grid grid-cols-2">
              {/* Home Starting XI */}
              <div className="border-r border-gray-100">
                {homeStartXI.map((item, idx) => {
                  const player = item?.player || item;
                  return (
                    <div key={idx} className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 border-b border-gray-50 hover:bg-gray-50">
                      <span className="text-[10px] sm:text-xs text-gray-400 font-condensed w-4 sm:w-5 flex-shrink-0">{player?.number}</span>
                      <span className="text-xs sm:text-sm text-gray-800 font-condensed truncate">{player?.name || 'Player'}</span>
                    </div>
                  );
                })}
              </div>

              {/* Away Starting XI */}
              <div>
                {awayStartXI.map((item, idx) => {
                  const player = item?.player || item;
                  return (
                    <div key={idx} className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 border-b border-gray-50 hover:bg-gray-50">
                      <span className="text-[10px] sm:text-xs text-gray-400 font-condensed w-4 sm:w-5 flex-shrink-0">{player?.number}</span>
                      <span className="text-xs sm:text-sm text-gray-800 font-condensed truncate">{player?.name || 'Player'}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Substitutes Label */}
            <div className="grid grid-cols-2 border-t border-gray-100 bg-slate-600">
              <div className="px-2 sm:px-3 py-1.5 border-r border-slate-500">
                <p className="text-[10px] sm:text-xs text-white font-condensed font-semibold">SUBSTITUTES</p>
              </div>
              <div className="px-2 sm:px-3 py-1.5">
                <p className="text-[10px] sm:text-xs text-white font-condensed font-semibold">SUBSTITUTES</p>
              </div>
            </div>

            {/* Substitutes Players */}
            <div className="grid grid-cols-2">
              {/* Home Substitutes */}
              <div className="border-r border-gray-100">
                {homeSubstitutes.map((item, idx) => {
                  const player = item?.player || item;
                  return (
                    <div key={idx} className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 border-b border-gray-50 hover:bg-gray-50">
                      <span className="text-[10px] sm:text-xs text-gray-400 font-condensed w-4 sm:w-5 flex-shrink-0">{player?.number}</span>
                      <span className="text-xs sm:text-sm text-gray-800 font-condensed truncate">{player?.name || 'Player'}</span>
                    </div>
                  );
                })}
              </div>

              {/* Away Substitutes */}
              <div>
                {awaySubstitutes.map((item, idx) => {
                  const player = item?.player || item;
                  return (
                    <div key={idx} className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 border-b border-gray-50 hover:bg-gray-50">
                      <span className="text-[10px] sm:text-xs text-gray-400 font-condensed w-4 sm:w-5 flex-shrink-0">{player?.number}</span>
                      <span className="text-xs sm:text-sm text-gray-800 font-condensed truncate">{player?.name || 'Player'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Stat Pemain View */
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Home Team Stats */}
            <div>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                {homeTeamLogo && <img src={homeTeamLogo} alt="" className="w-5 h-5 object-contain" />}
                <span className="font-semibold text-gray-800 font-condensed text-sm">{homeTeam}</span>
              </div>
              <div className="space-y-2">
                {homeStartXI.slice(0, 11).map((item, idx) => {
                  const player = item?.player || item;
                  const rating = player?.rating;
                  return (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 w-4">{player?.number}</span>
                        <span className="text-gray-800 font-condensed truncate max-w-[100px]">{player?.name}</span>
                      </div>
                      {rating && (
                        <span className={`px-1.5 py-0.5 rounded text-white text-[10px] font-bold ${getRatingColor(rating)}`}>
                          {parseFloat(rating).toFixed(1)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Away Team Stats */}
            <div>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100 justify-end">
                <span className="font-semibold text-gray-800 font-condensed text-sm">{awayTeam}</span>
                {awayTeamLogo && <img src={awayTeamLogo} alt="" className="w-5 h-5 object-contain" />}
              </div>
              <div className="space-y-2">
                {awayStartXI.slice(0, 11).map((item, idx) => {
                  const player = item?.player || item;
                  const rating = player?.rating;
                  return (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      {rating && (
                        <span className={`px-1.5 py-0.5 rounded text-white text-[10px] font-bold ${getRatingColor(rating)}`}>
                          {parseFloat(rating).toFixed(1)}
                        </span>
                      )}
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-gray-800 font-condensed truncate max-w-[100px]">{player?.name}</span>
                        <span className="text-gray-500 w-4 text-right">{player?.number}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
