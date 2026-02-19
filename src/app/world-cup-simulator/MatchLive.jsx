'use client';

import { useState, useEffect, useRef } from 'react';

const flagUrl = (code) => `https://flagcdn.com/w40/${code}.png`;
const flagUrlLg = (code) => `https://flagcdn.com/w80/${code}.png`;
const Flag = ({ code, size = 20 }) => (
  <img src={flagUrl(code)} alt="" className="inline-block object-cover rounded-sm" style={{ width: size, height: Math.round(size * 0.75) }} />
);
const FlagLg = ({ code, size = 48 }) => (
  <img src={flagUrlLg(code)} alt="" className="inline-block object-cover rounded" style={{ width: size, height: Math.round(size * 0.75) }} />
);

// ============================================================
// REALISTIC MATCH EVENT GENERATOR
// ============================================================
function generateMatchEvents(homeTeam, awayTeam, matchConfig) {
  const tacticMod = matchConfig?.tactic?.id === 'attacking' ? 1.25 : matchConfig?.tactic?.id === 'defensive' ? 0.75 : 1;

  // Expected goals: based on stars, roughly 0.5-2.5 per team
  const homeXG = (homeTeam.stars * 0.35 + 0.3) * tacticMod;
  const awayXG = awayTeam.stars * 0.35 + 0.3;

  // Pre-determine total goals using Poisson-like distribution
  const poissonGoals = (xg) => {
    let goals = 0;
    let p = Math.exp(-xg);
    let cdf = p;
    const r = Math.random();
    while (cdf < r && goals < 7) {
      goals++;
      p *= xg / goals;
      cdf += p;
    }
    return goals;
  };

  const totalHomeGoals = poissonGoals(homeXG);
  const totalAwayGoals = poissonGoals(awayXG);

  // Distribute goals across minutes (weighted: more likely 20-40, 55-85)
  const pickGoalMinute = () => {
    const r = Math.random();
    if (r < 0.15) return 1 + Math.floor(Math.random() * 15); // 1-15
    if (r < 0.40) return 16 + Math.floor(Math.random() * 15); // 16-30
    if (r < 0.55) return 31 + Math.floor(Math.random() * 14); // 31-44
    if (r < 0.70) return 46 + Math.floor(Math.random() * 15); // 46-60
    if (r < 0.90) return 61 + Math.floor(Math.random() * 20); // 61-80
    return 81 + Math.floor(Math.random() * 10); // 81-90
  };

  const homePlayers = homeTeam.players || [];
  const awayPlayers = awayTeam.players || [];

  const getScorer = (players) => {
    const fwd = players.filter(p => p.pos === 'FWD');
    const mid = players.filter(p => p.pos === 'MID');
    const pool = [...fwd, ...fwd, ...fwd, ...mid];
    return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : players[Math.floor(Math.random() * players.length)];
  };
  const getAssister = (players, scorer) => {
    const pool = players.filter(p => p.name !== scorer?.name && (p.pos === 'MID' || p.pos === 'FWD'));
    return pool.length > 0 && Math.random() > 0.3 ? pool[Math.floor(Math.random() * pool.length)] : null;
  };
  const getCardPlayer = (players) => {
    const pool = players.filter(p => p.pos === 'DEF' || p.pos === 'MID');
    return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : players[0];
  };

  const events = [];
  let hg = 0, ag = 0;

  // Place home goals
  const homeGoalMinutes = [];
  for (let i = 0; i < totalHomeGoals; i++) {
    let m = pickGoalMinute();
    while (homeGoalMinutes.includes(m)) m = Math.min(m + 1, 90);
    homeGoalMinutes.push(m);
  }
  // Place away goals
  const awayGoalMinutes = [];
  for (let i = 0; i < totalAwayGoals; i++) {
    let m = pickGoalMinute();
    while (awayGoalMinutes.includes(m) || homeGoalMinutes.includes(m)) m = Math.min(m + 1, 90);
    awayGoalMinutes.push(m);
  }

  // Sort all goal minutes
  const allGoals = [
    ...homeGoalMinutes.map(m => ({ min: m, side: 'home' })),
    ...awayGoalMinutes.map(m => ({ min: m, side: 'away' })),
  ].sort((a, b) => a.min - b.min);

  allGoals.forEach(g => {
    if (g.side === 'home') {
      hg++;
      const scorer = getScorer(homePlayers);
      events.push({ min: g.min, type: 'goal', side: 'home', player: scorer?.name || 'Unknown', assist: getAssister(homePlayers, scorer)?.name || null, homeGoals: hg, awayGoals: ag });
    } else {
      ag++;
      const scorer = getScorer(awayPlayers);
      events.push({ min: g.min, type: 'goal', side: 'away', player: scorer?.name || 'Unknown', assist: getAssister(awayPlayers, scorer)?.name || null, homeGoals: hg, awayGoals: ag });
    }
  });

  // Yellow cards (1-3 per match)
  const numCards = Math.floor(Math.random() * 3) + 1;
  for (let i = 0; i < numCards; i++) {
    const min = 10 + Math.floor(Math.random() * 75);
    const side = Math.random() < 0.5 ? 'home' : 'away';
    const player = getCardPlayer(side === 'home' ? homePlayers : awayPlayers);
    events.push({ min, type: 'yellow', side, player: player?.name || 'Unknown' });
  }

  // Dangerous chances (3-6 per match)
  const numChances = 3 + Math.floor(Math.random() * 4);
  const chanceTexts = [
    'Tendangan keras! Nyaris masuk!', 'Peluang emas terbuang!', 'Kiper melakukan penyelamatan gemilang!',
    'Bola membentur tiang gawang!', 'Offside! Serangan dihentikan.', 'Tendangan bebas berbahaya!',
    'Header melambung di atas mistar!', 'Counter attack cepat!',
  ];
  for (let i = 0; i < numChances; i++) {
    const min = 5 + Math.floor(Math.random() * 83);
    events.push({ min, type: 'chance', side: Math.random() < 0.55 ? 'home' : 'away', text: chanceTexts[Math.floor(Math.random() * chanceTexts.length)] });
  }

  // Substitutions (1-2 per team, around 55-78 min)
  if (Math.random() < 0.8) events.push({ min: 55 + Math.floor(Math.random() * 10), type: 'sub', side: 'home', text: 'Pergantian pemain' });
  if (Math.random() < 0.7) events.push({ min: 65 + Math.floor(Math.random() * 10), type: 'sub', side: 'away', text: 'Pergantian pemain' });
  if (Math.random() < 0.5) events.push({ min: 70 + Math.floor(Math.random() * 10), type: 'sub', side: 'home', text: 'Pergantian pemain' });

  // Fixed events
  events.push({ min: 1, type: 'commentary', text: 'Peluit kick-off berbunyi! Pertandingan dimulai! ⚽' });
  events.push({ min: 45, type: 'halftime', homeGoals: hg <= totalHomeGoals ? events.filter(e => e.type === 'goal' && e.side === 'home' && e.min <= 45).length : 0, awayGoals: events.filter(e => e.type === 'goal' && e.side === 'away' && e.min <= 45).length });
  events.push({ min: 46, type: 'commentary', text: 'Babak kedua dimulai!' });
  events.push({ min: 90, type: 'fulltime', homeGoals: totalHomeGoals, awayGoals: totalAwayGoals });

  // Sort by minute
  events.sort((a, b) => a.min - b.min || (a.type === 'commentary' ? -1 : 0));

  // Fix halftime score (count goals <= 45)
  const htHomeGoals = events.filter(e => e.type === 'goal' && e.side === 'home' && e.min <= 45).length;
  const htAwayGoals = events.filter(e => e.type === 'goal' && e.side === 'away' && e.min <= 45).length;
  const htEvent = events.find(e => e.type === 'halftime');
  if (htEvent) { htEvent.homeGoals = htHomeGoals; htEvent.awayGoals = htAwayGoals; }

  return { events, finalScore: { goalsA: totalHomeGoals, goalsB: totalAwayGoals } };
}

