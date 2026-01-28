'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Trophy, Info, Loader2, Award, Circle, BarChart3 } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

// ============================================================
// COUNTRY FLAGS
// ============================================================
const COUNTRY_FLAGS = {
    'serbia': '🇷🇸',
    'spain': '🇪🇸',
    'italy': '🇮🇹',
    'germany': '🇩🇪',
    'russia': '🇷🇺',
    'greece': '🇬🇷',
    'norway': '🇳🇴',
    'usa': '🇺🇸',
    'united states': '🇺🇸',
    'canada': '🇨🇦',
    'australia': '🇦🇺',
    'france': '🇫🇷',
    'uk': '🇬🇧',
    'great britain': '🇬🇧',
    'poland': '🇵🇱',
    'czech republic': '🇨🇿',
    'czechia': '🇨🇿',
    'switzerland': '🇨🇭',
    'argentina': '🇦🇷',
    'brazil': '🇧🇷',
    'japan': '🇯🇵',
    'china': '🇨🇳',
    'kazakhstan': '🇰🇿',
    'belarus': '🇧🇾',
    'ukraine': '🇺🇦',
    'croatia': '🇭🇷',
    'denmark': '🇩🇰',
    'netherlands': '🇳🇱',
    'belgium': '🇧🇪',
    'tunisia': '🇹🇳',
    'estonia': '🇪🇪',
};

