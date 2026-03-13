'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Share2, ChevronLeft, RefreshCw, Loader2, Trophy } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';
import SofaHeader from '@/components/SofaHeader';
import SofaFooter from '@/components/SofaFooter';
import OrbitLoader from '@/components/OrbitLoader';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function MMAFightDetailClient({ fightId }) {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [username, setUsername] = useState('');
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [fight, setFight] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
            try { setIsLoadingAuth(true); const { data: { session } } = await supabase.auth.getSession(); if (session?.user) { setUser(session.user); const { data: p } = await supabase.from('profiles').select('username').eq('email', session.user.email).single(); if (p?.username) setUsername(p.username); } } catch (e) { } finally { setIsLoadingAuth(false); }
        };
        checkAuth();
    }, []);

    const fetchFight = async (isBackground = false) => {
        if (!fightId) return;
        if (!isBackground) setIsLoading(true);
        setError(null);
        try { const res = await fetch(`${API_BASE_URL}/api/mma/fight/${fightId}`); const data = await res.json(); if (data.success && data.fight) { setFight(data.fight); setLastUpdated(new Date()); } else { setError('Fight tidak ditemukan'); } }
        catch (e) { setError('Gagal memuat data fight'); }
        finally { if (!isBackground) setIsLoading(false); }
    };

    useEffect(() => { fetchFight(); }, [fightId]);
    useEffect(() => { if (!fight?.isLive) return; const i = setInterval(() => fetchFight(true), 15000); return () => clearInterval(i); }, [fight?.isLive]);

    const handleAuthRedirect = () => router.push('/auth');
    const fmtDate = (d) => { if (!d) return '-'; return new Date(d).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); };

    if (isLoading) return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><OrbitLoader color="#374151" colorAlt="#1F2937" /></div>;
    if (error || !fight) return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4"><span className="text-3xl">🥊</span></div>
            <h1 className="text-xl font-bold text-gray-800 font-condensed mb-2">{error || 'Fight tidak ditemukan'}</h1>
            <button onClick={() => router.push('/mma')} className="mt-4 px-6 py-2 bg-gray-800 text-white rounded-full font-condensed hover:bg-gray-700 transition-colors">Kembali ke MMA</button>
        </div>
    );

    const isLive = fight.isLive, isFinished = fight.isFinished;

    return (
        <div className="min-h-screen bg-gray-100">
            <SofaHeader user={user} username={username} onAuthRedirect={handleAuthRedirect} />
            <main className="pb-20 lg:pb-8">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={() => router.push('/mma')} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"><ChevronLeft className="w-5 h-5" /><span className="font-condensed">Kembali ke MMA</span></button>
                        <div className="hidden sm:flex items-center gap-2">
                            {lastUpdated && <span className="text-xs text-gray-400 font-condensed">Updated: {lastUpdated.toLocaleTimeString('id-ID')}</span>}
                            <button onClick={() => fetchFight(false)} disabled={isLoading} className="p-1.5 hover:bg-gray-200 rounded-full transition-colors">{isLoading ? <Loader2 className="w-4 h-4 animate-spin text-gray-500" /> : <RefreshCw className="w-4 h-4 text-gray-500" />}</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        <div className="lg:col-span-8">
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
                                <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div><p className="text-white font-bold text-lg font-condensed">{fight.category?.name || 'MMA'}</p><p className="text-gray-300 text-xs font-condensed">{fight.event || fmtDate(fight.date)}</p></div>
                                        {isLive && <span className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold"><span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>LIVE</span>}
                                        {isFinished && <span className="bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg font-condensed">FINISHED</span>}
                                    </div>
                                </div>
                                <div className="p-6 md:p-8">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex-1 text-center">
                                            <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-3 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
                                                {fight.fighter1?.logo ? <img src={fight.fighter1.logo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><span className="text-3xl font-bold text-gray-300">{fight.fighter1?.name?.[0]}</span></div>}
                                            </div>
                                            <h2 className={`text-lg font-bold font-condensed ${isFinished && fight.fighter1?.winner ? 'text-green-600' : 'text-gray-800'}`}>{fight.fighter1?.name || 'TBA'}</h2>
                                            {isFinished && fight.fighter1?.winner && <div className="flex items-center justify-center gap-1 mt-1"><Trophy className="w-4 h-4 text-yellow-500" /><span className="text-xs text-yellow-600 font-condensed font-bold">WINNER</span></div>}
                                        </div>
                                        <div className="flex-shrink-0">
                                            {isLive ? <div className="bg-red-600 text-white px-4 py-3 rounded-xl text-center"><p className="text-sm font-bold">LIVE</p></div>
                                                : isFinished ? <div className="bg-gray-100 text-gray-500 px-4 py-3 rounded-xl text-center"><p className="text-sm font-bold">RESULT</p></div>
                                                    : <div className="bg-gray-100 text-gray-800 px-4 py-3 rounded-xl text-center"><p className="text-2xl font-black font-condensed">VS</p></div>}
                                        </div>
                                        <div className="flex-1 text-center">
                                            <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-3 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
                                                {fight.fighter2?.logo ? <img src={fight.fighter2.logo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><span className="text-3xl font-bold text-gray-300">{fight.fighter2?.name?.[0]}</span></div>}
                                            </div>
                                            <h2 className={`text-lg font-bold font-condensed ${isFinished && fight.fighter2?.winner ? 'text-green-600' : 'text-gray-800'}`}>{fight.fighter2?.name || 'TBA'}</h2>
                                            {isFinished && fight.fighter2?.winner && <div className="flex items-center justify-center gap-1 mt-1"><Trophy className="w-4 h-4 text-yellow-500" /><span className="text-xs text-yellow-600 font-condensed font-bold">WINNER</span></div>}
                                        </div>
                                    </div>
                                    {isFinished && fight.result?.method && <div className="mt-6 text-center bg-gray-50 rounded-xl p-4"><p className="text-gray-800 font-bold font-condensed text-lg">{fight.result.method}</p><p className="text-gray-500 text-sm font-condensed">{fight.result.round ? `Round ${fight.result.round}` : ''}{fight.result.time ? ` • ${fight.result.time}` : ''}</p></div>}
                                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div className="bg-gray-50 rounded-lg p-3 text-center"><p className="text-[10px] text-gray-400 font-condensed mb-1">Promotion</p><p className="text-sm text-gray-800 font-condensed font-semibold">{fight.category?.name || '-'}</p></div>
                                        <div className="bg-gray-50 rounded-lg p-3 text-center"><p className="text-[10px] text-gray-400 font-condensed mb-1">Tanggal</p><p className="text-sm text-gray-800 font-condensed font-semibold">{fight.date?.split('T')[0] || '-'}</p></div>
                                        {fight.weightClass && <div className="bg-gray-50 rounded-lg p-3 text-center"><p className="text-[10px] text-gray-400 font-condensed mb-1">Weight Class</p><p className="text-sm text-gray-800 font-condensed font-semibold">{fight.weightClass}</p></div>}
                                        <div className="bg-gray-50 rounded-lg p-3 text-center"><p className="text-[10px] text-gray-400 font-condensed mb-1">Status</p><p className={`text-sm font-condensed font-semibold ${isLive ? 'text-red-600' : isFinished ? 'text-gray-600' : 'text-blue-600'}`}>{isLive ? '🔴 Live' : isFinished ? 'Selesai' : 'Dijadwalkan'}</p></div>
                                    </div>
                                    <div className="flex items-center justify-center gap-3 mt-6 pt-4 border-t border-gray-100">
                                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors font-condensed text-sm"><Share2 className="w-4 h-4" />Bagikan</button>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4">
                                <h3 className="font-semibold text-gray-800 mb-3 font-condensed">Tentang Fight</h3>
                                <p className="text-sm text-gray-600 leading-relaxed font-condensed">{fight.fighter1?.name || 'Fighter 1'} menghadapi {fight.fighter2?.name || 'Fighter 2'} pada {fmtDate(fight.date)} di {fight.category?.name || 'MMA'}{fight.weightClass ? ` — ${fight.weightClass}` : ''}.</p>
                            </div>
                        </div>
                        <div className="lg:col-span-4 space-y-4">
                            <div className="bg-white rounded-xl shadow-sm p-4">
                                <h3 className="font-bold text-gray-800 mb-3 font-condensed flex items-center gap-2"><Trophy className="w-5 h-5 text-gray-600" />Event Info</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between"><span className="text-sm text-gray-500 font-condensed">Promotion</span><span className="text-sm font-semibold text-gray-800 font-condensed">{fight.category?.name || '-'}</span></div>
                                    {fight.event && <div className="flex justify-between"><span className="text-sm text-gray-500 font-condensed">Event</span><span className="text-sm font-semibold text-gray-800 font-condensed">{fight.event}</span></div>}
                                    {fight.country?.name && <div className="flex justify-between"><span className="text-sm text-gray-500 font-condensed">Negara</span><span className="text-sm font-semibold text-gray-800 font-condensed">{fight.country.name}</span></div>}
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="bg-gray-100 px-3 py-1 text-xs text-gray-500 font-condensed">Iklan</div>
                                <div className="aspect-[300/250] bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                                    <div className="text-center text-white p-4">
                                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2"><span className="text-3xl">🥊</span></div>
                                        <p className="text-xl font-bold font-condensed mb-1">MMA Live</p><p className="text-sm font-condensed">Nonton UFC & MMA!</p>
                                        <button className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold font-condensed hover:bg-red-700 transition-colors">STREAMING</button>
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
