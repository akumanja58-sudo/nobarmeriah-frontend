'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    ArrowLeft, Star, Share2, Trophy, Clock, MapPin, 
    ChevronRight, Loader2, Circle, Users
} from 'lucide-react';

import SofaHeader from '@/components/SofaHeader';
import SofaFooter from '@/components/SofaFooter';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function VolleyballMatchDetailClient({ gameId }) {
    const router = useRouter();
    
    // State
    const [game, setGame] = useState(null);
    const [h2h, setH2H] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [activeTab, setActiveTab] = useState('ringkasan');

    // ============================================================
    // FETCH DATA
    // ============================================================
    
    const fetchGameDetail = async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            const response = await fetch(`${API_BASE_URL}/api/volleyball/game/${gameId}`);
            const data = await response.json();
            
            if (data.success && data.game) {
                setGame(data.game);
                
                // Fetch H2H if we have both team IDs
                if (data.game.homeTeam?.id && data.game.awayTeam?.id) {
                    fetchH2H(data.game.homeTeam.id, data.game.awayTeam.id);
                }
            } else {
                setError(data.error || 'Game not found');
            }
        } catch (err) {
            console.error('Error fetching game:', err);
            setError('Gagal memuat data pertandingan');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchH2H = async (team1, team2) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/volleyball/h2h?team1=${team1}&team2=${team2}`);
            const data = await response.json();
            
            if (data.success && data.h2h) {
                setH2H(data.h2h.slice(0, 5));
            }
        } catch (err) {
            console.error('Error fetching H2H:', err);
        }
    };

    useEffect(() => {
        if (gameId) {
            fetchGameDetail();
        }
    }, [gameId]);

    // Auto refresh for live games
    useEffect(() => {
        if (game?.isLive) {
            const interval = setInterval(fetchGameDetail, 30000);
            return () => clearInterval(interval);
        }
    }, [game?.isLive]);

    // Check favorite status
    useEffect(() => {
        const saved = localStorage.getItem('volleyball_favorites');
        if (saved) {
            const favorites = JSON.parse(saved);
            setIsFavorite(favorites.includes(parseInt(gameId)));
        }
    }, [gameId]);

    // ============================================================
    // HANDLERS
    // ============================================================

    const handleToggleFavorite = () => {
        const saved = localStorage.getItem('volleyball_favorites');
        let favorites = saved ? JSON.parse(saved) : [];
        
        if (isFavorite) {
            favorites = favorites.filter(id => id !== parseInt(gameId));
        } else {
            favorites.push(parseInt(gameId));
        }
        
        localStorage.setItem('volleyball_favorites', JSON.stringify(favorites));
        setIsFavorite(!isFavorite);
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${game?.homeTeam?.name} vs ${game?.awayTeam?.name}`,
                    url: window.location.href
                });
            } catch (err) {
                console.log('Share cancelled');
            }
        }
    };

    // Format set scores
    const formatSetScores = () => {
        if (!game?.sets) return [];
        
        const setScores = [];
        for (let i = 1; i <= 5; i++) {
            const homeSet = game.sets.home?.[`set${i}`];
            const awaySet = game.sets.away?.[`set${i}`];
            if (homeSet !== null && homeSet !== undefined) {
                setScores.push({ 
                    num: i, 
                    home: homeSet, 
                    away: awaySet,
                    homeWon: homeSet > awaySet
                });
            }
        }
        return setScores;
    };

    // ============================================================
    // RENDER
    // ============================================================

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100">
                <SofaHeader />
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                    <span className="ml-3 text-gray-500 font-condensed">Memuat pertandingan...</span>
                </div>
                <SofaFooter />
            </div>
        );
    }

    if (error || !game) {
        return (
            <div className="min-h-screen bg-gray-100">
                <SofaHeader />
                <div className="max-w-4xl mx-auto px-4 py-20">
                    <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                        <p className="text-red-500 font-condensed mb-4">{error || 'Pertandingan tidak ditemukan'}</p>
                        <button
                            onClick={() => router.back()}
                            className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors font-condensed"
                        >
                            Kembali
                        </button>
                    </div>
                </div>
                <SofaFooter />
            </div>
        );
    }

    const setScores = formatSetScores();

    return (
        <div className="min-h-screen bg-gray-100">
            <SofaHeader />

            <main className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-8">
                        {/* Back Button */}
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 font-condensed"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Kembali
                        </button>

                        {/* Match Header Card */}
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
                            {/* League Header */}
                            <div className="bg-gradient-to-r from-cyan-600 to-cyan-500 px-4 py-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {game.league?.logo ? (
                                            <img 
                                                src={game.league.logo} 
                                                alt="" 
                                                className="w-6 h-6 object-contain"
                                            />
                                        ) : (
                                            <Trophy className="w-5 h-5 text-white" />
                                        )}
                                        <div>
                                            <p className="text-white font-semibold text-sm font-condensed">
                                                {game.league?.name || 'Volleyball'}
                                            </p>
                                            <p className="text-cyan-100 text-xs font-condensed">
                                                {game.country?.name}
                                            </p>
                                        </div>
                                    </div>
                                    {game.isLive && (
                                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded animate-pulse font-condensed flex items-center gap-1">
                                            <span className="w-2 h-2 bg-white rounded-full"></span>
                                            {game.status || 'LIVE'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Teams & Score */}
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    {/* Home Team */}
                                    <div className="flex-1 text-center">
                                        {game.homeTeam?.logo ? (
                                            <img 
                                                src={game.homeTeam.logo} 
                                                alt="" 
                                                className="w-20 h-20 object-contain mx-auto mb-3"
                                            />
                                        ) : (
                                            <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3">
                                                {game.homeTeam?.name?.[0] || 'H'}
                                            </div>
                                        )}
                                        <p className={`font-bold text-lg font-condensed ${
                                            game.isFinished && game.homeScore > game.awayScore 
                                                ? 'text-cyan-600' 
                                                : 'text-gray-800'
                                        }`}>
                                            {game.homeTeam?.name || 'Home'}
                                        </p>
                                        {game.isFinished && game.homeScore > game.awayScore && (
                                            <span className="inline-flex items-center gap-1 text-xs text-cyan-600 mt-1">
                                                <Trophy className="w-3 h-3" /> Pemenang
                                            </span>
                                        )}
                                    </div>

                                    {/* Score */}
                                    <div className="px-8 text-center">
                                        {(game.isLive || game.isFinished) ? (
                                            <>
                                                <div className="text-5xl font-bold text-gray-900 font-condensed">
                                                    {game.homeScore} - {game.awayScore}
                                                </div>
                                                <p className={`text-sm mt-2 font-condensed ${
                                                    game.isLive ? 'text-red-600' : 'text-gray-500'
                                                }`}>
                                                    {game.isLive && (
                                                        <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse"></span>
                                                    )}
                                                    {game.statusLong || game.status || 'Selesai'}
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <div className="text-3xl font-bold text-gray-300 font-condensed">VS</div>
                                                <p className="text-sm text-gray-500 mt-2 font-condensed">
                                                    {game.time?.substring(0, 5) || '-'}
                                                </p>
                                            </>
                                        )}
                                    </div>

                                    {/* Away Team */}
                                    <div className="flex-1 text-center">
                                        {game.awayTeam?.logo ? (
                                            <img 
                                                src={game.awayTeam.logo} 
                                                alt="" 
                                                className="w-20 h-20 object-contain mx-auto mb-3"
                                            />
                                        ) : (
                                            <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3">
                                                {game.awayTeam?.name?.[0] || 'A'}
                                            </div>
                                        )}
                                        <p className={`font-bold text-lg font-condensed ${
                                            game.isFinished && game.awayScore > game.homeScore 
                                                ? 'text-cyan-600' 
                                                : 'text-gray-800'
                                        }`}>
                                            {game.awayTeam?.name || 'Away'}
                                        </p>
                                        {game.isFinished && game.awayScore > game.homeScore && (
                                            <span className="inline-flex items-center gap-1 text-xs text-cyan-600 mt-1">
                                                <Trophy className="w-3 h-3" /> Pemenang
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Set Scores Table */}
                                {(game.isLive || game.isFinished) && setScores.length > 0 && (
                                    <div className="mt-6 pt-6 border-t border-gray-100">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="text-xs text-gray-500 font-condensed">
                                                    <th className="text-left py-2">Tim</th>
                                                    {setScores.map((set) => (
                                                        <th key={set.num} className="text-center py-2 w-12">Set {set.num}</th>
                                                    ))}
                                                    <th className="text-center py-2 w-12">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr className="border-t border-gray-100">
                                                    <td className="py-3 font-semibold font-condensed text-sm">
                                                        {game.homeTeam?.name}
                                                    </td>
                                                    {setScores.map((set) => (
                                                        <td key={set.num} className={`text-center py-3 font-bold font-condensed ${
                                                            set.homeWon ? 'text-cyan-600 bg-cyan-50' : 'text-gray-600'
                                                        }`}>
                                                            {set.home}
                                                        </td>
                                                    ))}
                                                    <td className={`text-center py-3 font-bold font-condensed ${
                                                        game.homeScore > game.awayScore ? 'text-cyan-600' : 'text-gray-600'
                                                    }`}>
                                                        {game.homeScore}
                                                    </td>
                                                </tr>
                                                <tr className="border-t border-gray-100">
                                                    <td className="py-3 font-semibold font-condensed text-sm">
                                                        {game.awayTeam?.name}
                                                    </td>
                                                    {setScores.map((set) => (
                                                        <td key={set.num} className={`text-center py-3 font-bold font-condensed ${
                                                            !set.homeWon ? 'text-cyan-600 bg-cyan-50' : 'text-gray-600'
                                                        }`}>
                                                            {set.away}
                                                        </td>
                                                    ))}
                                                    <td className={`text-center py-3 font-bold font-condensed ${
                                                        game.awayScore > game.homeScore ? 'text-cyan-600' : 'text-gray-600'
                                                    }`}>
                                                        {game.awayScore}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex items-center justify-center gap-4 mt-6 pt-6 border-t border-gray-100">
                                    <button
                                        onClick={handleToggleFavorite}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-condensed ${
                                            isFavorite 
                                                ? 'bg-yellow-100 text-yellow-700' 
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        <Star className={`w-4 h-4 ${isFavorite ? 'fill-yellow-500' : ''}`} />
                                        {isFavorite ? 'Favorit' : 'Tambah Favorit'}
                                    </button>
                                    <button
                                        onClick={handleShare}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors font-condensed"
                                    >
                                        <Share2 className="w-4 h-4" />
                                        Bagikan
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="flex border-b border-gray-100">
                                <button
                                    onClick={() => setActiveTab('ringkasan')}
                                    className={`flex-1 py-3 text-sm font-semibold font-condensed transition-colors ${
                                        activeTab === 'ringkasan'
                                            ? 'text-cyan-600 border-b-2 border-cyan-600'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    Ringkasan
                                </button>
                                <button
                                    onClick={() => setActiveTab('h2h')}
                                    className={`flex-1 py-3 text-sm font-semibold font-condensed transition-colors ${
                                        activeTab === 'h2h'
                                            ? 'text-cyan-600 border-b-2 border-cyan-600'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    Head to Head
                                </button>
                            </div>

                            <div className="p-4">
                                {activeTab === 'ringkasan' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                            <Clock className="w-5 h-5 text-gray-400" />
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800 font-condensed">Waktu</p>
                                                <p className="text-sm text-gray-500 font-condensed">
                                                    {game.date?.split('T')[0]} • {game.time?.substring(0, 5) || '-'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                            <Trophy className="w-5 h-5 text-gray-400" />
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800 font-condensed">Kompetisi</p>
                                                <p className="text-sm text-gray-500 font-condensed">
                                                    {game.league?.name} • {game.league?.season}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'h2h' && (
                                    <div>
                                        {h2h.length > 0 ? (
                                            <div className="space-y-3">
                                                <p className="text-sm text-gray-500 font-condensed mb-3">
                                                    5 Pertemuan terakhir
                                                </p>
                                                {h2h.map((match, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                        <div className="flex-1">
                                                            <p className="text-sm font-semibold font-condensed">
                                                                {match.homeTeam?.name}
                                                            </p>
                                                        </div>
                                                        <div className="px-4 text-center">
                                                            <span className="font-bold font-condensed">
                                                                {match.homeScore} - {match.awayScore}
                                                            </span>
                                                        </div>
                                                        <div className="flex-1 text-right">
                                                            <p className="text-sm font-semibold font-condensed">
                                                                {match.awayTeam?.name}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                                <p className="text-gray-500 font-condensed">Tidak ada data H2H</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4">
                        {/* League Info */}
                        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
                            <h3 className="font-bold text-gray-800 mb-3 font-condensed flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-cyan-500" />
                                Info Liga
                            </h3>
                            <div className="flex items-center gap-3">
                                {game.league?.logo ? (
                                    <img src={game.league.logo} alt="" className="w-12 h-12 object-contain" />
                                ) : (
                                    <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
                                        <Trophy className="w-6 h-6 text-cyan-500" />
                                    </div>
                                )}
                                <div>
                                    <p className="font-semibold text-gray-800 font-condensed">{game.league?.name}</p>
                                    <p className="text-sm text-gray-500 font-condensed">{game.country?.name}</p>
                                </div>
                            </div>
                        </div>

                        {/* Quick H2H */}
                        {h2h.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
                                <h3 className="font-bold text-gray-800 mb-3 font-condensed">Quick H2H</h3>
                                <div className="flex items-center justify-between">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-cyan-600 font-condensed">
                                            {h2h.filter(m => m.homeScore > m.awayScore).length}
                                        </p>
                                        <p className="text-xs text-gray-500 font-condensed">
                                            {game.homeTeam?.name?.split(' ')[0]}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-gray-400 font-condensed">
                                            {h2h.filter(m => m.homeScore === m.awayScore).length}
                                        </p>
                                        <p className="text-xs text-gray-500 font-condensed">Seri</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-cyan-600 font-condensed">
                                            {h2h.filter(m => m.awayScore > m.homeScore).length}
                                        </p>
                                        <p className="text-xs text-gray-500 font-condensed">
                                            {game.awayTeam?.name?.split(' ')[0]}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Ad Placeholder */}
                        <div className="bg-white rounded-xl shadow-sm p-4">
                            <div className="bg-gray-100 rounded-lg h-[250px] flex items-center justify-center">
                                <span className="text-gray-400 text-sm font-condensed">Iklan</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <SofaFooter />
        </div>
    );
}
