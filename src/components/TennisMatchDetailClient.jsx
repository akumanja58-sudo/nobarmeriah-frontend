'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Share2, ChevronLeft, RefreshCw, Loader2, Trophy } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';

// Components
import SofaHeader from '@/components/SofaHeader';
import SofaFooter from '@/components/SofaFooter';
import OrbitLoader from '@/components/OrbitLoader';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function TennisMatchDetailClient({ matchId }) {
    const router = useRouter();

    // Auth State
    const [user, setUser] = useState(null);
    const [username, setUsername] = useState('');
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);

    // Match State
    const [match, setMatch] = useState(null);
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
    // FETCH MATCH DATA
    // ============================================================
    const fetchMatch = async (isBackground = false) => {
        if (!matchId) return;

        if (!isBackground) setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/api/tennis/match/${matchId}`);
            const data = await response.json();

            if (data.success && data.match) {
                setMatch(data.match);
                setLastUpdated(new Date());

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
            if (!isBackground) setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMatch();
    }, [matchId]);

    // Auto refresh for live matches
    useEffect(() => {
        if (!match?.isLive) return;
        const interval = setInterval(() => fetchMatch(true), 30000);
        return () => clearInterval(interval);
    }, [match?.isLive]);

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
    // HANDLERS
    // ============================================================
    const handleAuthRedirect = () => router.push('/auth');
    const handleManualRefresh = () => fetchMatch(false);

    // ============================================================
    // RENDER: MATCH HEADER (Same style as Football)
    // ============================================================
    const renderMatchHeader = () => {
        const isLive = match?.isLive;
        const isFinished = match?.isFinished;

        const getStatusText = () => {
            if (isLive) return match?.status || 'LIVE';
            if (isFinished) return 'Selesai';
            return match?.time || '-';
        };

        return (
            <div className="match-header bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Desktop Header */}
                <div className="hidden md:block p-6 relative">
                    {/* LIVE Badge */}
                    {isLive && (
                        <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                            LIVE
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        {/* Player 1 */}
                        <div className="flex-1 flex flex-col items-center text-center">
                            <div className="w-20 h-20 mb-3 flex items-center justify-center">
                                {match?.player1?.logo ? (
                                    <img
                                        src={match.player1.logo}
                                        alt={match.player1.name}
                                        className="w-full h-full object-contain rounded-full"
                                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                    />
                                ) : null}
                                <div className={`w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full ${match?.player1?.logo ? 'hidden' : 'flex'} items-center justify-center`}>
                                    <span className="text-3xl text-white font-bold">{match?.player1?.name?.[0] || 'P'}</span>
                                </div>
                            </div>
                            <h2 className={`text-lg font-bold font-condensed ${match?.winner === 'First Player' ? 'text-green-600' : 'text-gray-800'}`}>
                                {match?.player1?.name || 'Player 1'}
                            </h2>
                            {match?.winner === 'First Player' && (
                                <div className="flex items-center gap-1 text-yellow-500 mt-1">
                                    <Trophy className="w-4 h-4" />
                                    <span className="text-xs font-condensed">Pemenang</span>
                                </div>
                            )}
                        </div>

                        {/* Score */}
                        <div className="flex-1 flex flex-col items-center">
                            {(isLive || isFinished) && match?.scores?.length > 0 ? (
                                <>
                                    <div className="text-5xl font-bold text-gray-900 font-condensed mb-2">
                                        {match?.setsWon?.player1 || 0} - {match?.setsWon?.player2 || 0}
                                    </div>
                                    <div className={`flex items-center gap-2 ${isLive ? 'text-green-600' : 'text-gray-500'}`}>
                                        {isLive && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>}
                                        <span className="text-sm font-medium font-condensed">{getStatusText()}</span>
                                    </div>
                                    {/* Set Scores */}
                                    <div className="flex items-center gap-2 mt-3">
                                        {match.scores.map((set, idx) => (
                                            <div key={idx} className="text-center">
                                                <div className="text-xs text-gray-400 font-condensed mb-1">Set {idx + 1}</div>
                                                <div className="bg-gray-100 rounded-lg px-3 py-1">
                                                    <span className={`font-bold font-condensed ${set.player1 > set.player2 ? 'text-green-600' : 'text-gray-600'}`}>
                                                        {set.player1}
                                                    </span>
                                                    <span className="text-gray-400 mx-1">-</span>
                                                    <span className={`font-bold font-condensed ${set.player2 > set.player1 ? 'text-green-600' : 'text-gray-600'}`}>
                                                        {set.player2}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        {isLive && match.gameScore !== '-' && (
                                            <div className="text-center">
                                                <div className="text-xs text-red-500 font-condensed mb-1">Game</div>
                                                <div className="bg-red-50 rounded-lg px-3 py-1">
                                                    <span className="font-bold text-red-600 font-condensed">
                                                        {match.gameScore}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="text-2xl font-bold text-gray-900 font-condensed mb-1">
                                        {match?.date}
                                    </div>
                                    <div className="text-lg text-gray-600 font-condensed">
                                        {match?.time}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Player 2 */}
                        <div className="flex-1 flex flex-col items-center text-center">
                            <div className="w-20 h-20 mb-3 flex items-center justify-center">
                                {match?.player2?.logo ? (
                                    <img
                                        src={match.player2.logo}
                                        alt={match.player2.name}
                                        className="w-full h-full object-contain rounded-full"
                                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                    />
                                ) : null}
                                <div className={`w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full ${match?.player2?.logo ? 'hidden' : 'flex'} items-center justify-center`}>
                                    <span className="text-3xl text-white font-bold">{match?.player2?.name?.[0] || 'P'}</span>
                                </div>
                            </div>
                            <h2 className={`text-lg font-bold font-condensed ${match?.winner === 'Second Player' ? 'text-green-600' : 'text-gray-800'}`}>
                                {match?.player2?.name || 'Player 2'}
                            </h2>
                            {match?.winner === 'Second Player' && (
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

                    {/* Match Info */}
                    <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5 font-condensed">
                            🗓️ {match?.date} • {match?.time}
                        </span>
                        <span className="flex items-center gap-2 font-condensed">
                            🎾 {match?.tournament?.name || 'Tennis'}
                        </span>
                        <span className="font-condensed">
                            {match?.eventType}
                        </span>
                    </div>
                </div>

                {/* Mobile Header */}
                <div className="md:hidden p-4 relative">
                    {/* LIVE Badge */}
                    {isLive && (
                        <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded-md text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                            LIVE
                        </div>
                    )}

                    {/* Favorite & Share */}
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                        <button
                            onClick={() => setIsFavorite(!isFavorite)}
                            className={`p-1.5 rounded-full transition-all ${isFavorite ? 'text-yellow-500' : 'text-gray-400'}`}
                        >
                            <Star className={`w-5 h-5 ${isFavorite ? 'fill-yellow-400' : ''}`} />
                        </button>
                        <button className="p-1.5 text-gray-400">
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-6">
                        {/* Player 1 */}
                        <div className="flex-1 flex flex-col items-center text-center min-w-0">
                            <div className="w-14 h-14 mb-2 flex items-center justify-center">
                                {match?.player1?.logo ? (
                                    <img
                                        src={match.player1.logo}
                                        alt={match.player1.name}
                                        className="w-full h-full object-contain rounded-full"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                ) : (
                                    <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                                        <span className="text-xl text-white font-bold">{match?.player1?.name?.[0] || 'P'}</span>
                                    </div>
                                )}
                            </div>
                            <h2 className={`text-sm font-bold font-condensed line-clamp-2 leading-tight ${match?.winner === 'First Player' ? 'text-green-600' : 'text-gray-800'}`}>
                                {match?.player1?.name || 'Player 1'}
                            </h2>
                        </div>

                        {/* Score */}
                        <div className="flex-shrink-0 flex flex-col items-center px-3">
                            {(isLive || isFinished) && match?.scores?.length > 0 ? (
                                <>
                                    <div className="text-3xl font-bold text-gray-900 font-condensed">
                                        {match?.setsWon?.player1 || 0} - {match?.setsWon?.player2 || 0}
                                    </div>
                                    <div className={`flex items-center gap-1.5 mt-1 ${isLive ? 'text-green-600' : 'text-gray-500'}`}>
                                        {isLive && <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>}
                                        <span className="text-xs font-medium font-condensed">{getStatusText()}</span>
                                    </div>
                                    {/* Set Scores - Mobile */}
                                    <div className="flex items-center gap-1 mt-2">
                                        {match.scores.map((set, idx) => (
                                            <div key={idx} className="bg-gray-100 rounded px-2 py-0.5 text-xs">
                                                <span className={`font-bold ${set.player1 > set.player2 ? 'text-green-600' : 'text-gray-500'}`}>{set.player1}</span>
                                                <span className="text-gray-400">-</span>
                                                <span className={`font-bold ${set.player2 > set.player1 ? 'text-green-600' : 'text-gray-500'}`}>{set.player2}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="text-xl font-bold text-gray-900 font-condensed">
                                        {match?.date}
                                    </div>
                                    <div className="text-base text-gray-600 font-condensed">
                                        {match?.time}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Player 2 */}
                        <div className="flex-1 flex flex-col items-center text-center min-w-0">
                            <div className="w-14 h-14 mb-2 flex items-center justify-center">
                                {match?.player2?.logo ? (
                                    <img
                                        src={match.player2.logo}
                                        alt={match.player2.name}
                                        className="w-full h-full object-contain rounded-full"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                ) : (
                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                                        <span className="text-xl text-white font-bold">{match?.player2?.name?.[0] || 'P'}</span>
                                    </div>
                                )}
                            </div>
                            <h2 className={`text-sm font-bold font-condensed line-clamp-2 leading-tight ${match?.winner === 'Second Player' ? 'text-green-600' : 'text-gray-800'}`}>
                                {match?.player2?.name || 'Player 2'}
                            </h2>
                        </div>
                    </div>

                    {/* Match Info - Mobile */}
                    <div className="flex items-center justify-center gap-3 mt-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1.5 font-condensed">
                            <span>🎾</span>
                            <span>{match?.tournament?.name || 'Tennis'}</span>
                        </div>
                        <span className="text-gray-300">•</span>
                        <span className="font-condensed">{match?.eventType}</span>
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
                        {/* Match Info */}
                        <div className="bg-white rounded-xl shadow-sm p-4">
                            <h3 className="font-semibold text-gray-800 mb-3 font-condensed">Info Pertandingan</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500 font-condensed mb-1">Tournament</p>
                                    <p className="font-semibold text-gray-800 font-condensed text-sm">{match?.tournament?.name}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500 font-condensed mb-1">Round</p>
                                    <p className="font-semibold text-gray-800 font-condensed text-sm">{match?.tournament?.round || '-'}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500 font-condensed mb-1">Kategori</p>
                                    <p className="font-semibold text-gray-800 font-condensed text-sm">{match?.eventType}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500 font-condensed mb-1">Status</p>
                                    <p className={`font-semibold font-condensed text-sm ${match?.isLive ? 'text-red-600' : match?.isFinished ? 'text-gray-600' : 'text-blue-600'}`}>
                                        {match?.isLive ? '🔴 Live' : match?.isFinished ? 'Selesai' : 'Belum Dimulai'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Score Table */}
                        {match?.scores?.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm p-4">
                                <h3 className="font-semibold text-gray-800 mb-3 font-condensed">Skor Per Set</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="text-left py-2 px-3 font-semibold text-gray-600 font-condensed text-sm">Pemain</th>
                                                {match.scores.map((_, idx) => (
                                                    <th key={idx} className="text-center py-2 px-2 font-semibold text-gray-600 font-condensed text-sm w-12">
                                                        S{idx + 1}
                                                    </th>
                                                ))}
                                                {match.isLive && match.gameScore !== '-' && (
                                                    <th className="text-center py-2 px-2 font-semibold text-red-600 font-condensed text-sm w-12">G</th>
                                                )}
                                                <th className="text-center py-2 px-2 font-semibold text-gray-600 font-condensed text-sm w-12">Sets</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b border-gray-100">
                                                <td className="py-2 px-3">
                                                    <div className="flex items-center gap-2">
                                                        {match.player1?.isServing && match.isLive && (
                                                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                        )}
                                                        <span className={`font-condensed text-sm ${match.winner === 'First Player' ? 'font-bold text-green-600' : 'text-gray-800'}`}>
                                                            {match.player1?.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                {match.scores.map((set, idx) => (
                                                    <td key={idx} className="text-center py-2 px-2">
                                                        <span className={`font-bold font-condensed ${set.player1 > set.player2 ? 'text-green-600' : 'text-gray-500'}`}>
                                                            {set.player1}
                                                        </span>
                                                    </td>
                                                ))}
                                                {match.isLive && match.gameScore !== '-' && (
                                                    <td className="text-center py-2 px-2">
                                                        <span className="font-bold text-red-600 font-condensed">{match.gameScore?.split(' - ')[0]}</span>
                                                    </td>
                                                )}
                                                <td className="text-center py-2 px-2">
                                                    <span className="font-bold text-gray-800 font-condensed">{match.setsWon?.player1 || 0}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="py-2 px-3">
                                                    <div className="flex items-center gap-2">
                                                        {match.player2?.isServing && match.isLive && (
                                                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                        )}
                                                        <span className={`font-condensed text-sm ${match.winner === 'Second Player' ? 'font-bold text-green-600' : 'text-gray-800'}`}>
                                                            {match.player2?.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                {match.scores.map((set, idx) => (
                                                    <td key={idx} className="text-center py-2 px-2">
                                                        <span className={`font-bold font-condensed ${set.player2 > set.player1 ? 'text-green-600' : 'text-gray-500'}`}>
                                                            {set.player2}
                                                        </span>
                                                    </td>
                                                ))}
                                                {match.isLive && match.gameScore !== '-' && (
                                                    <td className="text-center py-2 px-2">
                                                        <span className="font-bold text-red-600 font-condensed">{match.gameScore?.split(' - ')[1]}</span>
                                                    </td>
                                                )}
                                                <td className="text-center py-2 px-2">
                                                    <span className="font-bold text-gray-800 font-condensed">{match.setsWon?.player2 || 0}</span>
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
                        ) : h2h?.H2H?.length > 0 ? (
                            <div className="space-y-2">
                                {h2h.H2H.slice(0, 5).map((m, idx) => (
                                    <div key={idx} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                                        <div className="text-xs text-gray-500 font-condensed">{m.event_date}</div>
                                        <div className="font-semibold font-condensed text-sm">{m.event_final_result}</div>
                                        <div className="text-xs text-gray-500 font-condensed truncate max-w-[100px]">{m.tournament_name}</div>
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

            case 'point':
                return (
                    <div className="bg-white rounded-xl shadow-sm p-4">
                        <h3 className="font-semibold text-gray-800 mb-3 font-condensed">Point by Point</h3>
                        {match?.pointByPoint?.length > 0 ? (
                            <div className="space-y-3">
                                {match.pointByPoint.slice(0, 3).map((set, setIdx) => (
                                    <div key={setIdx} className="bg-gray-50 rounded-lg p-3">
                                        <h4 className="font-bold text-gray-800 font-condensed text-sm mb-2">{set.set_number}</h4>
                                        <div className="space-y-1">
                                            {set.points?.slice(0, 5).map((point, pointIdx) => (
                                                <div key={pointIdx} className="flex items-center justify-between text-xs py-1 border-b border-gray-200 last:border-0">
                                                    <span className="text-gray-600 font-condensed">Point {point.number_point}</span>
                                                    <span className="font-semibold font-condensed">{point.score}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500 font-condensed">
                                Data point by point tidak tersedia
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
                            onClick={() => router.push('/tennis')}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            <span className="font-condensed">Kembali ke Tennis</span>
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

                    {/* Match Header */}
                    {renderMatchHeader()}

                    {/* Main Layout - Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4">
                        {/* Left Sidebar - Desktop Only */}
                        <div className="hidden lg:block lg:col-span-4 space-y-4">
                            {/* Tournament Info */}
                            <div className="bg-white rounded-xl shadow-sm p-4">
                                <h3 className="font-semibold text-gray-800 mb-3 font-condensed">🏆 Tournament</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500 font-condensed">Nama</span>
                                        <span className="text-sm font-semibold text-gray-800 font-condensed">{match?.tournament?.name}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500 font-condensed">Round</span>
                                        <span className="text-sm font-semibold text-gray-800 font-condensed">{match?.tournament?.round || '-'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500 font-condensed">Kategori</span>
                                        <span className="text-sm font-semibold text-gray-800 font-condensed">{match?.eventType}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500 font-condensed">Season</span>
                                        <span className="text-sm font-semibold text-gray-800 font-condensed">{match?.tournament?.season}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick H2H - Desktop */}
                            {h2h?.H2H?.length > 0 && (
                                <div className="bg-white rounded-xl shadow-sm p-4">
                                    <h3 className="font-semibold text-gray-800 mb-3 font-condensed">⚔️ Head to Head</h3>
                                    <div className="space-y-2">
                                        {h2h.H2H.slice(0, 3).map((m, idx) => (
                                            <div key={idx} className="bg-gray-50 rounded-lg p-2 text-xs">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500 font-condensed">{m.event_date}</span>
                                                    <span className="font-bold font-condensed">{m.event_final_result}</span>
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
                                        { id: 'point', name: 'Point' },
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
                            </div>

                            {/* Tab Content */}
                            {renderTabContent()}

                            {/* About Match */}
                            <div className="bg-white rounded-xl shadow-sm p-4">
                                <h3 className="font-semibold text-gray-800 mb-3 font-condensed">Tentang pertandingan</h3>
                                <p className="text-sm text-gray-600 leading-relaxed font-condensed">
                                    {match?.player1?.name || 'Player 1'} menghadapi {match?.player2?.name || 'Player 2'} pada{' '}
                                    {match?.date || 'tanggal tersebut'} di turnamen {match?.tournament?.name || 'Tennis'}.
                                    Pertandingan ini merupakan babak {match?.tournament?.round || '-'} dari kategori {match?.eventType || 'Tennis'}.
                                </p>
                            </div>
                        </div>

                        {/* Right Sidebar - Ads (Desktop Only) */}
                        <div className="hidden lg:block lg:col-span-3 space-y-4">
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="bg-gray-100 px-3 py-1 text-xs text-gray-500 font-condensed">Iklan</div>
                                <div className="aspect-[300/250] bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
                                    <div className="text-center text-white p-4">
                                        <p className="text-4xl mb-2">🎾</p>
                                        <p className="text-xl font-bold font-condensed mb-1">Tennis Live</p>
                                        <p className="text-sm font-condensed">Nonton ATP & WTA Gratis!</p>
                                        <button className="mt-3 px-4 py-2 bg-white text-green-600 rounded-lg text-sm font-bold font-condensed hover:bg-green-50 transition-colors">
                                            STREAMING
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="bg-gray-100 px-3 py-1 text-xs text-gray-500 font-condensed">Iklan</div>
                                <div className="aspect-[300/600] bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                                    <div className="text-center text-white p-4">
                                        <p className="text-4xl mb-4">🏆</p>
                                        <p className="text-xl font-bold font-condensed mb-2">Grand Slam</p>
                                        <p className="text-sm font-condensed mb-4">Jangan lewatkan pertandingan seru!</p>
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
