'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Trophy, Info, ThumbsUp, ExternalLink, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';

export default function SofaMatchPreview({ matches = [], user, onMatchClick, onChallengeClick }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedVote, setSelectedVote] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [activeRankingTab, setActiveRankingTab] = useState('fifa');
  const [slideDirection, setSlideDirection] = useState('next');
  const [isAnimating, setIsAnimating] = useState(false);
  const [topPlayers, setTopPlayers] = useState([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);

  // ============================================================
  // LIGA DEFINITIONS - Spesifik per negara
  // ============================================================

  // Pattern untuk EXCLUDE (liga yang bukan top tier)
  const excludePatterns = [
    /division\s*(one|two|three|1|2|3)/i,
    /league\s*(one|two|three|1|2)/i,
    /u\s*-?\s*(17|18|19|20|21|23)/i,
    /under\s*(17|18|19|20|21|23)/i,
    /reserve/i,
    /youth/i,
    /academy/i,
    /2nd\s*division/i,
    /second\s*division/i,
    /championship/i,
    /league\s*cup/i,
    /efl\s*trophy/i,
    /community\s*shield/i,
    /super\s*cup/i,
    /premier\s*league\s*2/i,
    /premier\s*league\s*cup/i,
    /professional\s*development/i,
    /2\.\s*bundesliga/i,
    /3\.\s*liga/i,
    /regionalliga/i,
    /ligue\s*2/i,
    /serie\s*b/i,
    /segunda/i,
    /segunda\s*division/i,
  ];

  const shouldExcludeLeague = (leagueName) => {
    return excludePatterns.some(pattern => pattern.test(leagueName));
  };

  const leagueDefinitions = [
    {
      name: 'Premier League',
      country: 'England',
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
      patterns: [/^bundesliga$/i],
      countryPatterns: [/germany/i, /german/i, /jerman/i, /deutschland/i],
      leagueIds: [78],
      priority: 4,
      requireCountryCheck: true,
    },
    {
      name: 'Ligue 1',
      country: 'France',
      patterns: [/^ligue\s*1$/i, /ligue\s*1\s*uber\s*eats/i],
      countryPatterns: [/france/i, /french/i, /prancis/i, /perancis/i],
      leagueIds: [61],
      priority: 5,
      requireCountryCheck: true,
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

  const matchBelongsToLeague = (match, leagueDef) => {
    const leagueName = (match.league_name || match.competition || match.league || '');
    const leagueNameLower = leagueName.toLowerCase();
    const countryName = (match.country || match.league_country || '').toLowerCase();
    const leagueId = Number(match.league_id || 0);

    if (shouldExcludeLeague(leagueName)) {
      return false;
    }

    if (leagueDef.leagueIds.includes(leagueId)) {
      return true;
    }

    const matchesLeagueName = leagueDef.patterns.some(pattern => pattern.test(leagueNameLower));

    if (matchesLeagueName) {
      if (leagueDef.requireCountryCheck || leagueDef.name === 'Premier League' || leagueDef.name === 'Serie A') {
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
  // BIG MATCH / DERBY DEFINITIONS
  // ============================================================
  const bigMatchPairs = [
    // England
    { teams: ['manchester united', 'manchester city'], name: 'Manchester Derby' },
    { teams: ['manchester united', 'liverpool'], name: 'North West Derby' },
    { teams: ['liverpool', 'everton'], name: 'Merseyside Derby' },
    { teams: ['arsenal', 'tottenham'], name: 'North London Derby' },
    { teams: ['chelsea', 'tottenham'], name: 'London Derby' },
    { teams: ['chelsea', 'arsenal'], name: 'London Derby' },
    { teams: ['manchester united', 'arsenal'], name: 'Big Match' },
    { teams: ['manchester united', 'chelsea'], name: 'Big Match' },
    { teams: ['liverpool', 'manchester city'], name: 'Title Clash' },
    // Spain
    { teams: ['barcelona', 'real madrid'], name: 'El Clásico' },
    { teams: ['atletico madrid', 'real madrid'], name: 'Madrid Derby' },
    { teams: ['barcelona', 'atletico madrid'], name: 'Big Match' },
    { teams: ['sevilla', 'real betis'], name: 'Seville Derby' },
    // Italy
    { teams: ['inter', 'milan', 'ac milan', 'inter milan'], name: 'Derby della Madonnina' },
    { teams: ['juventus', 'inter', 'inter milan'], name: 'Derby d\'Italia' },
    { teams: ['roma', 'lazio'], name: 'Derby della Capitale' },
    { teams: ['juventus', 'milan', 'ac milan'], name: 'Big Match' },
    { teams: ['napoli', 'juventus'], name: 'Big Match' },
    // Germany
    { teams: ['bayern munich', 'borussia dortmund', 'bayern', 'dortmund'], name: 'Der Klassiker' },
    { teams: ['schalke', 'borussia dortmund', 'dortmund'], name: 'Revierderby' },
    // France
    { teams: ['paris saint-germain', 'marseille', 'psg', 'olympique marseille'], name: 'Le Classique' },
    { teams: ['lyon', 'saint-etienne', 'olympique lyonnais'], name: 'Derby Rhône-Alpes' },
  ];

  const isBigMatch = (match) => {
    const homeTeam = (match.home_team_name || match.home_team || '').toLowerCase();
    const awayTeam = (match.away_team_name || match.away_team || '').toLowerCase();

    for (const pair of bigMatchPairs) {
      const teamPatterns = pair.teams.map(t => t.toLowerCase());
      const homeMatches = teamPatterns.some(t => homeTeam.includes(t) || t.includes(homeTeam));
      const awayMatches = teamPatterns.some(t => awayTeam.includes(t) || t.includes(awayTeam));

      if (homeMatches && awayMatches) {
        return { isBig: true, name: pair.name };
      }
    }
    return { isBig: false, name: null };
  };

  const getDisplayMatches = () => {
    let allTopLeagueMatches = [];
    const leagueMatchCount = {}; // Track matches per league

    // MAX matches per league (to ensure variety)
    const MAX_PER_LEAGUE = 2;

    for (const leagueDef of leagueDefinitions) {
      const leagueMatches = matches.filter(match => matchBelongsToLeague(match, leagueDef));

      if (leagueMatches.length > 0) {
        const matchesWithPriority = leagueMatches.map(m => {
          const bigMatchInfo = isBigMatch(m);
          return {
            ...m,
            _leaguePriority: leagueDef.priority,
            _leagueName: leagueDef.name,
            _isBigMatch: bigMatchInfo.isBig,
            _bigMatchName: bigMatchInfo.name
          };
        });

        allTopLeagueMatches = [...allTopLeagueMatches, ...matchesWithPriority];
      }
    }

    if (allTopLeagueMatches.length > 0) {
      // 1. Separate LIVE matches
      const liveMatches = allTopLeagueMatches.filter(m => {
        const status = (m.status_short || m.status || '').toUpperCase();
        return ['1H', '2H', 'HT', 'LIVE', 'ET', 'PT'].includes(status) || m.is_live;
      });

      // If there are live matches, prioritize them
      if (liveMatches.length > 0) {
        // Sort live matches: Big Match first, then by league priority
        liveMatches.sort((a, b) => {
          if (a._isBigMatch && !b._isBigMatch) return -1;
          if (!a._isBigMatch && b._isBigMatch) return 1;
          return a._leaguePriority - b._leaguePriority;
        });
        return liveMatches.slice(0, 5);
      }

      // 2. For non-live: Sort by Big Match first, then league priority
      allTopLeagueMatches.sort((a, b) => {
        // Big matches always first
        if (a._isBigMatch && !b._isBigMatch) return -1;
        if (!a._isBigMatch && b._isBigMatch) return 1;
        // Then by league priority
        return a._leaguePriority - b._leaguePriority;
      });

      // 3. Pick matches with league limit to ensure variety
      const selectedMatches = [];
      const leagueCounts = {};

      for (const match of allTopLeagueMatches) {
        const leagueName = match._leagueName;

        // Always include Big Matches (bypass league limit)
        if (match._isBigMatch) {
          if (!selectedMatches.find(m => m.id === match.id)) {
            selectedMatches.push(match);
            leagueCounts[leagueName] = (leagueCounts[leagueName] || 0) + 1;
          }
          continue;
        }

        // Apply league limit for regular matches
        if ((leagueCounts[leagueName] || 0) < MAX_PER_LEAGUE) {
          if (!selectedMatches.find(m => m.id === match.id)) {
            selectedMatches.push(match);
            leagueCounts[leagueName] = (leagueCounts[leagueName] || 0) + 1;
          }
        }

        // Stop if we have enough
        if (selectedMatches.length >= 5) break;
      }

      return selectedMatches.slice(0, 5);
    }

    return matches.slice(0, 5);
  };

  const displayMatches = getDisplayMatches();
  const currentMatch = displayMatches[currentIndex];

  // ============================================================
  // FETCH TOP RATED PLAYERS FROM BACKEND
  // ============================================================
  const fetchTopPlayers = async () => {
    setIsLoadingPlayers(true);
    try {
      // Fetch from backend API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/matches/top-players?limit=3`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        setTopPlayers(result.data);
      } else {
        // No data available
        setTopPlayers([]);
      }
    } catch (err) {
      console.error('Error fetching top players:', err);
      setTopPlayers([]);
    } finally {
      setIsLoadingPlayers(false);
    }
  };

  // Fetch top players on mount
  useEffect(() => {
    fetchTopPlayers();
    // Refresh every 5 minutes
    const interval = setInterval(fetchTopPlayers, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // ============================================================
  // CHECK EXISTING VOTE FROM DATABASE
  // ============================================================
  const checkExistingVote = async () => {
    if (!user || !currentMatch) return;

    const matchId = parseInt(currentMatch.id || currentMatch.match_id);
    if (!matchId) return;

    try {
      const { data, error } = await supabase
        .from('winner_predictions')
        .select('predicted_result')
        .eq('email', user.email)
        .eq('match_id', matchId)
        .single();

      if (data && !error) {
        setSelectedVote(data.predicted_result);
        setHasVoted(true);
      } else {
        setSelectedVote(null);
        setHasVoted(false);
      }
    } catch (err) {
      console.log('No existing vote found');
      setSelectedVote(null);
      setHasVoted(false);
    }
  };

  // Check vote when match changes or user logs in
  useEffect(() => {
    checkExistingVote();
  }, [currentMatch?.id, user?.email]);

  // ============================================================
  // SUBMIT VOTE TO DATABASE
  // ============================================================
  const handleVote = async (vote) => {
    if (!user) {
      alert('Login dulu untuk voting!');
      return;
    }

    if (hasVoted) {
      alert('Kamu sudah voting untuk pertandingan ini!');
      return;
    }

    // Check if match already started or finished
    const statusShort = (currentMatch.status_short || currentMatch.status || '').toUpperCase();
    const isLive = ['1H', '2H', 'HT', 'LIVE', 'ET', 'PT'].includes(statusShort);
    const isFinished = ['FT', 'AET', 'PEN'].includes(statusShort);

    if (isLive || isFinished) {
      alert('Tidak bisa voting untuk pertandingan yang sudah dimulai atau selesai!');
      return;
    }

    setIsSubmitting(true);

    try {
      const matchId = parseInt(currentMatch.id || currentMatch.match_id);

      const { error } = await supabase
        .from('winner_predictions')
        .insert([{
          email: user.email,
          match_id: matchId,
          predicted_result: vote,
          status: 'pending'
        }]);

      if (error) {
        console.error('Vote error:', error);
        alert('Gagal menyimpan vote: ' + error.message);
        return;
      }

      setSelectedVote(vote);
      setHasVoted(true);
      alert('🎯 Vote berhasil disimpan!');

    } catch (err) {
      console.error('Vote error:', err);
      alert('Terjadi kesalahan saat voting');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================
  // AUTO-PLAY & NAVIGATION
  // ============================================================
  useEffect(() => {
    if (!isAutoPlaying || displayMatches.length <= 1) return;

    const interval = setInterval(() => {
      setSlideDirection('next');
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % displayMatches.length);
        setTimeout(() => setIsAnimating(false), 50);
      }, 200);
    }, 8000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, displayMatches.length]);

  const handlePrev = () => {
    if (isAnimating) return;
    setIsAutoPlaying(false);
    setSlideDirection('prev');
    setIsAnimating(true);

    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + displayMatches.length) % displayMatches.length);
      setTimeout(() => setIsAnimating(false), 50);
    }, 200);
  };

  const handleNext = () => {
    if (isAnimating) return;
    setSlideDirection('next');
    setIsAnimating(true);

    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % displayMatches.length);
      setTimeout(() => setIsAnimating(false), 50);
    }, 200);
  };

  const goToIndex = (index) => {
    if (isAnimating || index === currentIndex) return;
    setIsAutoPlaying(false);
    setSlideDirection(index > currentIndex ? 'next' : 'prev');
    setIsAnimating(true);

    setTimeout(() => {
      setCurrentIndex(index);
      setTimeout(() => setIsAnimating(false), 50);
    }, 200);
  };

  // Animation classes for smooth slide
  const getSlideAnimationClass = () => {
    if (!isAnimating) return 'translate-x-0 opacity-100';
    if (slideDirection === 'next') return '-translate-x-4 opacity-0';
    return 'translate-x-4 opacity-0';
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
  // MOCK DATA FOR RANKINGS
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

  // topPlayers is now fetched from API (see useEffect above)

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

  // Check if voting is allowed
  const statusShort = (currentMatch?.status_short || currentMatch?.status || '').toUpperCase();
  const isMatchLive = ['1H', '2H', 'HT', 'LIVE', 'ET', 'PT'].includes(statusShort);
  const isMatchFinished = ['FT', 'AET', 'PEN'].includes(statusShort);
  const canVote = !isMatchLive && !isMatchFinished && !hasVoted;

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (!currentMatch) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* League Header */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2">
            {currentMatch.league_logo ? (
              <img
                src={currentMatch.league_logo}
                alt=""
                className="w-5 h-5 object-contain"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <span className="text-sm">⚽</span>
            )}
            <h3 className="font-bold text-gray-800 font-condensed">
              {currentMatch._leagueName || currentMatch.league_name || currentMatch.competition || 'League'}
            </h3>
            <span className="text-sm text-gray-500 font-condensed">
              • {currentMatch.country || currentMatch.league_country || 'World'}
            </span>
          </div>
        </div>

        {/* Match Preview Card - Smooth Slide Animation */}
        <div className="overflow-hidden">
          <div className={`transform transition-all duration-300 ease-out ${getSlideAnimationClass()}`}>
            <div className="px-4 py-6">
              <div className="flex items-center justify-between">
                {/* Home Team */}
                <div className="flex-1 text-center">
                  <div className="flex flex-col items-center">
                    {currentMatch.home_team_logo ? (
                      <img
                        src={currentMatch.home_team_logo}
                        alt={currentMatch.home_team_name || currentMatch.home_team}
                        className="w-14 h-14 object-contain mb-2"
                        onError={(e) => { e.target.src = '/images/default-team.png'; }}
                      />
                    ) : (
                      <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center text-2xl mb-2">
                        🏠
                      </div>
                    )}
                  </div>
                  <p className="font-semibold text-gray-800 text-sm font-condensed line-clamp-2">
                    {currentMatch.home_team_name || currentMatch.home_team || 'Home'}
                  </p>
                </div>

                {/* Score/Time */}
                <div className="flex-shrink-0 mx-4 text-center min-w-[80px]">
                  {matchDisplay.isLive ? (
                    <div>
                      <div className="text-2xl font-bold text-red-600 font-condensed">{matchDisplay.score}</div>
                      <div className="flex items-center justify-center gap-1">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        <span className="text-xs text-red-600 font-condensed">{matchDisplay.status}</span>
                      </div>
                    </div>
                  ) : matchDisplay.isFinished ? (
                    <div>
                      <div className="text-2xl font-bold text-gray-800 font-condensed">{matchDisplay.score}</div>
                      <span className="text-xs text-green-600 font-condensed">{matchDisplay.status}</span>
                    </div>
                  ) : (
                    <div>
                      <div className="text-2xl font-bold text-gray-800 font-condensed">{matchDisplay.time}</div>
                      <span className="text-xs text-gray-500 font-condensed">{matchDisplay.status}</span>
                    </div>
                  )}
                </div>

                {/* Away Team */}
                <div className="flex-1 text-center">
                  <div className="flex flex-col items-center">
                    {currentMatch.away_team_logo ? (
                      <img
                        src={currentMatch.away_team_logo}
                        alt={currentMatch.away_team_name || currentMatch.away_team}
                        className="w-14 h-14 object-contain mb-2"
                        onError={(e) => { e.target.src = '/images/default-team.png'; }}
                      />
                    ) : (
                      <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center text-2xl mb-2">
                        ✈️
                      </div>
                    )}
                  </div>
                  <p className="font-semibold text-gray-800 text-sm font-condensed line-clamp-2">
                    {currentMatch.away_team_name || currentMatch.away_team || 'Away'}
                  </p>
                </div>
              </div>

              {/* Big Match Badge */}
              {currentMatch._isBigMatch && (
                <div className="mt-3 flex justify-center">
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                    🔥 {currentMatch._bigMatchName || 'Big Match'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Voting Section */}
        <div className="px-4 py-4 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold text-gray-800 font-condensed">Siapa yang akan menang?</p>
              <p className="text-xs text-gray-500 font-condensed">
                {hasVoted ? '✅ Kamu sudah voting!' : isMatchLive ? '🔴 Pertandingan sedang berlangsung' : isMatchFinished ? '✅ Pertandingan selesai' : 'Berikan votingmu!'}
              </p>
            </div>
            {hasVoted ? (
              <Check className="w-5 h-5 text-green-500" />
            ) : (
              <ThumbsUp className="w-5 h-5 text-gray-400" />
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleVote('home')}
              disabled={!canVote || isSubmitting}
              className={`flex items-center justify-center gap-2 py-3 px-2 rounded-lg border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${selectedVote === 'home'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : currentMatch.home_team_logo ? (
                <img src={currentMatch.home_team_logo} alt="" className="w-6 h-6 object-contain" />
              ) : (
                <span>🏠</span>
              )}
              {selectedVote === 'home' && <Check className="w-4 h-4 text-green-500" />}
            </button>

            <button
              onClick={() => handleVote('draw')}
              disabled={!canVote || isSubmitting}
              className={`flex items-center justify-center py-3 px-2 rounded-lg border-2 transition-all font-bold font-condensed disabled:opacity-50 disabled:cursor-not-allowed ${selectedVote === 'draw'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'X'}
              {selectedVote === 'draw' && <Check className="w-4 h-4 text-green-500 ml-1" />}
            </button>

            <button
              onClick={() => handleVote('away')}
              disabled={!canVote || isSubmitting}
              className={`flex items-center justify-center gap-2 py-3 px-2 rounded-lg border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${selectedVote === 'away'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : currentMatch.away_team_logo ? (
                <img src={currentMatch.away_team_logo} alt="" className="w-6 h-6 object-contain" />
              ) : (
                <span>✈️</span>
              )}
              {selectedVote === 'away' && <Check className="w-4 h-4 text-green-500" />}
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
            <button
              onClick={fetchTopPlayers}
              disabled={isLoadingPlayers}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {isLoadingPlayers ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Info className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="px-4 pb-3 space-y-3">
            {isLoadingPlayers ? (
              // Loading skeleton
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-4 h-4 bg-gray-200 rounded"></div>
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="h-6 w-10 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : topPlayers.length === 0 ? (
              // Empty state
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 font-condensed">Belum ada data pemain</p>
                <p className="text-xs text-gray-400 font-condensed mt-1">Data rating tersedia setelah match liga top selesai</p>
              </div>
            ) : (
              // Player list
              topPlayers.map((player) => (
                <div key={player.rank} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-400 w-4">{player.rank}</span>

                  {player.photo ? (
                    <img
                      src={player.photo}
                      alt={player.name}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${player.photo ? 'hidden' : ''}`}
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
                    <span
                      className="text-white text-xs px-2 py-1 rounded font-bold min-w-[32px] text-center"
                      style={{ backgroundColor: player.color || '#3B82F6' }}
                    >
                      {typeof player.rating === 'number' ? player.rating.toFixed(1) : player.rating}
                    </span>
                  </div>
                </div>
              ))
            )}
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
