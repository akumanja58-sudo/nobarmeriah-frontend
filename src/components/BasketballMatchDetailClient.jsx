'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Share2, ChevronLeft, RefreshCw, Loader2, Trophy, Circle } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';

// Components
import SofaHeader from '@/components/SofaHeader';
import SofaFooter from '@/components/SofaFooter';
import OrbitLoader from '@/components/OrbitLoader';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function BasketballMatchDetailClient({ gameId }) {
    const router = useRouter();

    // Auth State
    const [user, setUser] = useState(null);
    const [username, setUsername] = useState('');
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);

    // Game State
    const [game, setGame] = useState(null);
    const [h2h, setH2H] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingH2H, setIsLoadingH2H] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    // UI State
    const [activeTab, setActiveTab] = useState('ringkasan');
    const [isFavorite, setIsFavorite] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);

    // Check desktop
    useEffect(() => {
        const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
        checkDesktop();
        window.addEventListener('resize', checkDesktop);
        return () => window.removeEventListener('resize', checkDesktop);
    }, []);

    // ============================================================
    // AUTH CHECK
    // ============================================================
    useEffect(() => {
        const checkAuth = async () => {
            try {
                setIsLoadingAuth(true);
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    setUser(session.user);
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('username')
                        .eq('email', session.user.email)
                        .single();
                    if (profile?.username) setUsername(profile.username);
                }
            } catch (error) {
                console.error('Error checking auth:', error);
            } finally {
                setIsLoadingAuth(false);
            }
        };
        checkAuth();
    }, []);

    // ============================================================
    // FETCH GAME DATA
    // ============================================================
    const fetchGame = async (isBackground = false) => {
        if (!gameId) return;

        if (!isBackground) setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/api/basketball/game/${gameId}`);
            const data = await response.json();

            if (data.success && data.game) {
                setGame(data.game);
                setLastUpdated(new Date());

                // Fetch H2H if we have both team IDs
                if (data.game.homeTeam?.id && data.game.awayTeam?.id) {
                    fetchH2H(data.game.homeTeam.id, data.game.awayTeam.id);
                }
            } else {
                setError('Game tidak ditemukan');
            }
        } catch (err) {
            console.error('Error fetching game:', err);
            setError('Gagal memuat data game');
        } finally {
            if (!isBackground) setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchGame();
    }, [gameId]);

    // Auto refresh for live games
    useEffect(() => {
        if (!game?.isLive) return;
        const interval = setInterval(() => fetchGame(true), 30000);
        return () => clearInterval(interval);
    }, [game?.isLive]);

    // Fetch H2H
    const fetchH2H = async (team1Id, team2Id) => {
        setIsLoadingH2H(true);
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/basketball/h2h?team1=${team1Id}&team2=${team2Id}`
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
    // HANDLERS
    // ============================================================
    const handleAuthRedirect = () => router.push('/auth');
    const handleManualRefresh = () => fetchGame(false);

    // ============================================================
    // RENDER: GAME HEADER
    // ============================================================
    const renderGameHeader = () => {
        const isLive = game?.isLive;
        const isFinished = game?.isFinished;

        return (
            <div className="game-header bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Desktop Header */}
                <div className="hidden md:block p-6 relative">
                    {/* LIVE Badge */}
                    {isLive && (
                        <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                            LIVE • {game.status}
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        {/* Home Team */}
                        <div className="flex-1 flex flex-col items-center text-center">
                            <div className="w-20 h-20 mb-3 flex items-center justify-center">
                                {game?.homeTeam?.logo ? (
                                    <img
                                        src={game.homeTeam.logo}
                                        alt={game.homeTeam.name}
                                        className="w-full h-full object-contain"
                                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                    />
                                ) : null}
                                <div className={`w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full ${game?.homeTeam?.logo ? 'hidden' : 'flex'} items-center justify-center`}>
                                    <span className="text-3xl text-white font-bold">{game?.homeTeam?.name?.[0] || 'H'}</span>
                                </div>
                            </div>
                            <h2 className={`text-lg font-bold font-condensed ${isFinished && game.homeScore > game.awayScore ? 'text-green-600' : 'text-gray-800'}`}>
                                {game?.homeTeam?.name || 'Home Team'}
                            </h2>
                            {isFinished && game.homeScore > game.awayScore && (
                                <div className="flex items-center gap-1 text-yellow-500 mt-1">
                                    <Trophy className="w-4 h-4" />
                                    <span className="text-xs font-condensed">Pemenang</span>
                                </div>
                            )}
                        </div>

                        {/* Score */}
                        <div className="flex-1 flex flex-col items-center">
                            {(isLive || isFinished) ? (
                                <>
                                    <div className="text-5xl font-bold text-gray-900 font-condensed mb-2">
                                        {game?.homeScore || 0} - {game?.awayScore || 0}
                                    </div>
                                    <div className={`flex items-center gap-2 ${isLive ? 'text-red-600' : 'text-gray-500'}`}>
                                        {isLive && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                                        <span className="text-sm font-medium font-condensed">{game.statusLong || game.status}</span>
                                    </div>
                                    {/* Quarter Scores */}
                                    {game.quarters && (
                                        <div className="flex items-center gap-2 mt-3">
                                            {['q1', 'q2', 'q3', 'q4'].map((q, idx) => {
                                                const homeQ = game.quarters?.home?.[q];
                                                const awayQ = game.quarters?.away?.[q];
                                                if (homeQ === undefined) return null;
                                                return (
                                                    <div key={q} className="text-center">
                                                        <div className="text-xs text-gray-400 font-condensed mb-1">Q{idx + 1}</div>
                                                        <div className="bg-gray-100 rounded-lg px-2 py-1">
                                                            <span className={`font-bold font-condensed text-sm ${homeQ > awayQ ? 'text-orange-600' : 'text-gray-600'}`}>{homeQ}</span>
                                                            <span className="text-gray-400 mx-1">-</span>
                                                            <span className={`font-bold font-condensed text-sm ${awayQ > homeQ ? 'text-orange-600' : 'text-gray-600'}`}>{awayQ}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {game.quarters?.home?.ot !== null && game.quarters?.home?.ot !== undefined && (
                                                <div className="text-center">
                                                    <div className="text-xs text-orange-500 font-condensed mb-1">OT</div>
                                                    <div className="bg-orange-50 rounded-lg px-2 py-1">
                                                        <span className="font-bold font-condensed text-sm text-orange-600">{game.quarters?.home?.ot}</span>
                                                        <span className="text-gray-400 mx-1">-</span>
                                                        <span className="font-bold font-condensed text-sm text-orange-600">{game.quarters?.away?.ot}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className="text-2xl font-bold text-gray-900 font-condensed mb-1">
                                        {game?.date?.split('T')[0]}
                                    </div>
                                    <div className="text-lg text-gray-600 font-condensed">
                                        {game?.time?.substring(0, 5)}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Away Team */}
                        <div className="flex-1 flex flex-col items-center text-center">
                            <div className="w-20 h-20 mb-3 flex items-center justify-center">
                                {game?.awayTeam?.logo ? (
                                    <img
                                        src={game.awayTeam.logo}
                                        alt={game.awayTeam.name}
                                        className="w-full h-full object-contain"
                                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                    />
                                ) : null}
                                <div className={`w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full ${game?.awayTeam?.logo ? 'hidden' : 'flex'} items-center justify-center`}>
                                    <span className="text-3xl text-white font-bold">{game?.awayTeam?.name?.[0] || 'A'}</span>
                                </div>
                            </div>
                            <h2 className={`text-lg font-bold font-condensed ${isFinished && game.awayScore > game.homeScore ? 'text-green-600' : 'text-gray-800'}`}>
                                {game?.awayTeam?.name || 'Away Team'}
                            </h2>
                            {isFinished && game.awayScore > game.homeScore && (
                                <div className="flex items-center gap-1 text-yellow-500 mt-1">
                                    <Trophy className="w-4 h-4" />
                                    <span className="text-xs font-condensed">Pemenang</span>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="absolute top-4 right-4 flex items-center gap-2">
                            <button
                                onClick={() => setIsFavorite(!isFavorite)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all font-condensed text-sm ${isFavorite
                                    ? 'bg-yellow-50 border-yellow-400 text-yellow-600'
                                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                    }`}
                            >
                                <Star className={`w-4 h-4 ${isFavorite ? 'fill-yellow-400' : ''}`} />
                                FAVORIT
                            </button>
                            <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                                <Share2 className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                    </div>

                    {/* Game Info */}
                    <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5 font-condensed">
                            🗓️ {game?.date?.split('T')[0]} • {game?.time?.substring(0, 5)}
                        </span>
                        <span className="flex items-center gap-2 font-condensed">
                            {game?.league?.logo && (
                                <img src={game.league.logo} alt="" className="w-5 h-5 object-contain" />
                            )}
                            {game?.league?.name || 'Basketball'}
                        </span>
                    </div>
                </div>

                {/* Mobile Header */}
                <div className="md:hidden p-4 relative">
                    {isLive && (
                        <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded-md text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                            LIVE
                        </div>
                    )}

                    <div className="absolute top-2 right-2 flex items-center gap-1">
                        <button onClick={() => setIsFavorite(!isFavorite)} className={`p-1.5 rounded-full ${isFavorite ? 'text-yellow-500' : 'text-gray-400'}`}>
                            <Star className={`w-5 h-5 ${isFavorite ? 'fill-yellow-400' : ''}`} />
                        </button>
                        <button className="p-1.5 text-gray-400"><Share2 className="w-5 h-5" /></button>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-6">
                        <div className="flex-1 flex flex-col items-center text-center min-w-0">
                            {game?.homeTeam?.logo ? (
                                <img src={game.homeTeam.logo} alt="" className="w-14 h-14 object-contain mb-2" onError={(e) => { e.target.style.display = 'none'; }} />
                            ) : (
                                <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mb-2">
                                    <span className="text-xl text-white font-bold">{game?.homeTeam?.name?.[0] || 'H'}</span>
                                </div>
                            )}
                            <h2 className={`text-sm font-bold font-condensed line-clamp-2 ${isFinished && game.homeScore > game.awayScore ? 'text-green-600' : 'text-gray-800'}`}>
                                {game?.homeTeam?.name}
                            </h2>
                        </div>

                        <div className="flex-shrink-0 flex flex-col items-center px-3">
                            {(isLive || isFinished) ? (
                                <>
                                    <div className="text-3xl font-bold text-gray-900 font-condensed">{game?.homeScore || 0} - {game?.awayScore || 0}</div>
                                    <div className={`text-xs mt-1 ${isLive ? 'text-red-600' : 'text-gray-500'}`}>{game.status}</div>
                                </>
                            ) : (
                                <>
                                    <div className="text-xl font-bold text-gray-900 font-condensed">{game?.date?.split('T')[0]}</div>
                                    <div className="text-base text-gray-600 font-condensed">{game?.time?.substring(0, 5)}</div>
                                </>
                            )}
                        </div>

                        <div className="flex-1 flex flex-col items-center text-center min-w-0">
                            {game?.awayTeam?.logo ? (
                                <img src={game.awayTeam.logo} alt="" className="w-14 h-14 object-contain mb-2" onError={(e) => { e.target.style.display = 'none'; }} />
                            ) : (
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mb-2">
                                    <span className="text-xl text-white font-bold">{game?.awayTeam?.name?.[0] || 'A'}</span>
                                </div>
                            )}
                            <h2 className={`text-sm font-bold font-condensed line-clamp-2 ${isFinished && game.awayScore > game.homeScore ? 'text-green-600' : 'text-gray-800'}`}>
                                {game?.awayTeam?.name}
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-3 mt-3 text-xs text-gray-500">
                        {game?.league?.logo && <img src={game.league.logo} alt="" className="w-5 h-5 object-contain" />}
                        <span className="font-condensed">{game?.league?.name}</span>
                    </div>
                </div>
            </div>
        );
    };

    // ============================================================
    // RENDER: TAB CONTENT
    // ============================================================
    const renderTabContent = () => {
        switch (activeTab) {
            case 'ringkasan':
                return (
                    <div className="space-y-4">
                        <div className="bg-white rounded-xl shadow-sm p-4">
                            <h3 className="font-semibold text-gray-800 mb-3 font-condensed">Info Pertandingan</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500 font-condensed mb-1">Liga</p>
                                    <p className="font-semibold text-gray-800 font-condensed text-sm">{game?.league?.name}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500 font-condensed mb-1">Season</p>
                                    <p className="font-semibold text-gray-800 font-condensed text-sm">{game?.league?.season || '-'}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500 font-condensed mb-1">Negara</p>
                                    <p className="font-semibold text-gray-800 font-condensed text-sm">{game?.country?.name || '-'}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500 font-condensed mb-1">Status</p>
                                    <p className={`font-semibold font-condensed text-sm ${game?.isLive ? 'text-red-600' : game?.isFinished ? 'text-gray-600' : 'text-blue-600'}`}>
                                        {game?.isLive ? '🔴 Live' : game?.isFinished ? 'Selesai' : 'Belum Dimulai'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Quarter Scores Table */}
                        {(game?.isLive || game?.isFinished) && game?.quarters && (
                            <div className="bg-white rounded-xl shadow-sm p-4">
                                <h3 className="font-semibold text-gray-800 mb-3 font-condensed">Skor Per Quarter</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="text-left py-2 px-3 font-semibold text-gray-600 font-condensed text-sm">Tim</th>
                                                <th className="text-center py-2 px-2 font-semibold text-gray-600 font-condensed text-sm w-12">Q1</th>
                                                <th className="text-center py-2 px-2 font-semibold text-gray-600 font-condensed text-sm w-12">Q2</th>
                                                <th className="text-center py-2 px-2 font-semibold text-gray-600 font-condensed text-sm w-12">Q3</th>
                                                <th className="text-center py-2 px-2 font-semibold text-gray-600 font-condensed text-sm w-12">Q4</th>
                                                {game.quarters?.home?.ot !== null && game.quarters?.home?.ot !== undefined && (
                                                    <th className="text-center py-2 px-2 font-semibold text-orange-600 font-condensed text-sm w-12">OT</th>
                                                )}
                                                <th className="text-center py-2 px-2 font-semibold text-gray-800 font-condensed text-sm w-14">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b border-gray-100">
                                                <td className="py-2 px-3">
                                                    <div className="flex items-center gap-2">
                                                        {game.homeTeam?.logo && <img src={game.homeTeam.logo} alt="" className="w-5 h-5 object-contain" />}
                                                        <span className="font-condensed text-sm text-gray-800">{game.homeTeam?.name}</span>
                                                    </div>
                                                </td>
                                                {['q1', 'q2', 'q3', 'q4'].map(q => (
                                                    <td key={q} className="text-center py-2 px-2">
                                                        <span className={`font-bold font-condensed ${game.quarters?.home?.[q] > game.quarters?.away?.[q] ? 'text-orange-600' : 'text-gray-500'}`}>
                                                            {game.quarters?.home?.[q] ?? '-'}
                                                        </span>
                                                    </td>
                                                ))}
                                                {game.quarters?.home?.ot !== null && game.quarters?.home?.ot !== undefined && (
                                                    <td className="text-center py-2 px-2">
                                                        <span className="font-bold font-condensed text-orange-600">{game.quarters?.home?.ot}</span>
                                                    </td>
                                                )}
                                                <td className="text-center py-2 px-2">
                                                    <span className="font-bold font-condensed text-gray-800">{game.homeScore}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="py-2 px-3">
                                                    <div className="flex items-center gap-2">
                                                        {game.awayTeam?.logo && <img src={game.awayTeam.logo} alt="" className="w-5 h-5 object-contain" />}
                                                        <span className="font-condensed text-sm text-gray-800">{game.awayTeam?.name}</span>
                                                    </div>
                                                </td>
                                                {['q1', 'q2', 'q3', 'q4'].map(q => (
                                                    <td key={q} className="text-center py-2 px-2">
                                                        <span className={`font-bold font-condensed ${game.quarters?.away?.[q] > game.quarters?.home?.[q] ? 'text-orange-600' : 'text-gray-500'}`}>
                                                            {game.quarters?.away?.[q] ?? '-'}
                                                        </span>
                                                    </td>
                                                ))}
                                                {game.quarters?.away?.ot !== null && game.quarters?.away?.ot !== undefined && (
                                                    <td className="text-center py-2 px-2">
                                                        <span className="font-bold font-condensed text-orange-600">{game.quarters?.away?.ot}</span>
                                                    </td>
                                                )}
                                                <td className="text-center py-2 px-2">
                                                    <span className="font-bold font-condensed text-gray-800">{game.awayScore}</span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 'h2h':
                return (
                    <div className="bg-white rounded-xl shadow-sm p-4">
                        <h3 className="font-semibold text-gray-800 mb-3 font-condensed">Head to Head</h3>
                        {isLoadingH2H ? (
                            <div className="flex items-center justify-center py-8">
                                <OrbitLoader />
                            </div>
                        ) : h2h?.length > 0 ? (
                            <div className="space-y-2">
                                {h2h.slice(0, 5).map((g, idx) => (
                                    <div key={idx} className="bg-gray-50 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-gray-500 font-condensed">{g.date?.split('T')[0]}</span>
                                            <span className="text-xs text-gray-500 font-condensed">{g.league?.name}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="font-condensed text-sm">{g.homeTeam?.name}</span>
                                            <span className="font-bold font-condensed">{g.homeScore} - {g.awayScore}</span>
                                            <span className="font-condensed text-sm">{g.awayTeam?.name}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500 font-condensed">
                                Belum ada data head to head
                            </div>
                        )}
                    </div>
                );

            default:
                return null;
        }
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

    if (error || !game) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                    <Circle className="w-10 h-10 text-gray-400" />
                </div>
                <h1 className="text-xl font-bold text-gray-800 font-condensed mb-2">
                    {error || 'Game tidak ditemukan'}
                </h1>
                <button
                    onClick={() => router.push('/basketball')}
                    className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-full font-condensed hover:bg-orange-600 transition-colors"
                >
                    Kembali ke Basketball
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <SofaHeader
                user={user}
                username={username}
                onAuthRedirect={handleAuthRedirect}
            />

            {/* Main Content */}
            <main className="pb-20 lg:pb-8">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    {/* Breadcrumb + Refresh */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => router.push('/basketball')}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            <span className="font-condensed">Kembali ke Basketball</span>
                        </button>
                        <div className="hidden sm:flex items-center gap-2">
                            {lastUpdated && (
                                <span className="text-xs text-gray-400 font-condensed">
                                    Updated: {lastUpdated.toLocaleTimeString('id-ID')}
                                </span>
                            )}
                            <button
                                onClick={handleManualRefresh}
                                disabled={isLoading}
                                className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                                title="Refresh data"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                                ) : (
                                    <RefreshCw className="w-4 h-4 text-gray-500" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Game Header */}
                    {renderGameHeader()}

                    {/* Main Layout - Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4">
                        {/* Left Sidebar - Desktop Only */}
                        <div className="hidden lg:block lg:col-span-4 space-y-4">
                            {/* League Info */}
                            <div className="bg-white rounded-xl shadow-sm p-4">
                                <h3 className="font-semibold text-gray-800 mb-3 font-condensed flex items-center gap-2">
                                    <Trophy className="w-5 h-5 text-orange-500" />
                                    Liga
                                </h3>
                                <div className="flex items-center gap-3">
                                    {game?.league?.logo && (
                                        <img src={game.league.logo} alt="" className="w-12 h-12 object-contain" />
                                    )}
                                    <div>
                                        <p className="font-semibold text-gray-800 font-condensed">{game?.league?.name}</p>
                                        <p className="text-sm text-gray-500 font-condensed">{game?.country?.name} • {game?.league?.season}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Quick H2H */}
                            {h2h?.length > 0 && (
                                <div className="bg-white rounded-xl shadow-sm p-4">
                                    <h3 className="font-semibold text-gray-800 mb-3 font-condensed">⚔️ Head to Head</h3>
                                    <div className="space-y-2">
                                        {h2h.slice(0, 3).map((g, idx) => (
                                            <div key={idx} className="bg-gray-50 rounded-lg p-2 text-xs">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500 font-condensed">{g.date?.split('T')[0]}</span>
                                                    <span className="font-bold font-condensed">{g.homeScore} - {g.awayScore}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Center Content */}
                        <div className="lg:col-span-5 space-y-4">
                            {/* Tabs */}
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="flex border-b border-gray-200">
                                    {[
                                        { id: 'ringkasan', name: 'Ringkasan' },
                                        { id: 'h2h', name: 'H2H' },
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex-1 py-3 text-sm font-semibold font-condensed transition-colors ${activeTab === tab.id
                                                ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50'
                                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            {tab.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tab Content */}
                            {renderTabContent()}

                            {/* About Game */}
                            <div className="bg-white rounded-xl shadow-sm p-4">
                                <h3 className="font-semibold text-gray-800 mb-3 font-condensed">Tentang pertandingan</h3>
                                <p className="text-sm text-gray-600 leading-relaxed font-condensed">
                                    {game?.homeTeam?.name || 'Home'} menghadapi {game?.awayTeam?.name || 'Away'} pada{' '}
                                    {game?.date?.split('T')[0] || '-'} di kompetisi {game?.league?.name || 'Basketball'}.
                                </p>
                            </div>
                        </div>

                        {/* Right Sidebar - Ads (Desktop Only) */}
                        <div className="hidden lg:block lg:col-span-3 space-y-4">
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="bg-gray-100 px-3 py-1 text-xs text-gray-500 font-condensed">Iklan</div>
                                <div className="aspect-[300/250] bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center">
                                    <div className="text-center text-white p-4">
                                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <Circle className="w-10 h-10 text-white" />
                                        </div>
                                        <p className="text-xl font-bold font-condensed mb-1">Basketball Live</p>
                                        <p className="text-sm font-condensed">Nonton NBA Gratis!</p>
                                        <button className="mt-3 px-4 py-2 bg-white text-orange-600 rounded-lg text-sm font-bold font-condensed hover:bg-orange-50 transition-colors">
                                            STREAMING
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <SofaFooter />
        </div>
    );
}
