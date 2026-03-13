'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Share2, ChevronLeft, RefreshCw, Loader2, Trophy } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';
import SofaHeader from '@/components/SofaHeader';
import SofaFooter from '@/components/SofaFooter';
import OrbitLoader from '@/components/OrbitLoader';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function VolleyballMatchDetailClient({ gameId }) {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [username, setUsername] = useState('');
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [game, setGame] = useState(null);
    const [h2h, setH2H] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingH2H, setIsLoadingH2H] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [activeTab, setActiveTab] = useState('ringkasan');
    const [isFavorite, setIsFavorite] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
        checkDesktop();
        window.addEventListener('resize', checkDesktop);
        return () => window.removeEventListener('resize', checkDesktop);
    }, []);

    // Auth
    useEffect(() => {
        const checkAuth = async () => {
            try {
                setIsLoadingAuth(true);
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    setUser(session.user);
                    const { data: profile } = await supabase.from('profiles').select('username').eq('email', session.user.email).single();
                    if (profile?.username) setUsername(profile.username);
                }
            } catch (e) { console.error('Auth error:', e); }
            finally { setIsLoadingAuth(false); }
        };
        checkAuth();
    }, []);

    // Fetch game
    const fetchGame = async (isBackground = false) => {
        if (!gameId) return;
        if (!isBackground) setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/api/volleyball/game/${gameId}`);
            const data = await res.json();
            if (data.success && data.game) {
                setGame(data.game);
                setLastUpdated(new Date());
                if (data.game.homeTeam?.id && data.game.awayTeam?.id) fetchH2H(data.game.homeTeam.id, data.game.awayTeam.id);
            } else { setError('Game tidak ditemukan'); }
        } catch (err) { console.error('Fetch error:', err); setError('Gagal memuat data game'); }
        finally { if (!isBackground) setIsLoading(false); }
    };

    useEffect(() => { fetchGame(); }, [gameId]);
    useEffect(() => { if (!game?.isLive) return; const i = setInterval(() => fetchGame(true), 30000); return () => clearInterval(i); }, [game?.isLive]);

    const fetchH2H = async (t1, t2) => {
        setIsLoadingH2H(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/volleyball/h2h?team1=${t1}&team2=${t2}`);
            const data = await res.json();
            if (data.success && data.h2h) setH2H(data.h2h);
        } catch (e) { console.error('H2H error:', e); }
        finally { setIsLoadingH2H(false); }
    };

    useEffect(() => {
        const saved = localStorage.getItem('volleyball_favorites');
        if (saved) { setIsFavorite(JSON.parse(saved).includes(parseInt(gameId))); }
    }, [gameId]);

    const handleAuthRedirect = () => router.push('/auth');
    const handleManualRefresh = () => fetchGame(false);
    const handleToggleFavorite = () => {
        const saved = localStorage.getItem('volleyball_favorites');
        let favs = saved ? JSON.parse(saved) : [];
        favs = isFavorite ? favs.filter(id => id !== parseInt(gameId)) : [...favs, parseInt(gameId)];
        localStorage.setItem('volleyball_favorites', JSON.stringify(favs));
        setIsFavorite(!isFavorite);
    };

    // ============================================================
    // RENDER: GAME HEADER
    // ============================================================
    const renderGameHeader = () => {
        const isLive = game?.isLive;
        const isFinished = game?.isFinished;
        return (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Desktop */}
                <div className="hidden md:block p-6 relative">
                    <div className="bg-gradient-to-r from-cyan-600 to-cyan-500 -mx-6 -mt-6 px-6 py-3 mb-6">
                        <div className="flex items-center gap-2">
                            {game?.league?.logo && <img src={game.league.logo} alt="" className="w-6 h-6 object-contain" />}
                            <span className="text-white font-bold font-condensed text-sm">{game?.league?.name}</span>
                            <span className="text-cyan-100 text-xs font-condensed">{game?.country?.name}</span>
                        </div>
                    </div>
                    {isLive && (
                        <div className="absolute top-16 left-4 flex items-center gap-1.5 bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>LIVE • {game.status}
                        </div>
                    )}
                    <div className="flex items-center justify-between">
                        <div className="flex-1 flex flex-col items-center text-center">
                            <div className="w-20 h-20 mb-3 flex items-center justify-center">
                                {game?.homeTeam?.logo ? (
                                    <img src={game.homeTeam.logo} alt={game.homeTeam.name} className="w-full h-full object-contain" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                ) : null}
                                <div className={`w-20 h-20 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full ${game?.homeTeam?.logo ? 'hidden' : 'flex'} items-center justify-center`}>
                                    <span className="text-3xl text-white font-bold">{game?.homeTeam?.name?.[0] || 'H'}</span>
                                </div>
                            </div>
                            <h2 className={`text-lg font-bold font-condensed ${isFinished && game.homeScore > game.awayScore ? 'text-green-600' : 'text-gray-800'}`}>{game?.homeTeam?.name || 'Home Team'}</h2>
                            {isFinished && game.homeScore > game.awayScore && <div className="flex items-center gap-1 text-yellow-500 mt-1"><Trophy className="w-4 h-4" /><span className="text-xs font-condensed">Pemenang</span></div>}
                        </div>
                        <div className="flex-shrink-0 flex flex-col items-center px-6">
                            {(isLive || isFinished) ? (
                                <><div className="text-5xl font-bold text-gray-900 font-condensed">{game?.homeScore || 0} - {game?.awayScore || 0}</div><div className={`text-sm mt-2 font-condensed ${isLive ? 'text-red-600 font-bold' : 'text-gray-500'}`}>{game.status}</div></>
                            ) : (
                                <><div className="text-2xl font-bold text-gray-900 font-condensed">VS</div><div className="text-lg text-gray-600 font-condensed mt-1">{game?.time?.substring(0, 5)}</div><div className="text-xs text-gray-400 font-condensed">{game?.date?.split('T')[0]}</div></>
                            )}
                        </div>
                        <div className="flex-1 flex flex-col items-center text-center">
                            <div className="w-20 h-20 mb-3 flex items-center justify-center">
                                {game?.awayTeam?.logo ? (
                                    <img src={game.awayTeam.logo} alt={game.awayTeam.name} className="w-full h-full object-contain" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                ) : null}
                                <div className={`w-20 h-20 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full ${game?.awayTeam?.logo ? 'hidden' : 'flex'} items-center justify-center`}>
                                    <span className="text-3xl text-white font-bold">{game?.awayTeam?.name?.[0] || 'A'}</span>
                                </div>
                            </div>
                            <h2 className={`text-lg font-bold font-condensed ${isFinished && game.awayScore > game.homeScore ? 'text-green-600' : 'text-gray-800'}`}>{game?.awayTeam?.name || 'Away Team'}</h2>
                            {isFinished && game.awayScore > game.homeScore && <div className="flex items-center gap-1 text-yellow-500 mt-1"><Trophy className="w-4 h-4" /><span className="text-xs font-condensed">Pemenang</span></div>}
                        </div>
                    </div>
                    <div className="flex items-center justify-center gap-3 mt-4">
                        <button onClick={handleToggleFavorite} className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-condensed transition-colors ${isFavorite ? 'bg-yellow-50 border-yellow-300 text-yellow-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                            <Star className={`w-4 h-4 ${isFavorite ? 'fill-yellow-400 text-yellow-500' : ''}`} />{isFavorite ? 'Favorit' : 'Tambah Favorit'}
                        </button>
                        <button className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 text-gray-500 text-sm font-condensed hover:bg-gray-50"><Share2 className="w-4 h-4" />Bagikan</button>
                    </div>
                </div>
                {/* Mobile */}
                <div className="md:hidden p-4 relative">
                    <div className="bg-gradient-to-r from-cyan-600 to-cyan-500 -mx-4 -mt-4 px-4 py-2.5 mb-4">
                        <div className="flex items-center gap-2">
                            {game?.league?.logo && <img src={game.league.logo} alt="" className="w-5 h-5 object-contain" />}
                            <span className="text-white font-bold font-condensed text-xs">{game?.league?.name}</span>
                            <span className="text-cyan-100 text-[10px] font-condensed">{game?.country?.name}</span>
                        </div>
                    </div>
                    {isLive && <div className="absolute top-12 left-3 flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded text-[10px] font-bold"><span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>LIVE</div>}
                    <div className="absolute top-12 right-2 flex items-center gap-1">
                        <button onClick={handleToggleFavorite} className={`p-1.5 rounded-full ${isFavorite ? 'text-yellow-500' : 'text-gray-400'}`}><Star className={`w-5 h-5 ${isFavorite ? 'fill-yellow-400' : ''}`} /></button>
                        <button className="p-1.5 text-gray-400"><Share2 className="w-5 h-5" /></button>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-6">
                        <div className="flex-1 flex flex-col items-center text-center min-w-0">
                            {game?.homeTeam?.logo ? <img src={game.homeTeam.logo} alt="" className="w-14 h-14 object-contain mb-2" onError={(e) => { e.target.style.display = 'none'; }} /> : <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center mb-2"><span className="text-xl text-white font-bold">{game?.homeTeam?.name?.[0] || 'H'}</span></div>}
                            <h2 className={`text-sm font-bold font-condensed line-clamp-2 ${isFinished && game.homeScore > game.awayScore ? 'text-green-600' : 'text-gray-800'}`}>{game?.homeTeam?.name}</h2>
                        </div>
                        <div className="flex-shrink-0 flex flex-col items-center px-3">
                            {(isLive || isFinished) ? <><div className="text-3xl font-bold text-gray-900 font-condensed">{game?.homeScore || 0} - {game?.awayScore || 0}</div><div className={`text-xs mt-1 ${isLive ? 'text-red-600' : 'text-gray-500'}`}>{game.status}</div></> : <><div className="text-xl font-bold text-gray-900 font-condensed">{game?.date?.split('T')[0]}</div><div className="text-base text-gray-600 font-condensed">{game?.time?.substring(0, 5)}</div></>}
                        </div>
                        <div className="flex-1 flex flex-col items-center text-center min-w-0">
                            {game?.awayTeam?.logo ? <img src={game.awayTeam.logo} alt="" className="w-14 h-14 object-contain mb-2" onError={(e) => { e.target.style.display = 'none'; }} /> : <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center mb-2"><span className="text-xl text-white font-bold">{game?.awayTeam?.name?.[0] || 'A'}</span></div>}
                            <h2 className={`text-sm font-bold font-condensed line-clamp-2 ${isFinished && game.awayScore > game.homeScore ? 'text-green-600' : 'text-gray-800'}`}>{game?.awayTeam?.name}</h2>
                        </div>
                    </div>
                    <div className="flex items-center justify-center gap-3 mt-3 text-xs text-gray-500"><span className="font-condensed">{game?.league?.name}</span></div>
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
                                <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500 font-condensed mb-1">Liga</p><p className="font-semibold text-gray-800 font-condensed text-sm">{game?.league?.name}</p></div>
                                <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500 font-condensed mb-1">Season</p><p className="font-semibold text-gray-800 font-condensed text-sm">{game?.league?.season || '-'}</p></div>
                                <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500 font-condensed mb-1">Negara</p><p className="font-semibold text-gray-800 font-condensed text-sm">{game?.country?.name || '-'}</p></div>
                                <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500 font-condensed mb-1">Status</p><p className={`font-semibold font-condensed text-sm ${game?.isLive ? 'text-red-600' : game?.isFinished ? 'text-gray-600' : 'text-blue-600'}`}>{game?.isLive ? '🔴 Live' : game?.isFinished ? 'Selesai' : 'Belum Dimulai'}</p></div>
                            </div>
                        </div>
                        {/* Set Scores */}
                        {(game?.isLive || game?.isFinished) && game?.sets && (
                            <div className="bg-white rounded-xl shadow-sm p-4">
                                <h3 className="font-semibold text-gray-800 mb-3 font-condensed">Skor Per Set</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead><tr className="border-b border-gray-200">
                                            <th className="text-left py-2 px-3 font-semibold text-gray-600 font-condensed text-sm">Tim</th>
                                            {(game.sets?.home || game.sets?.away || []).map((_, i) => <th key={i} className="text-center py-2 px-2 font-semibold text-gray-600 font-condensed text-sm w-12">Set {i + 1}</th>)}
                                            <th className="text-center py-2 px-2 font-semibold text-gray-800 font-condensed text-sm w-14">Total</th>
                                        </tr></thead>
                                        <tbody>
                                            <tr className="border-b border-gray-100">
                                                <td className="py-2 px-3"><div className="flex items-center gap-2">{game.homeTeam?.logo && <img src={game.homeTeam.logo} alt="" className="w-5 h-5 object-contain" />}<span className="font-condensed text-sm text-gray-800">{game.homeTeam?.name}</span></div></td>
                                                {(game.sets?.home || []).map((s, i) => <td key={i} className="text-center py-2 px-2"><span className={`font-bold font-condensed ${s > (game.sets?.away?.[i] || 0) ? 'text-cyan-600' : 'text-gray-500'}`}>{s ?? '-'}</span></td>)}
                                                <td className="text-center py-2 px-2"><span className="font-bold font-condensed text-gray-800">{game.homeScore}</span></td>
                                            </tr>
                                            <tr>
                                                <td className="py-2 px-3"><div className="flex items-center gap-2">{game.awayTeam?.logo && <img src={game.awayTeam.logo} alt="" className="w-5 h-5 object-contain" />}<span className="font-condensed text-sm text-gray-800">{game.awayTeam?.name}</span></div></td>
                                                {(game.sets?.away || []).map((s, i) => <td key={i} className="text-center py-2 px-2"><span className={`font-bold font-condensed ${s > (game.sets?.home?.[i] || 0) ? 'text-cyan-600' : 'text-gray-500'}`}>{s ?? '-'}</span></td>)}
                                                <td className="text-center py-2 px-2"><span className="font-bold font-condensed text-gray-800">{game.awayScore}</span></td>
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
                        {isLoadingH2H ? <div className="flex items-center justify-center py-8"><OrbitLoader color="#06B6D4" colorAlt="#0891B2" /></div>
                            : h2h?.length > 0 ? (
                                <div className="space-y-2">
                                    {h2h.slice(0, 5).map((g, i) => (
                                        <div key={i} className="bg-gray-50 rounded-lg p-3">
                                            <div className="flex items-center justify-between mb-1"><span className="text-xs text-gray-500 font-condensed">{g.date?.split('T')[0]}</span><span className="text-xs text-gray-500 font-condensed">{g.league?.name}</span></div>
                                            <div className="flex items-center justify-between"><span className="font-condensed text-sm">{g.homeTeam?.name}</span><span className="font-bold font-condensed">{g.homeScore} - {g.awayScore}</span><span className="font-condensed text-sm">{g.awayTeam?.name}</span></div>
                                        </div>
                                    ))}
                                </div>
                            ) : <div className="text-center py-8 text-gray-500 font-condensed">Belum ada data head to head</div>}
                    </div>
                );
            default: return null;
        }
    };

    // ============================================================
    // MAIN RENDER
    // ============================================================
    if (isLoading) return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><OrbitLoader color="#06B6D4" colorAlt="#0891B2" /></div>;

    if (error || !game) return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4"><span className="text-3xl">🏐</span></div>
            <h1 className="text-xl font-bold text-gray-800 font-condensed mb-2">{error || 'Game tidak ditemukan'}</h1>
            <button onClick={() => router.push('/volleyball')} className="mt-4 px-6 py-2 bg-cyan-500 text-white rounded-full font-condensed hover:bg-cyan-600 transition-colors">Kembali ke Volleyball</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100">
            <SofaHeader user={user} username={username} onAuthRedirect={handleAuthRedirect} />
            <main className="pb-20 lg:pb-8">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={() => router.push('/volleyball')} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"><ChevronLeft className="w-5 h-5" /><span className="font-condensed">Kembali ke Volleyball</span></button>
                        <div className="hidden sm:flex items-center gap-2">
                            {lastUpdated && <span className="text-xs text-gray-400 font-condensed">Updated: {lastUpdated.toLocaleTimeString('id-ID')}</span>}
                            <button onClick={handleManualRefresh} disabled={isLoading} className="p-1.5 hover:bg-gray-200 rounded-full transition-colors" title="Refresh">{isLoading ? <Loader2 className="w-4 h-4 animate-spin text-gray-500" /> : <RefreshCw className="w-4 h-4 text-gray-500" />}</button>
                        </div>
                    </div>
                    {renderGameHeader()}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4">
                        <div className="hidden lg:block lg:col-span-4 space-y-4">
                            <div className="bg-white rounded-xl shadow-sm p-4">
                                <h3 className="font-semibold text-gray-800 mb-3 font-condensed flex items-center gap-2"><Trophy className="w-5 h-5 text-cyan-500" />Liga</h3>
                                <div className="flex items-center gap-3">{game?.league?.logo && <img src={game.league.logo} alt="" className="w-12 h-12 object-contain" />}<div><p className="font-semibold text-gray-800 font-condensed">{game?.league?.name}</p><p className="text-sm text-gray-500 font-condensed">{game?.country?.name} • {game?.league?.season}</p></div></div>
                            </div>
                            {h2h?.length > 0 && (
                                <div className="bg-white rounded-xl shadow-sm p-4">
                                    <h3 className="font-semibold text-gray-800 mb-3 font-condensed">⚔️ Head to Head</h3>
                                    <div className="space-y-2">{h2h.slice(0, 3).map((g, i) => <div key={i} className="bg-gray-50 rounded-lg p-2 text-xs"><div className="flex justify-between"><span className="text-gray-500 font-condensed">{g.date?.split('T')[0]}</span><span className="font-bold font-condensed">{g.homeScore} - {g.awayScore}</span></div></div>)}</div>
                                </div>
                            )}
                        </div>
                        <div className="lg:col-span-5 space-y-4">
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="flex border-b border-gray-200">
                                    {[{ id: 'ringkasan', name: 'Ringkasan' }, { id: 'h2h', name: 'H2H' }].map(tab => (
                                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-3 text-sm font-semibold font-condensed transition-colors ${activeTab === tab.id ? 'text-cyan-600 border-b-2 border-cyan-500 bg-cyan-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>{tab.name}</button>
                                    ))}
                                </div>
                            </div>
                            {renderTabContent()}
                            <div className="bg-white rounded-xl shadow-sm p-4">
                                <h3 className="font-semibold text-gray-800 mb-3 font-condensed">Tentang pertandingan</h3>
                                <p className="text-sm text-gray-600 leading-relaxed font-condensed">{game?.homeTeam?.name || 'Home'} menghadapi {game?.awayTeam?.name || 'Away'} pada {game?.date?.split('T')[0] || '-'} di kompetisi {game?.league?.name || 'Volleyball'}.</p>
                            </div>
                        </div>
                        <div className="hidden lg:block lg:col-span-3 space-y-4">
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="bg-gray-100 px-3 py-1 text-xs text-gray-500 font-condensed">Iklan</div>
                                <div className="aspect-[300/250] bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center">
                                    <div className="text-center text-white p-4">
                                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2"><span className="text-3xl">🏐</span></div>
                                        <p className="text-xl font-bold font-condensed mb-1">Volleyball Live</p>
                                        <p className="text-sm font-condensed">Nonton CEV & SuperLega!</p>
                                        <button className="mt-3 px-4 py-2 bg-white text-cyan-600 rounded-lg text-sm font-bold font-condensed hover:bg-cyan-50 transition-colors">STREAMING</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <SofaFooter />
        </div>
    );
}
