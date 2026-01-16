'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Trophy, Info, ThumbsUp, ExternalLink } from 'lucide-react';

export default function SofaMatchPreview({ matches = [], user, onMatchClick, onChallengeClick }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedVote, setSelectedVote] = useState(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [activeRankingTab, setActiveRankingTab] = useState('fifa');
  const [slideDirection, setSlideDirection] = useState('next');
  const [isAnimating, setIsAnimating] = useState(false);

  // ============================================================
  // LIGA DEFINITIONS - Spesifik per negara
  // ============================================================

  // Pattern untuk EXCLUDE (liga yang bukan top tier)
  const excludePatterns = [
    /division\s*(one|two|three|1|2|3)/i,  // Division One, Division 2, etc
    /league\s*(one|two|three|1|2)/i,       // League One, League Two
    /u\s*-?\s*(17|18|19|20|21|23)/i,       // U21, U-23, U19, etc
    /under\s*(17|18|19|20|21|23)/i,        // Under 21, Under 23
    /reserve/i,                             // Reserve league
    /youth/i,                               // Youth league
    /academy/i,                             // Academy
    /2nd\s*division/i,                      // 2nd Division
    /second\s*division/i,                   // Second Division
    /championship/i,                        // EFL Championship (tier 2 England)
    /league\s*cup/i,                        // League Cup (bukan liga)
    /efl\s*trophy/i,                        // EFL Trophy
    /community\s*shield/i,                  // Community Shield
    /super\s*cup/i,                         // Super Cup
    /premier\s*league\s*2/i,               // Premier League 2 (U21)
    /premier\s*league\s*cup/i,             // Premier League Cup
    /professional\s*development/i,          // Professional Development League
    /2\.\s*bundesliga/i,                    // 2. Bundesliga (tier 2 Germany)
    /3\.\s*liga/i,                          // 3. Liga (tier 3 Germany)
    /regionalliga/i,                        // Regionalliga (tier 4 Germany)
    /ligue\s*2/i,                           // Ligue 2 (tier 2 France)
    /serie\s*b/i,                           // Serie B (tier 2 Italy)
    /segunda/i,                             // Segunda Division (tier 2 Spain)
    /segunda\s*division/i,                  // Segunda Division
  ];

  // Check if league should be excluded
  const shouldExcludeLeague = (leagueName) => {
    return excludePatterns.some(pattern => pattern.test(leagueName));
  };

  const leagueDefinitions = [
    {
      name: 'Premier League',
      country: 'England',
      // Harus ada "England" atau "English" atau league_id 39
      // Dan TIDAK BOLEH ada "2", "Division", "U21", dll
      patterns: [/^premier\s*league$/i, /english\s*premier\s*league/i],
      countryPatterns: [/england/i, /english/i, /inggris/i],
      leagueIds: [39],
      priority: 1,
    },
    {
      name: 'La Liga',
      country: 'Spain',
      patterns: [/la\s*liga/i, /laliga/i, /primera\s*division/i],
      countryPatterns: [/spain/i, /spanish/i, /spanyol/i, /españa/i],
      leagueIds: [140],
      priority: 2,
    },
    {
      name: 'Serie A',
      country: 'Italy',
      patterns: [/serie\s*a/i],
      countryPatterns: [/italy/i, /italian/i, /italia/i],
      leagueIds: [135],
      priority: 3,
    },
    {
      name: 'Bundesliga',
      country: 'Germany',
      patterns: [/^bundesliga$/i],  // Exact match, bukan "2. Bundesliga"
      countryPatterns: [/germany/i, /german/i, /jerman/i, /deutschland/i],
      leagueIds: [78],
      priority: 4,
      requireCountryCheck: true,  // Harus cek country
    },
    {
      name: 'Ligue 1',
      country: 'France',
      patterns: [/^ligue\s*1$/i, /ligue\s*1\s*uber\s*eats/i],  // Exact match
      countryPatterns: [/france/i, /french/i, /prancis/i, /perancis/i],
      leagueIds: [61],
      priority: 5,
      requireCountryCheck: true,  // Harus cek country (bukan Congo, Tunisia dll)
    },
    {
      name: 'Champions League',
      country: 'Europe',
      patterns: [/champions\s*league/i, /ucl/i, /uefa\s*champions/i],
      countryPatterns: [/europe/i, /uefa/i, /world/i],
      leagueIds: [2],
      priority: 6,
    },
    {
      name: 'Europa League',
      country: 'Europe',
      patterns: [/europa\s*league/i, /uel/i, /uefa\s*europa/i],
      countryPatterns: [/europe/i, /uefa/i, /world/i],
      leagueIds: [3],
      priority: 7,
    },
  ];

  // ============================================================
  // CHECK IF MATCH BELONGS TO SPECIFIC LEAGUE
  // ============================================================
  const matchBelongsToLeague = (match, leagueDef) => {
    const leagueName = (match.league_name || match.competition || match.league || '');
    const leagueNameLower = leagueName.toLowerCase();
    const countryName = (match.country || match.league_country || '').toLowerCase();
    const leagueId = Number(match.league_id || 0);

    // FIRST: Check if this league should be excluded
    if (shouldExcludeLeague(leagueName)) {
      return false;
    }

    // Check by league ID first (most accurate)
    if (leagueDef.leagueIds.includes(leagueId)) {
      return true;
    }

    // Check by league name pattern
    const matchesLeagueName = leagueDef.patterns.some(pattern => pattern.test(leagueNameLower));

    if (matchesLeagueName) {
      // For leagues that require country check
      if (leagueDef.requireCountryCheck || leagueDef.name === 'Premier League' || leagueDef.name === 'Serie A') {
        // Must also match country
        const matchesCountry = leagueDef.countryPatterns.some(pattern =>
          pattern.test(countryName)
        );

        if (matchesCountry) {
          return true;
        }
        return false;
      }
      return true;
    }

    return false;
  };

  // ============================================================
  // GET DISPLAY MATCHES - Gabungin semua top league, ambil 5
  // ============================================================
  const getDisplayMatches = () => {

    // Debug: Log semua unique league names
    const uniqueLeagues = [...new Set(matches.map(m =>
      `${m.league_name || m.competition} (${m.country || m.league_country || 'Unknown'})`
    ))];

    // Collect ALL matches from ALL top leagues
    let allTopLeagueMatches = [];

    for (const leagueDef of leagueDefinitions) {
      const leagueMatches = matches.filter(match => matchBelongsToLeague(match, leagueDef));

      if (leagueMatches.length > 0) {

        // Add priority to each match for sorting later
        const matchesWithPriority = leagueMatches.map(m => ({
          ...m,
          _leaguePriority: leagueDef.priority,
          _leagueName: leagueDef.name
        }));

        allTopLeagueMatches = [...allTopLeagueMatches, ...matchesWithPriority];
      }
    }


    if (allTopLeagueMatches.length > 0) {
      // Prioritaskan LIVE matches dulu
      const liveMatches = allTopLeagueMatches.filter(m => {
        const status = (m.status_short || m.status || '').toUpperCase();
        return ['1H', '2H', 'HT', 'LIVE', 'ET', 'PT'].includes(status) || m.is_live;
      });

      if (liveMatches.length > 0) {
        // Sort by league priority, then take 5
        const sorted = liveMatches.sort((a, b) => a._leaguePriority - b._leaguePriority);
        return sorted.slice(0, 5);
      }

      // No live matches, sort by league priority and take 5
      // This ensures we get mix from different top leagues
      const sorted = allTopLeagueMatches.sort((a, b) => a._leaguePriority - b._leaguePriority);

      // Try to get variety - max 2 from each league
      const result = [];
      const leagueCount = {};

      for (const match of sorted) {
        const leagueName = match._leagueName;
        leagueCount[leagueName] = (leagueCount[leagueName] || 0) + 1;

        // Max 2 matches per league for variety
        if (leagueCount[leagueName] <= 2) {
          result.push(match);
        }

        if (result.length >= 5) break;
      }

      // If we don't have 5 yet, fill with remaining
      if (result.length < 5) {
        for (const match of sorted) {
          if (!result.includes(match)) {
            result.push(match);
          }
          if (result.length >= 5) break;
        }
      }

      return result;
    }

    // Fallback: Random 5 matches
    const shuffled = [...matches].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5);
  };

  const displayMatches = getDisplayMatches();
  const currentMatch = displayMatches[currentIndex] || null;

  // ============================================================
  // AUTO-SLIDE
  // ============================================================
  useEffect(() => {
    if (!isAutoPlaying || displayMatches.length <= 1) return;

    const interval = setInterval(() => {
      handleNext();
    }, 6000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, displayMatches.length, currentIndex]);

  // Reset index when matches change
  useEffect(() => {
    setCurrentIndex(0);
  }, [matches.length]);

  // ============================================================
  // NAVIGATION HANDLERS
  // ============================================================
  const handlePrev = () => {
    if (isAnimating) return;
    setIsAutoPlaying(false);
    setSlideDirection('prev');
    setIsAnimating(true);

    setTimeout(() => {
      setCurrentIndex(prev => (prev - 1 + displayMatches.length) % displayMatches.length);
      setSelectedVote(null);
      setIsAnimating(false);
    }, 300);
  };

  const handleNext = () => {
    if (isAnimating) return;
    setSlideDirection('next');
    setIsAnimating(true);

    setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % displayMatches.length);
      setSelectedVote(null);
      setIsAnimating(false);
    }, 300);
  };

  const goToIndex = (index) => {
    if (isAnimating || index === currentIndex) return;
    setIsAutoPlaying(false);
    setSlideDirection(index > currentIndex ? 'next' : 'prev');
    setIsAnimating(true);

    setTimeout(() => {
      setCurrentIndex(index);
      setSelectedVote(null);
      setIsAnimating(false);
    }, 300);
  };

  // ============================================================
  // VOTE HANDLER
  // ============================================================
  const handleVote = (vote) => {
    if (!user) {
      alert('Login dulu untuk voting!');
      return;
    }
    setSelectedVote(vote);
  };

  // ============================================================
  // FORMAT MATCH DISPLAY
  // ============================================================
  const getMatchDisplay = (match) => {
    if (!match) return { time: '-', status: '' };

    const statusShort = (match.status_short || match.status || '').toUpperCase();
    const isLive = ['1H', '2H', 'HT', 'LIVE', 'ET', 'PT'].includes(statusShort);
    const isFinished = ['FT', 'AET', 'PEN'].includes(statusShort);

    if (isLive) {
      return {
        score: `${match.home_score ?? 0} - ${match.away_score ?? 0}`,
        status: statusShort === 'HT' ? 'HT' : `${match.elapsed || ''}'`,
        isLive: true
      };
    }

    if (isFinished) {
      return {
        score: `${match.home_score ?? 0} - ${match.away_score ?? 0}`,
        status: 'FT',
        isFinished: true
      };
    }

    // Upcoming match
    const matchDate = match.match_date || match.date;
    if (matchDate) {
      const date = new Date(matchDate);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

      if (date.toDateString() === today.toDateString()) {
        return { time: timeStr, status: 'Hari ini' };
      } else if (date.toDateString() === tomorrow.toDateString()) {
        return { time: timeStr, status: 'Besok' };
      } else {
        return {
          time: timeStr,
          status: date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
        };
      }
    }

    return { time: match.time || '-', status: '' };
  };

  // ============================================================
  // MOCK DATA
  // ============================================================
  const fifaRankings = [
    { rank: 1, team: 'Argentina', points: 1867.25, change: 0 },
    { rank: 2, team: 'France', points: 1859.78, change: 0 },
    { rank: 3, team: 'Spain', points: 1845.50, change: 1 },
  ];

  const uefaRankings = [
    { rank: 1, team: 'Manchester City', points: 134.000, change: 0 },
    { rank: 2, team: 'Real Madrid', points: 130.000, change: 0 },
    { rank: 3, team: 'Bayern Munich', points: 117.000, change: 1 },
  ];

  const topPlayers = [
    { rank: 1, name: 'Adrien Rabiot', position: 'Gelandang', rating: 9.8, stats: '1 - 3', color: '#FF6B6B', initial: 'A' },
    { rank: 2, name: 'Rafael Borré', position: 'Penyerang', rating: 9.5, stats: '0 - 4', color: '#FFA94D', initial: 'R' },
    { rank: 3, name: 'Léo Rafael', position: 'Gelandang', rating: 9.2, stats: '1 - 3', color: '#FFD43B', initial: 'L' },
  ];

  const getOdds = () => ({
    home: (1.5 + Math.random() * 2).toFixed(2),
    draw: (3 + Math.random() * 2).toFixed(2),
    away: (2 + Math.random() * 3).toFixed(2),
    homeUp: Math.random() > 0.5,
    drawUp: Math.random() > 0.5,
    awayUp: Math.random() > 0.5,
  });

  const odds = getOdds();
  const matchDisplay = currentMatch ? getMatchDisplay(currentMatch) : { time: '-', status: '' };

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (!currentMatch) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
          <div className="h-20 bg-gray-200 rounded mb-4"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
        <p className="text-gray-500 text-sm mt-4 font-condensed">Memuat pertandingan...</p>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-4">
      {/* Main Match Card */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* League Header */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          {currentMatch.league_logo ? (
            <img
              src={currentMatch.league_logo}
              alt=""
              className="w-10 h-10 object-contain"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <span className="text-lg">⚽</span>
          )}
          <span className="font-semibold text-gray-800 font-condensed">
            {currentMatch.league_name || currentMatch.competition || 'Liga'}
          </span>
          {(currentMatch.country || currentMatch.league_country) && (
            <span className="text-xs text-gray-400 font-condensed">
              • {currentMatch.country || currentMatch.league_country}
            </span>
          )}
        </div>

        {/* Match Info - with smooth slide animation */}
        <div className="relative overflow-hidden">
          <div
            className={`px-4 py-6 transition-all duration-300 ease-in-out ${isAnimating
              ? slideDirection === 'next'
                ? 'opacity-0 -translate-x-4'
                : 'opacity-0 translate-x-4'
              : 'opacity-100 translate-x-0'
              }`}
          >
            <div className="flex items-center justify-between">
              {/* Home Team */}
              <div className="flex-1 text-center">
                <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center">
                  {currentMatch.home_team_logo ? (
                    <img
                      src={currentMatch.home_team_logo}
                      alt={currentMatch.home_team_name}
                      className="w-14 h-14 object-contain"
                      onError={(e) => { e.target.src = '/images/default-team.png'; }}
                    />
                  ) : (
                    <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center text-2xl">
                      🏠
                    </div>
                  )}
                </div>
                <p className="font-semibold text-gray-800 text-sm font-condensed line-clamp-2">
                  {currentMatch.home_team_name || currentMatch.home_team || 'Home'}
                </p>
              </div>

              {/* Score / Time */}
              <div className="flex-shrink-0 px-4 text-center min-w-[100px]">
                {matchDisplay.isLive ? (
                  <>
                    <p className="text-3xl font-bold text-gray-800 font-condensed">{matchDisplay.score}</p>
                    <span className="inline-block px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-condensed animate-pulse">
                      {matchDisplay.status}
                    </span>
                  </>
                ) : matchDisplay.isFinished ? (
                  <>
                    <p className="text-3xl font-bold text-gray-800 font-condensed">{matchDisplay.score}</p>
                    <span className="text-sm text-gray-500 font-condensed">{matchDisplay.status}</span>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-gray-800 font-condensed">{matchDisplay.time}</p>
                    <span className="text-sm text-gray-500 font-condensed">{matchDisplay.status}</span>
                  </>
                )}
              </div>

              {/* Away Team */}
              <div className="flex-1 text-center">
                <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center">
                  {currentMatch.away_team_logo ? (
                    <img
                      src={currentMatch.away_team_logo}
                      alt={currentMatch.away_team_name}
                      className="w-14 h-14 object-contain"
                      onError={(e) => { e.target.src = '/images/default-team.png'; }}
                    />
                  ) : (
                    <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center text-2xl">
                      ✈️
                    </div>
                  )}
                </div>
                <p className="font-semibold text-gray-800 text-sm font-condensed line-clamp-2">
                  {currentMatch.away_team_name || currentMatch.away_team || 'Away'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Voting Section */}
        <div className="px-4 py-4 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold text-gray-800 font-condensed">Siapa yang akan menang?</p>
              <p className="text-xs text-gray-500 font-condensed">Berikan votingmu!</p>
            </div>
            <ThumbsUp className="w-5 h-5 text-gray-400" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleVote('home')}
              className={`flex items-center justify-center gap-2 py-3 px-2 rounded-lg border-2 transition-all ${selectedVote === 'home'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
            >
              {currentMatch.home_team_logo ? (
                <img src={currentMatch.home_team_logo} alt="" className="w-6 h-6 object-contain" />
              ) : (
                <span>🏠</span>
              )}
            </button>

            <button
              onClick={() => handleVote('draw')}
              className={`flex items-center justify-center py-3 px-2 rounded-lg border-2 transition-all font-bold font-condensed ${selectedVote === 'draw'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
            >
              X
            </button>

            <button
              onClick={() => handleVote('away')}
              className={`flex items-center justify-center gap-2 py-3 px-2 rounded-lg border-2 transition-all ${selectedVote === 'away'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
            >
              {currentMatch.away_team_logo ? (
                <img src={currentMatch.away_team_logo} alt="" className="w-6 h-6 object-contain" />
              ) : (
                <span>✈️</span>
              )}
            </button>
          </div>
        </div>

        {/* Odds Section */}
        <div className="px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 font-condensed mb-2">Waktu penuh</p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-gray-50 rounded-lg py-2 px-3 text-center">
              <span className="text-xs text-gray-500 font-condensed">1</span>
              <p className={`font-bold font-condensed ${odds.homeUp ? 'text-green-600' : 'text-red-500'}`}>
                {odds.homeUp ? '▲' : '▼'} {odds.home}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg py-2 px-3 text-center">
              <span className="text-xs text-gray-500 font-condensed">X</span>
              <p className={`font-bold font-condensed ${odds.drawUp ? 'text-green-600' : 'text-red-500'}`}>
                {odds.drawUp ? '▲' : '▼'} {odds.draw}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg py-2 px-3 text-center">
              <span className="text-xs text-gray-500 font-condensed">2</span>
              <p className={`font-bold font-condensed ${odds.awayUp ? 'text-green-600' : 'text-red-500'}`}>
                {odds.awayUp ? '▲' : '▼'} {odds.away}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="bg-gray-800 text-white text-[10px] px-2 py-1 rounded font-bold">1XBET</span>
            <button className="text-sm text-blue-600 font-condensed hover:underline">
              Peluang tambahan ▼
            </button>
          </div>
        </div>

        {/* Navigation Dots */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={isAnimating}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 font-condensed disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
            Sebelumnya
          </button>

          <div className="flex items-center gap-1.5">
            {displayMatches.map((_, index) => (
              <button
                key={index}
                onClick={() => goToIndex(index)}
                disabled={isAnimating}
                className={`h-2 rounded-full transition-all duration-300 ${index === currentIndex
                  ? 'bg-green-500 w-4'
                  : 'bg-gray-300 hover:bg-gray-400 w-2'
                  }`}
              />
            ))}
          </div>

          <button
            onClick={() => { setIsAutoPlaying(false); handleNext(); }}
            disabled={isAnimating}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-condensed disabled:opacity-50"
          >
            Berikutnya
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* FIFA & UEFA Rankings Tabs */}
        <div className="border-t border-gray-100">
          <div className="grid grid-cols-2">
            <button
              onClick={() => setActiveRankingTab('fifa')}
              className={`flex items-center justify-center gap-2 py-3 transition-colors ${activeRankingTab === 'fifa'
                ? 'bg-white border-b-2 border-blue-500'
                : 'bg-gray-50 hover:bg-gray-100'
                }`}
            >
              <span className="font-bold text-gray-800 font-condensed text-sm">FIFA</span>
              <span className="text-blue-600 font-condensed text-xs">Peringkat FIFA →</span>
            </button>
            <button
              onClick={() => setActiveRankingTab('uefa')}
              className={`flex items-center justify-center gap-2 py-3 transition-colors ${activeRankingTab === 'uefa'
                ? 'bg-white border-b-2 border-blue-500'
                : 'bg-gray-50 hover:bg-gray-100'
                }`}
            >
              <span className="text-base">🏆</span>
              <span className="text-blue-600 font-condensed text-xs">Peringkat UEFA →</span>
            </button>
          </div>

          <div className="px-4 py-3">
            {activeRankingTab === 'fifa' ? (
              <div className="space-y-2">
                {fifaRankings.map((item) => (
                  <div key={item.rank} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-400 w-4">{item.rank}</span>
                      <span className="text-sm font-condensed text-gray-800">{item.team}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{item.points.toFixed(2)}</span>
                      {item.change > 0 && <span className="text-green-500 text-xs">▲</span>}
                      {item.change < 0 && <span className="text-red-500 text-xs">▼</span>}
                      {item.change === 0 && <span className="text-gray-400 text-xs">-</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {uefaRankings.map((item) => (
                  <div key={item.rank} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-400 w-4">{item.rank}</span>
                      <span className="text-sm font-condensed text-gray-800">{item.team}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{item.points.toFixed(3)}</span>
                      {item.change > 0 && <span className="text-green-500 text-xs">▲</span>}
                      {item.change < 0 && <span className="text-red-500 text-xs">▼</span>}
                      {item.change === 0 && <span className="text-gray-400 text-xs">-</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Players Section */}
        <div className="border-t border-gray-100">
          <div className="px-4 py-3 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 font-condensed">Pemain terbaik</h3>
            <Info className="w-4 h-4 text-gray-400" />
          </div>

          <div className="px-4 pb-3 space-y-3">
            {topPlayers.map((player) => (
              <div key={player.rank} className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-400 w-4">{player.rank}</span>

                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: player.color }}
                >
                  {player.initial}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm font-condensed truncate">{player.name}</p>
                  <p className="text-xs text-gray-500 font-condensed">{player.position}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <span>⚽</span> {player.stats}
                  </span>
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded font-bold min-w-[32px] text-center">
                    {player.rating}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 pb-4">
            <button className="w-full text-center text-blue-600 text-sm font-condensed hover:underline">
              Selengkapnya ▼
            </button>
          </div>
        </div>

        {/* View Match Detail Button */}
        <div className="px-4 pb-4">
          <button
            onClick={() => onMatchClick?.(currentMatch)}
            className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 font-condensed"
          >
            Lihat Detail Pertandingan
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Season Challenge Button */}
      <button
        onClick={onChallengeClick}
        className="w-full flex items-center justify-between bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-800 font-condensed">SEASON CHALLENGE</p>
            <p className="text-sm text-gray-500 font-condensed">Tebak skor & dapatkan poin!</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </button>
    </div>
  );
}
