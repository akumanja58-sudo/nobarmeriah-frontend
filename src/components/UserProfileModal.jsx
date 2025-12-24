import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateLevel, getLevelTier, getXPProgress, getPointsToNextLevel } from '../utils/levelSystem';
import { getActiveEffect } from '../utils/avatarEffects';
import { ProfileAnalytics } from '../utils/profileSystem'; // ← Import ProfileAnalytics
import React from 'react';
import EditProfilePanel from './EditProfilePanel';
import StatsModal from './StatsModal';

const UserProfileModal = ({ isOpen, onClose, user }) => {
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState(null); // ← Use consistent stats
    const [showEditPanel, setShowEditPanel] = useState(false);
    const [showStatsModal, setShowStatsModal] = useState(false);

    useEffect(() => {
        if (isOpen && user?.email) fetchProfile();
    }, [isOpen, user]);

    const fetchProfile = async () => {
        try {
            // First, get current user profile
            const { data: currentProfile, error: profileError } = await supabase
                .from('profiles')
                .select('user_id, email, username, points, streak, first_name, last_name, avatar_url, bio, selected_effect, total_wins')
                .eq('email', user.email)
                .single();

            if (profileError) {
                console.error("Profile error:", profileError);
                return;
            }

            // Then get rank (only get count, not all data)
            const { count, error: countError } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .gt('points', currentProfile.points);

            const rank = (count || 0) + 1;

            setProfile({
                ...currentProfile,
                rank: `#${rank}`
            });

            // ✅ PERBAIKAN: Use real stats instead of random
            await fetchRealStats(currentProfile);

        } catch (error) {
            console.error("Fetch profile error:", error);
        }
    };

    // ✅ PERBAIKAN: Function untuk fetch real stats
    const fetchRealStats = async (profile) => {
        try {
            // Get actual match results from predictions table
            const { data: winnerPreds } = await supabase
                .from('winner_predictions')
                .select('points_earned, match_id')
                .eq('email', profile.email);

            // Get score predictions  
            const { data: scorePreds } = await supabase
                .from('score_predictions')
                .select('points_earned, match_id')
                .eq('email', profile.email);

            // Combine both
            const predictions = [...(winnerPreds || []), ...(scorePreds || [])];
            if (!winnerPreds && !scorePreds) {
                console.log("No predictions found");
                setStats(calculateFallbackStats(profile));
                return;
            }

            // Calculate real stats
            const totalMatches = predictions?.length || 0;
            const wins = predictions?.filter(p => (p.points_earned || 0) > 0).length || 0;
            const losses = totalMatches - wins;

            // Calculate win rate consistently
            const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

            setStats({
                totalMatches,
                wins,
                losses,
                winRate,
                // Add more stats
                totalPoints: profile.points || 0,
                bestStreak: profile.streak || 0,
                currentStreak: profile.streak || 0
            });

        } catch (error) {
            console.error("Error calculating real stats:", error);
            setStats(calculateFallbackStats(profile));
        }
    };

    // ✅ PERBAIKAN: Consistent fallback calculation
    const calculateFallbackStats = (profile) => {
        // Use profile data to create consistent stats
        const level = calculateLevel(profile.points || 0);
        const estimatedMatches = Math.max(Math.floor(level / 2), 1); // Consistent based on level
        const wins = profile.total_wins || Math.floor(estimatedMatches * 0.6); // 60% win rate assumption
        const winRate = estimatedMatches > 0 ? Math.round((wins / estimatedMatches) * 100) : 0;

        return {
            totalMatches: estimatedMatches,
            wins,
            losses: estimatedMatches - wins,
            winRate,
            totalPoints: profile.points || 0,
            bestStreak: profile.streak || 0,
            currentStreak: profile.streak || 0
        };
    };

    // Enhanced Avatar Component (same as before)
    const EnhancedAvatar = ({ size = 'lg', showLevel = true }) => {
        if (!profile) return null;

        const currentLevel = calculateLevel(profile.points || 0);
        const levelTier = getLevelTier(currentLevel);
        const totalWins = profile.total_wins || 0;
        const activeEffect = getActiveEffect(profile.selected_effect, currentLevel, profile.streak || 0, totalWins);

        const sizes = {
            sm: { avatar: 'w-12 h-12', level: 'w-6 h-6 text-xs', text: 'text-sm' },
            md: { avatar: 'w-16 h-16', level: 'w-7 h-7 text-xs', text: 'text-lg' },
            lg: { avatar: 'w-20 h-20', level: 'w-8 h-8 text-sm', text: 'text-xl' },
            xl: { avatar: 'w-24 h-24', level: 'w-10 h-10 text-sm', text: 'text-2xl' }
        };

        const getUserInitials = () => {
            if (profile?.first_name && profile?.last_name) {
                return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
            } else if (profile?.username) {
                return profile.username.slice(0, 2).toUpperCase();
            }
            return 'U';
        };

        return (
            <motion.div
                className="relative inline-block"
                whileHover={{ scale: 1.05 }}
            >
                {/* Avatar Container with Effects */}
                <div
                    className={`${sizes[size].avatar} rounded-full relative`}
                    style={activeEffect?.css || {}}
                >
                    {profile?.avatar_url ? (
                        <img
                            src={profile.avatar_url}
                            alt="Avatar"
                            className="w-full h-full rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                            <span className={sizes[size].text}>{getUserInitials()}</span>
                        </div>
                    )}

                    {/* Effect Overlay for special effects */}
                    {(activeEffect?.type === 'legendary' || activeEffect?.type === 'ultimate') && (
                        <div className="absolute inset-0 rounded-full pointer-events-none">
                            {/* Sparkle effects */}
                            <div className="absolute top-1 right-2 w-2 h-2 bg-white rounded-full animate-ping"></div>
                            <div className="absolute bottom-2 left-1 w-1 h-1 bg-yellow-300 rounded-full animate-pulse"></div>
                            <div className="absolute top-3 left-3 w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce"></div>
                        </div>
                    )}
                </div>

                {/* Level Badge */}
                {showLevel && (
                    <motion.div
                        className={`absolute -bottom-1 -right-1 ${sizes[size].level} rounded-full flex items-center justify-center text-white font-bold shadow-lg`}
                        style={{ backgroundColor: levelTier.color }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                    >
                        {currentLevel}
                    </motion.div>
                )}

                {/* Active Effect Badge */}
                {activeEffect && activeEffect.id !== 'none' && (
                    <motion.div
                        className="absolute -top-2 -left-2 bg-black/80 text-white text-xs px-2 py-1 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-300"
                        initial={{ y: -10, opacity: 0 }}
                        whileHover={{ y: 0, opacity: 1 }}
                    >
                        {activeEffect.name}
                    </motion.div>
                )}

                {/* Streak Fire Indicator */}
                {(profile.streak || 0) >= 3 && (
                    <motion.div
                        className="absolute -top-1 -right-1 text-lg"
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                    >
                        🔥
                    </motion.div>
                )}
            </motion.div>
        );
    };

    // Get achievements based on points and streak
    const getAchievements = () => {
        const achievements = [];
        if (profile?.points > 0) achievements.push({ icon: '🥇', name: 'First Goal', color: 'yellow' });
        if (profile?.points >= 5) achievements.push({ icon: '⚽', name: 'Rookie Player', color: 'green' });
        if (profile?.points >= 10) achievements.push({ icon: '📈', name: 'Rising Star', color: 'blue' });
        if (profile?.streak >= 3) achievements.push({ icon: '🔥', name: 'Hot Streak', color: 'red' });
        if (stats?.winRate >= 60) achievements.push({ icon: '👑', name: 'Champion', color: 'purple' });
        return achievements;
    };

    // Handle profile update from EditProfilePanel
    const handleProfileUpdate = (updatedProfile) => {
        setProfile(prev => ({ ...prev, ...updatedProfile }));
    };

    // Handle button clicks
    const handleEditProfile = () => {
        setShowEditPanel(true);
    };

    const handleViewStats = () => {
        setShowStatsModal(true);
    };

    if (!isOpen) return null;

    return (
        <>
            <AnimatePresence>
                <motion.div
                    className="fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center px-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="relative w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto"
                        initial={{ y: 50, opacity: 0, scale: 0.9 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 50, opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.4, type: 'spring', damping: 25 }}
                    >
                        {/* Stadium Card Container */}
                        <div className="relative bg-gradient-to-b from-green-600 via-green-700 to-green-800 rounded-2xl p-4 sm:p-6 text-white overflow-hidden shadow-2xl mx-2 sm:mx-0">

                            {/* Grass Texture Overlay */}
                            <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
                                backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px),
                                                repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.05) 1px, rgba(255,255,255,0.05) 2px)`
                            }}></div>

                            {/* Stadium Lights */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-40 pointer-events-none"></div>
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-40 pointer-events-none"></div>

                            {/* Close Button */}
                            <motion.button
                                className="absolute top-4 right-4 w-10 h-10 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-all duration-200 z-50 cursor-pointer"
                                onClick={onClose}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                style={{ zIndex: 9999 }}
                            >
                                <span className="text-white font-bold text-lg pointer-events-none">✕</span>
                            </motion.button>

                            {/* Header with Football Icons */}
                            <motion.div
                                className="text-center mb-4 sm:mb-6 relative z-10"
                                initial={{ y: -20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2, duration: 0.6 }}
                            >
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <motion.span
                                        className="text-xl sm:text-2xl"
                                        animate={{ rotate: [0, 360] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    >⚽</motion.span>
                                    <h2 className="text-lg sm:text-xl font-bold">Player Profile</h2>
                                    <motion.span
                                        className="text-xl sm:text-2xl"
                                        animate={{ rotate: [360, 0] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    >⚽</motion.span>
                                </div>
                                {/* Pitch Line */}
                                <div className="h-0.5 bg-white bg-opacity-80 relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"></div>
                                </div>
                            </motion.div>

                            {!profile || !stats ? (
                                <motion.div
                                    className="text-center py-8"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <div className="animate-spin text-4xl mb-4">⚽</div>
                                    <p className="text-white/80">Loading player data...</p>
                                </motion.div>
                            ) : (
                                <>
                                    {/* Avatar Section with Effects */}
                                    <motion.div
                                        className="text-center mb-4 sm:mb-6 relative z-10"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
                                    >
                                        <div className="relative inline-block mb-3">
                                            <EnhancedAvatar size="lg" />
                                        </div>

                                        <h3 className="text-lg sm:text-xl font-bold mb-1">{profile.username}</h3>
                                        {profile?.bio && (
                                            <p className="text-sm text-white/80 mb-2">{profile.bio}</p>
                                        )}

                                        {/* Rank Badge */}
                                        <motion.div
                                            className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black rounded-full text-xs sm:text-sm font-semibold shadow-lg"
                                            whileHover={{ scale: 1.05 }}
                                        >
                                            <span className="text-sm sm:text-lg">🏆</span>
                                            <span>Rank {profile.rank}</span>
                                        </motion.div>
                                    </motion.div>

                                    {/* Player Stats Grid - ✅ NOW USING CONSISTENT STATS */}
                                    <motion.div
                                        className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6 relative z-10"
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.4, duration: 0.6 }}
                                    >
                                        {/* Goals (Points) */}
                                        <motion.div
                                            className="bg-white/20 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center border border-white/30"
                                            whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.3)" }}
                                        >
                                            <div className="text-xl sm:text-2xl mb-1">⚽</div>
                                            <motion.div
                                                className="text-xl sm:text-2xl font-bold text-green-300"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: 0.6, type: "spring" }}
                                            >
                                                {stats.totalPoints}
                                            </motion.div>
                                            <div className="text-xs text-white/80">Goals</div>
                                        </motion.div>

                                        {/* Streak */}
                                        <motion.div
                                            className="bg-white/20 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center border border-white/30"
                                            whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.3)" }}
                                        >
                                            <div className="text-xl sm:text-2xl mb-1">🔥</div>
                                            <motion.div
                                                className="text-xl sm:text-2xl font-bold text-orange-300"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: 0.7, type: "spring" }}
                                            >
                                                {stats.currentStreak}x
                                            </motion.div>
                                            <div className="text-xs text-white/80">Streak</div>
                                        </motion.div>

                                        {/* Matches */}
                                        <motion.div
                                            className="bg-white/20 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center border border-white/30"
                                            whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.3)" }}
                                        >
                                            <div className="text-xl sm:text-2xl mb-1">🏟️</div>
                                            <motion.div
                                                className="text-xl sm:text-2xl font-bold text-blue-300"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: 0.8, type: "spring" }}
                                            >
                                                {stats.totalMatches}
                                            </motion.div>
                                            <div className="text-xs text-white/80">Matches</div>
                                        </motion.div>

                                        {/* Win Rate - ✅ NOW CONSISTENT */}
                                        <motion.div
                                            className="bg-white/20 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center border border-white/30"
                                            whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.3)" }}
                                        >
                                            <div className="text-xl sm:text-2xl mb-1">📊</div>
                                            <motion.div
                                                className="text-xl sm:text-2xl font-bold text-yellow-300"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: 0.9, type: "spring" }}
                                            >
                                                {stats.winRate}%
                                            </motion.div>
                                            <div className="text-xs text-white/80">Win Rate</div>
                                        </motion.div>
                                    </motion.div>

                                    {/* Contact Info */}
                                    <motion.div
                                        className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/30 relative z-10"
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.5, duration: 0.6 }}
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="text-lg">📧</span>
                                            <div>
                                                <div className="text-sm text-white/80">Email</div>
                                                <div className="font-medium text-sm">{profile.email}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">👤</span>
                                            <div>
                                                <div className="text-sm text-white/80">Username</div>
                                                <div className="font-medium text-sm">{profile.username}</div>
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Achievements */}
                                    {getAchievements().length > 0 && (
                                        <motion.div
                                            className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/30 relative z-10"
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.6, duration: 0.6 }}
                                        >
                                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                                                <span className="text-lg">🏆</span>
                                                <span>Achievements</span>
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {getAchievements().map((achievement, index) => (
                                                    <motion.span
                                                        key={index}
                                                        className={`bg-${achievement.color}-500/20 text-${achievement.color}-300 px-2 py-1 rounded-full text-xs font-medium border border-${achievement.color}-500/30`}
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{ delay: 0.7 + index * 0.1, type: "spring" }}
                                                        whileHover={{ scale: 1.1 }}
                                                    >
                                                        {achievement.icon} {achievement.name}
                                                    </motion.span>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Action Buttons */}
                                    <motion.div
                                        className="flex gap-2 sm:gap-3 relative z-10"
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.7, duration: 0.6 }}
                                    >
                                        <motion.button
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 sm:py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleEditProfile}
                                        >
                                            <span>⚙️</span>
                                            <span className="text-xs sm:text-sm">Edit Profile</span>
                                        </motion.button>
                                        <motion.button
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 sm:py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleViewStats}
                                        >
                                            <span>📊</span>
                                            <span className="text-xs sm:text-sm">View Stats</span>
                                        </motion.button>
                                    </motion.div>
                                </>
                            )}

                            {/* Grass Pattern Bottom */}
                            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-green-900/50 to-transparent"></div>
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>

            {/* Edit Profile Panel */}
            <EditProfilePanel
                isOpen={showEditPanel}
                onClose={() => setShowEditPanel(false)}
                profile={profile}
                onUpdate={handleProfileUpdate}
            />

            {/* Stats Modal - ✅ PASS CONSISTENT STATS */}
            <StatsModal
                isOpen={showStatsModal}
                onClose={() => setShowStatsModal(false)}
                profile={profile}
                stats={stats} // ← Pass consistent stats object
            />
        </>
    );
};

export default UserProfileModal;