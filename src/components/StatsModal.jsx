import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area } from 'recharts';
import React from 'react';

const StatsModal = ({ isOpen, onClose, profile, totalMatches, winRate }) => {
    const [activeTab, setActiveTab] = useState('overview');

    // Generate mock data for charts
    const performanceData = useMemo(() => {
        return Array.from({ length: 12 }, (_, i) => ({
            month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
            points: Math.floor(Math.random() * 20) + 5,
            matches: Math.floor(Math.random() * 10) + 3,
            wins: Math.floor(Math.random() * 8) + 1
        }));
    }, []);

    const winLossData = useMemo(() => {
        const wins = Math.floor(totalMatches * (winRate / 100));
        const losses = totalMatches - wins;
        return [
            { name: 'Wins', value: wins, color: '#22c55e' },
            { name: 'Losses', value: losses, color: '#ef4444' }
        ];
    }, [totalMatches, winRate]);

    const streakData = useMemo(() => {
        return Array.from({ length: 10 }, (_, i) => ({
            game: `Game ${i + 1}`,
            result: Math.random() > 0.4 ? 'Win' : 'Loss',
            points: Math.floor(Math.random() * 5) + 1
        }));
    }, []);

    const achievementProgress = useMemo(() => {
        return [
            { name: 'Goal Scorer', current: profile?.points || 0, target: 50, icon: '⚽' },
            { name: 'Streak Master', current: profile?.streak || 0, target: 10, icon: '🔥' },
            { name: 'Match Player', current: totalMatches, target: 100, icon: '🏟️' },
            { name: 'Champion', current: winRate, target: 80, icon: '👑' }
        ];
    }, [profile, totalMatches, winRate]);

    const tabs = [
        { id: 'overview', label: 'Overview', icon: '📊' },
        { id: 'performance', label: 'Performance', icon: '📈' },
        { id: 'achievements', label: 'Achievements', icon: '🏆' },
        { id: 'history', label: 'History', icon: '📅' }
    ];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[80] bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
                    initial={{ y: 50, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 50, opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4, type: 'spring', damping: 25 }}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 relative overflow-hidden">
                        {/* Grass texture */}
                        <div className="absolute inset-0 opacity-20" style={{
                            backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)`
                        }}></div>

                        <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <motion.span
                                    className="text-3xl"
                                    animate={{ rotate: [0, 360] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                >📊</motion.span>
                                <div>
                                    <h2 className="text-2xl font-bold">Player Analytics</h2>
                                    <p className="text-green-100">Detailed performance insights</p>
                                </div>
                            </div>
                            <motion.button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <span className="text-xl font-bold">✕</span>
                            </motion.button>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-6">
                        <div className="flex space-x-8">
                            {tabs.map((tab) => (
                                <motion.button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === tab.id
                                            ? 'border-green-500 text-green-600 dark:text-green-400'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                        }`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <span>{tab.icon}</span>
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[60vh]">

                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                {/* Quick Stats */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <motion.div
                                        className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-xl"
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        <div className="text-2xl mb-2">⚽</div>
                                        <div className="text-2xl font-bold">{profile?.points || 0}</div>
                                        <div className="text-sm opacity-90">Total Goals</div>
                                    </motion.div>

                                    <motion.div
                                        className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 rounded-xl"
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        <div className="text-2xl mb-2">🔥</div>
                                        <div className="text-2xl font-bold">{profile?.streak || 0}</div>
                                        <div className="text-sm opacity-90">Current Streak</div>
                                    </motion.div>

                                    <motion.div
                                        className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-xl"
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        <div className="text-2xl mb-2">🏟️</div>
                                        <div className="text-2xl font-bold">{totalMatches}</div>
                                        <div className="text-sm opacity-90">Total Matches</div>
                                    </motion.div>

                                    <motion.div
                                        className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-xl"
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        <div className="text-2xl mb-2">🎯</div>
                                        <div className="text-2xl font-bold">{winRate}%</div>
                                        <div className="text-sm opacity-90">Win Rate</div>
                                    </motion.div>
                                </div>

                                {/* Win/Loss Chart */}
                                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                        🎯 Win/Loss Ratio
                                    </h3>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={winLossData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={100}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {winLossData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex justify-center gap-6 mt-4">
                                        {winLossData.map((item, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: item.color }}></div>
                                                <span className="text-sm font-medium">{item.name}: {item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Performance Tab */}
                        {activeTab === 'performance' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                {/* Monthly Performance */}
                                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                        📈 Monthly Performance
                                    </h3>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={performanceData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="month" />
                                                <YAxis />
                                                <Tooltip />
                                                <Area
                                                    type="monotone"
                                                    dataKey="points"
                                                    stroke="#22c55e"
                                                    fill="#22c55e"
                                                    fillOpacity={0.3}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Matches vs Wins */}
                                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                        🏟️ Matches vs Wins
                                    </h3>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={performanceData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="month" />
                                                <YAxis />
                                                <Tooltip />
                                                <Bar dataKey="matches" fill="#3b82f6" name="Matches" />
                                                <Bar dataKey="wins" fill="#22c55e" name="Wins" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Achievements Tab */}
                        {activeTab === 'achievements' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                {/* Achievement Progress */}
                                <div className="grid gap-4">
                                    {achievementProgress.map((achievement, index) => (
                                        <motion.div
                                            key={achievement.name}
                                            className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{achievement.icon}</span>
                                                    <div>
                                                        <h4 className="font-semibold">{achievement.name}</h4>
                                                        <p className="text-sm text-gray-500">
                                                            {achievement.current} / {achievement.target}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-bold text-green-600">
                                                        {Math.min(100, Math.round((achievement.current / achievement.target) * 100))}%
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                <motion.div
                                                    className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full"
                                                    initial={{ width: 0 }}
                                                    animate={{
                                                        width: `${Math.min(100, (achievement.current / achievement.target) * 100)}%`
                                                    }}
                                                    transition={{ delay: index * 0.2, duration: 1 }}
                                                />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* History Tab */}
                        {activeTab === 'history' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                {/* Recent Matches */}
                                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                        📅 Recent Match History
                                    </h3>
                                    <div className="space-y-3">
                                        {streakData.map((game, index) => (
                                            <motion.div
                                                key={index}
                                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-3 h-3 rounded-full ${game.result === 'Win' ? 'bg-green-500' : 'bg-red-500'
                                                        }`}></span>
                                                    <span className="font-medium">{game.game}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${game.result === 'Win'
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200'
                                                            : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200'
                                                        }`}>
                                                        {game.result}
                                                    </span>
                                                    {game.result === 'Win' && (
                                                        <span className="text-sm font-medium text-green-600">
                                                            +{game.points} pts
                                                        </span>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Last updated: {new Date().toLocaleDateString()}
                            </div>
                            <motion.button
                                onClick={onClose}
                                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Close Analytics
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default StatsModal;