import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Trophy, Info, X, Calendar, Star, Target, Zap, Users } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import Leaderboard from '../components/Leaderboard';
import {
    RANK_TIERS,
    getRankFromExp,
    calculateRewards,
    isBigMatch,
    getPotentialRewards,
    getNextRank,
    getRankProgress
} from '../utils/experienceSystem';

// ============================================================
// FETCH MATCHES FROM BACKEND API (bukan Supabase)
// ============================================================
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

const fetchMatchesFromBackend = async () => {
    try {
        console.log('🔄 Fetching matches from backend API...');

        // Fetch dari backend livescore
        const response = await fetch(`${API_BASE_URL}/api/matches`);

        if (!response.ok) {
            throw new Error('Failed to fetch matches');
        }

        const data = await response.json();
        console.log('📊 Backend response:', data);

        if (!data.success || !data.matches) {
            return { hotMatches: [], leagueMatches: {}, allMatches: [] };
        }

        const allMatches = data.matches;

        // Filter: Hapus match yang sudah selesai (FT, AET, PEN)
        const finishedStatuses = ['FT', 'AET', 'PEN', 'CANC', 'PST', 'ABD'];
        const activeMatches = allMatches.filter(match => {
            const status = (match.status_short || match.status || '').toUpperCase();
            return !finishedStatuses.includes(status);
        });

        // Sort: LIVE dulu, lalu by kickoff time
        const sortedMatches = activeMatches.sort((a, b) => {
            const aLive = a.status_short === '1H' || a.status_short === '2H' || a.is_live || a.status === 'live';
            const bLive = b.status_short === '1H' || b.status_short === '2H' || b.is_live || b.status === 'live';

            // LIVE matches first
            if (aLive && !bLive) return -1;
            if (!aLive && bLive) return 1;

            // Then by kickoff time
            const aTime = new Date(a.date || a.timestamp || a.kickoff || 0);
            const bTime = new Date(b.date || b.timestamp || b.kickoff || 0);
            return aTime - bTime;
        });

        // Filter hot matches (big leagues)
        const hotMatches = sortedMatches.filter(match => {
            const league = match.league_name || match.league || '';
            return isBigMatch({ league, home_team: match.home_team_name, away_team: match.away_team_name }) ||
                league.includes('Champions League') ||
                league.includes('Premier League') ||
                league.includes('La Liga') ||
                league.includes('Serie A') ||
                league.includes('Bundesliga') ||
                league.includes('Liga 1');
        }).slice(0, 5);

        // Group by league
        const leagueGroups = {};
        for (const match of sortedMatches) {
            const league = match.league || 'Other';
            if (!leagueGroups[league]) {
                leagueGroups[league] = [];
            }
            if (leagueGroups[league].length < 10) {
                leagueGroups[league].push(match);
            }
        }

        console.log('✅ Processed:', {
            total: allMatches.length,
            active: sortedMatches.length,
            hot: hotMatches.length,
            leagues: Object.keys(leagueGroups).length
        });

        return {
            hotMatches,
            leagueMatches: leagueGroups,
            allMatches: sortedMatches
        };

    } catch (error) {
        console.error('❌ Error fetching matches:', error);
        return { hotMatches: [], leagueMatches: {}, allMatches: [] };
    }
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const ChallengePage = ({ user, username, onClose }) => {
    // State management
    const [activeTab, setActiveTab] = useState('season-1');
    const [showPointsModal, setShowPointsModal] = useState(false);

    // Match data
    const [matches, setMatches] = useState([]);
    const [hotMatches, setHotMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    // User data
    const [realUserData, setRealUserData] = useState({
        name: username || 'Guest User',
        email: user?.email || '',
        avatar: (username || 'G').charAt(0).toUpperCase(),
        totalExp: 0,
        seasonPoints: 0,
        weeklyPoints: 0,
        trophies: 0,
        rank: 1,
        correctPredictions: 0,
        totalPredictions: 0,
        currentStreak: 0,
        bestStreak: 0
    });
    const [predictionHistory, setPredictionHistory] = useState([]);
    const [userLoading, setUserLoading] = useState(true);

    // Season system (3 bulan per season)
    const [seasonTimeLeft, setSeasonTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });

    // ============================================================
    // SEASON CALCULATION (3 bulan per season, mulai Des 2025)
    // ============================================================
    const currentSeason = useMemo(() => {
        const now = new Date();

        // Season 1: 1 Des 2025 - 28 Feb 2026
        const season1End = new Date('2026-02-28T23:59:59');

        // Season 2: 1 Mar 2026 - 31 Mei 2026
        const season2End = new Date('2026-05-31T23:59:59');

        // Season 3: 1 Jun 2026 - 31 Agu 2026
        const season3End = new Date('2026-08-31T23:59:59');

        // Season 4: 1 Sep 2026 - 30 Nov 2026
        const season4End = new Date('2026-11-30T23:59:59');

        // Determine current season
        if (now <= season1End) {
            return {
                number: 1,
                startDate: '1 Des 2025',
                endDate: '28 Feb 2026',
                endTimestamp: season1End
            };
        } else if (now <= season2End) {
            return {
                number: 2,
                startDate: '1 Mar 2026',
                endDate: '31 Mei 2026',
                endTimestamp: season2End
            };
        } else if (now <= season3End) {
            return {
                number: 3,
                startDate: '1 Jun 2026',
                endDate: '31 Agu 2026',
                endTimestamp: season3End
            };
        } else if (now <= season4End) {
            return {
                number: 4,
                startDate: '1 Sep 2026',
                endDate: '30 Nov 2026',
                endTimestamp: season4End
            };
        } else {
            // Season 5+: Calculate dynamically
            const season5Start = new Date('2026-12-01');
            const daysSinceSeason5 = Math.floor((now - season5Start) / (1000 * 60 * 60 * 24));
            const extraSeasons = Math.floor(Math.max(0, daysSinceSeason5) / 90);
            const seasonNumber = 5 + extraSeasons;

            const seasonStart = new Date(season5Start.getTime() + (extraSeasons * 90 * 24 * 60 * 60 * 1000));
            const seasonEnd = new Date(seasonStart.getTime() + (90 * 24 * 60 * 60 * 1000) - 1000);

            const formatDate = (date) => {
                return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
            };

            return {
                number: seasonNumber,
                startDate: formatDate(seasonStart),
                endDate: formatDate(seasonEnd),
                endTimestamp: seasonEnd
            };
        }
    }, []); // Empty dependency - only calculate once on mount

    // ============================================================
    // FETCH USER DATA
    // ============================================================
    const fetchRealUserData = async () => {
        if (!user?.email) {
            setUserLoading(false);
            return;
        }

        try {
            setUserLoading(true);
            console.log('🔄 Fetching user data for:', user.email);

            // Get user profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('username, total_experience, season_points, weekly_points, current_streak, best_streak, correct_predictions, total_predictions')
                .eq('email', user.email)
                .single();

            if (profileError) {
                console.log('Profile error:', profileError);
            }

            // Get winner predictions
            const { data: winnerPredictions } = await supabase
                .from('winner_predictions')
                .select('id, match_id, predicted_result, status, created_at')
                .eq('email', user.email)
                .order('created_at', { ascending: false })
                .limit(20);

            // Get score predictions
            const { data: scorePredictions } = await supabase
                .from('score_predictions')
                .select('id, match_id, predicted_home_score, predicted_away_score, status, created_at')
                .eq('email', user.email)
                .order('created_at', { ascending: false })
                .limit(20);

            // Build prediction history
            const history = [];
            const predictionsByMatch = {};

            // Group predictions by match_id
            [...(winnerPredictions || []), ...(scorePredictions || [])].forEach(pred => {
                const matchId = pred.match_id;
                if (!predictionsByMatch[matchId]) {
                    predictionsByMatch[matchId] = { winner: null, score: null };
                }
                if (pred.predicted_result) {
                    predictionsByMatch[matchId].winner = pred;
                } else {
                    predictionsByMatch[matchId].score = pred;
                }
            });

            // Create history entries
            Object.entries(predictionsByMatch).forEach(([matchId, preds]) => {
                const winnerPred = preds.winner;
                const scorePred = preds.score;

                let winnerText = '-';
                if (winnerPred) {
                    winnerText = winnerPred.predicted_result === 'home' ? 'Home Win' :
                        winnerPred.predicted_result === 'away' ? 'Away Win' : 'Draw';
                }

                let scoreText = '-';
                if (scorePred) {
                    scoreText = `${scorePred.predicted_home_score} - ${scorePred.predicted_away_score}`;
                }

                history.push({
                    id: `match-${matchId}`,
                    matchId,
                    winnerPrediction: winnerText,
                    scorePrediction: scoreText,
                    hasWinnerPred: !!winnerPred,
                    hasScorePred: !!scorePred,
                    winnerStatus: winnerPred?.status || 'pending',
                    scoreStatus: scorePred?.status || 'pending',
                    date: winnerPred?.created_at || scorePred?.created_at
                });
            });

            // Sort by date
            history.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Update state
            setRealUserData({
                name: profileData?.username || username || 'Guest User',
                email: user.email,
                avatar: (profileData?.username || username || 'G').charAt(0).toUpperCase(),
                totalExp: profileData?.total_experience || 0,
                seasonPoints: profileData?.season_points || 0,
                weeklyPoints: profileData?.weekly_points || 0,
                trophies: 0,
                rank: 1,
                correctPredictions: profileData?.correct_predictions || 0,
                totalPredictions: profileData?.total_predictions || 0,
                currentStreak: profileData?.current_streak || 0,
                bestStreak: profileData?.best_streak || 0
            });

            setPredictionHistory(history);
            console.log('✅ User data loaded');

        } catch (error) {
            console.error('❌ Error fetching user data:', error);
        } finally {
            setUserLoading(false);
        }
    };

    // ============================================================
    // FETCH USER RANK POSITION
    // ============================================================
    const fetchUserRankPosition = async () => {
        if (!user?.email) return;

        try {
            const { data: leaderboardData } = await supabase
                .from('profiles')
                .select('email, total_experience')
                .order('total_experience', { ascending: false });

            const userPosition = leaderboardData?.findIndex(p => p.email === user.email) + 1;

            setRealUserData(prev => ({
                ...prev,
                rank: userPosition || 999
            }));
        } catch (error) {
            console.error('Error fetching rank:', error);
        }
    };

    // ============================================================
    // EFFECTS
    // ============================================================
    useEffect(() => {
        const loadMatches = async () => {
            try {
                setLoading(true);
                const { hotMatches: hot, allMatches } = await fetchMatchesFromBackend();
                setHotMatches(hot);
                setMatches(allMatches);
            } catch (error) {
                console.error('Error loading matches:', error);
            } finally {
                setLoading(false);
            }
        };
        loadMatches();

        // Auto refresh setiap 60 detik
        const refreshInterval = setInterval(() => {
            console.log('🔄 Auto refreshing matches...');
            loadMatches();
        }, 60000);

        return () => clearInterval(refreshInterval);
    }, []);

    useEffect(() => {
        fetchRealUserData();
        fetchUserRankPosition();
    }, [user?.email]);

    // Update season countdown every minute
    useEffect(() => {
        const updateSeasonCountdown = () => {
            const now = new Date();
            const diff = currentSeason.endTimestamp - now;

            if (diff > 0) {
                setSeasonTimeLeft({
                    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
                });
            } else {
                setSeasonTimeLeft({ days: 0, hours: 0, minutes: 0 });
            }
        };

        // Initial calculation
        updateSeasonCountdown();

        // Update every minute
        const timer = setInterval(updateSeasonCountdown, 60000);

        return () => clearInterval(timer);
    }, []); // Run once on mount

    // ============================================================
    // HELPERS
    // ============================================================
    const formatMatchDateTime = (kickoffTime) => {
        if (!kickoffTime) return { date: '', time: '' };

        const matchDate = new Date(kickoffTime);
        const now = new Date();

        const timeString = matchDate.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'Asia/Jakarta'
        });

        const isToday = matchDate.toDateString() === now.toDateString();
        const isTomorrow = matchDate.toDateString() === new Date(now.getTime() + 86400000).toDateString();

        let dateString;
        if (isToday) dateString = 'Hari Ini';
        else if (isTomorrow) dateString = 'Besok';
        else {
            dateString = matchDate.toLocaleDateString('id-ID', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                timeZone: 'Asia/Jakarta'
            });
        }

        return { date: dateString, time: timeString };
    };

    const handleMatchClick = (match) => {
        const matchId = match.id || match.match_id;
        const homeTeam = match.home_team_name || match.home_team || 'home';
        const awayTeam = match.away_team_name || match.away_team || 'away';

        const slug = `${homeTeam}-vs-${awayTeam}`
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');

        window.location.href = `/match/${slug}-${matchId}`;
    };

    // User rank calculations
    const userRank = getRankFromExp(realUserData.totalExp);
    const nextRank = getNextRank(realUserData.totalExp);
    const expProgress = getRankProgress(realUserData.totalExp);

    // Generate tabs - hanya current season + next season
    const tabs = [
        { id: `season-${currentSeason.number}`, label: `Season ${currentSeason.number}` },
        { id: `season-${currentSeason.number + 1}`, label: `Season ${currentSeason.number + 1}` }
    ];

    // ============================================================
    // LOADING STATE
    // ============================================================
    if (loading || userLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading challenge data...</p>
                </div>
            </div>
        );
    }

    // ============================================================
    // RENDER
    // ============================================================
    return (
        <div className="min-h-screen max-h-screen overflow-y-auto bg-gray-50 p-4 md:p-6">
            <div className="max-w-7xl mx-auto pb-8">

                {/* Header with Close Button */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                        🏆 Season Challenge
                    </h1>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6 text-gray-600" />
                        </button>
                    )}
                </div>

                {/* Main Content - 3 Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* ==================== LEFT SIDEBAR ==================== */}
                    <div className="lg:col-span-3 order-2 lg:order-1">
                        <div className="bg-white rounded-xl shadow-sm p-4 space-y-6">

                            {/* Season Countdown */}
                            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white">
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                    <Trophy className="w-4 h-4" />
                                    Season {currentSeason.number}
                                </h3>
                                <div className="text-center">
                                    <div className="text-3xl font-bold mb-1">
                                        {seasonTimeLeft.days}d {seasonTimeLeft.hours}h {seasonTimeLeft.minutes}m
                                    </div>
                                    <p className="text-sm opacity-80">Sisa waktu season ini</p>
                                    <p className="text-xs opacity-60 mt-1">
                                        {currentSeason.startDate} - {currentSeason.endDate}
                                    </p>
                                </div>
                            </div>

                            {/* User Rank Card */}
                            <div>
                                <h3 className="font-semibold mb-3">Peringkat Saat Ini</h3>
                                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">

                                    {/* Rank & Avatar */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                            #{realUserData.rank}
                                        </div>
                                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                                            {realUserData.avatar}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-800">{realUserData.name}</p>
                                            <p className="text-sm text-gray-500">{realUserData.seasonPoints} pts</p>
                                        </div>
                                    </div>

                                    {/* Rank Badge */}
                                    <div className={`${userRank.bgColor} ${userRank.borderColor} border-2 rounded-lg p-3 mb-3`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-2xl">{userRank.icon}</span>
                                            <div>
                                                <p className={`font-bold ${userRank.color}`}>{userRank.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {realUserData.totalExp} / {nextRank ? nextRank.minExp : '∞'} EXP
                                                </p>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        {nextRank && (
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${expProgress}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="bg-white rounded-lg p-2">
                                            <p className="text-lg font-bold text-green-600">{realUserData.correctPredictions}</p>
                                            <p className="text-xs text-gray-500">Benar</p>
                                        </div>
                                        <div className="bg-white rounded-lg p-2">
                                            <p className="text-lg font-bold text-blue-600">{realUserData.totalPredictions}</p>
                                            <p className="text-xs text-gray-500">Total</p>
                                        </div>
                                        <div className="bg-white rounded-lg p-2">
                                            <p className="text-lg font-bold text-orange-600">{realUserData.currentStreak}🔥</p>
                                            <p className="text-xs text-gray-500">Streak</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Prediction History */}
                            <div>
                                <h3 className="font-semibold mb-3">Riwayat Prediksi</h3>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {predictionHistory.length > 0 ? (
                                        predictionHistory.slice(0, 5).map((pred) => (
                                            <div key={pred.id} className="bg-gray-50 rounded-lg p-3 text-sm">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-gray-600">Match #{pred.matchId}</span>
                                                    <span className={`px-2 py-0.5 rounded text-xs ${pred.winnerStatus === 'won' ? 'bg-green-100 text-green-700' :
                                                        pred.winnerStatus === 'lost' ? 'bg-red-100 text-red-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {pred.winnerStatus}
                                                    </span>
                                                </div>
                                                {pred.hasWinnerPred && (
                                                    <p className="text-xs text-gray-500">Winner: {pred.winnerPrediction}</p>
                                                )}
                                                {pred.hasScorePred && (
                                                    <p className="text-xs text-gray-500">Score: {pred.scorePrediction}</p>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-6 text-gray-500">
                                            <div className="text-3xl mb-2">🎯</div>
                                            <p className="text-sm">Belum ada prediksi</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ==================== CENTER - LEADERBOARD ==================== */}
                    <div className="lg:col-span-6 order-1 lg:order-2">
                        <div className="bg-white rounded-xl shadow-sm p-6">

                            {/* Season Tabs */}
                            <div className="flex border-b border-gray-200 mb-6">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`px-6 py-3 font-medium border-b-2 transition-colors ${activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {activeTab === 'season-1' && (
                                <div>
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold">🏆 Leaderboard Season 1</h3>
                                        <button
                                            onClick={() => setShowPointsModal(true)}
                                            className="flex items-center gap-1 text-sm text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg transition-colors"
                                        >
                                            <Info className="w-4 h-4" />
                                            <span>Info</span>
                                        </button>
                                    </div>

                                    {/* Rank Badges */}
                                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                                        {RANK_TIERS.map((tier) => (
                                            <div
                                                key={tier.name}
                                                className={`flex-shrink-0 w-16 h-16 rounded-lg flex flex-col items-center justify-center border-2 cursor-pointer transition-all hover:scale-105 ${realUserData.totalExp >= tier.minExp && realUserData.totalExp <= tier.maxExp
                                                    ? 'bg-gradient-to-r from-yellow-100 to-orange-100 border-yellow-400 shadow-md'
                                                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                                    }`}
                                                title={`${tier.name}: ${tier.minExp}-${tier.maxExp === 99999 ? '∞' : tier.maxExp} EXP`}
                                            >
                                                <span className="text-xl mb-1">{tier.icon}</span>
                                                <span className="text-xs font-medium">{tier.name}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Leaderboard Component */}
                                    <Leaderboard limit={50} currentUser={realUserData} />
                                </div>
                            )}

                            {activeTab === 'season-2' && (
                                <div className="text-center py-16">
                                    <div className="text-6xl mb-4">🚀</div>
                                    <h3 className="text-xl font-semibold mb-2">Season 2 Coming Soon!</h3>
                                    <p className="text-gray-600 mb-4">
                                        Bersiaplah untuk tantangan yang lebih seru!
                                    </p>
                                    <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm">
                                        <Calendar className="w-4 h-4" />
                                        <span>Launching Soon</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ==================== RIGHT SIDEBAR ==================== */}
                    <div className="lg:col-span-3 order-3">
                        <div className="bg-white rounded-xl shadow-sm p-4 space-y-6 lg:max-h-[calc(100vh-150px)] lg:overflow-y-auto">

                            {/* Today's Matches */}
                            <div>
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    ⚽ Pertandingan Hari Ini
                                </h3>
                                <div className="space-y-3">
                                    {matches.slice(0, 5).map((match) => {
                                        const { date, time } = formatMatchDateTime(match.date || match.timestamp || match.kickoff);
                                        const isLive = match.status_short === '1H' || match.status_short === '2H' || match.is_live || match.status === 'live';

                                        return (
                                            <div
                                                key={match.id}
                                                onClick={() => handleMatchClick(match)}
                                                className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-all hover:shadow-md hover:border-blue-300"
                                            >
                                                {/* League */}
                                                <div className="text-center mb-2">
                                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                                                        {match.league_name || match.league || 'Football'}
                                                    </span>
                                                </div>

                                                {/* Teams */}
                                                <div className="flex items-center justify-between text-sm">
                                                    <div className="flex-1 text-center min-w-0">
                                                        <p className="font-medium truncate text-xs" title={match.home_team_name || match.home_team}>
                                                            {match.home_team_name || match.home_team || 'Home'}
                                                        </p>
                                                    </div>
                                                    <div className="px-1 flex-shrink-0">
                                                        {isLive ? (
                                                            <span className="text-red-600 font-bold text-xs">
                                                                {match.home_score ?? 0} - {match.away_score ?? 0}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-500 text-xs">{time}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 text-center min-w-0">
                                                        <p className="font-medium truncate text-xs" title={match.away_team_name || match.away_team}>
                                                            {match.away_team_name || match.away_team || 'Away'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Status */}
                                                <div className="text-center mt-2">
                                                    {isLive ? (
                                                        <span className="inline-flex items-center gap-1 text-xs text-red-600">
                                                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                                            LIVE
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-500">{date}</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {matches.length === 0 && (
                                        <div className="text-center py-8 text-gray-500">
                                            <div className="text-3xl mb-2">⚽</div>
                                            <p className="text-sm">Tidak ada pertandingan</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* How to Play */}
                            <div>
                                <h3 className="font-semibold mb-3">ℹ️ Cara Bermain</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <h4 className="font-medium mb-2 text-blue-800">🎯 Sistem Poin</h4>
                                        <ul className="text-blue-700 space-y-1 text-xs">
                                            <li>• Winner benar: <b>+10 EXP</b></li>
                                            <li>• Score tepat: <b>+20 EXP</b></li>
                                            <li>• Big match: <b>+15 / +25 EXP</b></li>
                                        </ul>
                                    </div>

                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                        <h4 className="font-medium mb-2 text-green-800">🔥 Streak Bonus</h4>
                                        <ul className="text-green-700 space-y-1 text-xs">
                                            <li>• 3 streak: <b>+5 EXP</b></li>
                                            <li>• 5 streak: <b>+10 EXP</b></li>
                                            <li>• 10 streak: <b>+25 EXP</b></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ==================== INFO MODAL ==================== */}
                {showPointsModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">🏆 Sistem Ranking</h3>
                                <button
                                    onClick={() => setShowPointsModal(false)}
                                    className="p-1 hover:bg-gray-100 rounded-full"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* EXP System */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="font-medium mb-3 text-blue-800">⚡ Cara Dapat EXP</h4>
                                    <div className="space-y-2 text-sm text-blue-700">
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

                                {/* Rank Tiers */}
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                    <h4 className="font-medium mb-3 text-purple-800">🎖️ Ranking Tiers</h4>
                                    <div className="space-y-2 text-sm">
                                        {RANK_TIERS.map((tier) => (
                                            <div key={tier.name} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span>{tier.icon}</span>
                                                    <span className={`font-medium ${tier.color}`}>{tier.name}</span>
                                                </div>
                                                <span className="text-purple-700 text-xs">
                                                    {tier.minExp}-{tier.maxExp === 99999 ? '∞' : tier.maxExp} EXP
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChallengePage;