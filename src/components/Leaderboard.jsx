import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { getRankFromExp, getPositionBadge, getTrophyColor } from '../utils/experienceSystem';

const Leaderboard = ({ limit = 50, currentUser }) => {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLeaderboard = async () => {
        setLoading(true);

        try {
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select('email, username, total_experience, season_points, lifetime_points, current_streak, correct_predictions, total_predictions')
                .order('total_experience', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('❌ Gagal ambil leaderboard:', error);
                setLoading(false);
                return;
            }

            // Map data dengan rank info
            const leaderboard = profiles.map((user, index) => {
                const rankInfo = getRankFromExp(user.total_experience || 0);
                return {
                    position: index + 1,
                    email: user.email,
                    username: user.username || 'Anonymous',
                    totalExp: user.total_experience || 0,
                    seasonPoints: user.season_points || 0,
                    lifetimePoints: user.lifetime_points || 0,
                    streak: user.current_streak || 0,
                    correctPredictions: user.correct_predictions || 0,
                    totalPredictions: user.total_predictions || 0,
                    rankInfo,
                    isCurrentUser: currentUser?.email === user.email
                };
            });

            setLeaders(leaderboard);
        } catch (err) {
            console.error('💥 Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();

        // Auto refresh every 60 seconds
        const interval = setInterval(fetchLeaderboard, 60000);
        return () => clearInterval(interval);
    }, [limit]);

    // Mask username for privacy (show first 2 chars)
    const maskUsername = (username, isCurrentUser) => {
        if (isCurrentUser) return username; // Show full name for current user
        if (!username) return 'Anonymous';
        if (username.length <= 3) return username[0] + '**';
        return username.slice(0, 3) + '*'.repeat(Math.min(username.length - 3, 5));
    };

    // Get position badge (🥇🥈🥉)
    const getPositionDisplay = (position) => {
        if (position === 1) return { badge: '🥇', bg: 'bg-gradient-to-r from-yellow-100 to-amber-100', border: 'border-yellow-400' };
        if (position === 2) return { badge: '🥈', bg: 'bg-gradient-to-r from-gray-100 to-slate-100', border: 'border-gray-400' };
        if (position === 3) return { badge: '🥉', bg: 'bg-gradient-to-r from-orange-100 to-amber-100', border: 'border-orange-400' };
        return { badge: `#${position}`, bg: 'bg-white', border: 'border-gray-200' };
    };

    return (
        <div className="space-y-2">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🏆</span>
                    <h3 className="font-semibold text-gray-800">Top {limit} Players</h3>
                </div>
                <button
                    onClick={fetchLeaderboard}
                    disabled={loading}
                    className="text-xs px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                    {loading ? (
                        <>
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Loading...</span>
                        </>
                    ) : (
                        <>🔄 Refresh</>
                    )}
                </button>
            </div>

            {/* Loading State */}
            {loading && leaders.length === 0 ? (
                <div className="text-center py-8">
                    <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-gray-500 text-sm">Loading leaderboard...</p>
                </div>
            ) : leaders.length === 0 ? (
                <div className="text-center py-8">
                    <div className="text-4xl mb-2">🏆</div>
                    <p className="text-gray-500 text-sm">Belum ada pemain di leaderboard</p>
                    <p className="text-gray-400 text-xs">Mulai prediksi untuk masuk ranking!</p>
                </div>
            ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {leaders.map((user) => {
                        const posDisplay = getPositionDisplay(user.position);

                        return (
                            <div
                                key={user.email}
                                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${user.isCurrentUser
                                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-400 shadow-md'
                                        : `${posDisplay.bg} ${posDisplay.border} hover:shadow-sm`
                                    }`}
                            >
                                {/* Position */}
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${user.position <= 3
                                        ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {user.position <= 3 ? posDisplay.badge : user.position}
                                </div>

                                {/* Avatar & Name */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${user.isCurrentUser
                                                ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                                                : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                                            }`}>
                                            {(user.username || 'A')[0].toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-semibold text-sm truncate ${user.isCurrentUser ? 'text-blue-700' : 'text-gray-800'}`}>
                                                {maskUsername(user.username, user.isCurrentUser)}
                                                {user.isCurrentUser && <span className="ml-1 text-xs text-blue-500">(You)</span>}
                                            </p>
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs">{user.rankInfo.icon}</span>
                                                <span className={`text-xs font-medium ${user.rankInfo.color}`}>
                                                    {user.rankInfo.name}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="flex flex-col items-end gap-1">
                                    {/* Streak */}
                                    {user.streak > 0 && (
                                        <div className="flex items-center gap-1 text-orange-500">
                                            <span className="text-xs">🔥</span>
                                            <span className="text-xs font-medium">{user.streak}x</span>
                                        </div>
                                    )}

                                    {/* EXP */}
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs text-purple-500">⚡</span>
                                        <span className="text-sm font-bold text-purple-600">
                                            {user.totalExp.toLocaleString()} EXP
                                        </span>
                                    </div>

                                    {/* Accuracy */}
                                    {user.totalPredictions > 0 && (
                                        <div className="text-xs text-gray-500">
                                            {Math.round((user.correctPredictions / user.totalPredictions) * 100)}% acc
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Current User Position (if not in top list) */}
            {currentUser && !leaders.some(l => l.isCurrentUser) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Your Position:</p>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-400">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-sm text-gray-600">
                            #{currentUser.rank || '?'}
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-sm text-blue-700">{currentUser.name}</p>
                            <p className="text-xs text-gray-500">{currentUser.totalExp || 0} EXP</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Leaderboard;
