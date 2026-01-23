'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ProfileStats = ({ profile, stats, predictions, isMobile = false }) => {
    const [statsFilter, setStatsFilter] = useState('30days'); // 30days, alltime
    const [predictionTab, setPredictionTab] = useState('aktif'); // aktif, selesai, statistik

    if (!stats) return null;

    // Calculate filtered stats based on filter
    const getFilteredStats = () => {
        if (statsFilter === '30days') {
            return {
                correct: stats.monthlyCorrect || 0,
                total: stats.monthlyPredictions || 0,
                winRate: stats.monthlyPredictions > 0
                    ? Math.round((stats.monthlyCorrect / stats.monthlyPredictions) * 100)
                    : 0
            };
        }
        return {
            correct: stats.correctPredictions || 0,
            total: stats.totalPredictions || 0,
            winRate: stats.winRate || 0
        };
    };

    const filteredStats = getFilteredStats();

    // Format date for prediction items
    const formatPredictionDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return `Hari ini, ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
        }

        return date.toLocaleDateString('id-ID', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
    };

    return (
        <div className="space-y-4">
            {/* Ikhtisar Card */}
            <motion.div
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800 dark:text-white font-condensed">
                        Ikhtisar
                    </h3>

                    {/* Filter Toggle */}
                    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-full p-1">
                        <button
                            onClick={() => setStatsFilter('30days')}
                            className={`px-3 py-1 text-xs font-medium font-condensed rounded-full transition-colors ${statsFilter === '30days'
                                ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400'
                                }`}
                        >
                            30 hari terakhir
                        </button>
                        <button
                            onClick={() => setStatsFilter('alltime')}
                            className={`px-3 py-1 text-xs font-medium font-condensed rounded-full transition-colors ${statsFilter === 'alltime'
                                ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400'
                                }`}
                        >
                            Semua waktu
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Prediksi Benar */}
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <motion.p
                                className="text-2xl font-bold text-gray-800 dark:text-white font-condensed"
                                key={`correct-${statsFilter}`}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                {filteredStats.correct}/{filteredStats.total} ({filteredStats.winRate}%)
                            </motion.p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-condensed mt-1">
                                Prediksi benar
                            </p>
                        </div>

                        {/* Rata-rata Peluang */}
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <motion.p
                                className="text-2xl font-bold text-gray-800 dark:text-white font-condensed"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.3, delay: 0.1 }}
                            >
                                -
                            </motion.p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-condensed mt-1">
                                Rata-rata peluang berhasil
                            </p>
                        </div>

                        {/* Laba Investasi Virtual */}
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <motion.p
                                className="text-2xl font-bold text-green-600 dark:text-green-400 font-condensed"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.3, delay: 0.2 }}
                            >
                                {stats.totalPoints || 0}
                            </motion.p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-condensed mt-1 flex items-center justify-center gap-1">
                                Total poin earned
                                <span className="cursor-help" title="Total poin yang didapat dari prediksi">ⓘ</span>
                            </p>
                        </div>

                        {/* Peringkat Prediktor */}
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <motion.p
                                className="text-2xl font-bold text-green-600 dark:text-green-400 font-condensed"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.3, delay: 0.3 }}
                            >
                                #{profile?.rank || '-'}
                            </motion.p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-condensed mt-1">
                                Peringkat prediktor
                            </p>
                        </div>
                    </div>

                    {/* Additional Stats Row */}
                    <div className="mt-4 grid grid-cols-3 gap-3">
                        <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                            <p className="text-lg font-bold text-orange-600 dark:text-orange-400 font-condensed">
                                {stats.currentStreak || 0}x
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-condensed">
                                Streak 🔥
                            </p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <p className="text-lg font-bold text-purple-600 dark:text-purple-400 font-condensed">
                                {stats.bestStreak || 0}x
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-condensed">
                                Best Streak
                            </p>
                        </div>
                        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <p className="text-lg font-bold text-blue-600 dark:text-blue-400 font-condensed">
                                {stats.avgPointsPerMatch || 0}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-condensed">
                                Avg/Match
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Prediksi Card */}
            <motion.div
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
            >
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-800 dark:text-white font-condensed">
                        Prediksi
                    </h3>
                </div>

                {/* Prediction Tabs */}
                <div className="flex border-b border-gray-100 dark:border-gray-700">
                    <button
                        onClick={() => setPredictionTab('aktif')}
                        className={`flex-1 py-3 text-sm font-medium font-condensed transition-colors relative ${predictionTab === 'aktif'
                            ? 'text-gray-800 dark:text-white'
                            : 'text-gray-500 dark:text-gray-400'
                            }`}
                    >
                        <span className={`px-3 py-1 rounded-full ${predictionTab === 'aktif' ? 'bg-gray-800 dark:bg-white text-white dark:text-gray-800' : ''
                            }`}>
                            Aktif
                        </span>
                    </button>
                    <button
                        onClick={() => setPredictionTab('selesai')}
                        className={`flex-1 py-3 text-sm font-medium font-condensed transition-colors ${predictionTab === 'selesai'
                            ? 'text-gray-800 dark:text-white'
                            : 'text-gray-500 dark:text-gray-400'
                            }`}
                    >
                        Selesai
                    </button>
                    <button
                        onClick={() => setPredictionTab('statistik')}
                        className={`flex-1 py-3 text-sm font-medium font-condensed transition-colors ${predictionTab === 'statistik'
                            ? 'text-gray-800 dark:text-white'
                            : 'text-gray-500 dark:text-gray-400'
                            }`}
                    >
                        Statistik
                    </button>
                </div>

                {/* Prediction Content */}
                <div className="p-4">
                    <AnimatePresence mode="wait">
                        {predictionTab === 'aktif' && (
                            <motion.div
                                key="aktif"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {predictions.active.length > 0 ? (
                                    <div className="space-y-4">
                                        {/* Header */}
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-condensed">
                                                Prediksi aktif • {predictions.active.length} pertandingan
                                            </p>
                                        </div>

                                        {/* Active Prediction Cards */}
                                        {predictions.active.map((pred, index) => (
                                            <ActivePredictionCard
                                                key={pred.id || pred.match_id || index}
                                                prediction={pred}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="text-4xl mb-3">⚽</div>
                                        <p className="text-gray-500 dark:text-gray-400 font-condensed">
                                            Belum ada prediksi aktif
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 font-condensed mt-1">
                                            Mulai prediksi di halaman pertandingan!
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {predictionTab === 'selesai' && (
                            <motion.div
                                key="selesai"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {predictions.completed.length > 0 ? (
                                    <div className="space-y-3">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-condensed">
                                            Riwayat prediksi • {predictions.completed.length} pertandingan
                                        </p>

                                        {predictions.completed.map((pred, index) => (
                                            <PredictionItem
                                                key={pred.id || index}
                                                prediction={pred}
                                                isActive={false}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="text-4xl mb-3">📋</div>
                                        <p className="text-gray-500 dark:text-gray-400 font-condensed">
                                            Belum ada riwayat prediksi
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {predictionTab === 'statistik' && (
                            <motion.div
                                key="statistik"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="space-y-4">
                                    {/* Win/Loss Chart Visual */}
                                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 font-condensed">
                                                Distribusi Hasil
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 font-condensed">
                                                {stats.totalPredictions} total
                                            </span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="w-full h-4 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden flex">
                                            <motion.div
                                                className="h-full bg-green-500"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${stats.winRate}%` }}
                                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                            />
                                            <motion.div
                                                className="h-full bg-red-500"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${100 - stats.winRate}%` }}
                                                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                                            />
                                        </div>

                                        {/* Legend */}
                                        <div className="flex justify-between mt-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                                <span className="text-xs text-gray-600 dark:text-gray-300 font-condensed">
                                                    Benar ({stats.correctPredictions})
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                                <span className="text-xs text-gray-600 dark:text-gray-300 font-condensed">
                                                    Salah ({stats.wrongPredictions})
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Weekly Performance */}
                                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 font-condensed mb-3">
                                            Performa Mingguan
                                        </h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <p className="text-xl font-bold text-gray-800 dark:text-white font-condensed">
                                                    {stats.weeklyPredictions}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 font-condensed">
                                                    Prediksi minggu ini
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xl font-bold text-green-600 dark:text-green-400 font-condensed">
                                                    {stats.weeklyCorrect}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 font-condensed">
                                                    Prediksi benar
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

// Prediction Item Component
const PredictionItem = ({ prediction, isActive }) => {
    const formatMatchTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    const formatMatchDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return `Hari ini`;
        }

        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short'
        });
    };

    // Untuk completed: cek is_correct, bukan points_earned
    const isWin = prediction.is_correct === true;
    const totalPoints = (prediction.points_earned || 0) + (prediction.score_points_earned || 0);

    return (
        <motion.div
            className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
        >
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    {/* League & Date */}
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-condensed uppercase">
                            {prediction.league || 'Match'}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">•</span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-condensed">
                            {formatMatchDate(prediction.match_time)}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 mb-1">
                        {/* Home Team */}
                        <div className="flex items-center gap-1.5">
                            {prediction.home_logo && (
                                <img src={prediction.home_logo} alt="" className="w-5 h-5 object-contain" />
                            )}
                            <span className="text-sm font-medium text-gray-800 dark:text-white font-condensed">
                                {prediction.home_team || 'Home'}
                            </span>
                        </div>

                        {/* Score/Time */}
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-condensed px-2">
                            {(prediction.home_score !== null && prediction.away_score !== null)
                                ? `${prediction.home_score} - ${prediction.away_score}`
                                : 'vs'
                            }
                        </span>

                        {/* Away Team */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-gray-800 dark:text-white font-condensed">
                                {prediction.away_team || 'Away'}
                            </span>
                            {prediction.away_logo && (
                                <img src={prediction.away_logo} alt="" className="w-5 h-5 object-contain" />
                            )}
                        </div>
                    </div>

                    {/* Prediction Info */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 font-condensed">
                        {prediction.predicted_winner && (
                            <span>🎯 {prediction.predicted_winner}</span>
                        )}
                        {prediction.predicted_score && (
                            <span>• Skor: {prediction.predicted_score}</span>
                        )}
                    </div>
                </div>

                {/* Result Badge */}
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium font-condensed ${isWin
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                        }`}>
                        {isWin ? `+${totalPoints}` : '0'}
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

