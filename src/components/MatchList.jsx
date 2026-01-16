// MatchList.jsx - Updated with New Backend Integration
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { generateMatchSlug } from '../utils/matchUtils';
import React from 'react';

// ✅ GANTI IMPORT HOOK LAMA DENGAN YANG BARU
import { useLivescore } from '../hooks/useLivescore';

import { RefreshCw, Loader2, Star, Activity, Archive } from 'lucide-react';
import SimpleSearchBar from './SimpleSearchBar';
import RealTimeMatchItem from './RealTimeMatchItem';
import ArchivedMatches from './ArchivedMatches';
import StatusManager from '../utils/StatusManager';
import GoalNotificationPortal from './GoalNotificationPortal';
import MatchFilterService from '../services/MatchFilterService';

console.log('🔗 API Base URL:', process.env.NEXT_PUBLIC_API_BASE_URL);

// Logo helper functions
const BUNNYCDN_BASE = 'https://api-football-logos.b-cdn.net';

const generateTeamLogoUrl = (teamId, teamName) => {
    if (teamId) {
        return `${BUNNYCDN_BASE}/football/teams/${teamId}.png`;
    }
    return null;
};

const SimpleLeagueLogo = ({ leagueName, leagueId, logoUrl, size = 'w-4 h-4' }) => {
    const [imageSrc, setImageSrc] = useState(null);
    const [hasError, setHasError] = useState(false);

    const getCorrectLeagueLogo = (leagueName, leagueId) => {
        if (logoUrl && logoUrl !== '') {
            return logoUrl;
        }

        const leagueIdMapping = {
            39: `${BUNNYCDN_BASE}/football/leagues/39.png`,
            140: `${BUNNYCDN_BASE}/football/leagues/140.png`,
            135: `${BUNNYCDN_BASE}/football/leagues/135.png`,
            78: `${BUNNYCDN_BASE}/football/leagues/78.png`,
            61: `${BUNNYCDN_BASE}/football/leagues/61.png`,
            2: `${BUNNYCDN_BASE}/football/leagues/2.png`,
            3: `${BUNNYCDN_BASE}/football/leagues/3.png`,
            274: `${BUNNYCDN_BASE}/football/leagues/274.png`,
            88: `${BUNNYCDN_BASE}/football/leagues/88.png`,
        };

        if (leagueId && leagueIdMapping[leagueId]) {
            return leagueIdMapping[leagueId];
        }

        const leagueNameMapping = {
            'La Liga': `${BUNNYCDN_BASE}/football/leagues/140.png`,
            'Premier League': `${BUNNYCDN_BASE}/football/leagues/39.png`,
            'Serie A': `${BUNNYCDN_BASE}/football/leagues/135.png`,
            'Bundesliga': `${BUNNYCDN_BASE}/football/leagues/78.png`,
            'Ligue 1': `${BUNNYCDN_BASE}/football/leagues/61.png`,
            'UEFA Champions League': `${BUNNYCDN_BASE}/football/leagues/2.png`,
            'UEFA Europa League': `${BUNNYCDN_BASE}/football/leagues/3.png`,
        };

        return leagueNameMapping[leagueName] || null;
    };

    const getCountryFlag = (leagueName) => {
        const countryFlags = {
            'La Liga': 'https://media.api-sports.io/flags/es.svg',
            'Premier League': 'https://media.api-sports.io/flags/gb.svg',
            'Serie A': 'https://media.api-sports.io/flags/it.svg',
            'Bundesliga': 'https://media.api-sports.io/flags/de.svg',
            'Ligue 1': 'https://media.api-sports.io/flags/fr.svg',
            'Eredivisie': 'https://media.api-sports.io/flags/nl.svg',
            'Liga 1': 'https://media.api-sports.io/flags/id.svg',
            'UEFA Champions League': 'https://media.api-sports.io/flags/eu.svg',
            'UEFA Europa League': 'https://media.api-sports.io/flags/eu.svg',
        };
        return countryFlags[leagueName];
    };

    useEffect(() => {
        const correctLogo = getCorrectLeagueLogo(leagueName, leagueId);
        setImageSrc(correctLogo);
        setHasError(false);
    }, [leagueName, leagueId, logoUrl]);

    const handleError = () => {
        if (!hasError) {
            const countryFlag = getCountryFlag(leagueName);
            if (countryFlag && countryFlag !== imageSrc) {
                setImageSrc(countryFlag);
                setHasError(false);
                return;
            }
        }
        setHasError(true);
    };

    if (hasError || !imageSrc) {
        const initials = leagueName ? leagueName.substring(0, 2).toUpperCase() : 'LG';
        return (
            <div
                className={`${size} bg-gradient-to-br from-green-500 to-blue-600 rounded-sm flex items-center justify-center text-white font-bold text-xs`}
                title={leagueName}
            >
                {initials}
            </div>
        );
    }

    return (
        <img
            src={imageSrc}
            alt={`${leagueName} logo`}
            className={`${size} object-cover rounded-sm`}
            onError={handleError}
            title={leagueName}
        />
    );
};

