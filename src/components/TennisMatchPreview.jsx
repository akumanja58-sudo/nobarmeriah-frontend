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

    // Get featured matches (live or upcoming from top tournaments)
    const featuredMatches = matches.filter(m => {
        const eventType = m.eventType?.toLowerCase() || '';
        return eventType.includes('atp singles') ||
            eventType.includes('wta singles') ||
            m.isLive;
    }).slice(0, 10);

    const currentMatch = featuredMatches[currentIndex] || match;

    // Auto-slide for featured matches
    useEffect(() => {
        if (!isAutoPlaying || featuredMatches.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % featuredMatches.length);
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
        setIsAutoPlaying(false);
        setCurrentIndex(prev => prev === 0 ? featuredMatches.length - 1 : prev - 1);
    };

    const handleNextMatch = () => {
        setIsAutoPlaying(false);
        setCurrentIndex(prev => (prev + 1) % featuredMatches.length);
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

                {/* Match Content */}
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
                                        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                            {currentMatch.player1?.name?.[0] || 'P'}
                                        </div>
                                    )}
                                    <div>
                                        <p className={`font-semibold text-gray-800 font-condensed ${currentMatch.winner === 'First Player' ? 'text-green-600' : ''
                                            }`}>
                                            {currentMatch.player1?.name || 'Player 1'}
                                        </p>
                                    </div>
                                </div>

                                {/* Sets Score */}
                                <div className="flex items-center gap-2">
                                    {currentMatch.scores?.map((set, idx) => (
                                        <span
                                            key={idx}
                                            className={`w-8 h-8 flex items-center justify-center rounded text-sm font-bold font-condensed ${set.player1 > set.player2
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-600'
                                                }`}
                                        >
                                            {set.player1}
                                        </span>
                                    ))}
                                    {currentMatch.isLive && currentMatch.gameScore !== '-' && (
                                        <span className="w-8 h-8 flex items-center justify-center rounded text-sm font-bold font-condensed bg-red-100 text-red-600">
                                            {currentMatch.gameScore?.split(' - ')[0]}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* VS Divider */}
                            <div className="flex items-center justify-center">
                                <div className="h-px bg-gray-200 flex-1"></div>
                                <span className="px-3 text-xs text-gray-400 font-condensed">VS</span>
                                <div className="h-px bg-gray-200 flex-1"></div>
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
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                            {currentMatch.player2?.name?.[0] || 'P'}
                                        </div>
                                    )}
                                    <div>
                                        <p className={`font-semibold text-gray-800 font-condensed ${currentMatch.winner === 'Second Player' ? 'text-green-600' : ''
                                            }`}>
                                            {currentMatch.player2?.name || 'Player 2'}
                                        </p>
                                    </div>
                                </div>

                                {/* Sets Score */}
                                <div className="flex items-center gap-2">
                                    {currentMatch.scores?.map((set, idx) => (
                                        <span
                                            key={idx}
                                            className={`w-8 h-8 flex items-center justify-center rounded text-sm font-bold font-condensed ${set.player2 > set.player1
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-600'
                                                }`}
                                        >
                                            {set.player2}
                                        </span>
                                    ))}
                                    {currentMatch.isLive && currentMatch.gameScore !== '-' && (
                                        <span className="w-8 h-8 flex items-center justify-center rounded text-sm font-bold font-condensed bg-red-100 text-red-600">
                                            {currentMatch.gameScore?.split(' - ')[1]}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Match Info */}
                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                            <div className="text-xs text-gray-500 font-condensed">
                                {currentMatch.tournament?.round || currentMatch.status}
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

                {/* Navigation */}
                {featuredMatches.length > 1 && (
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-100">
                        <button
                            onClick={handlePrevMatch}
                            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-500" />
                        </button>

                        <div className="flex items-center gap-1">
                            {featuredMatches.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setIsAutoPlaying(false);
                                        setCurrentIndex(idx);
                                    }}
                                    className={`w-2 h-2 rounded-full transition-colors ${idx === currentIndex ? 'bg-green-500' : 'bg-gray-300'
                                        }`}
                                />
                            ))}
                        </div>

                        <button
                            onClick={handleNextMatch}
                            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
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
