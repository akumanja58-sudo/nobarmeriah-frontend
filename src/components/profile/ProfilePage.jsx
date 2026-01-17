'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateLevel, getLevelTier, getXPProgress } from '@/utils/levelSystem';
import { getActiveEffect } from '@/utils/avatarEffects';
import ProfileSidebar from './ProfileSidebar';
import ProfileStats from './ProfileStats';
import ProfileChallenge from './ProfileChallenge';
import EditProfileModal from './EditProfileModal';

const ProfilePage = ({ user }) => {
    const router = useRouter();
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState(null);
    const [predictions, setPredictions] = useState({ active: [], completed: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ikhtisar'); // Mobile tabs
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        if (user?.email) {
            fetchAllData();
        }
    }, [user]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchProfile(),
                fetchPredictions()
            ]);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProfile = async () => {
        try {
            // Get profile data
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('email', user.email)
                .single();

            if (profileError) throw profileError;

            // Get rank
            const { count } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .gt('points', profileData.points || 0);

            const rank = (count || 0) + 1;

            // Get total users for percentile
            const { count: totalUsers } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            setProfile({
                ...profileData,
                rank,
                totalUsers,
                percentile: totalUsers > 0 ? Math.round(((totalUsers - rank) / totalUsers) * 100) : 0
            });

            // Calculate stats
            await fetchStats(profileData);

        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const fetchStats = async (profileData) => {
        try {
            // Get winner predictions
            const { data: winnerPreds } = await supabase
                .from('winner_predictions')
                .select('*')
                .eq('email', profileData.email);

            // Get score predictions
            const { data: scorePreds } = await supabase
                .from('score_predictions')
                .select('*')
                .eq('email', profileData.email);

            const winnerPredictions = winnerPreds || [];
            const scorePredictions = scorePreds || [];

            // Total prediksi = unique match IDs dari kedua table
            const allMatchIds = new Set([
                ...winnerPredictions.map(p => p.match_id),
                ...scorePredictions.map(p => p.match_id)
            ]);
            const totalPredictions = allMatchIds.size;

            // Prediksi benar = winner won + score won (unique matches)
            const wonWinnerMatches = new Set(
                winnerPredictions.filter(p => p.status === 'won').map(p => p.match_id)
            );
            const wonScoreMatches = new Set(
                scorePredictions.filter(p => p.status === 'won').map(p => p.match_id)
            );
            const allWonMatches = new Set([...wonWinnerMatches, ...wonScoreMatches]);
            const correctPredictions = allWonMatches.size;

            // Win rate
            const winRate = totalPredictions > 0 ? Math.round((correctPredictions / totalPredictions) * 100) : 0;

            // Hitung current streak dari winner predictions (yang paling recent)
            const sortedWinnerPreds = [...winnerPredictions]
                .filter(p => p.status === 'won' || p.status === 'lost')
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            let currentStreak = 0;
            for (const pred of sortedWinnerPreds) {
                if (pred.status === 'won') {
                    currentStreak++;
                } else {
                    break;
                }
            }

            // Best streak - hitung dari semua prediksi
            let bestStreak = 0;
            let tempStreak = 0;
            const allSortedPreds = [...winnerPredictions]
                .filter(p => p.status === 'won' || p.status === 'lost')
                .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

            for (const pred of allSortedPreds) {
                if (pred.status === 'won') {
                    tempStreak++;
                    if (tempStreak > bestStreak) bestStreak = tempStreak;
                } else {
                    tempStreak = 0;
                }
            }

            // Ambil best streak dari profile jika lebih besar
            bestStreak = Math.max(bestStreak, profileData.best_streak || 0);

            // Combine all predictions for weekly/monthly calc
            const allPredictions = [...winnerPredictions, ...scorePredictions];

            // Weekly stats (unique match IDs dalam 7 hari terakhir)
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            const weeklyWinnerPreds = winnerPredictions.filter(p => new Date(p.created_at) >= oneWeekAgo);
            const weeklyScorePreds = scorePredictions.filter(p => new Date(p.created_at) >= oneWeekAgo);
            const weeklyMatchIds = new Set([
                ...weeklyWinnerPreds.map(p => p.match_id),
                ...weeklyScorePreds.map(p => p.match_id)
            ]);
            const weeklyPredictions = weeklyMatchIds.size;

            const weeklyWonMatches = new Set([
                ...weeklyWinnerPreds.filter(p => p.status === 'won').map(p => p.match_id),
                ...weeklyScorePreds.filter(p => p.status === 'won').map(p => p.match_id)
            ]);
            const weeklyCorrect = weeklyWonMatches.size;

            // Monthly stats (unique match IDs dalam 30 hari terakhir)
            const oneMonthAgo = new Date();
            oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

            const monthlyWinnerPreds = winnerPredictions.filter(p => new Date(p.created_at) >= oneMonthAgo);
            const monthlyScorePreds = scorePredictions.filter(p => new Date(p.created_at) >= oneMonthAgo);
            const monthlyMatchIds = new Set([
                ...monthlyWinnerPreds.map(p => p.match_id),
                ...monthlyScorePreds.map(p => p.match_id)
            ]);
            const monthlyPredictions = monthlyMatchIds.size;

            const monthlyWonMatches = new Set([
                ...monthlyWinnerPreds.filter(p => p.status === 'won').map(p => p.match_id),
                ...monthlyScorePreds.filter(p => p.status === 'won').map(p => p.match_id)
            ]);
            const monthlyCorrect = monthlyWonMatches.size;

            setStats({
                totalPredictions,
                correctPredictions,
                wrongPredictions: totalPredictions - correctPredictions,
                winRate,
                currentStreak,
                bestStreak,
                totalPoints: profileData.points || profileData.season_points || 0,
                weeklyPredictions,
                weeklyCorrect,
                monthlyPredictions,
                monthlyCorrect,
                avgPointsPerMatch: totalPredictions > 0
                    ? Math.round((profileData.points || 0) / totalPredictions)
                    : 0
            });

        } catch (error) {
            console.error('Error fetching stats:', error);
            // Fallback stats
            setStats({
                totalPredictions: 0,
                correctPredictions: 0,
                wrongPredictions: 0,
                winRate: 0,
                currentStreak: profileData?.streak || 0,
                bestStreak: profileData?.streak || 0,
                totalPoints: profileData?.points || 0,
                weeklyPredictions: 0,
                weeklyCorrect: 0,
                monthlyPredictions: 0,
                monthlyCorrect: 0,
                avgPointsPerMatch: 0
            });
        }
    };

    const fetchPredictions = async () => {
        try {
            const now = new Date().toISOString();

            // Get active predictions (match belum selesai)
            const { data: activePreds } = await supabase
                .from('winner_predictions')
                .select('*')
                .eq('email', user.email)
                .is('points_earned', null)
                .order('created_at', { ascending: false })
                .limit(10);

            // Get completed predictions
            const { data: completedPreds } = await supabase
                .from('winner_predictions')
                .select('*')
                .eq('email', user.email)
                .not('points_earned', 'is', null)
                .order('created_at', { ascending: false })
                .limit(20);

            setPredictions({
                active: activePreds || [],
                completed: completedPreds || []
            });

        } catch (error) {
            console.error('Error fetching predictions:', error);
        }
    };

    const handleProfileUpdate = (updatedProfile) => {
        setProfile(prev => ({ ...prev, ...updatedProfile }));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400 font-condensed">Memuat profil...</p>
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
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="font-condensed">Kembali</span>
                    </button>
                    <h1 className="text-lg font-bold text-gray-800 dark:text-white font-condensed">Profil Saya</h1>
                    <div className="w-20"></div>
                </div>
            </header>

            {/* Breadcrumb - Desktop */}
            <div className="hidden lg:block bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 py-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-condensed">
                        <button onClick={() => router.push('/')} className="hover:text-blue-600 transition-colors">
                            Beranda
                        </button>
                        <span>▸</span>
                        <span className="text-gray-800 dark:text-white">{profile?.username || 'Profil'}</span>
                    </div>
                </div>
            </div>

            {/* Mobile Tab Navigation */}
            <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-14 z-30">
                <div className="flex">
                    <button
                        onClick={() => setActiveTab('ikhtisar')}
                        className={`flex-1 py-3 text-center font-condensed font-medium transition-colors relative ${activeTab === 'ikhtisar'
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}
                    >
                        Ikhtisar
                        {activeTab === 'ikhtisar' && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600"
                            />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('prediksi')}
                        className={`flex-1 py-3 text-center font-condensed font-medium transition-colors relative ${activeTab === 'prediksi'
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}
                    >
                        Prediksi
                        {activeTab === 'prediksi' && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600"
                            />
                        )}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-6">
                {/* Desktop Layout - 3 Columns */}
                <div className="hidden lg:grid lg:grid-cols-12 gap-6">
                    {/* Left Sidebar - Profile Info */}
                    <div className="lg:col-span-3">
                        <ProfileSidebar
                            profile={profile}
                            onEditProfile={() => setShowEditModal(true)}
                        />
                    </div>

                    {/* Middle - Stats & Predictions */}
                    <div className="lg:col-span-6">
                        <ProfileStats
                            profile={profile}
                            stats={stats}
                            predictions={predictions}
                        />
                    </div>

                    {/* Right Sidebar - Challenge & Leaderboard */}
                    <div className="lg:col-span-3">
                        <ProfileChallenge
                            profile={profile}
                            stats={stats}
                        />
                    </div>
                </div>

                {/* Mobile Layout - Tab Content */}
                <div className="lg:hidden">
                    <AnimatePresence mode="wait">
                        {activeTab === 'ikhtisar' && (
                            <motion.div
                                key="ikhtisar"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-4"
                            >
                                {/* Profile Card Mobile */}
                                <ProfileSidebar
                                    profile={profile}
                                    onEditProfile={() => setShowEditModal(true)}
                                    isMobile={true}
                                />

                                {/* Quick Links */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                                    <h3 className="px-4 py-3 font-semibold text-gray-800 dark:text-white font-condensed border-b border-gray-100 dark:border-gray-700">
                                        Tautan cepat
                                    </h3>
                                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                        <button
                                            onClick={() => router.push('/reward-shop')}
                                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">🎁</span>
                                                <span className="font-condensed text-gray-700 dark:text-gray-200">Reward Shop</span>
                                            </div>
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => router.push('/trending')}
                                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">🔥</span>
                                                <span className="font-condensed text-gray-700 dark:text-gray-200">Trending Match</span>
                                            </div>
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Challenge Widget Mobile */}
                                <ProfileChallenge
                                    profile={profile}
                                    stats={stats}
                                    isMobile={true}
                                />
                            </motion.div>
                        )}

                        {activeTab === 'prediksi' && (
                            <motion.div
                                key="prediksi"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ProfileStats
                                    profile={profile}
                                    stats={stats}
                                    predictions={predictions}
                                    isMobile={true}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {/* Bottom Navigation - Mobile */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
                <div className="flex justify-around py-2">
                    <button
                        onClick={() => router.push('/')}
                        className="flex flex-col items-center py-1 px-3 text-gray-500 dark:text-gray-400"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-condensed mt-1">Pertandingan</span>
                    </button>
                    <button
                        onClick={() => router.push('/trending')}
                        className="flex flex-col items-center py-1 px-3 text-gray-500 dark:text-gray-400"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span className="text-xs font-condensed mt-1">Cari</span>
                    </button>
                    <button
                        onClick={() => router.push('/reward-shop')}
                        className="flex flex-col items-center py-1 px-3 text-gray-500 dark:text-gray-400"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        <span className="text-xs font-condensed mt-1">Favorit</span>
                    </button>
                    <button className="flex flex-col items-center py-1 px-3 text-green-600 dark:text-green-400">
                        <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                            <span className="text-xs font-bold">
                                {profile?.username?.slice(0, 1).toUpperCase() || 'U'}
                            </span>
                        </div>
                        <span className="text-xs font-condensed mt-1">Profil</span>
                    </button>
                </div>
            </nav>

            {/* Edit Profile Modal */}
            <EditProfileModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                profile={profile}
                onProfileUpdated={handleProfileUpdate}
            />
        </div>
    );
};

export default ProfilePage;
