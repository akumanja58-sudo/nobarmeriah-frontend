'use client';

import { useState, useMemo, useEffect } from 'react';
import { ChevronRight, Trophy, RotateCcw, Play } from 'lucide-react';

const flagUrl = (code) => `https://flagcdn.com/w40/${code}.png`;
const flagUrlLg = (code) => `https://flagcdn.com/w80/${code}.png`;
const Flag = ({ code, size = 20 }) => (
  <img src={flagUrl(code)} alt="" className="inline-block object-cover rounded-sm" style={{ width: size, height: Math.round(size * 0.75) }} />
);

// Match simulation (same as group stage)
const simKnockout = (teamA, teamB) => {
  const str = (t) => t.stars * 15 + Math.random() * 40;
  const sA = str(teamA), sB = str(teamB);
  const maxGoals = (s) => s > 70 ? 4 : s > 50 ? 3 : 2;
  let gA = 0, gB = 0;
  for (let i = 0; i < 10; i++) {
    if (Math.random() * 100 < sA * 0.5) gA = Math.min(gA + 1, maxGoals(sA));
    if (Math.random() * 100 < sB * 0.5) gB = Math.min(gB + 1, maxGoals(sB));
  }
  // Knockout: no draws — penalty shootout
  if (gA === gB) {
    const penA = 3 + Math.floor(Math.random() * 3);
    const penB = penA === 4 ? (Math.random() > 0.5 ? 5 : 3) : (Math.random() > 0.5 ? penA + 1 : penA - 1);
    return { goalsA: gA, goalsB: gB, penA, penB, penalties: true };
  }
  return { goalsA: gA, goalsB: gB, penalties: false };
};

// Round names
const ROUND_NAMES = {
  'r32': 'Babak 32 Besar',
  'r16': 'Babak 16 Besar',
  'qf': 'Perempat Final',
  'sf': 'Semi Final',
  'final': 'FINAL',
};

const ROUND_ORDER = ['r32', 'r16', 'qf', 'sf', 'final'];

// Generate knockout bracket from group standings
// 12 groups × top 2 = 24 teams
// Round of 32: 8 group winners get bye, 8 group winners + 16 runners-up play
// Actually simpler: 24 teams → need 8 matches in R32 to get to 16
// 8 teams get bye (top 8 group winners by points), 16 teams play 8 matches
function generateBracket(allGroupStandings, playerTeam) {
  const qualified = [];
  const GL = 'ABCDEFGHIJKL'.split('');

  GL.forEach(g => {
    const st = allGroupStandings[g];
    if (st && st.length >= 2) {
      qualified.push({ ...st[0], groupPos: 1, group: g });
      qualified.push({ ...st[1], groupPos: 2, group: g });
    }
  });

  // Sort group winners by points to determine byes
  const winners = qualified.filter(q => q.groupPos === 1).sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);
  const runnersUp = qualified.filter(q => q.groupPos === 2).sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);

  // Top 8 winners get bye to R16
  const byeTeams = winners.slice(0, 8).map(w => w.team);
  // Remaining 4 winners + 12 runners-up = 16 teams play R32
  const r32Teams = [...winners.slice(8).map(w => w.team), ...runnersUp.map(r => r.team)];

  // Shuffle R32 teams and pair them (1st vs last seed style)
  const shuffled = [...r32Teams].sort(() => Math.random() - 0.5);

  // Make sure player team is in the bracket
  const playerInBye = byeTeams.find(t => t.id === playerTeam.id);
  const playerInR32 = shuffled.find(t => t.id === playerTeam.id);

  // R32 matches: 8 matches from 16 teams
  const r32Matches = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    if (i + 1 < shuffled.length) {
      r32Matches.push({ home: shuffled[i], away: shuffled[i + 1], result: null, id: `r32-${r32Matches.length}` });
    }
  }

  // R16: 8 bye teams + 8 R32 winners
  // Shuffle bye teams
  const shuffledByes = [...byeTeams].sort(() => Math.random() - 0.5);
  const r16Matches = shuffledByes.map((team, i) => ({
    home: team, away: null, // will be filled by R32 winner
    result: null,
    id: `r16-${i}`,
    feedsFrom: r32Matches[i]?.id || null,
  }));

  // QF, SF, Final — empty, filled as rounds complete
  const qfMatches = Array.from({ length: 4 }, (_, i) => ({
    home: null, away: null, result: null, id: `qf-${i}`,
  }));
  const sfMatches = Array.from({ length: 2 }, (_, i) => ({
    home: null, away: null, result: null, id: `sf-${i}`,
  }));
  const finalMatch = [{ home: null, away: null, result: null, id: 'final-0' }];

  return {
    r32: r32Matches,
    r16: r16Matches,
    qf: qfMatches,
    sf: sfMatches,
    final: finalMatch,
  };
}