function getCountryFlag(country) {
    if (!country) return '🌍';
    return COUNTRY_FLAGS[country.toLowerCase()] || '🌍';
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function TennisMatchPreview({
    matches = [],
    match,
    user,
    onMatchClick
}) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [activeRankingTab, setActiveRankingTab] = useState('atp');
    const [rankings, setRankings] = useState({ atp: [], wta: [] });
    const [isLoadingRankings, setIsLoadingRankings] = useState(false);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    // Animation states
    const [slideDirection, setSlideDirection] = useState('next');
    const [isAnimating, setIsAnimating] = useState(false);

    // Get featured matches (live or upcoming from top tournaments)
    const featuredMatches = matches.filter(m => {
        const eventType = m.eventType?.toLowerCase() || '';
        return eventType.includes('atp singles') ||
            eventType.includes('wta singles') ||
            m.isLive;
    }).slice(0, 10);

    const currentMatch = featuredMatches[currentIndex] || match;

    // ============================================================
    // AUTO-PLAY & NAVIGATION WITH SMOOTH ANIMATION
    // ============================================================
    useEffect(() => {
        if (!isAutoPlaying || featuredMatches.length <= 1) return;

        const interval = setInterval(() => {
            setSlideDirection('next');
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentIndex(prev => (prev + 1) % featuredMatches.length);
                setTimeout(() => setIsAnimating(false), 50);
            }, 200);
        }, 5000);

        return () => clearInterval(interval);
    }, [isAutoPlaying, featuredMatches.length]);

    // Fetch rankings on mount
    useEffect(() => {
        fetchRankings();
    }, []);

    const fetchRankings = async () => {
        setIsLoadingRankings(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/tennis/rankings?limit=10`);
            const data = await response.json();

            if (data.success && data.rankings) {
                setRankings(data.rankings);
            }
        } catch (error) {
            console.error('Failed to fetch rankings:', error);
        } finally {
            setIsLoadingRankings(false);
        }
    };

    const handlePrevMatch = () => {
        if (isAnimating) return;
        setIsAutoPlaying(false);
        setSlideDirection('prev');
        setIsAnimating(true);

        setTimeout(() => {
            setCurrentIndex(prev => prev === 0 ? featuredMatches.length - 1 : prev - 1);
            setTimeout(() => setIsAnimating(false), 50);
        }, 200);
    };

    const handleNextMatch = () => {
        if (isAnimating) return;
        setIsAutoPlaying(false);
        setSlideDirection('next');
        setIsAnimating(true);

        setTimeout(() => {
            setCurrentIndex(prev => (prev + 1) % featuredMatches.length);
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
    // RENDER
    // ============================================================

    return (
        <div className="tennis-match-preview space-y-4">
            {/* Featured Match Card */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Match Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-500 px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                <Circle className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-white font-semibold text-sm font-condensed">
                                    {currentMatch?.tournament?.name || 'Tennis Match'}
                                </p>
                                <p className="text-green-100 text-xs font-condensed">
                                    {currentMatch?.eventType || 'ATP/WTA'}
                                </p>
                            </div>
                        </div>
                        {currentMatch?.isLive && (
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded animate-pulse font-condensed flex items-center gap-1">
                                <span className="w-2 h-2 bg-white rounded-full"></span>
                                LIVE
                            </span>
                        )}
                    </div>
                </div>

                {/* Match Content - Smooth Slide Animation */}
                <div className="overflow-hidden">
                    <div className={`transform transition-all duration-300 ease-out ${getSlideAnimationClass()}`}>
                        {currentMatch ? (
                            <div className="p-4">
                                {/* Players */}
                                <div className="space-y-4">
                                    {/* Player 1 */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {currentMatch.player1?.isServing && currentMatch.isLive && (
                                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                            )}
                                            {currentMatch.player1?.logo ? (
                                                <img
                                                    src={currentMatch.player1.logo}
                                                    alt=""
                                                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold">
                                                    {currentMatch.player1?.name?.[0] || 'P'}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-semibold text-gray-800 text-sm font-condensed">
                                                    {currentMatch.player1?.name || 'Player 1'}
                                                </p>
                                                {currentMatch.player1?.country && (
                                                    <p className="text-xs text-gray-500">
                                                        {getCountryFlag(currentMatch.player1.country)} {currentMatch.player1.country}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Score */}
                                        <div className="flex items-center gap-2">
                                            {currentMatch.score?.sets?.map((set, idx) => (
                                                <span
                                                    key={idx}
                                                    className={`w-7 h-7 flex items-center justify-center rounded text-sm font-bold ${set.player1 > set.player2
                                                            ? 'bg-green-500 text-white'
                                                            : set.player1 < set.player2
                                                                ? 'bg-red-500 text-white'
                                                                : 'bg-gray-200 text-gray-600'
                                                        }`}
                                                >
                                                    {set.player1}
                                                </span>
                                            ))}
                                            {currentMatch.score?.currentGame?.player1 !== undefined && currentMatch.isLive && (
                                                <span className="w-7 h-7 flex items-center justify-center rounded text-sm font-bold bg-yellow-400 text-gray-800">
                                                    {currentMatch.score.currentGame.player1}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* VS Divider */}
                                    <div className="flex items-center justify-center">
                                        <span className="text-xs text-gray-400 font-condensed">vs</span>
                                    </div>

                                    {/* Player 2 */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {currentMatch.player2?.isServing && currentMatch.isLive && (
                                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                            )}
                                            {currentMatch.player2?.logo ? (
                                                <img
                                                    src={currentMatch.player2.logo}
                                                    alt=""
                                                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                                                    {currentMatch.player2?.name?.[0] || 'P'}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-semibold text-gray-800 text-sm font-condensed">
                                                    {currentMatch.player2?.name || 'Player 2'}
                                                </p>
                                                {currentMatch.player2?.country && (
                                                    <p className="text-xs text-gray-500">
                                                        {getCountryFlag(currentMatch.player2.country)} {currentMatch.player2.country}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Score */}
                                        <div className="flex items-center gap-2">
                                            {currentMatch.score?.sets?.map((set, idx) => (
                                                <span
                                                    key={idx}
                                                    className={`w-7 h-7 flex items-center justify-center rounded text-sm font-bold ${set.player2 > set.player1
                                                            ? 'bg-green-500 text-white'
                                                            : set.player2 < set.player1
                                                                ? 'bg-red-500 text-white'
                                                                : 'bg-gray-200 text-gray-600'
                                                        }`}
                                                >
                                                    {set.player2}
                                                </span>
                                            ))}
                                            {currentMatch.score?.currentGame?.player2 !== undefined && currentMatch.isLive && (
                                                <span className="w-7 h-7 flex items-center justify-center rounded text-sm font-bold bg-yellow-400 text-gray-800">
                                                    {currentMatch.score.currentGame.player2}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Match Info */}
                                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                    <div className="text-xs text-gray-500 font-condensed">
                                        {currentMatch.round}
                                    </div>
                                    <div className="text-xs text-gray-500 font-condensed">
                                        {currentMatch.date} • {currentMatch.time}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Circle className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="text-gray-500 font-condensed">Tidak ada pertandingan</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                {featuredMatches.length > 1 && (
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-100">
                        <button
                            onClick={handlePrevMatch}
                            disabled={isAnimating}
                            className="p-1 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-500" />
                        </button>

                        <div className="flex items-center gap-1">
                            {featuredMatches.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => goToIndex(idx)}
                                    className={`w-2 h-2 rounded-full transition-colors ${idx === currentIndex ? 'bg-green-500' : 'bg-gray-300'
                                        }`}
                                />
                            ))}
                        </div>

                        <button
                            onClick={handleNextMatch}
                            disabled={isAnimating}
                            className="p-1 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                )}
            </div>

            {/* Rankings Card */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Tabs */}
                <div className="grid grid-cols-2 border-b border-gray-100">
                    <button
                        onClick={() => setActiveRankingTab('atp')}
                        className={`flex items-center justify-center gap-2 py-3 transition-colors font-condensed ${activeRankingTab === 'atp'
                                ? 'bg-white border-b-2 border-blue-500 text-blue-600'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <Award className={`w-5 h-5 ${activeRankingTab === 'atp' ? 'text-blue-500' : 'text-gray-400'}`} />
                        <span className="font-semibold text-sm">ATP Rankings</span>
                    </button>
                    <button
                        onClick={() => setActiveRankingTab('wta')}
                        className={`flex items-center justify-center gap-2 py-3 transition-colors font-condensed ${activeRankingTab === 'wta'
                                ? 'bg-white border-b-2 border-pink-500 text-pink-600'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <Award className={`w-5 h-5 ${activeRankingTab === 'wta' ? 'text-pink-500' : 'text-gray-400'}`} />
                        <span className="font-semibold text-sm">WTA Rankings</span>
                    </button>
                </div>

                {/* Rankings List */}
                <div className="p-4">
                    {isLoadingRankings ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {(activeRankingTab === 'atp' ? rankings.atp : rankings.wta).map((player) => (
                                <div
                                    key={player.playerKey || player.rank}
                                    className="flex items-center justify-between py-2 hover:bg-gray-50 rounded-lg px-2 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`w-6 text-center font-bold font-condensed ${player.rank <= 3 ? 'text-green-600' : 'text-gray-400'
                                            }`}>
                                            {player.rank}
                                        </span>
                                        <span className="text-lg">
                                            {getCountryFlag(player.country)}
                                        </span>
                                        <span className="text-sm font-medium text-gray-800 font-condensed">
                                            {player.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500 font-condensed">
                                            {player.points?.toLocaleString()} pts
                                        </span>
                                        {player.movement === 'up' && (
                                            <span className="text-green-500 text-xs">▲</span>
                                        )}
                                        {player.movement === 'down' && (
                                            <span className="text-red-500 text-xs">▼</span>
                                        )}
                                        {player.movement === 'same' && (
                                            <span className="text-gray-400 text-xs">-</span>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {(activeRankingTab === 'atp' ? rankings.atp : rankings.wta).length === 0 && (
                                <div className="text-center py-4">
                                    <p className="text-sm text-gray-500 font-condensed">
                                        Belum ada data ranking
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* View More */}
                <div className="px-4 pb-4">
                    <button className="w-full text-center text-green-600 text-sm font-condensed hover:underline">
                        Lihat ranking lengkap →
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            {matches.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-4">
                    <h3 className="font-bold text-gray-800 mb-3 font-condensed flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-green-500" />
                        Statistik Hari Ini
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-red-50 rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-red-600 font-condensed">
                                {matches.filter(m => m.isLive).length}
                            </p>
                            <p className="text-xs text-gray-500 font-condensed">Live</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-green-600 font-condensed">
                                {matches.filter(m => m.isFinished).length}
                            </p>
                            <p className="text-xs text-gray-500 font-condensed">Selesai</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-blue-600 font-condensed">
                                {matches.filter(m => !m.isLive && !m.isFinished).length}
                            </p>
                            <p className="text-xs text-gray-500 font-condensed">Akan Datang</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