const TeamLogo = ({ teamId, teamName, logoUrl, size = 'sm', className = '' }) => {
    const [imageSrc, setImageSrc] = useState(null);
    const [hasError, setHasError] = useState(false);

    const sizeClasses = {
        xs: 'w-4 h-4',
        sm: 'w-5 h-5',
        md: 'w-6 h-6',
        lg: 'w-8 h-8'
    };

    const getTeamLogo = (teamId, teamName, logoUrl) => {
        if (logoUrl && logoUrl !== '') {
            return logoUrl;
        }
        if (teamId) {
            return `https://media.api-sports.io/football/teams/${teamId}.png`;
        }
        return null;
    };

    useEffect(() => {
        const teamLogo = getTeamLogo(teamId, teamName, logoUrl);
        setImageSrc(teamLogo);
        setHasError(false);
    }, [logoUrl, teamId, teamName]);

    const handleError = () => {
        if (!hasError) {
            if (teamId) {
                const fallbackUrl = `${BUNNYCDN_BASE}/football/teams/${teamId}.png`;
                if (fallbackUrl !== imageSrc) {
                    setImageSrc(fallbackUrl);
                    setHasError(false);
                    return;
                }
            }
        }
        setHasError(true);
    };

    if (hasError || !imageSrc) {
        const initials = teamName ? teamName.substring(0, 2).toUpperCase() : 'FC';
        return (
            <div
                className={`${sizeClasses[size]} ${className} bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs`}
                title={teamName}
            >
                {initials}
            </div>
        );
    }

    return (
        <img
            src={imageSrc}
            alt={`${teamName} logo`}
            className={`${sizeClasses[size]} ${className} object-cover rounded-full border border-gray-200`}
            onError={handleError}
            title={teamName}
        />
    );
};