// Generate extra time events (91-120)
function generateExtraTimeEvents(homeTeam, awayTeam, matchConfig, currentHomeGoals, currentAwayGoals) {
  const tacticMod = matchConfig?.tactic?.id === 'attacking' ? 1.15 : matchConfig?.tactic?.id === 'defensive' ? 0.8 : 1;
  const homeXG = (homeTeam.stars * 0.2 + 0.15) * tacticMod;
  const awayXG = awayTeam.stars * 0.2 + 0.15;

  const poissonGoals = (xg) => {
    let goals = 0, p = Math.exp(-xg), cdf = p;
    const r = Math.random();
    while (cdf < r && goals < 3) { goals++; p *= xg / goals; cdf += p; }
    return goals;
  };

  const etHomeGoals = poissonGoals(homeXG);
  const etAwayGoals = poissonGoals(awayXG);

  const homePlayers = homeTeam.players || [];
  const awayPlayers = awayTeam.players || [];
  const getScorer = (players) => {
    const fwd = players.filter(p => p.pos === 'FWD');
    const mid = players.filter(p => p.pos === 'MID');
    const pool = [...fwd, ...fwd, ...mid];
    return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : players[0];
  };
  const getAssister = (players, scorer) => {
    const pool = players.filter(p => p.name !== scorer?.name && (p.pos === 'MID' || p.pos === 'FWD'));
    return pool.length > 0 && Math.random() > 0.4 ? pool[Math.floor(Math.random() * pool.length)] : null;
  };

  const events = [];
  let hg = currentHomeGoals, ag = currentAwayGoals;

  // Place ET goals with unique minutes
  const goalEvents = [];
  const usedMins = new Set();
  for (let i = 0; i < etHomeGoals; i++) {
    let min = 91 + Math.floor(Math.random() * 29);
    while (usedMins.has(min)) min = Math.min(min + 1, 120);
    usedMins.add(min);
    const scorer = getScorer(homePlayers);
    goalEvents.push({ min, type: 'goal', side: 'home', player: scorer?.name || 'Unknown', assist: getAssister(homePlayers, scorer)?.name || null });
  }
  for (let i = 0; i < etAwayGoals; i++) {
    let min = 91 + Math.floor(Math.random() * 29);
    while (usedMins.has(min)) min = Math.min(min + 1, 120);
    usedMins.add(min);
    const scorer = getScorer(awayPlayers);
    goalEvents.push({ min, type: 'goal', side: 'away', player: scorer?.name || 'Unknown', assist: getAssister(awayPlayers, scorer)?.name || null });
  }

  // Sort by minute and calculate running totals
  goalEvents.sort((a, b) => a.min - b.min);
  goalEvents.forEach(g => {
    if (g.side === 'home') hg++;
    else ag++;
    events.push({ ...g, homeGoals: hg, awayGoals: ag });
  });

  // Some chances
  const chanceTexts = ['Tendangan keras! Nyaris masuk!', 'Kiper menyelamatkan!', 'Bola membentur tiang gawang!', 'Peluang emas terbuang!'];
  for (let i = 0; i < 2; i++) {
    events.push({ min: 93 + Math.floor(Math.random() * 25), type: 'chance', side: Math.random() < 0.5 ? 'home' : 'away', text: chanceTexts[Math.floor(Math.random() * chanceTexts.length)] });
  }

  // Fixed events - calculate ET halftime score (goals <= 105)
  const ethtHome = currentHomeGoals + events.filter(e => e.type === 'goal' && e.side === 'home' && e.min <= 105).length;
  const ethtAway = currentAwayGoals + events.filter(e => e.type === 'goal' && e.side === 'away' && e.min <= 105).length;
  events.push({ min: 91, type: 'commentary', text: '⏱️ Extra time dimulai! Babak pertama perpanjangan waktu.' });
  events.push({ min: 105, type: 'ethalftime', homeGoals: ethtHome, awayGoals: ethtAway });
  events.push({ min: 106, type: 'commentary', text: 'Babak kedua perpanjangan waktu dimulai!' });
  events.push({ min: 120, type: 'etfulltime', homeGoals: hg, awayGoals: ag });

  events.sort((a, b) => a.min - b.min);

  return { events, etFinalScore: { goalsA: hg, goalsB: ag } };
}

