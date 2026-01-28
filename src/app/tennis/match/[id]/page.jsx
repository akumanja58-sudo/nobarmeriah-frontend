'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Star, Share2, Trophy, Clock, MapPin, Calendar } from 'lucide-react';
import OrbitLoader from '@/components/OrbitLoader';

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
    'switzerland': '🇨🇭',
    'argentina': '🇦🇷',
    'brazil': '🇧🇷',
    'japan': '🇯🇵',
    'china': '🇨🇳',
    'kazakhstan': '🇰🇿',
    'belarus': '🇧🇾',
    'ukraine': '🇺🇦',
    'croatia': '🇭🇷',
    'indonesia': '🇮🇩',
};

function getCountryFlag(country) {
    if (!country) return '🌍';
    return COUNTRY_FLAGS[country.toLowerCase()] || '🌍';
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function TennisMatchDetailPage() {
    const params = useParams();
    const router = useRouter();
    const matchId = params.id;

    const [match, setMatch] = useState(null);
    const [h2h, setH2H] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingH2H, setIsLoadingH2H] = useState(false);
    const [activeTab, setActiveTab] = useState('summary');
    const [error, setError] = useState(null);

    // Fetch match detail
    useEffect(() => {
        if (!matchId) return;

        const fetchMatch = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch(`${API_BASE_URL}/api/tennis/match/${matchId}`);
                const data = await response.json();

                if (data.success && data.match) {
                    setMatch(data.match);

                    // Fetch H2H if we have both player keys
                    if (data.match.player1?.key && data.match.player2?.key) {
                        fetchH2H(data.match.player1.key, data.match.player2.key);
                    }
                } else {
                    setError('Match tidak ditemukan');
                }
            } catch (err) {
                console.error('Error fetching match:', err);
                setError('Gagal memuat data match');
            } finally {
                setIsLoading(false);
            }
        };

        fetchMatch();
    }, [matchId]);

    // Fetch H2H
    const fetchH2H = async (player1Key, player2Key) => {
        setIsLoadingH2H(true);
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/tennis/h2h?player1=${player1Key}&player2=${player2Key}`
            );
            const data = await response.json();

            if (data.success && data.h2h) {
                setH2H(data.h2h);
            }
        } catch (err) {
            console.error('Error fetching H2H:', err);
        } finally {
            setIsLoadingH2H(false);
        }
    };

    // ============================================================
    // RENDER HELPERS
    // ============================================================

    const renderScoreTable = () => {
        if (!match?.scores || match.scores.length === 0) {
            return (
                <div className="text-center py-4 text-gray-500 font-condensed">
                    Pertandingan belum dimulai
                </div>
            );
        }

        return (
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 font-semibold text-gray-600 font-condensed">Pemain</th>
                            {match.scores.map((_, idx) => (
                                <th key={idx} className="text-center py-3 px-3 font-semibold text-gray-600 font-condensed w-12">
                                    Set {idx + 1}
                                </th>
                            ))}
                            {match.isLive && match.gameScore !== '-' && (
                                <th className="text-center py-3 px-3 font-semibold text-red-600 font-condensed w-12">
                                    Game
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {/* Player 1 */}
                        <tr className="border-b border-gray-100">
                            <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                    {match.player1?.isServing && match.isLive && (
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    )}
                                    {match.player1?.logo ? (
                                        <img
                                            src={match.player1.logo}
                                            alt=""
                                            className="w-8 h-8 rounded-full object-cover"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    ) : (
                                        <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                            {match.player1?.name?.[0] || 'P'}
                                        </div>
                                    )}
                                    <span className={`font-semibold font-condensed ${match.winner === 'First Player' ? 'text-green-600' : 'text-gray-800'
                                        }`}>
                                        {match.player1?.name || 'Player 1'}
                                    </span>
                                    {match.winner === 'First Player' && (
                                        <Trophy className="w-4 h-4 text-yellow-500" />
                                    )}
                                </div>
                            </td>
                            {match.scores.map((set, idx) => (
                                <td key={idx} className="text-center py-3 px-3">
                                    <span className={`text-lg font-bold font-condensed ${set.player1 > set.player2
                                            ? 'text-green-600'
                                            : 'text-gray-600'
                                        }`}>
                                        {set.player1}
                                    </span>
                                </td>
                            ))}
                            {match.isLive && match.gameScore !== '-' && (
                                <td className="text-center py-3 px-3">
                                    <span className="text-lg font-bold text-red-600 font-condensed">
                                        {match.gameScore?.split(' - ')[0]}
                                    </span>
                                </td>
                            )}
                        </tr>

                        {/* Player 2 */}
                        <tr>
                            <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                    {match.player2?.isServing && match.isLive && (
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    )}
                                    {match.player2?.logo ? (
                                        <img
                                            src={match.player2.logo}
                                            alt=""
                                            className="w-8 h-8 rounded-full object-cover"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    ) : (
                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                            {match.player2?.name?.[0] || 'P'}
                                        </div>
                                    )}
                                    <span className={`font-semibold font-condensed ${match.winner === 'Second Player' ? 'text-green-600' : 'text-gray-800'
                                        }`}>
                                        {match.player2?.name || 'Player 2'}
                                    </span>
                                    {match.winner === 'Second Player' && (
                                        <Trophy className="w-4 h-4 text-yellow-500" />
                                    )}
                                </div>
                            </td>
                            {match.scores.map((set, idx) => (
                                <td key={idx} className="text-center py-3 px-3">
                                    <span className={`text-lg font-bold font-condensed ${set.player2 > set.player1
                                            ? 'text-green-600'
                                            : 'text-gray-600'
                                        }`}>
                                        {set.player2}
                                    </span>
                                </td>
                            ))}
                            {match.isLive && match.gameScore !== '-' && (
                                <td className="text-center py-3 px-3">
                                    <span className="text-lg font-bold text-red-600 font-condensed">
                                        {match.gameScore?.split(' - ')[1]}
                                    </span>
                                </td>
                            )}
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    };

    const renderPointByPoint = () => {
        if (!match?.pointByPoint || match.pointByPoint.length === 0) {
            return (
                <div className="text-center py-8 text-gray-500 font-condensed">
                    Data point by point tidak tersedia
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {match.pointByPoint.map((set, setIdx) => (
                    <div key={setIdx} className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-bold text-gray-800 font-condensed mb-3">
                            {set.set_number}
                        </h4>
                        <div className="space-y-2">
                            {set.points?.slice(0, 10).map((point, pointIdx) => (
                                <div
                                    key={pointIdx}
                                    className="flex items-center justify-between text-sm py-1 border-b border-gray-200 last:border-0"
                                >
                                    <span className="text-gray-600 font-condensed">
                                        Game {set.number_game} - Point {point.number_point}
                                    </span>
                                    <span className="font-semibold font-condensed">
                                        {point.score}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderH2H = () => {
        if (isLoadingH2H) {
            return (
                <div className="flex items-center justify-center py-8">
                    <OrbitLoader />
                </div>
            );
        }

        if (!h2h) {
            return (
                <div className="text-center py-8 text-gray-500 font-condensed">
                    Data head to head tidak tersedia
                </div>
            );
        }

        const h2hMatches = h2h.H2H || [];
        const player1Results = h2h.firstPlayerResults || [];
        const player2Results = h2h.secondPlayerResults || [];

        return (
            <div className="space-y-6">
                {/* H2H Summary */}
                {h2hMatches.length > 0 && (
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4">
                        <h4 className="font-bold text-gray-800 font-condensed mb-3 text-center">
                            Pertemuan Sebelumnya
                        </h4>
                        <div className="space-y-2">
                            {h2hMatches.slice(0, 5).map((m, idx) => (
                                <div key={idx} className="bg-white rounded-lg p-3 flex items-center justify-between">
                                    <div className="text-sm text-gray-600 font-condensed">
                                        {m.event_date}
                                    </div>
                                    <div className="font-semibold font-condensed">
                                        {m.event_final_result}
                                    </div>
                                    <div className="text-xs text-gray-500 font-condensed">
                                        {m.tournament_name}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent Form */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Player 1 Recent */}
                    <div className="bg-gray-50 rounded-xl p-4">
                        <h4 className="font-bold text-gray-800 font-condensed mb-3 text-sm">
                            {match?.player1?.name} - Form Terakhir
                        </h4>
                        <div className="space-y-2">
                            {player1Results.slice(0, 5).map((m, idx) => (
                                <div key={idx} className="text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className={`font-semibold font-condensed ${m.event_winner === 'First Player' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {m.event_winner === 'First Player' ? 'W' : 'L'}
                                        </span>
                                        <span className="text-gray-600 font-condensed">
                                            {m.event_final_result}
                                        </span>
                                    </div>
                                    <div className="text-gray-400 font-condensed truncate">
                                        vs {m.event_second_player}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Player 2 Recent */}
                    <div className="bg-gray-50 rounded-xl p-4">
                        <h4 className="font-bold text-gray-800 font-condensed mb-3 text-sm">
                            {match?.player2?.name} - Form Terakhir
                        </h4>
                        <div className="space-y-2">
                            {player2Results.slice(0, 5).map((m, idx) => (
                                <div key={idx} className="text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className={`font-semibold font-condensed ${m.event_winner === 'First Player' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {m.event_winner === 'First Player' ? 'W' : 'L'}
                                        </span>
                                        <span className="text-gray-600 font-condensed">
                                            {m.event_final_result}
                                        </span>
                                    </div>
                                    <div className="text-gray-400 font-condensed truncate">
                                        vs {m.event_second_player}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ============================================================
    // MAIN RENDER
    // ============================================================

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <OrbitLoader />
            </div>
        );
    }

    if (error || !match) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
                <span className="text-6xl mb-4">🎾</span>
                <h1 className="text-xl font-bold text-gray-800 font-condensed mb-2">
                    {error || 'Match tidak ditemukan'}
                </h1>
                <button
                    onClick={() => router.push('/tennis')}
                    className="mt-4 px-6 py-2 bg-green-500 text-white rounded-full font-condensed hover:bg-green-600 transition-colors"
                >
                    Kembali ke Tennis
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-500 text-white">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    {/* Top Bar */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => router.push('/tennis')}
                            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            <span className="font-condensed">Kembali</span>
                        </button>
                        <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <Star className="w-5 h-5" />
                            </button>
                            <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <Share2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Tournament Info */}
                    <div className="text-center mb-4">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <span className="text-2xl">🎾</span>
                            <h1 className="text-lg font-bold font-condensed">
                                {match.tournament?.name || 'Tennis Match'}
                            </h1>
                        </div>
                        <p className="text-green-100 text-sm font-condensed">
                            {match.eventType} • {match.tournament?.round}
                        </p>
                    </div>

                    {/* Match Status */}
                    <div className="flex items-center justify-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-green-100">
                            <Calendar className="w-4 h-4" />
                            <span className="font-condensed">{match.date}</span>
                        </div>
                        <div className="flex items-center gap-1 text-green-100">
                            <Clock className="w-4 h-4" />
                            <span className="font-condensed">{match.time}</span>
                        </div>
                        {match.isLive && (
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded animate-pulse font-condensed">
                                🔴 LIVE
                            </span>
                        )}
                        {match.isFinished && (
                            <span className="bg-gray-600 text-white text-xs font-bold px-2 py-1 rounded font-condensed">
                                Selesai
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 py-4">
                {/* Score Card */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
                    {/* Players Header */}
                    <div className="p-6 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center justify-between">
                            {/* Player 1 */}
                            <div className="flex-1 text-center">
                                {match.player1?.logo ? (
                                    <img
                                        src={match.player1.logo}
                                        alt=""
                                        className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-4 border-white shadow-lg"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                ) : (
                                    <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3 border-4 border-white shadow-lg">
                                        {match.player1?.name?.[0] || 'P'}
                                    </div>
                                )}
                                <h2 className={`font-bold text-lg font-condensed ${match.winner === 'First Player' ? 'text-green-600' : 'text-gray-800'
                                    }`}>
                                    {match.player1?.name || 'Player 1'}
                                </h2>
                                {match.winner === 'First Player' && (
                                    <div className="flex items-center justify-center gap-1 text-yellow-500 mt-1">
                                        <Trophy className="w-4 h-4" />
                                        <span className="text-xs font-condensed">Pemenang</span>
                                    </div>
                                )}
                            </div>

                            {/* VS / Score */}
                            <div className="px-6">
                                <div className="text-4xl font-bold text-gray-300 font-condensed">
                                    {match.setsWon?.player1 || 0} - {match.setsWon?.player2 || 0}
                                </div>
                                <div className="text-center text-xs text-gray-400 font-condensed mt-1">
                                    SETS
                                </div>
                            </div>

                            {/* Player 2 */}
                            <div className="flex-1 text-center">
                                {match.player2?.logo ? (
                                    <img
                                        src={match.player2.logo}
                                        alt=""
                                        className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-4 border-white shadow-lg"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                ) : (
                                    <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3 border-4 border-white shadow-lg">
                                        {match.player2?.name?.[0] || 'P'}
                                    </div>
                                )}
                                <h2 className={`font-bold text-lg font-condensed ${match.winner === 'Second Player' ? 'text-green-600' : 'text-gray-800'
                                    }`}>
                                    {match.player2?.name || 'Player 2'}
                                </h2>
                                {match.winner === 'Second Player' && (
                                    <div className="flex items-center justify-center gap-1 text-yellow-500 mt-1">
                                        <Trophy className="w-4 h-4" />
                                        <span className="text-xs font-condensed">Pemenang</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Score Table */}
                    <div className="border-t border-gray-100">
                        {renderScoreTable()}
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {/* Tab Headers */}
                    <div className="flex border-b border-gray-200">
                        {[
                            { id: 'summary', name: 'Ringkasan' },
                            { id: 'pointbypoint', name: 'Point by Point' },
                            { id: 'h2h', name: 'Head to Head' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 py-3 text-sm font-semibold font-condensed transition-colors ${activeTab === tab.id
                                        ? 'text-green-600 border-b-2 border-green-500 bg-green-50'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                {tab.name}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="p-4">
                        {activeTab === 'summary' && (
                            <div className="space-y-4">
                                {/* Match Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-xs text-gray-500 font-condensed mb-1">Tournament</p>
                                        <p className="font-semibold text-gray-800 font-condensed">
                                            {match.tournament?.name}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-xs text-gray-500 font-condensed mb-1">Round</p>
                                        <p className="font-semibold text-gray-800 font-condensed">
                                            {match.tournament?.round || '-'}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-xs text-gray-500 font-condensed mb-1">Kategori</p>
                                        <p className="font-semibold text-gray-800 font-condensed">
                                            {match.eventType}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-xs text-gray-500 font-condensed mb-1">Status</p>
                                        <p className={`font-semibold font-condensed ${match.isLive ? 'text-red-600' :
                                                match.isFinished ? 'text-gray-600' : 'text-blue-600'
                                            }`}>
                                            {match.isLive ? '🔴 Live' :
                                                match.isFinished ? 'Selesai' : 'Belum Dimulai'}
                                        </p>
                                    </div>
                                </div>

                                {/* Final Result */}
                                {match.finalResult && match.finalResult !== '-' && (
                                    <div className="bg-green-50 rounded-lg p-4 text-center">
                                        <p className="text-xs text-gray-500 font-condensed mb-1">Hasil Akhir (Sets)</p>
                                        <p className="text-2xl font-bold text-green-600 font-condensed">
                                            {match.finalResult}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'pointbypoint' && renderPointByPoint()}

                        {activeTab === 'h2h' && renderH2H()}
                    </div>
                </div>
            </div>
        </div>
    );
}
