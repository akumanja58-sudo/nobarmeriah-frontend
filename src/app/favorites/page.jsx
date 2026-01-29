'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Trash2, ChevronRight, Loader2, ArrowLeft } from 'lucide-react';

import BottomNav from '@/components/BottomNav';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

// Sport icons mapping
const sportIcons = {
    football: '⚽',
    tennis: '🎾',
    basketball: '🏀',
    volleyball: '🏐',
    baseball: '⚾',
    formula1: '🏎️'
};

// Sport labels
const sportLabels = {
    football: 'Sepak Bola',
    tennis: 'Tenis',
    basketball: 'Basket',
    volleyball: 'Voli',
    baseball: 'Baseball'
};

export default function FavoritesPage() {
    const router = useRouter();

    const [favoriteIds, setFavoriteIds] = useState({
        football: [],
        tennis: [],
        basketball: [],
        volleyball: [],
        baseball: []
    });
    const [favoriteMatches, setFavoriteMatches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeSport, setActiveSport] = useState('all');

    // Load favorite IDs from localStorage
    useEffect(() => {
        const loadFavoriteIds = () => {
            return {
                football: JSON.parse(localStorage.getItem('football_favorites') || '[]'),
                tennis: JSON.parse(localStorage.getItem('tennis_favorites') || '[]'),
                basketball: JSON.parse(localStorage.getItem('basketball_favorites') || '[]'),
                volleyball: JSON.parse(localStorage.getItem('volleyball_favorites') || '[]'),
                baseball: JSON.parse(localStorage.getItem('baseball_favorites') || '[]')
            };
        };

        const favIds = loadFavoriteIds();
        setFavoriteIds(favIds);

        // Fetch match details for all favorites
        fetchAllFavoriteMatches(favIds);
    }, []);

    // Fetch match details from API
    const fetchAllFavoriteMatches = async (favIds) => {
        setIsLoading(true);
        const allMatches = [];

        try {
            // Fetch football matches
            if (favIds.football.length > 0) {
                const footballMatches = await fetchFootballMatches(favIds.football);
                allMatches.push(...footballMatches);
            }

            // Fetch tennis matches
            if (favIds.tennis.length > 0) {
                const tennisMatches = await fetchSportMatches('tennis', favIds.tennis);
                allMatches.push(...tennisMatches);
            }

            // Fetch basketball matches
            if (favIds.basketball.length > 0) {
                const basketballMatches = await fetchSportMatches('basketball', favIds.basketball);
                allMatches.push(...basketballMatches);
            }

            // Fetch volleyball matches
            if (favIds.volleyball.length > 0) {
                const volleyballMatches = await fetchSportMatches('volleyball', favIds.volleyball);
                allMatches.push(...volleyballMatches);
            }

            // Fetch baseball matches
            if (favIds.baseball.length > 0) {
                const baseballMatches = await fetchSportMatches('baseball', favIds.baseball);
                allMatches.push(...baseballMatches);
            }

            setFavoriteMatches(allMatches);
        } catch (error) {
            console.error('Error fetching favorite matches:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch football match details
    const fetchFootballMatches = async (matchIds) => {
        const matches = [];

        for (const matchId of matchIds) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/livescore/match/${matchId}`);
                const data = await response.json();

                if (data.success && data.data) {
                    matches.push({
                        ...data.data,
                        sport: 'football',
                        id: matchId
                    });
                } else {
                    // Fallback jika tidak ditemukan
                    matches.push({
                        id: matchId,
                        sport: 'football',
                        home_team_name: 'Unknown',
                        away_team_name: 'Unknown',
                        notFound: true
                    });
                }
            } catch (error) {
                console.error(`Error fetching match ${matchId}:`, error);
                matches.push({
                    id: matchId,
                    sport: 'football',
                    home_team_name: 'Unknown',
                    away_team_name: 'Unknown',
                    notFound: true
                });
            }
        }

        return matches;
    };

    // Fetch other sport matches (tennis, basketball, etc)
    const fetchSportMatches = async (sport, matchIds) => {
        const matches = [];

        for (const matchId of matchIds) {
            try {
                const endpoint = sport === 'tennis' ? 'match' : 'game';
                const response = await fetch(`${API_BASE_URL}/api/${sport}/${endpoint}/${matchId}`);
                const data = await response.json();

                if (data.success && data.data) {
                    const matchData = data.data;
                    matches.push({
                        id: matchId,
                        sport: sport,
                        home_team_name: matchData.homeTeam?.name || matchData.home_team_name || 'Home',
                        away_team_name: matchData.awayTeam?.name || matchData.away_team_name || 'Away',
                        home_team_logo: matchData.homeTeam?.logo || matchData.home_team_logo,
                        away_team_logo: matchData.awayTeam?.logo || matchData.away_team_logo,
                        home_score: matchData.homeScore ?? matchData.home_score,
                        away_score: matchData.awayScore ?? matchData.away_score,
                        league_name: matchData.league?.name || matchData.league_name || sport,
                        status: matchData.status,
                        isLive: matchData.isLive,
                        isFinished: matchData.isFinished
                    });
                } else {
                    matches.push({
                        id: matchId,
                        sport: sport,
                        home_team_name: 'Unknown',
                        away_team_name: 'Unknown',
                        notFound: true
                    });
                }
            } catch (error) {
                console.error(`Error fetching ${sport} match ${matchId}:`, error);
                matches.push({
                    id: matchId,
                    sport: sport,
                    home_team_name: 'Unknown',
                    away_team_name: 'Unknown',
                    notFound: true
                });
            }
        }

        return matches;
    };

    // Get total favorites count
    const getTotalCount = () => {
        return Object.values(favoriteIds).reduce((sum, arr) => sum + arr.length, 0);
    };

    // Get favorites for a sport
    const getSportCount = (sport) => {
        return favoriteIds[sport]?.length || 0;
    };

    // Remove favorite
    const removeFavorite = (sport, matchId) => {
        const key = `${sport}_favorites`;
        const current = JSON.parse(localStorage.getItem(key) || '[]');
        const updated = current.filter(id => id !== matchId);
        localStorage.setItem(key, JSON.stringify(updated));

        setFavoriteIds(prev => ({
            ...prev,
            [sport]: updated
        }));

        // Remove from favoriteMatches state
        setFavoriteMatches(prev => prev.filter(m => !(m.id === matchId && m.sport === sport)));
    };

    // Clear all favorites
    const clearAllFavorites = () => {
        Object.keys(favoriteIds).forEach(sport => {
            localStorage.setItem(`${sport}_favorites`, '[]');
        });

        setFavoriteIds({
            football: [],
            tennis: [],
            basketball: [],
            volleyball: [],
            baseball: []
        });
        setFavoriteMatches([]);
    };

    // Navigate to match
    const goToMatch = (sport, matchId) => {
        switch (sport) {
            case 'football':
                router.push(`/match/${matchId}`);
                break;
            case 'tennis':
                router.push(`/tennis/match/${matchId}`);
                break;
            case 'basketball':
                router.push(`/basketball/game/${matchId}`);
                break;
            case 'volleyball':
                router.push(`/volleyball/game/${matchId}`);
                break;
            case 'baseball':
                router.push(`/baseball/game/${matchId}`);
                break;
            default:
                router.push(`/match/${matchId}`);
        }
    };

    // Get filtered matches
    const getFilteredMatches = () => {
        if (activeSport === 'all') return favoriteMatches;
        return favoriteMatches.filter(match => match.sport === activeSport);
    };

    const filteredMatches = getFilteredMatches();

    // Check match status
    const isLiveMatch = (match) => {
        const status = match.status_short || match.status || '';
        return ['1H', '2H', 'HT', 'LIVE', 'ET', 'BT', 'P'].includes(status.toUpperCase()) || match.isLive || match.is_live;
    };

    const isFinishedMatch = (match) => {
        const status = match.status_short || match.status || '';
        return ['FT', 'AET', 'PEN'].includes(status.toUpperCase()) || match.isFinished;
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-green-600 text-white sticky top-0 z-40">
                <div className="px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.back()}
                                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-2">
                                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                <div>
                                    <h1 className="text-lg font-bold font-condensed">Favorit</h1>
                                    <p className="text-xs text-green-100 font-condensed">
                                        {getTotalCount()} pertandingan disimpan
                                    </p>
                                </div>
                            </div>
                        </div>

                        {getTotalCount() > 0 && (
                            <button
                                onClick={clearAllFavorites}
                                className="text-xs text-green-200 hover:text-white font-condensed"
                            >
                                Hapus Semua
                            </button>
                        )}
                    </div>
                </div>

                {/* Sport Filter Tabs */}
                {getTotalCount() > 0 && (
                    <div className="px-4 pb-3">
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                            <button
                                onClick={() => setActiveSport('all')}
                                className={`px-3 py-1.5 rounded-full text-xs font-condensed whitespace-nowrap transition-colors ${activeSport === 'all'
                                        ? 'bg-white text-green-600'
                                        : 'bg-white/20 text-white'
                                    }`}
                            >
                                Semua ({getTotalCount()})
                            </button>
                            {Object.keys(favoriteIds).map((sport) => {
                                const count = getSportCount(sport);
                                if (count === 0) return null;

                                return (
                                    <button
                                        key={sport}
                                        onClick={() => setActiveSport(sport)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-condensed whitespace-nowrap transition-colors flex items-center gap-1 ${activeSport === sport
                                                ? 'bg-white text-green-600'
                                                : 'bg-white/20 text-white'
                                            }`}
                                    >
                                        <span>{sportIcons[sport]}</span>
                                        <span>{sportLabels[sport]}</span>
                                        <span>({count})</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            <main className="pb-20">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-green-500 mb-3" />
                        <p className="text-sm text-gray-500 font-condensed">Memuat pertandingan...</p>
                    </div>
                ) : filteredMatches.length > 0 ? (
                    <div className="bg-white">
                        <div className="divide-y divide-gray-100">
                            {filteredMatches.map((match, idx) => {
                                const isLive = isLiveMatch(match);
                                const isFinished = isFinishedMatch(match);

                                return (
                                    <div
                                        key={`${match.sport}-${match.id}-${idx}`}
                                        className="flex items-center gap-3 p-4"
                                    >
                                        {/* Sport Icon */}
                                        <div
                                            className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center cursor-pointer flex-shrink-0"
                                            onClick={() => goToMatch(match.sport, match.id)}
                                        >
                                            <span className="text-xl">{sportIcons[match.sport]}</span>
                                        </div>

                                        {/* Match Info */}
                                        <div
                                            className="flex-1 min-w-0 cursor-pointer"
                                            onClick={() => goToMatch(match.sport, match.id)}
                                        >
                                            {/* Teams */}
                                            <div className="flex items-center gap-2 mb-1">
                                                {match.home_team_logo && (
                                                    <img
                                                        src={match.home_team_logo}
                                                        alt=""
                                                        className="w-4 h-4 object-contain"
                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                    />
                                                )}
                                                <p className="text-sm font-semibold text-gray-800 font-condensed truncate">
                                                    {match.home_team_name || 'Home'} vs {match.away_team_name || 'Away'}
                                                </p>
                                            </div>

                                            {/* League & Status */}
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs text-gray-500 font-condensed truncate">
                                                    {match.league_name || match.league || sportLabels[match.sport]}
                                                </p>
                                                {isLive && (
                                                    <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded font-condensed">
                                                        LIVE
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Score */}
                                        {(isLive || isFinished) && (
                                            <div className="text-right flex-shrink-0 mr-2">
                                                <p className={`text-sm font-bold font-condensed ${isLive ? 'text-red-600' : 'text-gray-800'}`}>
                                                    {match.home_score ?? 0} - {match.away_score ?? 0}
                                                </p>
                                                {isFinished && (
                                                    <p className="text-[10px] text-gray-400 font-condensed">FT</p>
                                                )}
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <button
                                            onClick={() => removeFavorite(match.sport, match.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors flex-shrink-0"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>

                                        <button
                                            onClick={() => goToMatch(match.sport, match.id)}
                                            className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-full transition-colors flex-shrink-0"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white p-8 text-center mt-2">
                        <Star className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-600 font-condensed font-semibold">Belum ada favorit</p>
                        <p className="text-sm text-gray-400 font-condensed mt-1">
                            Tambahkan pertandingan ke favorit untuk melihatnya di sini
                        </p>
                        <button
                            onClick={() => router.push('/')}
                            className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg font-condensed text-sm hover:bg-green-600 transition-colors"
                        >
                            Jelajahi Pertandingan
                        </button>
                    </div>
                )}
            </main>

            {/* Bottom Nav */}
            <BottomNav />

            {/* Scrollbar hide style */}
            <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
