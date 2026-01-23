'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/utils/supabaseClient';
import {
    RANK_TIERS,
    getRankFromExp,
    getNextRank,
    getRankProgress
} from '@/utils/experienceSystem';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

// ============================================================
// FETCH MATCHES FROM BACKEND API
// ============================================================
const fetchMatchesFromBackend = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/matches`);
        if (!response.ok) throw new Error('Failed to fetch matches');

        const data = await response.json();
        if (!data.success || !data.matches) {
            return { hotMatches: [], allMatches: [] };
        }

        const allMatches = data.matches;
        const finishedStatuses = ['FT', 'AET', 'PEN', 'CANC', 'PST', 'ABD'];

        const activeMatches = allMatches.filter(match => {
            const status = (match.status_short || match.status || '').toUpperCase();
            return !finishedStatuses.includes(status);
        });

        const sortedMatches = activeMatches.sort((a, b) => {
            const aLive = ['1H', '2H', 'HT'].includes(a.status_short) || a.is_live;
            const bLive = ['1H', '2H', 'HT'].includes(b.status_short) || b.is_live;
            if (aLive && !bLive) return -1;
            if (!aLive && bLive) return 1;
            return new Date(a.date || 0) - new Date(b.date || 0);
        });

        const hotMatches = sortedMatches.filter(match => {
            const league = match.league_name || match.league || '';
            return league.includes('Champions League') ||
                league.includes('Premier League') ||
                league.includes('La Liga') ||
                league.includes('Serie A') ||
                league.includes('Bundesliga') ||
                league.includes('Liga 1');
        }).slice(0, 5);

        return { hotMatches, allMatches: sortedMatches };
    } catch (error) {
        console.error('Error fetching matches:', error);
        return { hotMatches: [], allMatches: [] };
    }
};

// ============================================================
// LEADERBOARD COMPONENT (INLINE)
// ============================================================
const LeaderboardSection = ({ currentUserEmail }) => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('username, email, total_experience, season_points, avatar_url, current_streak')
                .order('season_points', { ascending: false })
                .limit(50);

            setLeaderboard(data || []);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {leaderboard.map((user, index) => {
                const rank = getRankFromExp(user.total_experience || 0);
                const isCurrentUser = user.email === currentUserEmail;

                return (
                    <motion.div
                        key={user.email}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`flex items-center gap-3 p-3 rounded-lg ${isCurrentUser
                            ? 'bg-green-50 dark:bg-green-900/30 border-2 border-green-500'
                            : 'bg-gray-50 dark:bg-gray-700/50'
                            }`}
                    >
                        {/* Rank Position */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-400 text-yellow-900' :
                            index === 1 ? 'bg-gray-300 text-gray-700' :
                                index === 2 ? 'bg-orange-400 text-orange-900' :
                                    'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                            }`}>
                            {index + 1}
                        </div>

                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold">
                            {user.avatar_url ? (
                                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                user.username?.charAt(0).toUpperCase() || 'U'
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <p className={`font-semibold truncate font-condensed ${isCurrentUser ? 'text-green-700 dark:text-green-300' : 'text-gray-800 dark:text-white'}`}>
                                {user.username || 'Anonymous'}
                                {isCurrentUser && <span className="ml-1 text-xs">(Kamu)</span>}
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="text-sm">{rank.icon}</span>
                                <span className={`text-xs ${rank.color} font-condensed`}>{rank.name}</span>
                                {user.current_streak > 0 && (
                                    <span className="text-xs text-orange-500">🔥{user.current_streak}</span>
                                )}
                            </div>
                        </div>

                        {/* Points */}
                        <div className="text-right">
                            <p className="font-bold text-green-600 dark:text-green-400 font-condensed">
                                {(user.season_points || 0).toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-condensed">pts</p>
                        </div>
                    </motion.div>
                );
            })}

            {leaderboard.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">🏆</div>
                    <p className="font-condensed">Belum ada data leaderboard</p>
                </div>
            )}
        </div>
    );
};

