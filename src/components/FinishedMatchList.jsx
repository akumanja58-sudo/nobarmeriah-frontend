'use client';

import { useState, useEffect } from 'react';
import { Star, ChevronDown, ChevronUp, Calendar, Loader2 } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

// ============================================================
// LEAGUE TIER SYSTEM - Sama dengan SofaMatchList
// ============================================================
const TIER_1_EXACT = [
    { name: 'Premier League', country: 'England' },
    { name: 'La Liga', country: 'Spain' },
    { name: 'Serie A', country: 'Italy' },
    { name: 'Bundesliga', country: 'Germany' },
    { name: 'Ligue 1', country: 'France' },
    { name: 'Eredivisie', country: 'Netherlands' },
    { name: 'Primeira Liga', country: 'Portugal' },
    { name: 'Liga Portugal', country: 'Portugal' },
];

const TIER_1_INTERNATIONAL = [
    'UEFA Champions League', 'Champions League',
    'UEFA Europa League', 'Europa League',
    'UEFA Europa Conference League', 'Conference League',
    'World Cup', 'FIFA World Cup',
    'UEFA Euro', 'Euro Championship',
    'Copa America', 'Africa Cup of Nations',
    'AFC Asian Cup', 'Asian Cup',
    'UEFA Nations League', 'Nations League',
];

const TIER_2_EXACT = [
    { name: 'Championship', country: 'England' },
    { name: 'La Liga 2', country: 'Spain' },
    { name: 'Serie B', country: 'Italy' },
    { name: '2. Bundesliga', country: 'Germany' },
    { name: 'Ligue 2', country: 'France' },
    { name: 'Liga 1', country: 'Indonesia' },
    { name: 'MLS', country: 'USA' },
    { name: 'Saudi Pro League', country: 'Saudi-Arabia' },
];

function getLeagueTier(leagueName, country) {
    if (!leagueName) return 50;
    const nameLower = leagueName.toLowerCase();
    const countryLower = (country || '').toLowerCase();

    // Friendlies paling bawah
    if (nameLower.includes('friend')) return 99;

    // TIER 1 - Exact match
    for (const league of TIER_1_EXACT) {
        if (nameLower.includes(league.name.toLowerCase()) &&
            countryLower === league.country.toLowerCase()) {
            return 1;
        }
    }

    // TIER 1 - International
    for (const league of TIER_1_INTERNATIONAL) {
        if (nameLower.includes(league.toLowerCase())) {
            return 1;
        }
    }

    // TIER 2
    for (const league of TIER_2_EXACT) {
        if (nameLower.includes(league.name.toLowerCase()) &&
            countryLower === league.country.toLowerCase()) {
            return 2;
        }
    }

    // Big countries
    const bigCountries = ['england', 'spain', 'italy', 'germany', 'france'];
    if (bigCountries.includes(countryLower)) return 3;

    return 5;
}

// ============================================================
// DATE HELPERS
// ============================================================
function formatDateHeader(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time untuk compare
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    const dayName = date.toLocaleDateString('id-ID', { weekday: 'long' });
    const fullDate = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    if (dateOnly.getTime() === todayOnly.getTime()) {
        return `Hari ini - ${dayName}, ${fullDate}`;
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
        return `Kemarin - ${dayName}, ${fullDate}`;
    } else {
        return `${dayName}, ${fullDate}`;
    }
}