// Active Prediction Card Component - Simple Compact Version
const ActivePredictionCard = ({ prediction }) => {
    const [timeLeft, setTimeLeft] = useState('');

    // Calculate time until match
    useEffect(() => {
        const calculateTimeLeft = () => {
            if (!prediction.match_time) return 'Segera';

            const matchTime = new Date(prediction.match_time);
            const now = new Date();
            const diff = matchTime - now;

            if (diff <= 0) return '🔴 Live';

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            if (hours > 24) {
                const days = Math.floor(hours / 24);
                return `${days}h lagi`;
            } else if (hours > 0) {
                return `${hours}j ${minutes}m`;
            } else {
                return `${minutes}m`;
            }
        };

        setTimeLeft(calculateTimeLeft());
        const interval = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 60000);

        return () => clearInterval(interval);
    }, [prediction.match_time]);

    const formatMatchTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <motion.div
            className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
        >
            {/* Header Row - League & Countdown */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-green-600 dark:text-green-400 font-condensed uppercase font-medium">
                        {prediction.league || 'Match'}
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] text-green-600 dark:text-green-400 font-condensed font-medium">
                        {timeLeft}
                    </span>
                </div>
            </div>

            {/* Teams Row */}
            <div className="flex items-center gap-2 mb-2">
                {/* Home Team */}
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {prediction.home_logo ? (
                        <img src={prediction.home_logo} alt="" className="w-5 h-5 object-contain flex-shrink-0" />
                    ) : (
                        <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
                    )}
                    <span className="text-sm font-medium text-gray-800 dark:text-white font-condensed truncate">
                        {prediction.home_team || 'Home'}
                    </span>
                </div>

                {/* Time */}
                <div className="flex-shrink-0 px-2 py-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <span className="text-xs font-bold text-gray-800 dark:text-white font-condensed">
                        {formatMatchTime(prediction.match_time)}
                    </span>
                </div>

                {/* Away Team */}
                <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                    <span className="text-sm font-medium text-gray-800 dark:text-white font-condensed truncate">
                        {prediction.away_team || 'Away'}
                    </span>
                    {prediction.away_logo ? (
                        <img src={prediction.away_logo} alt="" className="w-5 h-5 object-contain flex-shrink-0" />
                    ) : (
                        <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
                    )}
                </div>
            </div>

            {/* Prediction Row */}
            <div className="flex items-center gap-2 pt-2 border-t border-green-200 dark:border-green-800/50">
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-condensed">Prediksi:</span>
                {prediction.predicted_winner && (
                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-800/50 text-green-700 dark:text-green-300 text-xs font-medium font-condensed rounded-full">
                        🏆 {prediction.predicted_winner}
                    </span>
                )}
                {prediction.predicted_score && (
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300 text-xs font-medium font-condensed rounded-full">
                        📊 {prediction.predicted_score}
                    </span>
                )}
            </div>
        </motion.div>
    );
};

export default ProfileStats;