// ============================================================
// MAIN CHALLENGE PAGE COMPONENT
// ============================================================
export default function ChallengePage() {
    const router = useRouter();

    // State
    const [activeTab, setActiveTab] = useState('season-1');
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState({
        username: 'Guest',
        email: '',
        avatar: 'G',
        totalExp: 0,
        seasonPoints: 0,
        rank: 999,
        correctPredictions: 0,
        totalPredictions: 0,
        currentStreak: 0,
        bestStreak: 0
    });
    const [predictionHistory, setPredictionHistory] = useState([]);
    const [seasonTimeLeft, setSeasonTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });

    // Season calculation
    const currentSeason = useMemo(() => {
        const now = new Date();
        const season1End = new Date('2026-02-28T23:59:59');
        const season2End = new Date('2026-05-31T23:59:59');
        const season3End = new Date('2026-08-31T23:59:59');
        const season4End = new Date('2026-11-30T23:59:59');

        if (now <= season1End) {
            return { number: 1, startDate: '1 Des 2025', endDate: '28 Feb 2026', endTimestamp: season1End };
        } else if (now <= season2End) {
            return { number: 2, startDate: '1 Mar 2026', endDate: '31 Mei 2026', endTimestamp: season2End };
        } else if (now <= season3End) {
            return { number: 3, startDate: '1 Jun 2026', endDate: '31 Agu 2026', endTimestamp: season3End };
        } else if (now <= season4End) {
            return { number: 4, startDate: '1 Sep 2026', endDate: '30 Nov 2026', endTimestamp: season4End };
        }
        return { number: 1, startDate: '1 Des 2025', endDate: '28 Feb 2026', endTimestamp: season1End };
    }, []);

    // Fetch user session
    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser(session.user);
            }
        };
        getUser();
    }, []);

    // Fetch user data
    useEffect(() => {
        if (!user?.email) {
            setLoading(false);
            return;
        }

        const fetchUserData = async () => {
            try {
                // Get profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('email', user.email)
                    .single();

                // Get ALL winner predictions untuk hitung stats
                const { data: allWinnerPreds } = await supabase
                    .from('winner_predictions')
                    .select('*')
                    .eq('email', user.email);

                // Get ALL score predictions untuk hitung stats
                const { data: allScorePreds } = await supabase
                    .from('score_predictions')
                    .select('*')
                    .eq('email', user.email);

                // Hitung stats dari predictions (SAMA KAYAK PROFILE PAGE)
                const winnerPredictions = allWinnerPreds || [];
                const scorePredictions = allScorePreds || [];

                // Ambil langsung dari profiles (sudah di-sync oleh backend)
                const totalPredictions = profile.total_predictions || 0;
                const correctPredictions = profile.correct_predictions || 0;
                const currentStreak = profile.current_streak || 0;
                const bestStreak = profile.best_streak || 0;

                if (profile) {
                    // Get rank position
                    const { data: allProfiles } = await supabase
                        .from('profiles')
                        .select('email, season_points')
                        .order('season_points', { ascending: false });

                    const rankPosition = allProfiles?.findIndex(p => p.email === user.email) + 1;

                    setUserData({
                        username: profile.username || 'Guest',
                        email: user.email,
                        avatar: profile.username?.charAt(0).toUpperCase() || 'G',
                        avatarUrl: profile.avatar_url || null,
                        totalExp: profile.total_experience || profile.points || 0,
                        seasonPoints: profile.season_points || profile.points || 0,
                        rank: rankPosition || 999,
                        correctPredictions: correctPredictions,
                        totalPredictions: totalPredictions,
                        currentStreak: currentStreak,
                        bestStreak: Math.max(bestStreak, profile.best_streak || 0)
                    });
                }

                // Get prediction history (recent 10)
                const { data: winnerPreds } = await supabase
                    .from('winner_predictions')
                    .select('*')
                    .eq('email', user.email)
                    .order('created_at', { ascending: false })
                    .limit(10);

                const { data: scorePreds } = await supabase
                    .from('score_predictions')
                    .select('*')
                    .eq('email', user.email)
                    .order('created_at', { ascending: false })
                    .limit(10);

                // Merge predictions
                const history = [...(winnerPreds || []), ...(scorePreds || [])]
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .slice(0, 10);

                setPredictionHistory(history);

            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        fetchUserData();
    }, [user]);

    // Fetch matches
    useEffect(() => {
        const loadMatches = async () => {
            const { allMatches } = await fetchMatchesFromBackend();
            setMatches(allMatches.slice(0, 10));
            setLoading(false);
        };
        loadMatches();
    }, []);

    // Season countdown
    useEffect(() => {
        const updateCountdown = () => {
            const now = new Date();
            const diff = currentSeason.endTimestamp - now;

            if (diff > 0) {
                setSeasonTimeLeft({
                    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
                });
            }
        };

        updateCountdown();
        const timer = setInterval(updateCountdown, 60000);
        return () => clearInterval(timer);
    }, [currentSeason]);

    // User rank calculations
    const userRank = getRankFromExp(userData.totalExp);
    const nextRank = getNextRank(userData.totalExp);
    const expProgress = getRankProgress(userData.totalExp);

    // Tabs
    const tabs = [
        { id: 'season-1', label: `Season ${currentSeason.number}` },
        { id: 'season-2', label: `Season ${currentSeason.number + 1}` }
    ];

    // Handle match click
    const handleMatchClick = (match) => {
        const matchId = match.id || match.match_id;
        const homeTeam = match.home_team_name || match.home_team || 'home';
        const awayTeam = match.away_team_name || match.away_team || 'away';
        const slug = `${homeTeam}-vs-${awayTeam}`
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        router.push(`/match/${slug}-${matchId}`);
    };

    // Format time
    const formatMatchTime = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400 font-condensed">Memuat data challenge...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="font-condensed">Kembali</span>
                    </button>
                    <h1 className="text-lg font-bold text-gray-800 dark:text-white font-condensed">🏆 Season Challenge</h1>
                    <button
                        onClick={() => setShowInfoModal(true)}
                        className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Left Sidebar - User Stats */}
                    <div className="lg:col-span-3 order-2 lg:order-1 space-y-4">
                        {/* Season Countdown */}
                        <motion.div
                            className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <h3 className="font-semibold mb-2 flex items-center gap-2 font-condensed">
                                🏆 Season {currentSeason.number}
                            </h3>
                            <div className="text-center">
                                <div className="text-3xl font-bold mb-1 font-condensed">
                                    {seasonTimeLeft.days}h {seasonTimeLeft.hours}j {seasonTimeLeft.minutes}m
                                </div>
                                <p className="text-sm text-green-100 font-condensed">Sisa waktu season</p>
                                <p className="text-xs text-green-200 mt-1 font-condensed">
                                    {currentSeason.startDate} - {currentSeason.endDate}
                                </p>
                            </div>
                        </motion.div>

                        {/* User Rank Card */}
                        <motion.div
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <h3 className="font-semibold mb-3 text-gray-800 dark:text-white font-condensed">Peringkat Kamu</h3>

                            {/* Rank & Avatar */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                    #{userData.rank}
                                </div>
                                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                                    {userData.avatar}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-800 dark:text-white font-condensed">{userData.username}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-condensed">{userData.seasonPoints} pts</p>
                                </div>
                            </div>

                            {/* Rank Badge */}
                            <div className={`${userRank.bgColor} border-2 ${userRank.borderColor} rounded-lg p-3 mb-3`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl">{userRank.icon}</span>
                                    <div>
                                        <p className={`font-bold ${userRank.color} font-condensed`}>{userRank.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-condensed">
                                            {userData.totalExp} / {nextRank ? nextRank.minExp : '∞'} EXP
                                        </p>
                                    </div>
                                </div>
                                {nextRank && (
                                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                        <motion.div
                                            className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${expProgress}%` }}
                                            transition={{ duration: 0.8 }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                                    <p className="text-lg font-bold text-green-600 font-condensed">{userData.correctPredictions}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-condensed">Benar</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                                    <p className="text-lg font-bold text-blue-600 font-condensed">{userData.totalPredictions}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-condensed">Total</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                                    <p className="text-lg font-bold text-orange-600 font-condensed">{userData.currentStreak}🔥</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-condensed">Streak</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Prediction History */}
                        <motion.div
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h3 className="font-semibold mb-3 text-gray-800 dark:text-white font-condensed">Riwayat Prediksi</h3>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {predictionHistory.length > 0 ? (
                                    predictionHistory.slice(0, 5).map((pred, idx) => (
                                        <div key={idx} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-sm">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600 dark:text-gray-300 font-condensed">
                                                    Match #{pred.match_id}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded text-xs font-condensed ${pred.status === 'won' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                    pred.status === 'lost' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                    }`}>
                                                    {pred.status || 'pending'}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6 text-gray-500">
                                        <div className="text-3xl mb-2">🎯</div>
                                        <p className="text-sm font-condensed">Belum ada prediksi</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Center - Leaderboard */}
                    <div className="lg:col-span-6 order-1 lg:order-2">
                        <motion.div
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 lg:p-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            {/* Season Tabs */}
                            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`px-6 py-3 font-medium border-b-2 transition-colors font-condensed ${activeTab === tab.id
                                            ? 'border-green-500 text-green-600 dark:text-green-400'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {activeTab === 'season-1' && (
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold text-gray-800 dark:text-white font-condensed">
                                            🏆 Leaderboard Season {currentSeason.number}
                                        </h3>
                                    </div>

                                    {/* Rank Badges */}
                                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                                        {RANK_TIERS?.map((tier) => (
                                            <div
                                                key={tier.name}
                                                className={`flex-shrink-0 w-14 h-14 rounded-lg flex flex-col items-center justify-center border-2 transition-all ${userData.totalExp >= tier.minExp && userData.totalExp <= tier.maxExp
                                                    ? 'bg-gradient-to-r from-yellow-100 to-orange-100 border-yellow-400 shadow-md dark:from-yellow-900/30 dark:to-orange-900/30'
                                                    : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                                                    }`}
                                                title={`${tier.name}: ${tier.minExp}-${tier.maxExp === 99999 ? '∞' : tier.maxExp} EXP`}
                                            >
                                                <span className="text-lg">{tier.icon}</span>
                                                <span className="text-xs font-medium font-condensed">{tier.name}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Leaderboard */}
                                    <LeaderboardSection currentUserEmail={user?.email} />
                                </div>
                            )}

                            {activeTab === 'season-2' && (
                                <div className="text-center py-16">
                                    <div className="text-6xl mb-4">🚀</div>
                                    <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white font-condensed">
                                        Season {currentSeason.number + 1} Coming Soon!
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-4 font-condensed">
                                        Bersiaplah untuk tantangan yang lebih seru!
                                    </p>
                                    <div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-4 py-2 rounded-full text-sm font-condensed">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span>Launching Soon</span>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>

                    {/* Right Sidebar - Matches & How to Play */}
                    <div className="lg:col-span-3 order-3 space-y-4">
                        {/* Today's Matches */}
                        <motion.div
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <h3 className="font-semibold mb-3 text-gray-800 dark:text-white font-condensed">
                                ⚽ Pertandingan Hari Ini
                            </h3>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {matches.slice(0, 5).map((match) => {
                                    const isLive = ['1H', '2H', 'HT'].includes(match.status_short);
                                    return (
                                        <div
                                            key={match.id}
                                            onClick={() => handleMatchClick(match)}
                                            className="border dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-all"
                                        >
                                            <div className="text-center mb-2">
                                                <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full text-xs font-condensed">
                                                    {match.league_name || match.league || 'Football'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex-1 text-center">
                                                    <p className="font-medium truncate text-xs text-gray-800 dark:text-white font-condensed">
                                                        {match.home_team_name || match.home_team}
                                                    </p>
                                                </div>
                                                <div className="px-2">
                                                    {isLive ? (
                                                        <span className="text-red-600 font-bold text-xs">
                                                            {match.home_score ?? 0} - {match.away_score ?? 0}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-500 text-xs font-condensed">
                                                            {formatMatchTime(match.date)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex-1 text-center">
                                                    <p className="font-medium truncate text-xs text-gray-800 dark:text-white font-condensed">
                                                        {match.away_team_name || match.away_team}
                                                    </p>
                                                </div>
                                            </div>
                                            {isLive && (
                                                <div className="text-center mt-2">
                                                    <span className="inline-flex items-center gap-1 text-xs text-red-600">
                                                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                                        LIVE
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {matches.length === 0 && (
                                    <div className="text-center py-6 text-gray-500">
                                        <div className="text-3xl mb-2">⚽</div>
                                        <p className="text-sm font-condensed">Tidak ada pertandingan</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* How to Play */}
                        <motion.div
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h3 className="font-semibold mb-3 text-gray-800 dark:text-white font-condensed">ℹ️ Cara Bermain</h3>
                            <div className="space-y-3 text-sm">
                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                                    <h4 className="font-medium mb-2 text-green-800 dark:text-green-300 font-condensed">🎯 Sistem Poin</h4>
                                    <ul className="text-green-700 dark:text-green-400 space-y-1 text-xs font-condensed">
                                        <li>• Winner benar: <b>+10 EXP</b></li>
                                        <li>• Score tepat: <b>+20 EXP</b></li>
                                        <li>• Big match: <b>+15 / +25 EXP</b></li>
                                    </ul>
                                </div>

                                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                                    <h4 className="font-medium mb-2 text-orange-800 dark:text-orange-300 font-condensed">🔥 Streak Bonus</h4>
                                    <ul className="text-orange-700 dark:text-orange-400 space-y-1 text-xs font-condensed">
                                        <li>• 3 streak: <b>+5 EXP</b></li>
                                        <li>• 5 streak: <b>+10 EXP</b></li>
                                        <li>• 10 streak: <b>+25 EXP</b></li>
                                    </ul>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>

            {/* Info Modal */}
            <AnimatePresence>
                {showInfoModal && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowInfoModal(false)}
                    >
                        <motion.div
                            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white font-condensed">🏆 Sistem Ranking</h3>
                                <button
                                    onClick={() => setShowInfoModal(false)}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                                >
                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                    <h4 className="font-medium mb-3 text-green-800 dark:text-green-300 font-condensed">⚡ Cara Dapat EXP</h4>
                                    <div className="space-y-2 text-sm text-green-700 dark:text-green-400 font-condensed">
                                        <div className="flex justify-between">
                                            <span>Winner normal</span>
                                            <span className="font-bold">+10 EXP</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Score exact</span>
                                            <span className="font-bold">+20 EXP</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Big match (Winner)</span>
                                            <span className="font-bold">+15 EXP</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Big match (Score)</span>
                                            <span className="font-bold">+25 EXP</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                                    <h4 className="font-medium mb-3 text-purple-800 dark:text-purple-300 font-condensed">🎖️ Ranking Tiers</h4>
                                    <div className="space-y-2 text-sm">
                                        {RANK_TIERS?.map((tier) => (
                                            <div key={tier.name} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span>{tier.icon}</span>
                                                    <span className={`font-medium ${tier.color} font-condensed`}>{tier.name}</span>
                                                </div>
                                                <span className="text-purple-700 dark:text-purple-400 text-xs font-condensed">
                                                    {tier.minExp}-{tier.maxExp === 99999 ? '∞' : tier.maxExp} EXP
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