// ============================================
// MAIN COMPONENT
// ============================================
const CleanMatchList = ({ user, username, onAuthRequired }) => {
    const router = useRouter();

    // ✅ MENGGUNAKAN HOOK BARU - useLivescore
    const {
        matches,
        grouped,
        loading: isLoading,
        error: backendError,
        serverStatus,
        lastUpdated,
        refresh: fetchMatches
    } = useLivescore({
        autoFetch: true,
        refreshInterval: 30000  // 30 detik auto-refresh
    });

    // Derive connected status dari serverStatus
    const connected = serverStatus?.connected || false;

    // Filter state
    const [filterService] = useState(() => new MatchFilterService());
    const [filters, setFilters] = useState({
        searchQuery: '',
        timeRange: 'all',
        showFinished: false
    });
    const [filterCounts, setFilterCounts] = useState({
        all: 0, live: 0, next2h: 0, today: 0, popular: 0
    });

    // UI state
    const [groupedMatches, setGroupedMatches] = useState({});
    const [filteredMatches, setFilteredMatches] = useState([]);
    const [activeView, setActiveView] = useState('live');

    // Goal notification state
    const [goalNotification, setGoalNotification] = useState({
        show: false,
        homeTeam: '',
        awayTeam: '',
        scorer: '',
        minute: '',
        homeScore: 0,
        awayScore: 0,
        teamSide: ''
    });

    // League mapping
    const leagueCountryMap = {
        'La Liga': { country: 'Spain', flag: 'https://media.api-sports.io/flags/es.svg' },
        'Premier League': { country: 'England', flag: 'https://media.api-sports.io/flags/gb.svg' },
        'National League': { country: 'England', flag: 'https://media.api-sports.io/flags/gb.svg' },
        'FA Cup': { country: 'England', flag: 'https://media.api-sports.io/flags/gb.svg' },
        'Championship': { country: 'England', flag: 'https://media.api-sports.io/flags/gb.svg' },
        'Liga 1': { country: 'Indonesia', flag: 'https://media.api-sports.io/flags/id.svg' },
        'Bundesliga': { country: 'Germany', flag: 'https://media.api-sports.io/flags/de.svg' },
        'Serie A': { country: 'Italy', flag: 'https://media.api-sports.io/flags/it.svg' },
        'Ligue 1': { country: 'France', flag: 'https://media.api-sports.io/flags/fr.svg' },
        'Eredivisie': { country: 'Netherlands', flag: 'https://media.api-sports.io/flags/nl.svg' },
        'Major League Soccer': { country: 'USA', flag: 'https://media.api-sports.io/flags/us.svg' },
        'USL League One': { country: 'USA', flag: 'https://media.api-sports.io/flags/us.svg' },
        'USL Championship': { country: 'USA', flag: 'https://media.api-sports.io/flags/us.svg' },
        'US Open Cup': { country: 'USA', flag: 'https://media.api-sports.io/flags/us.svg' },
        'J1 League': { country: 'Japan', flag: 'https://media.api-sports.io/flags/jp.svg' },
        'K League 1': { country: 'Korea', flag: 'https://media.api-sports.io/flags/kr.svg' },
        'UEFA Champions League': { country: 'Europe', flag: 'https://media.api-sports.io/flags/eu.svg' },
        'UEFA Europa League': { country: 'Europe', flag: 'https://media.api-sports.io/flags/eu.svg' },
        'AFC U23 Asian Cup - Qualification': { country: 'Asia', flag: 'https://upload.wikimedia.org/wikipedia/en/4/44/AFC_U-23_Asian_Cup_logo.svg' },
        'EFL Trophy': { country: 'England', flag: 'https://media.api-sports.io/flags/gb.svg' },
    };

    // ✅ TRANSFORM DATA DARI BACKEND BARU
    // Backend baru menggunakan field: home_team_name, away_team_name, league_name, dll
    const transformMatch = (match) => {
        return {
            ...match,
            // Map field baru ke field lama untuk kompatibilitas
            home_team: match.home_team_name || match.home_team,
            away_team: match.away_team_name || match.away_team,
            league: match.league_name || match.league,
            country: match.league_country || match.country,
            country_flag: match.league_flag || match.country_flag,
            status: match.status_short || match.status,
            // Keep original fields too
            league_id: match.league_id,
            home_team_id: match.home_team_id,
            away_team_id: match.away_team_id,
            home_team_logo: match.home_team_logo,
            away_team_logo: match.away_team_logo,
            league_logo: match.league_logo,
        };
    };

    // Apply filters effect
    useEffect(() => {
        if (!matches || matches.length === 0) {
            setFilteredMatches([]);
            setFilterCounts({ all: 0, live: 0, next2h: 0, today: 0, popular: 0 });
            return;
        }

        // Transform matches untuk kompatibilitas
        const transformedMatches = matches.map(transformMatch);

        const now = new Date();
        const today = now.toDateString();

        // Calculate filter counts
        const counts = {
            all: transformedMatches.length,
            live: transformedMatches.filter(match => {
                const liveStatuses = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'];
                const status = match.status_short || match.status || '';
                return liveStatuses.includes(status.toUpperCase()) || match.is_live;
            }).length,
            today: transformedMatches.filter(match => {
                if (!match.date) return false;
                const matchDate = new Date(match.date).toDateString();
                return matchDate === today;
            }).length,
            next2h: 0,
            popular: 0
        };

        setFilterCounts(counts);

        // Apply filters
        let filtered = [...transformedMatches];

        // Search filter
        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            filtered = filtered.filter(match =>
                (match.home_team || '').toLowerCase().includes(query) ||
                (match.away_team || '').toLowerCase().includes(query) ||
                (match.league || '').toLowerCase().includes(query)
            );
        }

        // Time range filter
        if (filters.timeRange === 'live') {
            filtered = filtered.filter(match => {
                const liveStatuses = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'];
                const status = match.status_short || match.status || '';
                return liveStatuses.includes(status.toUpperCase()) || match.is_live;
            });
        } else if (filters.timeRange === 'today') {
            filtered = filtered.filter(match => {
                if (!match.date) return false;
                const matchDate = new Date(match.date).toDateString();
                return matchDate === today;
            });
        }

        setFilteredMatches(filtered);
        console.log(`[MatchList] Filtered: ${filtered.length} of ${transformedMatches.length} matches`);

    }, [matches, filters]);

    // Group matches by league_id (to avoid mixing leagues with same name like "Premier League")
    // Also sort by tier: LIVE first, then top leagues, then others
    useEffect(() => {
        // League Tier Priority (lower = more important)
        const TIER_1_LEAGUES = [
            'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1',
            'UEFA Champions League', 'Champions League', 'UEFA Europa League',
            'Europa League', 'UEFA Europa Conference League', 'Conference League',
            'World Cup', 'UEFA Euro', 'Euro Championship', 'Copa America',
            'AFC Asian Cup', 'Liga 1', 'BRI Liga 1'
        ];

        const TIER_2_LEAGUES = [
            'Eredivisie', 'Primeira Liga', 'Liga Portugal', 'Belgian Pro League',
            'Scottish Premiership', 'Championship', 'Liga 2', 'Serie B',
            'La Liga 2', '2. Bundesliga', 'Ligue 2', 'MLS', 'Saudi Pro League', 'Super Lig'
        ];

        const getLeagueTier = (leagueName, country = '') => {
            if (!leagueName) return 99;
            const name = leagueName.toLowerCase();
            const countryLower = country.toLowerCase();

            // Special handling for "Premier League" and "Liga 1" - check country
            if (name === 'premier league') {
                if (countryLower === 'england' || countryLower === 'world') return 1;
                return 3; // Other countries' Premier League
            }
            if (name === 'liga 1' || name === 'bri liga 1') {
                if (countryLower === 'indonesia') return 1;
                return 3; // Other countries' Liga 1
            }
            if (name === 'ligue 1') {
                if (countryLower === 'france') return 1;
                return 3; // Other countries' Ligue 1
            }
            if (name === 'serie a') {
                if (countryLower === 'italy' || countryLower === 'italia') return 1;
                return 3;
            }

            for (const league of TIER_1_LEAGUES) {
                if (name.includes(league.toLowerCase())) return 1;
            }
            for (const league of TIER_2_LEAGUES) {
                if (name.includes(league.toLowerCase())) return 2;
            }
            return 3;
        };

        const grouped = {};
        filteredMatches.forEach((match) => {
            // Use league_id as unique key, fallback to league name if no id
            const leagueKey = match.league_id ? `league_${match.league_id}` : (match.league || 'Unknown League');
            if (!grouped[leagueKey]) {
                grouped[leagueKey] = [];
            }
            grouped[leagueKey].push(match);
        });

        // Sort leagues: LIVE first, then by tier, then alphabetically
        const sortedEntries = Object.entries(grouped).sort(([keyA, matchesA], [keyB, matchesB]) => {
            const hasLiveA = matchesA.some(m => m.is_live);
            const hasLiveB = matchesB.some(m => m.is_live);

            // 1. Leagues with LIVE matches first
            if (hasLiveA && !hasLiveB) return -1;
            if (!hasLiveA && hasLiveB) return 1;

            // 2. Sort by tier (check league_name first, then league for compatibility)
            const leagueNameA = matchesA[0]?.league_name || matchesA[0]?.league || '';
            const leagueNameB = matchesB[0]?.league_name || matchesB[0]?.league || '';
            const countryA = matchesA[0]?.league_country || '';
            const countryB = matchesB[0]?.league_country || '';
            const tierA = getLeagueTier(leagueNameA, countryA);
            const tierB = getLeagueTier(leagueNameB, countryB);

            if (tierA !== tierB) return tierA - tierB;

            // 3. Alphabetically
            return leagueNameA.localeCompare(leagueNameB);
        });

        // Convert back to object (maintains insertion order in modern JS)
        const sortedGrouped = {};
        sortedEntries.forEach(([key, matches]) => {
            sortedGrouped[key] = matches;
        });

        setGroupedMatches(sortedGrouped);
    }, [filteredMatches]);

    // Request notification permission
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // Helper functions
    const handleMatchClick = (match) => {
        const slug = generateMatchSlug(
            match.home_team,
            match.away_team,
            match.id || Date.now()
        );
        router.push(`/match/${slug}`);
    };

    const handleSearchChange = (query) => {
        setFilters(prev => ({ ...prev, searchQuery: query }));
    };

    const handleQuickFilter = (timeRange) => {
        setFilters(prev => ({
            ...prev,
            timeRange: prev.timeRange === timeRange ? 'all' : timeRange
        }));
    };

    const clearFilters = () => {
        setFilters({
            searchQuery: '',
            timeRange: 'all',
            showFinished: false
        });
    };

    const hasActiveFilters = filters.searchQuery || filters.timeRange !== 'all' || filters.showFinished;

    // Count live matches
    const liveMatchesCount = filteredMatches.filter(m => m.is_live).length;

    // League Header Component
    const LeagueHeader = ({ league, matches, flagColor = "bg-red-500" }) => {
        const firstMatch = matches[0];

        let displayCountry = 'Unknown Country';
        let displayFlag = '';

        // ✅ PAKE DATA DARI BACKEND BARU
        if (firstMatch?.league_country && firstMatch.league_country !== 'Unknown') {
            displayCountry = firstMatch.league_country;
            displayFlag = firstMatch.league_flag || '';
        } else if (firstMatch?.country) {
            displayCountry = firstMatch.country;
            displayFlag = firstMatch.country_flag || '';
        } else {
            const leagueInfo = leagueCountryMap[league];
            if (leagueInfo) {
                displayCountry = leagueInfo.country;
                displayFlag = leagueInfo.flag;
            }
        }

        const liveCount = matches.filter(m => m.is_live).length;

        return (
            <div className="flex items-center justify-between py-3 px-4 bg-white border-b border-gray-200">
                <div className="flex items-center space-x-3">
                    <SimpleLeagueLogo
                        leagueName={firstMatch?.league || firstMatch?.league_name || league}
                        leagueId={firstMatch?.league_id}
                        logoUrl={firstMatch?.league_logo}
                        size="w-6 h-6"
                    />
                    <div>
                        <div className="text-xs text-gray-500 flex items-center space-x-2">
                            {displayFlag && (
                                <img
                                    src={displayFlag}
                                    alt={displayCountry}
                                    className="w-4 h-4 rounded-sm object-cover"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            )}
                            <span>{displayCountry}</span>
                        </div>
                        <div className="text-sm font-medium text-gray-800">{league}</div>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">{matches.length} matches</span>
                    {liveCount > 0 && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                            {liveCount} LIVE
                        </span>
                    )}
                </div>
            </div>
        );
    };

    // Render
    return (
        <div className="min-h-screen bg-gray-50 font-condensed">
            {/* Status Bar - Mobile */}
            <div className="flex items-center justify-between max-w-md mx-auto p-2">
                <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm text-gray-700">
                        {connected ? 'via NobarMeriah' : 'Offline'}
                    </span>

                    {liveMatchesCount > 0 && (
                        <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                            <span className="text-xs text-red-600 font-medium">
                                {liveMatchesCount} live
                            </span>
                        </div>
                    )}

                    {lastUpdated && (
                        <span className="text-xs text-gray-500">
                            {lastUpdated.toLocaleTimeString()}
                        </span>
                    )}
                </div>

                <button
                    onClick={fetchMatches}
                    disabled={isLoading}
                    className={`p-2 rounded-full transition-all duration-200 ${isLoading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                    {isLoading ? (
                        <div className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <RefreshCw className="w-4 h-4" />
                    )}
                </button>
            </div>

            {/* View Tabs */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="flex">
                        <button
                            onClick={() => setActiveView('live')}
                            className={`flex-1 sm:flex-none sm:px-6 py-3 text-sm font-condensed transition-all ${activeView === 'live'
                                ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Activity className="w-4 h-4" />
                                <span>Live & Upcoming</span>
                                {liveMatchesCount > 0 && (
                                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                        {liveMatchesCount}
                                    </span>
                                )}
                            </div>
                        </button>

                        <button
                            onClick={() => setActiveView('archive')}
                            className={`flex-1 sm:flex-none sm:px-6 py-3 text-sm font-condensed transition-all ${activeView === 'archive'
                                ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Archive className="w-4 h-4" />
                                <span>Match Archive</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Search Controls - Mobile */}
            <div className="lg:hidden bg-white border-b border-gray-200 p-3">
                <div className="max-w-md mx-auto space-y-3">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search teams, leagues..."
                            value={filters.searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => handleQuickFilter('live')}
                            className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${filters.timeRange === 'live'
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Live ({filterCounts.live})
                        </button>

                        <button
                            onClick={() => handleQuickFilter('today')}
                            className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${filters.timeRange === 'today'
                                ? 'bg-green-100 text-green-700 border border-green-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Today ({filterCounts.today})
                        </button>
                    </div>

                    {hasActiveFilters && (
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-blue-600">
                                {filteredMatches.length} of {matches.length} matches
                            </span>
                            <button onClick={clearFilters} className="text-red-600 hover:text-red-800">
                                Clear
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {activeView === 'live' ? (
                <>
                    {/* Mobile Layout */}
                    <div className="lg:hidden">
                        <div className="max-w-md mx-auto bg-white">
                            {Object.entries(groupedMatches).map(([league, leagueMatches], index) => {
                                const firstMatch = leagueMatches[0];
                                const liveCount = leagueMatches.filter(m => m.is_live).length;

                                let displayCountry = 'Unknown';
                                let displayFlag = '';

                                if (firstMatch?.league_country) {
                                    displayCountry = firstMatch.league_country;
                                    displayFlag = firstMatch.league_flag || '';
                                } else {
                                    const leagueInfo = leagueCountryMap[league];
                                    if (leagueInfo) {
                                        displayCountry = leagueInfo.country;
                                        displayFlag = leagueInfo.flag;
                                    }
                                }

                                return (
                                    <div key={league} className="bg-white rounded-lg shadow-sm overflow-hidden mb-4">
                                        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
                                            <div className="flex items-center space-x-3">
                                                <SimpleLeagueLogo
                                                    leagueName={firstMatch?.league || firstMatch?.league_name || league}
                                                    leagueId={firstMatch?.league_id}
                                                    logoUrl={firstMatch?.league_logo}
                                                    size="w-6 h-6"
                                                />
                                                <div>
                                                    <div className="text-xs text-gray-500 flex items-center space-x-2">
                                                        {displayFlag && (
                                                            <img
                                                                src={displayFlag}
                                                                alt={displayCountry}
                                                                className="w-4 h-4 rounded-sm object-cover"
                                                                onError={(e) => { e.target.style.display = 'none'; }}
                                                            />
                                                        )}
                                                        <span>{displayCountry}</span>
                                                    </div>
                                                    <div className="font-medium text-gray-800">{firstMatch?.league || firstMatch?.league_name || league}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-xs text-gray-500">{leagueMatches.length}</span>
                                                {liveCount > 0 && (
                                                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                                                        {liveCount} LIVE
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="divide-y divide-gray-100">
                                            {leagueMatches.map((match, idx) => (
                                                <RealTimeMatchItem
                                                    key={`${match.id}-${idx}`}
                                                    match={match}
                                                    layout="mobile"
                                                    showDate={true}
                                                    onMatchClick={handleMatchClick}
                                                    statusInfo={StatusManager.getDisplayInfo(match)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Empty State Mobile */}
                        {Object.keys(groupedMatches).length === 0 && !isLoading && (
                            <div className="max-w-md mx-auto bg-white text-center py-20">
                                <div className="text-gray-400 mb-4">
                                    <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
                                        <span className="text-2xl">⚽</span>
                                    </div>
                                </div>
                                <h3 className="text-lg text-gray-600 mb-2">No matches found</h3>
                                <p className="text-sm text-gray-500 mb-6">
                                    {connected ? 'No data available today' : 'Cannot connect to server'}
                                </p>
                                <button
                                    onClick={fetchMatches}
                                    className="bg-blue-500 text-white px-6 py-2 rounded-full text-sm hover:bg-blue-600"
                                >
                                    Refresh
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden lg:block">
                        <div className="max-w-6xl mx-auto p-6">
                            {/* Desktop Controls */}
                            <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
                                <div className="relative mb-4">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search teams, leagues..."
                                        value={filters.searchQuery}
                                        onChange={(e) => handleSearchChange(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => handleQuickFilter('live')}
                                            className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${filters.timeRange === 'live'
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            Live ({filterCounts.live})
                                        </button>

                                        <button
                                            onClick={() => handleQuickFilter('today')}
                                            className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${filters.timeRange === 'today'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            Today ({filterCounts.today})
                                        </button>

                                        {hasActiveFilters && (
                                            <button
                                                onClick={clearFilters}
                                                className="px-3 py-2 text-red-600 hover:text-red-800 text-sm"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex items-center space-x-4">
                                        {hasActiveFilters && (
                                            <span className="text-sm text-blue-600">
                                                {filteredMatches.length} matches
                                            </span>
                                        )}

                                        <div className="flex items-center space-x-2">
                                            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                            <span className="text-sm text-gray-600">
                                                {connected ? 'Connected' : 'Offline'}
                                            </span>
                                        </div>

                                        <button
                                            onClick={fetchMatches}
                                            disabled={isLoading}
                                            className="p-2 hover:bg-gray-100 rounded-full"
                                        >
                                            {isLoading ? (
                                                <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                                            ) : (
                                                <RefreshCw className="w-4 h-4 text-gray-600" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Results Summary */}
                            <div className="text-gray-500 mb-4 flex items-center justify-between">
                                {lastUpdated && (
                                    <div className="text-sm">
                                        Last updated: {lastUpdated.toLocaleTimeString()}
                                        {connected && <span className="ml-2 text-green-600">• Live from NobarMeriah</span>}
                                    </div>
                                )}
                            </div>

                            {/* Desktop Matches */}
                            <div className="space-y-6">
                                {Object.entries(groupedMatches).map(([league, leagueMatches], index) => {
                                    const liveCount = leagueMatches.filter(m => m.is_live).length;
                                    const firstMatch = leagueMatches[0];

                                    let displayCountry = 'Unknown';
                                    let displayFlag = '';

                                    if (firstMatch?.league_country && firstMatch.league_country !== 'Unknown') {
                                        displayCountry = firstMatch.league_country;
                                        displayFlag = firstMatch.league_flag || '';
                                    } else {
                                        const leagueInfo = leagueCountryMap[league];
                                        if (leagueInfo) {
                                            displayCountry = leagueInfo.country;
                                            displayFlag = leagueInfo.flag;
                                        }
                                    }

                                    return (
                                        <div key={league} className="bg-white rounded-lg shadow-sm overflow-hidden">
                                            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b">
                                                <div className="flex items-center space-x-3">
                                                    <SimpleLeagueLogo
                                                        leagueName={firstMatch?.league || firstMatch?.league_name || league}
                                                        leagueId={firstMatch?.league_id}
                                                        logoUrl={firstMatch?.league_logo}
                                                        size="w-6 h-6"
                                                    />
                                                    <div>
                                                        <div className="text-sm text-gray-500 flex items-center space-x-2">
                                                            {displayFlag && (
                                                                <img
                                                                    src={displayFlag}
                                                                    alt={displayCountry}
                                                                    className="w-4 h-4 rounded-sm object-cover"
                                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                                />
                                                            )}
                                                            <span>{displayCountry}</span>
                                                        </div>
                                                        <div className="font-medium text-gray-800">{firstMatch?.league || firstMatch?.league_name || league}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-3">
                                                    <span className="text-sm text-gray-500">{leagueMatches.length} matches</span>
                                                    {liveCount > 0 && (
                                                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                                                            {liveCount} LIVE
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="divide-y divide-gray-100">
                                                {leagueMatches.map((match, idx) => (
                                                    <RealTimeMatchItem
                                                        key={`${match.id}-${idx}`}
                                                        match={match}
                                                        layout="desktop"
                                                        showDate={true}
                                                        onMatchClick={handleMatchClick}
                                                        statusInfo={StatusManager.getDisplayInfo(match)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Empty State Desktop */}
                            {Object.keys(groupedMatches).length === 0 && !isLoading && (
                                <div className="bg-white rounded-lg shadow-sm text-center py-20">
                                    <div className="text-gray-400 mb-6">
                                        <div className="w-24 h-24 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
                                            <span className="text-4xl">⚽</span>
                                        </div>
                                    </div>
                                    <h3 className="text-xl text-gray-600 mb-3">No matches found</h3>
                                    <p className="text-gray-500 mb-8 max-w-md mx-auto">
                                        {connected
                                            ? 'via NobarMeriah connected but no match data available today'
                                            : 'Cannot connect to via NobarMeriah server'
                                        }
                                    </p>
                                    <button
                                        onClick={fetchMatches}
                                        className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600"
                                    >
                                        <RefreshCw className="w-5 h-5 inline mr-2" />
                                        Refresh Matches
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <ArchivedMatches onMatchClick={handleMatchClick} />
            )}

            {/* Goal Notification Portal */}
            <GoalNotificationPortal
                show={goalNotification.show}
                homeTeam={goalNotification.homeTeam}
                awayTeam={goalNotification.awayTeam}
                scorer={goalNotification.scorer}
                minute={goalNotification.minute}
                homeScore={goalNotification.homeScore}
                awayScore={goalNotification.awayScore}
                teamSide={goalNotification.teamSide}
                onClose={() => setGoalNotification(prev => ({ ...prev, show: false }))}
            />
        </div>
    );
};

export default CleanMatchList;
