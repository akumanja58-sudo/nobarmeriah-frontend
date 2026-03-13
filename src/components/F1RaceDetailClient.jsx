'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Flag, MapPin, Calendar, Clock, Trophy, Loader2, Share2, ChevronLeft, RefreshCw } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';
import SofaHeader from '@/components/SofaHeader';
import SofaFooter from '@/components/SofaFooter';
import OrbitLoader from '@/components/OrbitLoader';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function F1RaceDetailClient({ raceId }) {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [username, setUsername] = useState('');
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [race, setRace] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

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

    // Fetch
    const fetchRace = async (isBackground = false) => {
        if (!raceId) return;
        if (!isBackground) setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/api/formula1/race/${raceId}`);
            const data = await res.json();
            if (data.success && data.race) { setRace(data.race); setLastUpdated(new Date()); }
            else { setError('Race tidak ditemukan'); }
        } catch (err) { console.error('Fetch error:', err); setError('Gagal memuat data race'); }
        finally { if (!isBackground) setIsLoading(false); }
    };

    useEffect(() => { fetchRace(); }, [raceId]);

    // Countdown
    useEffect(() => {
        if (!race?.date) return;
        const raceDate = new Date(race.date);
        if (raceDate <= new Date()) return;

        const updateCountdown = () => {
            const now = new Date();
            const diff = raceDate - now;
            if (diff <= 0) { setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return; }
            setCountdown({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((diff % (1000 * 60)) / 1000)
            });
        };
        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [race?.date]);

    const handleAuthRedirect = () => router.push('/auth');
    const handleManualRefresh = () => fetchRace(false);
    const formatDate = (dateStr) => { if (!dateStr) return '-'; return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }); };

    const handleShare = async () => {
        if (navigator.share) {
            try { await navigator.share({ title: race?.competition?.name || 'F1 Race', url: window.location.href }); } catch (e) { }
        }
    };

    // Loading
    if (isLoading) return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><OrbitLoader color="#DC2626" colorAlt="#991B1B" /></div>;

    // Error
    if (error || !race) return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4"><span className="text-3xl">🏎️</span></div>
            <h1 className="text-xl font-bold text-gray-800 font-condensed mb-2">{error || 'Race tidak ditemukan'}</h1>
            <button onClick={() => router.push('/formula1')} className="mt-4 px-6 py-2 bg-red-600 text-white rounded-full font-condensed hover:bg-red-700 transition-colors">Kembali ke Formula 1</button>
        </div>
    );

    const isUpcoming = race.status === 'upcoming' || new Date(race.date) > new Date();

    return (
        <div className="min-h-screen bg-gray-100">
            <SofaHeader user={user} username={username} onAuthRedirect={handleAuthRedirect} />
            <main className="pb-20 lg:pb-8">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    {/* Breadcrumb */}
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={() => router.push('/formula1')} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"><ChevronLeft className="w-5 h-5" /><span className="font-condensed">Kembali ke Formula 1</span></button>
                        <div className="hidden sm:flex items-center gap-2">
                            {lastUpdated && <span className="text-xs text-gray-400 font-condensed">Updated: {lastUpdated.toLocaleTimeString('id-ID')}</span>}
                            <button onClick={handleManualRefresh} disabled={isLoading} className="p-1.5 hover:bg-gray-200 rounded-full transition-colors">{isLoading ? <Loader2 className="w-4 h-4 animate-spin text-gray-500" /> : <RefreshCw className="w-4 h-4 text-gray-500" />}</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        {/* Main Content */}
                        <div className="lg:col-span-8">
                            {/* Race Header */}
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
                                <div className="bg-gradient-to-r from-red-700 to-red-600 px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Flag className="w-6 h-6 text-white" />
                                            <div>
                                                <p className="text-white font-bold text-xl font-condensed">{race.competition?.name || 'Grand Prix'}</p>
                                                <p className="text-red-200 text-sm font-condensed">Season {race.season || new Date().getFullYear()}</p>
                                            </div>
                                        </div>
                                        {isUpcoming && <span className="bg-white text-red-600 text-xs font-bold px-3 py-1 rounded-full font-condensed">UPCOMING</span>}
                                        {race.status === 'completed' && <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full font-condensed">COMPLETED</span>}
                                    </div>
                                </div>
                                <div className="p-6">
                                    {/* Circuit Image */}
                                    {race.circuit?.image && (
                                        <div className="mb-6"><img src={race.circuit.image} alt={race.circuit.name} className="w-full h-48 object-contain bg-gray-50 rounded-lg" onError={(e) => { e.target.style.display = 'none'; }} /></div>
                                    )}

                                    {/* Race Info Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                            <MapPin className="w-5 h-5 text-red-500" />
                                            <div><p className="text-xs text-gray-500 font-condensed">Circuit</p><p className="font-semibold text-gray-800 font-condensed">{race.circuit?.name || '-'}</p></div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                            <Calendar className="w-5 h-5 text-red-500" />
                                            <div><p className="text-xs text-gray-500 font-condensed">Tanggal</p><p className="font-semibold text-gray-800 font-condensed">{formatDate(race.date)}</p></div>
                                        </div>
                                        {race.competition?.location && (
                                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                <Flag className="w-5 h-5 text-red-500" />
                                                <div><p className="text-xs text-gray-500 font-condensed">Lokasi</p><p className="font-semibold text-gray-800 font-condensed">{race.competition.location.city}, {race.competition.location.country}</p></div>
                                            </div>
                                        )}
                                        {race.laps?.total && (
                                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                <Trophy className="w-5 h-5 text-red-500" />
                                                <div><p className="text-xs text-gray-500 font-condensed">Total Laps</p><p className="font-semibold text-gray-800 font-condensed">{race.laps.total} laps</p></div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Countdown */}
                                    {isUpcoming && (
                                        <div className="mb-6">
                                            <h3 className="font-bold text-gray-800 mb-3 font-condensed">Countdown to Race</h3>
                                            <div className="grid grid-cols-4 gap-3">
                                                {[{ val: countdown.days, label: 'HARI' }, { val: countdown.hours, label: 'JAM' }, { val: countdown.minutes, label: 'MENIT' }, { val: countdown.seconds, label: 'DETIK' }].map(c => (
                                                    <div key={c.label} className="bg-red-50 rounded-lg p-4 text-center">
                                                        <p className="text-3xl font-bold text-red-600 font-condensed">{c.val}</p>
                                                        <p className="text-xs text-gray-500 font-condensed">{c.label}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Fastest Lap */}
                                    {race.fastestLap?.driver && (
                                        <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
                                            <h3 className="font-bold text-gray-800 mb-2 font-condensed flex items-center gap-2"><Clock className="w-4 h-4 text-yellow-600" />Fastest Lap</h3>
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-gray-800 font-condensed">{race.fastestLap.driver.name}</span>
                                                <span className="font-bold text-yellow-600 font-condensed">{race.fastestLap.time}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center justify-center gap-4 pt-4 border-t border-gray-100">
                                        <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors font-condensed"><Share2 className="w-4 h-4" />Bagikan</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-4 space-y-4">
                            <div className="bg-white rounded-xl shadow-sm p-4">
                                <h3 className="font-bold text-gray-800 mb-3 font-condensed flex items-center gap-2"><MapPin className="w-5 h-5 text-red-500" />Circuit Info</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between"><span className="text-sm text-gray-500 font-condensed">Nama</span><span className="text-sm font-semibold text-gray-800 font-condensed">{race.circuit?.name || '-'}</span></div>
                                    {race.distance && <div className="flex justify-between"><span className="text-sm text-gray-500 font-condensed">Race Distance</span><span className="text-sm font-semibold text-gray-800 font-condensed">{race.distance}</span></div>}
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="bg-gray-100 px-3 py-1 text-xs text-gray-500 font-condensed">Iklan</div>
                                <div className="aspect-[300/250] bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center">
                                    <div className="text-center text-white p-4">
                                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2"><span className="text-3xl">🏎️</span></div>
                                        <p className="text-xl font-bold font-condensed mb-1">F1 Live</p>
                                        <p className="text-sm font-condensed">Nonton Race Live!</p>
                                        <button className="mt-3 px-4 py-2 bg-white text-red-700 rounded-lg text-sm font-bold font-condensed hover:bg-red-50 transition-colors">STREAMING</button>
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
