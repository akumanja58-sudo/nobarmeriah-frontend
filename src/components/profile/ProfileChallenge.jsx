'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/utils/supabaseClient';

const ProfileChallenge = ({ profile, stats, isMobile = false }) => {
    const router = useRouter();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('username, points, streak, avatar_url')
                .order('points', { ascending: false })
                .limit(5);

            setLeaderboard(data || []);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        } finally {
            setLoadingLeaderboard(false);
        }
    };

    // Calculate weekly challenge progress
    const getWeeklyProgress = () => {
        const weeklyTarget = 10; // Target 10 prediksi per minggu
        const current = stats?.weeklyPredictions || 0;
        const progress = Math.min((current / weeklyTarget) * 100, 100);
        return { current, target: weeklyTarget, progress };
    };

    // Calculate time remaining in week
    const getTimeRemaining = () => {
        const now = new Date();
        const endOfWeek = new Date(now);
        endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
        endOfWeek.setHours(23, 59, 59, 999);

        const diff = endOfWeek - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        return `${days}h ${hours}j`;
    };

    const weeklyProgress = getWeeklyProgress();

    return (
        <div className={`space-y-4 ${isMobile ? '' : 'sticky top-24'}`}>
            {/* Season Challenge Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <button
                    onClick={() => router.push('/challenge')}
                    className="w-full flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 hover:shadow-md transition-all"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-gray-800 dark:text-white font-condensed">SEASON CHALLENGE</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-condensed">Tebak skor & dapatkan poin!</p>
                        </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </motion.div>

            {/* Quick Links - Desktop Only */}
            {!isMobile && (
                <motion.div
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 }}
                >
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
                        <button
                            onClick={() => router.push('/')}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl">⚽</span>
                                <span className="font-condensed text-gray-700 dark:text-gray-200">Live Score</span>
                            </div>
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Leaderboard Card */}
            <motion.div
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
            >
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-800 dark:text-white font-condensed">
                        Papan peringkat
                    </h3>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {/* Prediktor Teratas */}
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🎯</span>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 font-condensed">
                                    Prediktor teratas
                                </span>
                            </div>
                            <button className="text-xs text-green-600 dark:text-green-400 font-condensed hover:underline">
                                LIHAT SEMUA
                            </button>
                        </div>

                        {loadingLeaderboard ? (
                            <div className="text-center py-4">
                                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            </div>
                        ) : leaderboard.length > 0 ? (
                            <div className="space-y-2">
                                {leaderboard.slice(0, 3).map((user, index) => (
                                    <div
                                        key={index}
                                        className={`flex items-center gap-3 p-2 rounded-lg ${user.username === profile?.username
                                                ? 'bg-blue-50 dark:bg-blue-900/20'
                                                : ''
                                            }`}
                                    >
                                        <span className="text-lg">
                                            {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                        </span>
                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                                            {user.avatar_url ? (
                                                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">
                                                    {user.username?.slice(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-800 dark:text-white font-condensed">
                                                {user.username}
                                            </p>
                                        </div>
                                        <span className="text-sm font-bold text-gray-600 dark:text-gray-300 font-condensed">
                                            {user.points || 0}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4 font-condensed">
                                Belum ada stat prediksi ditampilkan
                            </p>
                        )}
                    </div>

                    {/* Kontributor Teratas */}
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">⚡</span>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 font-condensed">
                                    Kontributor teratas
                                </span>
                            </div>
                            <button className="text-xs text-green-600 dark:text-green-400 font-condensed hover:underline">
                                LIHAT SEMUA
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2 font-condensed">
                            Belum ada stat kontribusi ditampilkan
                        </p>
                    </div>

                    {/* Editor Teratas */}
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">✏️</span>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 font-condensed">
                                    Editor teratas
                                </span>
                            </div>
                            <button className="text-xs text-green-600 dark:text-green-400 font-condensed hover:underline">
                                LIHAT SEMUA
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2 font-condensed">
                            Belum ada stat editor ditampilkan
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Share Card - Mobile Only */}
            {isMobile && (
                <motion.div
                    className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                >
                    <div className="flex items-start gap-3">
                        <div className="flex-1">
                            <h3 className="font-semibold font-condensed mb-1">
                                Ajak teman-temanmu
                            </h3>
                            <p className="text-sm text-green-100 font-condensed mb-3">
                                Bagikan NobarMeriah dengan pecinta olahraga di sekitar kamu ✨
                            </p>
                            <button className="inline-flex items-center gap-2 px-4 py-2 bg-white text-green-600 rounded-full text-sm font-medium font-condensed hover:bg-green-50 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                                Bagikan tautan
                            </button>
                        </div>
                        <div className="text-4xl">📢</div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default ProfileChallenge;