function getWinner(match) {
  if (!match.result) return null;
  const { goalsA, goalsB, penA, penB, penalties } = match.result;
  if (penalties) return penA > penB ? match.home : match.away;
  return goalsA > goalsB ? match.home : match.away;
}

export default function KnockoutStage({ bracket: initialBracket, playerTeam, onStartMatch, onRestart, resultCallbackRef }) {
  const [bracket, setBracket] = useState(initialBracket);
  const [currentRound, setCurrentRound] = useState('r32');
  const [gameOver, setGameOver] = useState(false);
  const [champion, setChampion] = useState(null);
  const [viewRound, setViewRound] = useState('r32');
  const [showBracket, setShowBracket] = useState(false);

  // Expose match result handler via ref
  if (resultCallbackRef) {
    resultCallbackRef.current = (result) => handleKnockoutMatchResult(result);
  }

  // Find player's current match in the current round
  const playerMatch = useMemo(() => {
    const roundMatches = bracket[currentRound] || [];
    return roundMatches.find(m =>
      (m.home?.id === playerTeam.id || m.away?.id === playerTeam.id) && !m.result
    );
  }, [bracket, currentRound, playerTeam]);

  // Check if player was eliminated (lost in previous round)
  const playerEliminated = useMemo(() => {
    for (const round of ROUND_ORDER) {
      const matches = bracket[round] || [];
      const pm = matches.find(m => m.result && (m.home?.id === playerTeam.id || m.away?.id === playerTeam.id));
      if (pm) {
        const winner = getWinner(pm);
        if (winner && winner.id !== playerTeam.id) return round;
      }
    }
    return null;
  }, [bracket, playerTeam]);

  // Check if player has a bye (skip R32)
  const playerHasBye = useMemo(() => {
    const r32 = bracket.r32 || [];
    const inR32 = r32.find(m => m.home?.id === playerTeam.id || m.away?.id === playerTeam.id);
    if (!inR32) {
      // Player might be in R16 as bye team
      const r16 = bracket.r16 || [];
      return r16.find(m => m.home?.id === playerTeam.id);
    }
    return null;
  }, [bracket, playerTeam]);

  // Advance round after all matches are done
  const roundComplete = useMemo(() => {
    const matches = bracket[currentRound] || [];
    return matches.length > 0 && matches.every(m => m.result || (!m.home && !m.away));
  }, [bracket, currentRound]);

  // Auto-sim non-player matches when player finishes their match
  const simRemainingInRound = () => {
    setBracket(prev => {
      const updated = { ...prev };
      const matches = [...(updated[currentRound] || [])];
      updated[currentRound] = matches.map(m => {
        if (m.result || !m.home || !m.away) return m;
        if (m.home.id === playerTeam.id || m.away.id === playerTeam.id) return m;
        return { ...m, result: simKnockout(m.home, m.away) };
      });
      return updated;
    });
  };

  // Advance to next round
  const advanceRound = () => {
    const curIdx = ROUND_ORDER.indexOf(currentRound);
    if (curIdx >= ROUND_ORDER.length - 1) {
      // Final is done
      const finalMatch = bracket.final[0];
      if (finalMatch?.result) {
        const w = getWinner(finalMatch);
        if (w.id === playerTeam.id) setChampion(playerTeam);
        else { setGameOver(true); }
      }
      return;
    }

    const nextRoundKey = ROUND_ORDER[curIdx + 1];
    const currentMatches = bracket[currentRound] || [];
    const winners = currentMatches.map(m => getWinner(m)).filter(Boolean);

    // Fill next round
    setBracket(prev => {
      const updated = { ...prev };
      const nextMatches = [...(updated[nextRoundKey] || [])];

      if (currentRound === 'r32') {
        // R32 winners go into R16 as away teams
        nextMatches.forEach((m, i) => {
          if (winners[i]) {
            nextMatches[i] = { ...m, away: winners[i] };
          }
        });
      } else {
        // Pair winners: 0v1, 2v3, etc.
        for (let i = 0; i < winners.length; i += 2) {
          const matchIdx = Math.floor(i / 2);
          if (matchIdx < nextMatches.length) {
            nextMatches[matchIdx] = {
              ...nextMatches[matchIdx],
              home: winners[i] || null,
              away: winners[i + 1] || null,
            };
          }
        }
      }

      updated[nextRoundKey] = nextMatches;
      return updated;
    });

    setCurrentRound(nextRoundKey);
    setViewRound(nextRoundKey);
  };

  // Handle player's match result from MatchLive
  const handleKnockoutMatchResult = (result) => {
    setBracket(prev => {
      const updated = { ...prev };
      const matches = [...(updated[currentRound] || [])];
      updated[currentRound] = matches.map(m => {
        if (m.home?.id === playerTeam.id || m.away?.id === playerTeam.id) {
          if (!m.result) return { ...m, result };
        }
        return m;
      });
      return updated;
    });

    // Check if player lost
    const isHome = playerMatch?.home?.id === playerTeam.id;
    const playerWon = result.penalties
      ? (isHome ? result.penA > result.penB : result.penB > result.penA)
      : (isHome ? result.goalsA > result.goalsB : result.goalsB > result.goalsA);

    if (!playerWon) {
      setTimeout(() => setGameOver(true), 500);
      return;
    }

    // Sim remaining matches
    setTimeout(() => simRemainingInRound(), 500);
  };

  // Current round display
  const displayMatches = bracket[viewRound] || [];

  // Check if player's R32 is applicable
  const playerSkipsR32 = !bracket.r32.find(m => m.home?.id === playerTeam.id || m.away?.id === playerTeam.id);

  // Auto-advance R32 if player has bye
  useEffect(() => {
    if (currentRound === 'r32' && playerSkipsR32) {
      // Auto-sim all R32 matches
      setBracket(prev => {
        const updated = { ...prev };
        updated.r32 = (updated.r32 || []).map(m => {
          if (m.result || !m.home || !m.away) return m;
          return { ...m, result: simKnockout(m.home, m.away) };
        });
        return updated;
      });
    }
  }, [currentRound, playerSkipsR32]);

  // Auto-advance when R32 all done and player had bye
  useEffect(() => {
    if (currentRound === 'r32' && playerSkipsR32) {
      const allDone = bracket.r32.every(m => m.result);
      if (allDone) {
        setTimeout(() => advanceRound(), 1000);
      }
    }
  }, [bracket.r32, currentRound, playerSkipsR32]);

  // ============ CHAMPION SCREEN ============
  if (champion) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-b from-yellow-400 via-yellow-500 to-amber-600 flex items-center justify-center">
        <div className="text-center p-6 max-w-md">
          <div className="text-6xl lg:text-8xl mb-4" style={{ animation: 'wcSlideUp 0.5s ease-out' }}>🏆</div>
          <h1 className="text-3xl lg:text-5xl font-bold font-condensed text-white mb-2" style={{ animation: 'wcSlideUp 0.7s ease-out' }}>
            JUARA DUNIA!
          </h1>
          <div className="my-6" style={{ animation: 'wcSlideUp 0.9s ease-out' }}>
            <img src={flagUrlLg(champion.flagCode)} alt="" className="mx-auto rounded shadow-lg" style={{ width: 100, height: 75 }} />
            <p className="text-2xl lg:text-3xl font-bold font-condensed text-white mt-3">{champion.name}</p>
            <p className="text-yellow-200 font-condensed text-lg">FIFA World Cup 2026™ Champion</p>
          </div>
          <div className="text-5xl mb-6" style={{ animation: 'wcSlideUp 1.1s ease-out' }}>🎉🎊🥇🎊🎉</div>
          <button onClick={onRestart}
            className="px-8 py-4 bg-white text-yellow-700 font-bold font-condensed rounded-full text-lg shadow-xl hover:bg-yellow-50 transition-all flex items-center gap-2 mx-auto"
            style={{ animation: 'wcSlideUp 1.3s ease-out' }}>
            <RotateCcw className="w-5 h-5" /> Main Lagi
          </button>
        </div>
      </div>
    );
  }

  // ============ GAME OVER SCREEN ============
  if (gameOver) {
    const eliminatedRound = playerEliminated || currentRound;
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-b from-gray-800 via-gray-900 to-black flex items-center justify-center">
        <div className="text-center p-6 max-w-md">
          <div className="text-5xl lg:text-7xl mb-4" style={{ animation: 'wcSlideUp 0.5s ease-out' }}>😢</div>
          <h1 className="text-2xl lg:text-4xl font-bold font-condensed text-white mb-2" style={{ animation: 'wcSlideUp 0.7s ease-out' }}>
            TERSINGKIR
          </h1>
          <p className="text-gray-400 font-condensed text-lg" style={{ animation: 'wcSlideUp 0.9s ease-out' }}>
            {playerTeam.name} gugur di {ROUND_NAMES[eliminatedRound] || eliminatedRound}
          </p>
          <div className="my-6" style={{ animation: 'wcSlideUp 1s ease-out' }}>
            <img src={flagUrlLg(playerTeam.flagCode)} alt="" className="mx-auto rounded shadow-lg opacity-50" style={{ width: 80, height: 60 }} />
          </div>
          <button onClick={onRestart}
            className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold font-condensed rounded-full text-lg shadow-xl flex items-center gap-2 mx-auto transition-all"
            style={{ animation: 'wcSlideUp 1.2s ease-out' }}>
            <RotateCcw className="w-5 h-5" /> Main Lagi dari Awal
          </button>
        </div>
      </div>
    );
  }

  // ============ KNOCKOUT BRACKET VIEW ============
  return (
    <div>
      {/* Round Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex overflow-x-auto max-w-5xl mx-auto" style={{ scrollbarWidth: 'none' }}>
          {ROUND_ORDER.map(r => {
            const isActive = !showBracket && viewRound === r;
            const isCurrent = currentRound === r;
            const roundDone = (bracket[r] || []).every(m => m.result);
            return (
              <button key={r} onClick={() => { setViewRound(r); setShowBracket(false); }}
                className={`flex-shrink-0 px-4 py-3 text-xs lg:text-sm font-bold font-condensed text-center transition-colors whitespace-nowrap ${isActive ? 'text-green-600 border-b-2 border-green-600' :
                    roundDone ? 'text-gray-400' :
                      isCurrent ? 'text-green-500' : 'text-gray-300'
                  }`}>
                {ROUND_NAMES[r]}
                {roundDone && ' ✓'}
                {isCurrent && !roundDone && ' ●'}
              </button>
            );
          })}
          <button onClick={() => setShowBracket(true)}
            className={`flex-shrink-0 px-4 py-3 text-xs lg:text-sm font-bold font-condensed text-center transition-colors whitespace-nowrap ${showBracket ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-400'
              }`}>
            🏆 Bracket
          </button>
        </div>
      </div>

      {/* BRACKET TREE VIEW */}
      {showBracket && (
        <div className="max-w-5xl mx-auto px-3 lg:px-6 py-4 overflow-x-auto">
          <h2 className="text-lg font-bold font-condensed text-gray-900 text-center mb-4">🏆 Bracket Knockout</h2>
          <div className="flex gap-4 lg:gap-6 min-w-[700px] items-start pb-4">
            {['r16', 'qf', 'sf', 'final'].map((round, rIdx) => {
              const matches = bracket[round] || [];
              const roundHeight = rIdx === 0 ? 'gap-2' : rIdx === 1 ? 'gap-8' : rIdx === 2 ? 'gap-24' : 'gap-0';
              return (
                <div key={round} className="flex-1 min-w-[140px] lg:min-w-[160px]">
                  <p className="text-[10px] font-bold font-condensed text-gray-400 uppercase tracking-wider text-center mb-2">{ROUND_NAMES[round]}</p>
                  <div className={`flex flex-col ${roundHeight}`} style={{ justifyContent: 'center', minHeight: rIdx === 0 ? 'auto' : `${matches.length * 70 + (matches.length - 1) * (rIdx * 30)}px` }}>
                    {matches.map((m, i) => {
                      const winner = getWinner(m);
                      const isPlayer = m.home?.id === playerTeam.id || m.away?.id === playerTeam.id;
                      return (
                        <div key={m.id} className={`rounded-lg border overflow-hidden text-[10px] lg:text-xs ${isPlayer ? 'border-green-400 shadow-sm' : 'border-gray-200'
                          }`}>
                          <div className={`flex items-center gap-1 px-2 py-1.5 ${m.home ? (winner?.id === m.home.id ? 'bg-green-50 font-bold' : m.result ? 'bg-gray-50 text-gray-400' : 'bg-white') : 'bg-gray-50'}`}>
                            {m.home ? <Flag code={m.home.flagCode} size={14} /> : null}
                            <span className="flex-1 truncate font-condensed">{m.home?.name || 'TBD'}</span>
                            {m.result && <span className="font-bold font-condensed">{m.result.goalsA}</span>}
                          </div>
                          <div className="h-px bg-gray-200" />
                          <div className={`flex items-center gap-1 px-2 py-1.5 ${m.away ? (winner?.id === m.away.id ? 'bg-green-50 font-bold' : m.result ? 'bg-gray-50 text-gray-400' : 'bg-white') : 'bg-gray-50'}`}>
                            {m.away ? <Flag code={m.away.flagCode} size={14} /> : null}
                            <span className="flex-1 truncate font-condensed">{m.away?.name || 'TBD'}</span>
                            {m.result && <span className="font-bold font-condensed">{m.result.goalsB}</span>}
                          </div>
                          {m.result?.penalties && (
                            <div className="bg-gray-100 text-center py-0.5">
                              <span className="text-[8px] font-condensed text-gray-500">Pen: {m.result.penA}-{m.result.penB}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ROUND MATCHES VIEW */}
      {!showBracket && (

        <div className="max-w-5xl mx-auto px-3 lg:px-6 py-4 lg:py-6 space-y-4">
          {/* Round Header */}
          <div className="text-center">
            <h2 className="text-lg lg:text-2xl font-bold font-condensed text-gray-900">{ROUND_NAMES[viewRound]}</h2>
            {viewRound === currentRound && playerMatch && (
              <p className="text-sm text-green-600 font-condensed mt-1">🎮 Pertandingan kamu ada di babak ini!</p>
            )}
            {viewRound === 'r32' && playerSkipsR32 && (
              <p className="text-sm text-blue-600 font-condensed mt-1">⭐ Tim kamu mendapat bye — langsung ke Babak 16 Besar!</p>
            )}
          </div>

          {/* Player's Match Card (if in this round) */}
          {viewRound === currentRound && playerMatch && !playerMatch.result && (
            <div className="rounded-xl lg:rounded-2xl border-2 border-green-500 overflow-hidden">
              <div className="bg-green-50 p-4 lg:bg-gradient-to-br lg:from-green-800 lg:via-green-700 lg:to-emerald-800 lg:p-8 lg:text-white">
                <p className="text-[10px] lg:text-xs font-condensed uppercase tracking-wider font-bold text-green-600 lg:text-green-300 mb-2 lg:mb-4">
                  🎮 {ROUND_NAMES[currentRound]}
                </p>
                <div className="flex items-center justify-center gap-4 lg:gap-10">
                  <div className="text-center">
                    <Flag code={playerMatch.home.flagCode} size={36} />
                    <p className="text-xs lg:text-base font-bold font-condensed mt-1">{playerMatch.home.name}</p>
                    <p className="text-yellow-500 text-[9px] lg:text-sm">{'★'.repeat(playerMatch.home.stars)}</p>
                  </div>
                  <span className="text-2xl lg:text-4xl font-bold font-condensed text-gray-300 lg:text-white/30">VS</span>
                  <div className="text-center">
                    <Flag code={playerMatch.away.flagCode} size={36} />
                    <p className="text-xs lg:text-base font-bold font-condensed mt-1">{playerMatch.away.name}</p>
                    <p className="text-yellow-500 text-[9px] lg:text-sm">{'★'.repeat(playerMatch.away.stars)}</p>
                  </div>
                </div>
                <button onClick={() => onStartMatch(playerMatch, currentRound)}
                  className="w-full lg:max-w-xs lg:mx-auto mt-3 lg:mt-6 py-3.5 lg:py-4 bg-green-600 lg:bg-yellow-400 lg:text-gray-900 hover:bg-green-700 lg:hover:bg-yellow-300 text-white font-bold font-condensed rounded-xl flex items-center justify-center gap-2 shadow-md text-base lg:text-lg lg:rounded-full">
                  <Play className="w-5 h-5" /> PERSIAPAN PERTANDINGAN
                </button>
              </div>
            </div>
          )}

          {/* Advance Button */}
          {viewRound === currentRound && roundComplete && !champion && !gameOver && currentRound !== 'final' && (
            <button onClick={advanceRound}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold font-condensed rounded-xl text-lg flex items-center justify-center gap-2 shadow-lg">
              Lanjut ke {ROUND_NAMES[ROUND_ORDER[ROUND_ORDER.indexOf(currentRound) + 1]]} <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Final check after final match */}
          {currentRound === 'final' && roundComplete && !champion && !gameOver && (
            <button onClick={() => {
              const w = getWinner(bracket.final[0]);
              if (w?.id === playerTeam.id) setChampion(playerTeam);
              else setGameOver(true);
            }}
              className="w-full py-4 bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-bold font-condensed rounded-xl text-lg flex items-center justify-center gap-2 shadow-lg">
              🏆 Lihat Hasil Final
            </button>
          )}

          {/* Match Cards */}
          <div className="grid gap-3 lg:grid-cols-2">
            {displayMatches.map((match, i) => {
              if (!match.home && !match.away) {
                return (
                  <div key={match.id} className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-4 text-center">
                    <p className="text-xs font-condensed text-gray-400">Menunggu babak sebelumnya</p>
                  </div>
                );
              }
              const isPlayer = match.home?.id === playerTeam.id || match.away?.id === playerTeam.id;
              const winner = getWinner(match);
              const played = !!match.result;
              return (
                <div key={match.id} className={`bg-white rounded-xl border-2 p-3 lg:p-4 ${isPlayer ? (played ? (winner?.id === playerTeam.id ? 'border-green-400 bg-green-50/50' : 'border-red-300 bg-red-50/50') : 'border-green-500') : 'border-gray-200'
                  }`}>
                  {isPlayer && <p className="text-[9px] font-condensed font-bold text-green-600 uppercase tracking-wider mb-2">🎮 Pertandingan Kamu</p>}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {match.home ? (
                        <>
                          <Flag code={match.home.flagCode} size={22} />
                          <span className={`text-xs lg:text-sm font-semibold font-condensed truncate ${winner?.id === match.home.id ? 'text-green-700 font-bold' : played && winner?.id !== match.home.id ? 'text-gray-400' : 'text-gray-800'}`}>
                            {match.home.name}
                          </span>
                        </>
                      ) : <span className="text-xs text-gray-400 font-condensed">TBD</span>}
                    </div>
                    {played ? (
                      <div className="text-center mx-2">
                        <div className={`px-3 py-1 rounded-lg ${isPlayer ? (winner?.id === playerTeam.id ? 'bg-green-600' : 'bg-red-500') : 'bg-gray-800'}`}>
                          <span className="text-sm font-bold font-condensed text-white">
                            {match.result.goalsA} - {match.result.goalsB}
                          </span>
                        </div>
                        {match.result.penalties && (
                          <p className="text-[9px] font-condensed text-gray-500 mt-0.5">
                            Pen: {match.result.penA}-{match.result.penB}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 font-condensed mx-3">vs</span>
                    )}
                    <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                      {match.away ? (
                        <>
                          <span className={`text-xs lg:text-sm font-semibold font-condensed truncate ${winner?.id === match.away.id ? 'text-green-700 font-bold' : played && winner?.id !== match.away.id ? 'text-gray-400' : 'text-gray-800'}`}>
                            {match.away.name}
                          </span>
                          <Flag code={match.away.flagCode} size={22} />
                        </>
                      ) : <span className="text-xs text-gray-400 font-condensed">TBD</span>}
                    </div>
                  </div>
                  {played && winner && (
                    <p className={`text-[10px] font-bold font-condensed text-center mt-1 ${isPlayer ? (winner.id === playerTeam.id ? 'text-green-600' : 'text-red-500') : 'text-gray-500'
                      }`}>
                      {isPlayer
                        ? (winner.id === playerTeam.id ? '✅ Lolos!' : '❌ Gugur')
                        : `→ ${winner.name}`
                      }
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export { generateBracket, ROUND_NAMES };