function getDateKey(dateStr) {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// ============================================================
// COMPONENT
// ============================================================
export default function FinishedMatchList({ onMatchClick, selectedMatch }) {
    const [matchesByDate, setMatchesByDate] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedDates, setExpandedDates] = useState({});
    const [expandedLeagues, setExpandedLeagues] = useState({});
    const [favoriteMatches, setFavoriteMatches] = useState([]);

    // Load favorites
    useEffect(() => {
        const saved = localStorage.getItem('football_favorites');
        if (saved) {
            setFavoriteMatches(JSON.parse(saved));
        }
    }, []);

    // Fetch finished matches (7 hari terakhir)
    useEffect(() => {
        const fetchFinishedMatches = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Hitung tanggal 7 hari yang lalu
                const today = new Date();
                const sevenDaysAgo = new Date(today);
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

                const dateFrom = sevenDaysAgo.toISOString().split('T')[0];
                const dateTo = today.toISOString().split('T')[0];

                const response = await fetch(
                    `${API_BASE_URL}/api/matches/archived?limit=200&date_from=${dateFrom}&date_to=${dateTo}`
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch finished matches');
                }

                const data = await response.json();

                if (data.success && data.data?.matches) {
                    // Group by date
                    const grouped = {};

                    data.data.matches.forEach(match => {
                        const dateKey = getDateKey(match.date);

                        if (!grouped[dateKey]) {
                            grouped[dateKey] = {
                                date: match.date,
                                dateKey,
                                leagues: {}
                            };
                        }

                        // Group by league within date
                        const leagueKey = `${match.league_id}-${match.league_name}`;
                        if (!grouped[dateKey].leagues[leagueKey]) {
                            grouped[dateKey].leagues[leagueKey] = {
                                leagueId: match.league_id,
                                league: match.league_name,
                                country: match.league_country,
                                leagueLogo: match.league_logo,
                                leagueFlag: match.league_flag,
                                tier: getLeagueTier(match.league_name, match.league_country),
                                matches: []
                            };
                        }

                        grouped[dateKey].leagues[leagueKey].matches.push(match);
                    });

                    // Sort dates (newest first)
                    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

                    // Convert to array and sort leagues within each date
                    const result = {};
                    sortedDates.forEach(dateKey => {
                        const dateData = grouped[dateKey];
                        const sortedLeagues = Object.values(dateData.leagues).sort((a, b) => a.tier - b.tier);
                        result[dateKey] = {
                            ...dateData,
                            leagues: sortedLeagues
                        };
                    });

                    setMatchesByDate(result);

                    // Auto-expand today
                    const todayKey = getDateKey(new Date().toISOString());
                    setExpandedDates({ [todayKey]: false }); // false = not collapsed

                    console.log(`✅ Loaded ${data.data.matches.length} finished matches from last 7 days`);
                }
            } catch (err) {
                console.error('Error fetching finished matches:', err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFinishedMatches();
    }, []);

    // Toggle functions
    const toggleDate = (dateKey) => {
        setExpandedDates(prev => ({ ...prev, [dateKey]: !prev[dateKey] }));
    };

    const toggleLeague = (key) => {
        setExpandedLeagues(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleFavorite = (e, matchId) => {
        e.stopPropagation();
        let newFavorites;
        if (favoriteMatches.includes(matchId)) {
            newFavorites = favoriteMatches.filter(id => id !== matchId);
        } else {
            newFavorites = [...favoriteMatches, matchId];
        }
        setFavoriteMatches(newFavorites);
        localStorage.setItem('football_favorites', JSON.stringify(newFavorites));
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-8 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-green-500 mb-3" />
                <p className="text-sm text-gray-500 font-condensed">Memuat pertandingan selesai...</p>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <span className="text-4xl mb-3 block">😢</span>
                <p className="text-gray-500 font-condensed">Gagal memuat data</p>
                <p className="text-xs text-gray-400 mt-1">{error}</p>
            </div>
        );
    }

    // Empty state
    const dateKeys = Object.keys(matchesByDate);
    if (dateKeys.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <span className="text-4xl mb-3 block">⚽</span>
                <p className="text-gray-500 font-condensed">Tidak ada pertandingan selesai</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {dateKeys.map(dateKey => {
                const dateData = matchesByDate[dateKey];
                const isDateCollapsed = expandedDates[dateKey];
                const totalMatches = dateData.leagues.reduce((sum, l) => sum + l.matches.length, 0);

                return (
                    <div key={dateKey} className="bg-white rounded-xl shadow-sm overflow-hidden">
                        {/* Date Header */}
                        <div
                            className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-green-50 to-white border-b border-gray-100 cursor-pointer hover:bg-green-50 transition-colors"
                            onClick={() => toggleDate(dateKey)}
                        >
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-green-600" />
                                <span className="font-semibold text-gray-800 font-condensed">
                                    {formatDateHeader(dateData.date)}
                                </span>
                                <span className="text-xs text-gray-400 font-condensed">
                                    ({totalMatches} pertandingan)
                                </span>
                            </div>
                            {isDateCollapsed ? (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                            ) : (
                                <ChevronUp className="w-5 h-5 text-gray-400" />
                            )}
                        </div>

                        {/* Leagues & Matches */}
                        {!isDateCollapsed && (
                            <div>
                                {dateData.leagues.map((league, leagueIdx) => {
                                    const leagueKey = `${dateKey}-${league.leagueId}`;
                                    const isLeagueCollapsed = expandedLeagues[leagueKey];

                                    return (
                                        <div key={leagueKey}>
                                            {/* League Header */}
                                            <div
                                                className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
                                                onClick={() => toggleLeague(leagueKey)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {league.leagueLogo ? (
                                                        <img
                                                            src={league.leagueLogo}
                                                            alt=""
                                                            className="w-5 h-5 object-contain"
                                                            onError={(e) => { e.target.style.display = 'none'; }}
                                                        />
                                                    ) : league.leagueFlag ? (
                                                        <img
                                                            src={league.leagueFlag}
                                                            alt=""
                                                            className="w-5 h-4 object-cover rounded-sm"
                                                            onError={(e) => { e.target.style.display = 'none'; }}
                                                        />
                                                    ) : (
                                                        <span className="text-sm">🌍</span>
                                                    )}
                                                    <div>
                                                        <p className="text-xs text-gray-500 font-condensed">{league.country}</p>
                                                        <p className="text-sm font-semibold text-gray-800 font-condensed">{league.league}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-400">{league.matches.length}</span>
                                                    {isLeagueCollapsed ? (
                                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                                                    ) : (
                                                        <ChevronUp className="w-4 h-4 text-gray-400" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Matches */}
                                            {!isLeagueCollapsed && (
                                                <div>
                                                    {league.matches.map(match => {
                                                        const matchId = match.id || match.match_id;
                                                        const isFavorite = favoriteMatches.includes(matchId);
                                                        const isSelected = selectedMatch?.id === matchId;

                                                        return (
                                                            <div
                                                                key={matchId}
                                                                className={`flex items-center px-4 py-3 border-b border-gray-50 cursor-pointer transition-all ${isSelected
                                                                    ? 'bg-green-50 border-l-4 border-l-green-500'
                                                                    : 'hover:bg-gray-50'
                                                                    }`}
                                                                onClick={() => onMatchClick?.(match)}
                                                            >
                                                                {/* Time */}
                                                                <div className="w-14 flex-shrink-0 text-center">
                                                                    <span className="text-xs font-medium text-gray-500 font-condensed">
                                                                        FT
                                                                    </span>
                                                                </div>

                                                                {/* Teams */}
                                                                <div className="flex-1 min-w-0">
                                                                    {/* Home */}
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        {match.home_team_logo ? (
                                                                            <img
                                                                                src={match.home_team_logo}
                                                                                alt=""
                                                                                className="w-4 h-4 object-contain"
                                                                                onError={(e) => { e.target.style.display = 'none'; }}
                                                                            />
                                                                        ) : (
                                                                            <div className="w-4 h-4 bg-gray-200 rounded-full" />
                                                                        )}
                                                                        <span className={`text-sm truncate font-condensed ${match.home_score > match.away_score
                                                                            ? 'font-bold text-gray-900'
                                                                            : 'text-gray-700'
                                                                            }`}>
                                                                            {match.home_team_name || match.home_team}
                                                                        </span>
                                                                    </div>
                                                                    {/* Away */}
                                                                    <div className="flex items-center gap-2">
                                                                        {match.away_team_logo ? (
                                                                            <img
                                                                                src={match.away_team_logo}
                                                                                alt=""
                                                                                className="w-4 h-4 object-contain"
                                                                                onError={(e) => { e.target.style.display = 'none'; }}
                                                                            />
                                                                        ) : (
                                                                            <div className="w-4 h-4 bg-gray-200 rounded-full" />
                                                                        )}
                                                                        <span className={`text-sm truncate font-condensed ${match.away_score > match.home_score
                                                                            ? 'font-bold text-gray-900'
                                                                            : 'text-gray-700'
                                                                            }`}>
                                                                            {match.away_team_name || match.away_team}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* Score */}
                                                                <div className="w-12 flex-shrink-0 text-right">
                                                                    <div className="flex flex-col items-end">
                                                                        <span className={`text-sm font-condensed ${match.home_score > match.away_score
                                                                            ? 'font-bold text-gray-900'
                                                                            : 'text-gray-600'
                                                                            }`}>
                                                                            {match.home_score ?? 0}
                                                                        </span>
                                                                        <span className={`text-sm font-condensed ${match.away_score > match.home_score
                                                                            ? 'font-bold text-gray-900'
                                                                            : 'text-gray-600'
                                                                            }`}>
                                                                            {match.away_score ?? 0}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* Favorite */}
                                                                <div className="w-8 flex-shrink-0 flex justify-end">
                                                                    <button
                                                                        onClick={(e) => toggleFavorite(e, matchId)}
                                                                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                                    >
                                                                        <Star className={`w-4 h-4 ${isFavorite
                                                                            ? 'text-yellow-500 fill-yellow-500'
                                                                            : 'text-gray-300 hover:text-gray-400'
                                                                            }`} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
