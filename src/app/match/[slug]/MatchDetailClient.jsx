'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';

// Hooks
import { useMatchDetail } from '@/hooks/useLivescore';

// Components
import SofaHeader from '@/components/SofaHeader';
import SofaFooter from '@/components/SofaFooter';
import MatchHeader from '@/components/match-detail/MatchHeader';
import MatchTabs from '@/components/match-detail/MatchTabs';
import MatchEvents from '@/components/match-detail/MatchEvents';
import MatchLineup from '@/components/match-detail/MatchLineup';
import MatchStats from '@/components/match-detail/MatchStats';
import MatchH2H from '@/components/match-detail/MatchH2H';
import MatchStandings from '@/components/match-detail/MatchStandings';
import MatchInfo from '@/components/match-detail/MatchInfo';
import MatchOdds from '@/components/match-detail/MatchOdds';
import MatchVote from '@/components/match-detail/MatchVote';
import MatchPreStandings from '@/components/match-detail/MatchPreStandings';
import MatchPrediction from '@/components/match-detail/MatchPrediction';
import MatchTeamStats from '@/components/match-detail/MatchTeamStats';

import { RefreshCw, Loader2 } from 'lucide-react';

export default function MatchDetailClient({ matchSlug, matchId }) {
    const router = useRouter();

    // Auth State
    const [user, setUser] = useState(null);
    const [username, setUsername] = useState('');
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);

    // ============================================================
    // DETECT DEVICE - Desktop vs Mobile
    // ============================================================
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        // Check if desktop on mount
        const checkDesktop = () => {
            setIsDesktop(window.innerWidth >= 1024); // lg breakpoint
        };

        checkDesktop();
        window.addEventListener('resize', checkDesktop);
        return () => window.removeEventListener('resize', checkDesktop);
    }, []);

    // UI State - Default 'lineup' untuk desktop, 'rincian' untuk mobile
    const [activeTab, setActiveTab] = useState('rincian'); // Will be updated by useEffect
    const [showProfile, setShowProfile] = useState(false);

    // Set default tab based on device
    useEffect(() => {
        if (isDesktop) {
            setActiveTab('lineup');
        } else {
            setActiveTab('rincian');
        }
    }, [isDesktop]);

    // ============================================================
    // USE MATCH DETAIL HOOK - Clean data fetching!
    // ============================================================
    const {
        match,
        statistics,
        events,
        lineups,
        loading: isLoadingMatch,
        error,
        lastUpdated,
        refresh
    } = useMatchDetail(matchId, {
        includeStats: true,
        includeEvents: true,
        includeLineups: true,
        refreshInterval: 0 // No auto refresh by default
    });

    // Check if match is live or finished
    const isLive = ['1H', '2H', 'HT', 'LIVE', 'ET', 'BT', 'P'].includes(
        (match?.status_short || match?.status || '').toUpperCase()
    ) || match?.is_live;

    const isFinished = ['FT', 'AET', 'PEN'].includes(
        (match?.status_short || match?.status || '').toUpperCase()
    );

    // ============================================================
    // AUTO REFRESH FOR LIVE MATCHES ONLY
    // ============================================================
    useEffect(() => {
        if (!isLive) return;

        // Auto refresh setiap 30 detik HANYA untuk live match
        const interval = setInterval(() => {
            console.log('🔄 Auto-refreshing live match...');
            refresh(true); // Background refresh
        }, 30000);

        return () => clearInterval(interval);
    }, [isLive, refresh]);

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
    // HANDLERS
    // ============================================================
    const handleAuthRedirect = () => {
        router.push('/auth');
    };

    const handleManualRefresh = () => {
        refresh(false); // Show loading state
    };

    // ============================================================
    // RENDER TAB CONTENT
    // ============================================================
    const renderTabContent = () => {
        switch (activeTab) {
            case 'rincian':
                // Tab Rincian - isinya sidebar content (Mobile Only)
                // Di Desktop, tab ini disembunyikan karena sidebar kiri sudah ada
                return (
                    <div className="space-y-4">
                        {/* 1. Odds dari API-Football */}
                        <MatchOdds match={match} />

                        {/* 2. Prediksi Voting */}
                        <MatchVote
                            match={match}
                            user={user}
                            isFinished={isFinished}
                        />

                        {/* 3. Klasemen Pra-Pertandingan */}
                        <MatchPreStandings
                            leagueId={match?.league_id}
                            homeTeamId={match?.home_team_id}
                            awayTeamId={match?.away_team_id}
                            homeTeam={match?.home_team_name || match?.home_team}
                            awayTeam={match?.away_team_name || match?.away_team}
                            homeTeamLogo={match?.home_team_logo}
                            awayTeamLogo={match?.away_team_logo}
                            season={match?.league_season || match?.season || (new Date().getMonth() + 1 < 8 ? new Date().getFullYear() - 1 : new Date().getFullYear())}
                        />

                        {/* 4. Match Info */}
                        <MatchInfo match={match} />
                    </div>
                );
            case 'lineup':
                return (
                    <MatchLineup
                        lineups={lineups}
                        homeTeam={match?.home_team_name || match?.home_team}
                        awayTeam={match?.away_team_name || match?.away_team}
                        homeTeamLogo={match?.home_team_logo}
                        awayTeamLogo={match?.away_team_logo}
                    />
                );
            case 'statistik':
                return (
                    <div className="space-y-4">
                        {/* Prediksi Pertandingan */}
                        <MatchPrediction match={match} />

                        {/* Statistik Musim */}
                        <MatchTeamStats match={match} />

                        {/* Statistik Match - HANYA tampil kalau match sudah live atau selesai */}
                        {(isLive || isFinished) && (
                            <MatchStats
                                statistics={statistics}
                                homeTeam={match?.home_team_name || match?.home_team}
                                awayTeam={match?.away_team_name || match?.away_team}
                            />
                        )}
                    </div>
                );
            case 'h2h':
                return (
                    <MatchH2H
                        homeTeamId={match?.home_team_id}
                        awayTeamId={match?.away_team_id}
                        homeTeam={match?.home_team_name || match?.home_team}
                        awayTeam={match?.away_team_name || match?.away_team}
                        homeTeamLogo={match?.home_team_logo}
                        awayTeamLogo={match?.away_team_logo}
                    />
                );
            case 'klasemen':
                return (
                    <MatchStandings
                        leagueId={match?.league_id}
                        homeTeamId={match?.home_team_id}
                        awayTeamId={match?.away_team_id}
                        season={match?.league_season || match?.season || (new Date().getMonth() + 1 < 8 ? new Date().getFullYear() - 1 : new Date().getFullYear())}
                    />
                );
            case 'media':
                return (
                    <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                        <span className="text-4xl mb-3 block">📺</span>
                        <p className="text-gray-500 font-condensed">Media belum tersedia</p>
                        <p className="text-xs text-gray-400 mt-1 font-condensed">
                            Highlights akan muncul setelah pertandingan selesai
                        </p>
                    </div>
                );
            default:
                return null;
        }
    };

    // ============================================================
    // LOADING STATE
    // ============================================================
    if (isLoadingMatch && !match) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600 font-condensed">Memuat data pertandingan...</p>
                </div>
            </div>
        );
    }

    // ============================================================
    // ERROR STATE
    // ============================================================
    if (error || !match) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col">
                <SofaHeader
                    user={user}
                    username={username}
                    onAuthRedirect={handleAuthRedirect}
                    onShowProfile={() => setShowProfile(true)}
                />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <span className="text-6xl mb-4 block">🥺</span>
                        <h2 className="text-xl font-bold text-gray-800 mb-2 font-condensed">
                            Pertandingan tidak ditemukan
                        </h2>
                        <p className="text-gray-500 mb-4 font-condensed">Match ID: {matchId}</p>
                        <button
                            onClick={() => router.push('/')}
                            className="px-6 py-2 bg-green-500 text-white rounded-lg font-condensed hover:bg-green-600 transition-colors"
                        >
                            Kembali ke Beranda
                        </button>
                    </div>
                </main>
                <SofaFooter />
            </div>
        );
    }

    // ============================================================
    // MAIN RENDER
    // ============================================================
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* Header */}
            <SofaHeader
                user={user}
                username={username}
                onAuthRedirect={handleAuthRedirect}
                onShowProfile={() => setShowProfile(true)}
            />

            {/* Main Content */}
            <main className="flex-1">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    {/* Match Header with Refresh Button */}
                    <div className="relative">
                        <MatchHeader match={match} isLive={isLive} isFinished={isFinished} />

                        {/* Refresh Button & Last Updated */}
                        <div className="absolute top-2 right-2 flex items-center gap-2">
                            {lastUpdated && (
                                <span className="text-xs text-gray-400 font-condensed hidden sm:block">
                                    Updated: {lastUpdated.toLocaleTimeString('id-ID')}
                                </span>
                            )}
                            <button
                                onClick={handleManualRefresh}
                                disabled={isLoadingMatch}
                                className="p-2 bg-white/80 hover:bg-white rounded-full shadow-sm transition-colors"
                                title="Refresh data"
                            >
                                {isLoadingMatch ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                                ) : (
                                    <RefreshCw className="w-4 h-4 text-gray-600" />
                                )}
                            </button>
                        </div>

                        {/* Live indicator */}
                        {isLive && (
                            <div className="absolute top-2 left-2 flex items-center gap-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                LIVE
                            </div>
                        )}
                    </div>

                    {/* Main Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4">

                        {/* ============================================================ */}
                        {/* LEFT COLUMN - SIDEBAR (Desktop Only) */}
                        {/* ============================================================ */}
                        <div className="hidden lg:block lg:col-span-3 space-y-4">
                            {/* 1. Odds dari API-Football */}
                            <MatchOdds match={match} />

                            {/* 2. Prediksi Voting */}
                            <MatchVote
                                match={match}
                                user={user}
                                isFinished={isFinished}
                            />

                            {/* 3. Klasemen Pra-Pertandingan */}
                            <MatchPreStandings
                                leagueId={match?.league_id}
                                homeTeamId={match?.home_team_id}
                                awayTeamId={match?.away_team_id}
                                homeTeam={match?.home_team_name || match?.home_team}
                                awayTeam={match?.away_team_name || match?.away_team}
                                homeTeamLogo={match?.home_team_logo}
                                awayTeamLogo={match?.away_team_logo}
                                season={match?.league_season || match?.season || (new Date().getMonth() + 1 < 8 ? new Date().getFullYear() - 1 : new Date().getFullYear())}
                            />

                            {/* 4. Match Info (Tanggal, Venue, Wasit, dll) */}
                            <MatchInfo match={match} />
                        </div>

                        {/* ============================================================ */}
                        {/* CENTER COLUMN - MAIN CONTENT */}
                        {/* ============================================================ */}
                        <div className="lg:col-span-6 space-y-4">
                            {/* Tabs */}
                            <MatchTabs
                                activeTab={activeTab}
                                onTabChange={setActiveTab}
                                isLive={isLive}
                            />

                            {/* Tab Content */}
                            {renderTabContent()}

                            {/* Match Events (always visible) */}
                            <MatchEvents
                                events={events}
                                homeTeam={match?.home_team_name || match?.home_team}
                                awayTeam={match?.away_team_name || match?.away_team}
                                homeTeamId={match?.home_team_id}
                                awayTeamId={match?.away_team_id}
                            />

                            {/* About Match */}
                            <div className="bg-white rounded-xl shadow-sm p-4">
                                <h3 className="font-semibold text-gray-800 mb-3 font-condensed">Tentang pertandingan</h3>
                                <p className="text-sm text-gray-600 leading-relaxed font-condensed">
                                    {match?.home_team_name || 'Home'} menghadapi {match?.away_team_name || 'Away'} pada{' '}
                                    {match?.date ? new Date(match.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'tanggal tersebut'}{' '}
                                    di {match?.venue || 'Stadion'}. Pertandingan ini bagian dari {match?.league_name || match?.league || 'kompetisi'}.
                                </p>
                                <button className="text-sm text-green-600 font-medium mt-2 font-condensed hover:underline">
                                    Selengkapnya ▼
                                </button>
                            </div>
                        </div>

                        {/* ============================================================ */}
                        {/* RIGHT COLUMN - ADS SIDEBAR (Desktop Only) */}
                        {/* ============================================================ */}
                        <div className="hidden lg:block lg:col-span-3 space-y-4">
                            {/* Ad Slot 1 */}
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="bg-gray-100 px-3 py-1 text-xs text-gray-500 font-condensed">Iklan</div>
                                <div className="aspect-[300/250] bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
                                    <div className="text-center text-white p-4">
                                        <p className="text-2xl font-bold font-condensed mb-2">NobarMeriah</p>
                                        <p className="text-sm font-condensed">Streaming Gratis!</p>
                                        <button className="mt-3 px-4 py-2 bg-white text-green-600 rounded-lg text-sm font-bold font-condensed hover:bg-green-50 transition-colors">
                                            NONTON SEKARANG
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Ad Slot 2 */}
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="bg-gray-100 px-3 py-1 text-xs text-gray-500 font-condensed">Iklan</div>
                                <div className="aspect-[300/600] bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center">
                                    <div className="text-center text-white p-4">
                                        <p className="text-4xl mb-4">🎯</p>
                                        <p className="text-xl font-bold font-condensed mb-2">Tebak Skor</p>
                                        <p className="text-sm font-condensed mb-4">Dapatkan poin dan tukar dengan hadiah!</p>
                                        <button
                                            onClick={() => router.push('/reward-shop')}
                                            className="px-4 py-2 bg-white text-purple-600 rounded-lg text-sm font-bold font-condensed hover:bg-purple-50 transition-colors"
                                        >
                                            IKUT SEKARANG
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