// Generate penalty shootout
function generatePenaltyShootout(homeTeam, awayTeam) {
  const homePlayers = homeTeam.players || [];
  const awayPlayers = awayTeam.players || [];
  const homeStr = homeTeam.stars * 0.12 + 0.6;
  const awayStr = awayTeam.stars * 0.12 + 0.6;

  const kicks = [];
  let hScore = 0, aScore = 0;
  const maxRounds = 10; // 5 regular + 5 sudden death max

  for (let round = 0; round < maxRounds; round++) {
    const homeKicker = homePlayers[round % homePlayers.length];
    const awayKicker = awayPlayers[round % awayPlayers.length];
    const homeScored = Math.random() < homeStr;
    const awayScored = Math.random() < awayStr;

    if (homeScored) hScore++;
    kicks.push({ round: round + 1, side: 'home', player: homeKicker?.name || `Penendang ${round + 1}`, scored: homeScored, homeTotal: hScore, awayTotal: aScore });

    if (awayScored) aScore++;
    kicks.push({ round: round + 1, side: 'away', player: awayKicker?.name || `Penendang ${round + 1}`, scored: awayScored, homeTotal: hScore, awayTotal: aScore });

    // Check if decided after 5 rounds
    if (round >= 4) {
      if (hScore !== aScore) break;
    }
    // Check if mathematically impossible to catch up (before 5)
    if (round < 4) {
      const remaining = 4 - round;
      if (hScore > aScore + remaining || aScore > hScore + remaining) break;
    }
  }

  return { kicks, penScore: { home: hScore, away: aScore } };
}

// ============================================================
// STYLES
// ============================================================
const LIVE_STYLES = `
  @keyframes mlPulse{0%,100%{opacity:1}50%{opacity:.4}}
  @keyframes mlSlideIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes mlGoalFlash{0%{background:rgba(34,197,94,.3)}50%{background:rgba(34,197,94,.1)}100%{background:transparent}}
  @keyframes mlGoalBounce{0%{transform:scale(1)}30%{transform:scale(1.4)}60%{transform:scale(0.95)}100%{transform:scale(1)}}
  @keyframes mlScorePop{0%{transform:scale(0.5);opacity:0}60%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
  @keyframes mlFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes mlWhistle{0%{transform:scale(0) rotate(-20deg);opacity:0}50%{transform:scale(1.2) rotate(5deg);opacity:1}100%{transform:scale(1) rotate(0);opacity:1}}

  /* === PL-STYLE GOAL BANNER === */
  @keyframes goalBannerIn{0%{transform:translateX(-110%)}8%{transform:translateX(2%)}12%{transform:translateX(0)}82%{transform:translateX(0)}92%{transform:translateX(2%)}100%{transform:translateX(110%)}}
  @keyframes goalOverlayBg{0%{opacity:0}6%{opacity:1}85%{opacity:1}100%{opacity:0}}
  @keyframes goalFlagPop{0%{transform:scale(0) rotate(-10deg);opacity:0}10%{transform:scale(1.3) rotate(3deg);opacity:1}16%{transform:scale(1) rotate(0)}80%{opacity:1}100%{opacity:0}}
  @keyframes goalTextReveal{0%{clip-path:inset(0 100% 0 0)}10%{clip-path:inset(0 0% 0 0)}80%{clip-path:inset(0 0% 0 0);opacity:1}100%{opacity:0}}
  @keyframes goalScoreBounce{0%{transform:scale(0)}10%{transform:scale(1.4)}16%{transform:scale(0.9)}20%{transform:scale(1)}80%{transform:scale(1);opacity:1}100%{opacity:0}}
  @keyframes goalPlayerFade{0%{opacity:0;transform:translateY(8px)}14%{opacity:1;transform:translateY(0)}80%{opacity:1}100%{opacity:0}}
  @keyframes goalFlashPulse{0%{opacity:0}5%{opacity:0.4}10%{opacity:0}15%{opacity:0.2}20%{opacity:0}}
  @keyframes goalShake{0%,100%{transform:translate(0)}3%{transform:translate(-6px,3px)}6%{transform:translate(5px,-2px)}9%{transform:translate(-3px,4px)}12%{transform:translate(2px,-1px)}15%{transform:translate(0)}}
  @keyframes goalConfettiDrop{0%{opacity:1;transform:translateY(-20px) rotate(0deg)}100%{opacity:0;transform:translateY(100vh) rotate(var(--rot,360deg))}}
  @keyframes goalAccentBar{0%{transform:scaleX(0)}8%{transform:scaleX(1)}85%{transform:scaleX(1)}100%{transform:scaleX(0)}}
  @keyframes goalMinPulse{0%,100%{opacity:0.6}50%{opacity:1}}

  .goal-confetti{position:absolute;top:-10px;animation:goalConfettiDrop var(--dur,2.5s) ease-in forwards;animation-delay:var(--delay,0s)}
`;

const CONFETTI_COLORS = ['#22c55e', '#eab308', '#ef4444', '#3b82f6', '#ffffff', '#f97316', '#a855f7', '#06b6d4'];
const CONFETTI_PIECES = Array.from({ length: 35 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  size: 4 + Math.random() * 7,
  dur: `${1.8 + Math.random() * 2.2}s`,
  delay: `${Math.random() * 0.6}s`,
  rot: `${360 + Math.random() * 720}deg`,
  shape: Math.random() > 0.5 ? '50%' : '2px',
}));

// ============================================================
// MATCH LIVE COMPONENT
// ============================================================
export default function MatchLive({ homeTeam, awayTeam, matchConfig, isHome, onComplete, isKnockout = false, skipIntro = false }) {
  const [phase, setPhase] = useState(skipIntro ? 'firsthalf' : 'intro'); // intro | firsthalf | halftime | secondhalf | fulltime | extratime1 | ethalftime | extratime2 | etfulltime | penalties | penaltydone
  const [currentMin, setCurrentMin] = useState(0);
  const [displayedEvents, setDisplayedEvents] = useState([]);
  const [homeGoals, setHomeGoals] = useState(0);
  const [awayGoals, setAwayGoals] = useState(0);
  const [matchData] = useState(() => generateMatchEvents(homeTeam, awayTeam, matchConfig));
  const [goalFlash, setGoalFlash] = useState(null);
  const [goalCelebration, setGoalCelebration] = useState(null); // { side, player, homeGoals, awayGoals }
  const [motm, setMotm] = useState(null); // Man of the Match
  const [etData, setEtData] = useState(null);
  const [penData, setPenData] = useState(null);
  const [penIndex, setPenIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const eventsEndRef = useRef(null);
  const timerRef = useRef(null);
  const processedMins = useRef(new Set());

  useEffect(() => {
    if (eventsEndRef.current) eventsEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [displayedEvents]);

  // Intro → first half
  useEffect(() => {
    if (skipIntro) return; // already set to firsthalf
    const t = setTimeout(() => setPhase('firsthalf'), 2500);
    return () => clearTimeout(t);
  }, []);

  // Process events at a given minute
  const processMinute = (min) => {
    if (processedMins.current.has(min)) return;
    processedMins.current.add(min);

    const eventsAtMin = matchData.events.filter(e => e.min === min);
    if (eventsAtMin.length > 0) {
      setDisplayedEvents(d => [...d, ...eventsAtMin]);
      eventsAtMin.forEach(e => {
        if (e.type === 'goal') {
          setHomeGoals(e.homeGoals);
          setAwayGoals(e.awayGoals);
          setGoalFlash(e.side);
          // Pause timer and show celebration overlay
          setIsPaused(true);
          clearInterval(timerRef.current);
          setGoalCelebration({
            side: e.side,
            player: e.player,
            team: e.side === 'home' ? homeTeam.name : awayTeam.name,
            homeGoals: e.homeGoals,
            awayGoals: e.awayGoals,
          });
          setTimeout(() => {
            setGoalFlash(null);
            setGoalCelebration(null);
            setIsPaused(false);
          }, 3500);
        }
      });
    }
  };

  // Timer for first half (1-45)
  useEffect(() => {
    if (phase !== 'firsthalf' || isPaused) return;
    timerRef.current = setInterval(() => {
      setCurrentMin(prev => {
        const next = prev + 1;
        if (next > 45) {
          clearInterval(timerRef.current);
          processMinute(45);
          setPhase('halftime');
          return 45;
        }
        processMinute(next);
        return next;
      });
    }, 600);
    return () => clearInterval(timerRef.current);
  }, [phase, isPaused]);

  // Halftime → second half
  useEffect(() => {
    if (phase !== 'halftime') return;
    const t = setTimeout(() => {
      processMinute(46);
      setPhase('secondhalf');
    }, 2500);
    return () => clearTimeout(t);
  }, [phase]);

  // Timer for second half (46-90)
  useEffect(() => {
    if (phase !== 'secondhalf' || isPaused) return;
    if (currentMin < 46) setCurrentMin(46);
    timerRef.current = setInterval(() => {
      setCurrentMin(prev => {
        const next = prev + 1;
        if (next > 90) {
          clearInterval(timerRef.current);
          processMinute(90);
          const ftHome = matchData.finalScore.goalsA;
          const ftAway = matchData.finalScore.goalsB;
          if (isKnockout && ftHome === ftAway) {
            setPhase('goingtoet');
          } else {
            setPhase('fulltime');
          }
          return 90;
        }
        processMinute(next);
        return next;
      });
    }, 600);
    return () => clearInterval(timerRef.current);
  }, [phase, isPaused]);

  // Transition to extra time
  useEffect(() => {
    if (phase !== 'goingtoet') return;
    setHomeGoals(matchData.finalScore.goalsA);
    setAwayGoals(matchData.finalScore.goalsB);
    // Generate ET events
    const et = generateExtraTimeEvents(homeTeam, awayTeam, matchConfig, matchData.finalScore.goalsA, matchData.finalScore.goalsB);
    setEtData(et);
    // Show "going to extra time" message
    setDisplayedEvents(d => [...d, { min: 90, type: 'commentary', text: '⏱️ Skor imbang! Lanjut ke perpanjangan waktu!' }]);
    const t = setTimeout(() => setPhase('extratime1'), 3000);
    return () => clearTimeout(t);
  }, [phase]);

  // Extra time first half (91-105)
  useEffect(() => {
    if (phase !== 'extratime1' || !etData || isPaused) return;
    if (currentMin < 91) setCurrentMin(91);
    timerRef.current = setInterval(() => {
      setCurrentMin(prev => {
        const next = prev + 1;
        if (next > 105) {
          clearInterval(timerRef.current);
          const ethEvent = etData.events.find(e => e.type === 'ethalftime');
          if (ethEvent && !processedMins.current.has('eth')) {
            processedMins.current.add('eth');
            setDisplayedEvents(d => [...d, ethEvent]);
          }
          setPhase('ethalftime');
          return 105;
        }
        // Process ET events at this minute (deduplicated)
        if (!processedMins.current.has(`et-${next}`)) {
          processedMins.current.add(`et-${next}`);
          const eventsAtMin = etData.events.filter(e => e.min === next && e.type !== 'ethalftime' && e.type !== 'etfulltime');
          if (eventsAtMin.length > 0) {
            setDisplayedEvents(d => [...d, ...eventsAtMin]);
            eventsAtMin.forEach(e => {
              if (e.type === 'goal') {
                setHomeGoals(e.homeGoals); setAwayGoals(e.awayGoals);
                setIsPaused(true);
                clearInterval(timerRef.current);
                setGoalCelebration({ side: e.side, player: e.player, team: e.side === 'home' ? homeTeam.name : awayTeam.name, homeGoals: e.homeGoals, awayGoals: e.awayGoals });
                setGoalFlash(e.side);
                setTimeout(() => { setGoalFlash(null); setGoalCelebration(null); setIsPaused(false); }, 3500);
              }
            });
          }
        }
        return next;
      });
    }, 600);
    return () => clearInterval(timerRef.current);
  }, [phase, etData, isPaused]);

  // ET halftime → ET second half
  useEffect(() => {
    if (phase !== 'ethalftime') return;
    const t = setTimeout(() => setPhase('extratime2'), 2000);
    return () => clearTimeout(t);
  }, [phase]);

  // Extra time second half (106-120)
  useEffect(() => {
    if (phase !== 'extratime2' || !etData || isPaused) return;
    if (currentMin < 106) setCurrentMin(106);
    timerRef.current = setInterval(() => {
      setCurrentMin(prev => {
        const next = prev + 1;
        if (next > 120) {
          clearInterval(timerRef.current);
          const finalET = etData.etFinalScore;
          setHomeGoals(finalET.goalsA); setAwayGoals(finalET.goalsB);
          if (finalET.goalsA === finalET.goalsB) {
            setDisplayedEvents(d => [...d, { min: 120, type: 'commentary', text: '🎯 Masih imbang! Lanjut ke adu penalti!' }]);
            setPhase('goingtopen');
          } else {
            setPhase('fulltime');
          }
          return 120;
        }
        if (!processedMins.current.has(`et-${next}`)) {
          processedMins.current.add(`et-${next}`);
          const eventsAtMin = etData.events.filter(e => e.min === next && e.type !== 'ethalftime' && e.type !== 'etfulltime');
          if (eventsAtMin.length > 0) {
            setDisplayedEvents(d => [...d, ...eventsAtMin]);
            eventsAtMin.forEach(e => {
              if (e.type === 'goal') {
                setHomeGoals(e.homeGoals); setAwayGoals(e.awayGoals);
                setIsPaused(true);
                clearInterval(timerRef.current);
                setGoalCelebration({ side: e.side, player: e.player, team: e.side === 'home' ? homeTeam.name : awayTeam.name, homeGoals: e.homeGoals, awayGoals: e.awayGoals });
                setGoalFlash(e.side);
                setTimeout(() => { setGoalFlash(null); setGoalCelebration(null); setIsPaused(false); }, 3500);
              }
            });
          }
        }
        return next;
      });
    }, 600);
    return () => clearInterval(timerRef.current);
  }, [phase, etData, isPaused]);

  // Transition to penalties
  useEffect(() => {
    if (phase !== 'goingtopen') return;
    const pen = generatePenaltyShootout(homeTeam, awayTeam);
    setPenData(pen);
    setPenIndex(0);
    const t = setTimeout(() => setPhase('penalties'), 2500);
    return () => clearTimeout(t);
  }, [phase]);

  // Penalty shootout animation (reveal one kick at a time)
  useEffect(() => {
    if (phase !== 'penalties' || !penData) return;
    if (penIndex >= penData.kicks.length) {
      setPhase('penaltydone');
      return;
    }
    const t = setTimeout(() => {
      const kick = penData.kicks[penIndex];
      setDisplayedEvents(d => [...d, {
        min: 'PEN', type: 'penalty', side: kick.side, player: kick.player,
        scored: kick.scored, homeTotal: kick.homeTotal, awayTotal: kick.awayTotal, round: kick.round,
      }]);
      setPenIndex(prev => prev + 1);
    }, 1200);
    return () => clearTimeout(t);
  }, [phase, penIndex, penData]);

  // Set final score on fulltime + pick MOTM
  useEffect(() => {
    if (phase === 'fulltime' || phase === 'penaltydone') {
      if (etData) {
        setHomeGoals(etData.etFinalScore.goalsA);
        setAwayGoals(etData.etFinalScore.goalsB);
      } else if (phase === 'fulltime') {
        setHomeGoals(matchData.finalScore.goalsA);
        setAwayGoals(matchData.finalScore.goalsB);
      }
      // Pick Man of the Match
      if (!motm) {
        const allGoalEvents = displayedEvents.filter(e => e.type === 'goal');
        const allAssists = displayedEvents.filter(e => e.type === 'goal' && e.assist);
        // Score: 3 pts per goal, 1 pt per assist
        const scores = {};
        allGoalEvents.forEach(e => { scores[e.player] = (scores[e.player] || 0) + 3; });
        allAssists.forEach(e => { if (e.assist) scores[e.assist] = (scores[e.assist] || 0) + 1; });
        // If no goals, pick random from player's team
        if (Object.keys(scores).length === 0) {
          const myPlayers = isHome ? homeTeam.players : awayTeam.players;
          const pick = myPlayers[Math.floor(Math.random() * myPlayers.length)];
          setMotm({ name: pick?.name || 'Unknown', team: isHome ? homeTeam.name : awayTeam.name });
        } else {
          const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
          const goalEvent = allGoalEvents.find(e => e.player === best[0]);
          setMotm({ name: best[0], team: goalEvent?.side === 'home' ? homeTeam.name : awayTeam.name });
        }
      }
    }
  }, [phase]);

  const isFinalPhase = phase === 'fulltime' || phase === 'penaltydone';
  const myGoals = isHome ? homeGoals : awayGoals;
  const oppGoals = isHome ? awayGoals : homeGoals;

  // Determine winner for final result
  const getFinalResult = () => {
    if (phase === 'penaltydone' && penData) {
      const myPen = isHome ? penData.penScore.home : penData.penScore.away;
      const oppPen = isHome ? penData.penScore.away : penData.penScore.home;
      return { won: myPen > oppPen, drew: false, penalties: true, penHome: penData.penScore.home, penAway: penData.penScore.away };
    }
    return { won: myGoals > oppGoals, drew: myGoals === oppGoals, penalties: false };
  };

  const finalResult = isFinalPhase ? getFinalResult() : null;
  const won = finalResult?.won || false;
  const drew = finalResult?.drew || false;

  const buildFinalScore = () => {
    const base = { goalsA: homeGoals, goalsB: awayGoals, penalties: false };
    if (penData && phase === 'penaltydone') {
      return { ...base, penalties: true, penA: penData.penScore.home, penB: penData.penScore.away };
    }
    return base;
  };

  const renderEvent = (ev, i) => {
    const isHomeSide = ev.side === 'home';
    switch (ev.type) {
      case 'goal':
        return (
          <div key={`${ev.type}-${ev.min}-${ev.side}-${i}`} className="flex items-start gap-2 py-2" style={{ animation: 'mlSlideIn 0.4s ease-out' }}>
            <span className="text-[10px] font-mono text-gray-400 w-8 flex-shrink-0 pt-1">{ev.min}'</span>
            <div className={`flex-1 rounded-lg p-2.5 ${isHomeSide ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
              <div className="flex items-center gap-1.5">
                <span className="text-lg" style={{ animation: 'mlGoalBounce 0.5s ease-out' }}>⚽</span>
                <span className="font-bold font-condensed text-sm text-gray-900">GOOOL!</span>
              </div>
              <p className="text-sm font-semibold font-condensed text-gray-800 mt-0.5">
                {ev.player} <span className="text-gray-400 font-normal text-xs">({isHomeSide ? homeTeam.name : awayTeam.name})</span>
              </p>
              {ev.assist && <p className="text-[10px] text-gray-500 font-condensed">Assist: {ev.assist}</p>}
              <div className="mt-1.5 inline-flex items-center gap-1 bg-gray-900 text-white px-2.5 py-0.5 rounded text-sm font-bold font-condensed" style={{ animation: 'mlScorePop 0.4s ease-out' }}>
                {ev.homeGoals} - {ev.awayGoals}
              </div>
            </div>
          </div>
        );
      case 'yellow':
        return (
          <div key={`${ev.type}-${ev.min}-${i}`} className="flex items-center gap-2 py-1.5" style={{ animation: 'mlFadeUp 0.3s ease-out' }}>
            <span className="text-[10px] font-mono text-gray-400 w-8 flex-shrink-0">{ev.min}'</span>
            <span className="text-sm">🟨</span>
            <span className="text-xs text-gray-600 font-condensed"><span className="font-semibold">{ev.player}</span> <span className="text-gray-400">({isHomeSide ? homeTeam.name : awayTeam.name})</span></span>
          </div>
        );
      case 'sub':
        return (
          <div key={`${ev.type}-${ev.min}-${ev.side}-${i}`} className="flex items-center gap-2 py-1.5" style={{ animation: 'mlFadeUp 0.3s ease-out' }}>
            <span className="text-[10px] font-mono text-gray-400 w-8 flex-shrink-0">{ev.min}'</span>
            <span className="text-sm">🔄</span>
            <span className="text-xs text-gray-500 font-condensed">{ev.text} ({isHomeSide ? homeTeam.name : awayTeam.name})</span>
          </div>
        );
      case 'chance':
        return (
          <div key={`${ev.type}-${ev.min}-${i}`} className="flex items-center gap-2 py-1.5" style={{ animation: 'mlFadeUp 0.3s ease-out' }}>
            <span className="text-[10px] font-mono text-gray-400 w-8 flex-shrink-0">{ev.min}'</span>
            <span className="text-sm">💨</span>
            <span className="text-xs text-gray-500 font-condensed italic">{ev.text}</span>
          </div>
        );
      case 'commentary':
        return (
          <div key={`${ev.type}-${ev.min}-${i}`} className="flex items-center gap-2 py-1.5" style={{ animation: 'mlFadeUp 0.3s ease-out' }}>
            <span className="text-[10px] font-mono text-gray-400 w-8 flex-shrink-0">{ev.min}'</span>
            <span className="text-xs text-gray-600 font-condensed font-medium">{ev.text}</span>
          </div>
        );
      case 'halftime':
        return (
          <div key={`halftime-${i}`} className="text-center py-3 my-2 border-y border-dashed border-gray-200">
            <span className="text-xs font-bold font-condensed text-gray-500 bg-gray-100 px-4 py-1.5 rounded-full">
              ⏸️ BABAK PERTAMA SELESAI — {ev.homeGoals} : {ev.awayGoals}
            </span>
          </div>
        );
      case 'fulltime':
        return (
          <div key={`fulltime-${i}`} className="text-center py-4 my-2" style={{ animation: 'mlWhistle 0.5s ease-out' }}>
            <div className="inline-flex flex-col items-center bg-gray-900 text-white px-6 py-3 rounded-xl">
              <span className="text-[10px] font-condensed text-gray-400 uppercase tracking-wider">Peluit Panjang</span>
              <span className="text-lg font-bold font-condensed mt-1">⏱️ FULL TIME</span>
              <span className="text-3xl font-bold font-condensed mt-1">{ev.homeGoals} - {ev.awayGoals}</span>
            </div>
          </div>
        );
      case 'ethalftime':
        return (
          <div key={`etht-${i}`} className="text-center py-3 my-2 border-y border-dashed border-orange-200">
            <span className="text-xs font-bold font-condensed text-orange-600 bg-orange-50 px-4 py-1.5 rounded-full">
              ⏸️ ET BABAK PERTAMA SELESAI — {ev.homeGoals} : {ev.awayGoals}
            </span>
          </div>
        );
      case 'penalty':
        return (
          <div key={`pen-${ev.side}-${ev.round}-${i}`} className="flex items-center gap-2 py-2" style={{ animation: 'mlSlideIn 0.4s ease-out' }}>
            <span className="text-[10px] font-mono text-gray-400 w-8 flex-shrink-0">PEN</span>
            <div className={`flex-1 rounded-lg px-3 py-2 border ${ev.scored ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{ev.scored ? '✅' : '❌'}</span>
                <span className="text-xs font-semibold font-condensed text-gray-800">
                  {ev.player} <span className="text-gray-400">({ev.side === 'home' ? homeTeam.name : awayTeam.name})</span>
                </span>
                <span className="ml-auto text-xs font-bold font-condensed text-gray-600">{ev.homeTotal} - {ev.awayTotal}</span>
              </div>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
      <style dangerouslySetInnerHTML={{ __html: LIVE_STYLES }} />

      {/* INTRO */}
      {phase === 'intro' && (
        <div className="flex-1 flex flex-col items-center justify-center text-white px-4">
          <p className="text-[10px] font-condensed text-gray-500 uppercase tracking-widest">Kick Off</p>
          <div className="flex items-center gap-6 mt-4">
            <div className="text-center" style={{ animation: 'mlSlideIn 0.5s ease-out' }}>
              <FlagLg code={homeTeam.flagCode} size={56} />
              <p className="text-sm font-bold font-condensed mt-2">{homeTeam.name}</p>
              <p className="text-yellow-400 text-xs">{'★'.repeat(homeTeam.stars)}</p>
            </div>
            <div className="text-3xl font-bold font-condensed text-gray-600" style={{ animation: 'mlScorePop 0.6s ease-out' }}>VS</div>
            <div className="text-center" style={{ animation: 'mlSlideIn 0.5s ease-out' }}>
              <FlagLg code={awayTeam.flagCode} size={56} />
              <p className="text-sm font-bold font-condensed mt-2">{awayTeam.name}</p>
              <p className="text-yellow-400 text-xs">{'★'.repeat(awayTeam.stars)}</p>
            </div>
          </div>
          <div className="mt-6" style={{ animation: 'mlPulse 1.5s infinite' }}>
            <p className="text-xs font-condensed text-gray-500">Pertandingan akan dimulai...</p>
          </div>
        </div>
      )}

      {/* LIVE MATCH */}
      {phase !== 'intro' && (
        <>
          {/* Scoreboard */}
          <div className={`bg-gray-900 border-b border-gray-800 transition-colors duration-300 flex-shrink-0 ${goalFlash === 'home' ? 'bg-green-900/50' : goalFlash === 'away' ? 'bg-blue-900/50' : ''}`}>
            <div className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <Flag code={homeTeam.flagCode} size={22} />
                  <span className="text-white font-bold font-condensed text-sm truncate">{homeTeam.name}</span>
                </div>
                <div className="flex items-center gap-3 px-4">
                  <span className={`text-3xl font-bold font-condensed transition-all duration-200 ${goalFlash === 'home' ? 'text-green-400 scale-125' : 'text-white'}`}>{homeGoals}</span>
                  <span className="text-gray-600 font-condensed text-lg">-</span>
                  <span className={`text-3xl font-bold font-condensed transition-all duration-200 ${goalFlash === 'away' ? 'text-blue-400 scale-125' : 'text-white'}`}>{awayGoals}</span>
                </div>
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <span className="text-white font-bold font-condensed text-sm truncate">{awayTeam.name}</span>
                  <Flag code={awayTeam.flagCode} size={22} />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all duration-300" style={{ width: `${Math.min((currentMin / (etData ? 120 : 90)) * 100, 100)}%` }} />
                </div>
                <span className={`text-xs font-mono font-bold min-w-[36px] text-right ${isFinalPhase ? 'text-red-400' :
                    phase === 'halftime' || phase === 'ethalftime' ? 'text-yellow-400' :
                      phase === 'penalties' || phase === 'goingtopen' ? 'text-purple-400' :
                        phase === 'goingtoet' ? 'text-orange-400' :
                          'text-green-400'
                  }`}
                  style={['firsthalf', 'secondhalf', 'extratime1', 'extratime2'].includes(phase) ? { animation: 'mlPulse 1.5s infinite' } : {}}>
                  {isFinalPhase ? 'FT' : phase === 'halftime' ? 'HT' : phase === 'ethalftime' ? 'ET HT' :
                    phase === 'goingtoet' ? 'ET' : phase === 'goingtopen' || phase === 'penalties' ? 'PEN' : `${currentMin}'`}
                </span>
              </div>
            </div>
          </div>

          {/* Events Feed */}
          <div className="flex-1 overflow-y-auto bg-white px-3 py-2">
            {displayedEvents.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm font-condensed" style={{ animation: 'mlPulse 2s infinite' }}>
                ⚽ Pertandingan sedang berlangsung...
              </div>
            )}
            {displayedEvents.map((ev, i) => renderEvent(ev, i))}
            <div ref={eventsEndRef} />
          </div>

          {/* Full Time Result Bar */}
          {isFinalPhase && (
            <div className={`flex-shrink-0 p-4 pb-24 text-center ${won ? 'bg-green-600' : drew ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ animation: 'mlSlideIn 0.5s ease-out' }}>
              <p className="text-white font-bold font-condensed text-lg">
                {won ? '🎉 MENANG!' : drew ? '🤝 SERI' : '😢 KALAH'}
              </p>
              <p className="text-white/80 font-condensed text-sm mt-0.5">
                {homeTeam.name} {homeGoals} - {awayGoals} {awayTeam.name}
                {penData && phase === 'penaltydone' && ` (Pen: ${penData.penScore.home}-${penData.penScore.away})`}
                {etData && !penData && ' (AET)'}
              </p>
              {motm && (
                <div className="mt-2 inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full">
                  <span className="text-sm">⭐</span>
                  <span className="text-white text-xs font-condensed font-bold">Man of the Match: {motm.name}</span>
                </div>
              )}
              <button onClick={() => onComplete(buildFinalScore())}
                className="mt-3 px-8 py-3 bg-white text-gray-900 font-bold font-condensed rounded-full shadow-lg text-sm block mx-auto">
                LANJUTKAN →
              </button>
            </div>
          )}
        </>
      )}

      {/* PL-INSPIRED GOAL BANNER */}
      {goalCelebration && (() => {
        const isMyGoal = (goalCelebration.side === 'home' && isHome) || (goalCelebration.side === 'away' && !isHome);
        const scoringTeam = goalCelebration.side === 'home' ? homeTeam : awayTeam;
        const flagUrl = `https://flagcdn.com/w80/${scoringTeam.flagCode}.png`;
        // Team accent color based on confederation
        const confColors = { UEFA: '#1e40af', CONMEBOL: '#15803d', CONCACAF: '#b91c1c', CAF: '#a16207', AFC: '#be185d', OFC: '#0e7490' };
        const accent = confColors[scoringTeam.conf] || '#1e40af';
        const accentDark = accent + 'dd';

        return (
          <div className="fixed inset-0 z-[60] pointer-events-none overflow-hidden" style={{ animation: 'goalShake 0.5s ease-out' }}>
            {/* Dim background flash */}
            <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at center, ${accent}30 0%, rgba(0,0,0,0.7) 70%)`, animation: 'goalOverlayBg 3.5s ease-out forwards' }} />

            {/* Quick white flash */}
            <div className="absolute inset-0 bg-white" style={{ animation: 'goalFlashPulse 3.5s ease-out forwards' }} />

            {/* Confetti for player's team */}
            {isMyGoal && (
              <div className="absolute inset-0 overflow-hidden">
                {CONFETTI_PIECES.map(c => (
                  <div key={c.id} className="goal-confetti"
                    style={{ left: c.left, '--dur': c.dur, '--delay': c.delay, '--rot': c.rot, width: c.size, height: c.size, backgroundColor: c.color, borderRadius: c.shape }} />
                ))}
              </div>
            )}

            {/* === MAIN BANNER (PL-style horizontal bar) === */}
            <div className="absolute inset-0 flex items-center justify-center px-3">
              <div className="w-full max-w-lg" style={{ animation: 'goalBannerIn 3.5s cubic-bezier(0.22, 1, 0.36, 1) forwards' }}>

                {/* Top accent line */}
                <div className="h-1 rounded-t-lg" style={{ background: `linear-gradient(90deg, ${accent}, ${accentDark})`, animation: 'goalAccentBar 3.5s ease-out forwards', transformOrigin: 'left' }} />

                {/* Banner body */}
                <div className="relative overflow-hidden rounded-b-lg" style={{ background: `linear-gradient(135deg, ${accent}f0 0%, #1a1a2e 60%, #0f0f1a 100%)` }}>

                  {/* Decorative diagonal stripe */}
                  <div className="absolute inset-0 opacity-10" style={{ background: `repeating-linear-gradient(135deg, transparent, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 22px)` }} />

                  <div className="relative px-5 py-4 lg:px-8 lg:py-5">
                    <div className="flex items-center gap-4">

                      {/* Flag */}
                      <div style={{ animation: 'goalFlagPop 3.5s ease-out forwards' }}>
                        <img src={flagUrl} alt="" className="w-12 h-9 lg:w-16 lg:h-12 rounded shadow-lg object-cover" style={{ border: '2px solid rgba(255,255,255,0.3)' }} />
                      </div>

                      {/* Divider */}
                      <div className="w-0.5 h-12 bg-white/20 rounded-full" />

                      {/* GOAL text + player info */}
                      <div className="flex-1 min-w-0">
                        <div style={{ animation: 'goalTextReveal 3.5s ease-out forwards' }}>
                          <p className="text-2xl lg:text-4xl font-black font-condensed text-white tracking-wider" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                            {isMyGoal ? 'GOAL!' : 'GOAL'}
                          </p>
                        </div>
                        <div style={{ animation: 'goalPlayerFade 3.5s ease-out forwards' }}>
                          <p className="text-sm lg:text-base font-bold font-condensed text-white/90 truncate mt-0.5">{goalCelebration.player}</p>
                          <p className="text-[10px] lg:text-xs font-condensed text-white/50">{goalCelebration.team} • {currentMin}'</p>
                        </div>
                      </div>

                      {/* Score */}
                      <div style={{ animation: 'goalScoreBounce 3.5s ease-out forwards' }}>
                        <div className="bg-black/40 backdrop-blur-sm rounded-xl px-4 py-2 lg:px-5 lg:py-3 border border-white/10">
                          <p className="text-2xl lg:text-3xl font-black font-condensed text-white text-center leading-none">
                            {goalCelebration.homeGoals}<span className="text-white/30 mx-1">-</span>{goalCelebration.awayGoals}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom accent line */}
                <div className="h-0.5 mt-px rounded-b" style={{ background: accent, opacity: 0.5 }} />
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
