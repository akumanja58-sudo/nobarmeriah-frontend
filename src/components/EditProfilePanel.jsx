import { useState, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateLevel, getLevelTier, getXPProgress, getPointsToNextLevel } from '../utils/levelSystem';
import { getUnlockedEffects, getActiveEffect, AVATAR_EFFECTS, STREAK_EFFECTS, MILESTONE_EFFECTS } from '../utils/avatarEffects';
import React from 'react';

const EditProfilePanel = ({ isOpen, onClose, profile, onUpdate }) => {
    const [formData, setFormData] = useState({
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || '',
        bio: profile?.bio || '',
        avatar_url: profile?.avatar_url || '',
        selected_effect: profile?.selected_effect || 'none'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [showEffectSelector, setShowEffectSelector] = useState(false);
    const [activeTab, setActiveTab] = useState('level');
    const fileInputRef = useRef(null);

    // Calculate level data
    const currentLevel = calculateLevel(profile?.points || 0);
    const levelTier = getLevelTier(currentLevel);
    const xpProgress = getXPProgress(profile?.points || 0);
    const pointsToNext = getPointsToNextLevel(profile?.points || 0);
    const totalWins = profile?.total_wins || 0;

    // Get unlocked effects
    const unlockedEffects = getUnlockedEffects(currentLevel, profile?.streak || 0, totalWins);
    const levelEffects = unlockedEffects.filter(e => Object.values(AVATAR_EFFECTS).includes(e));
    const streakEffects = unlockedEffects.filter(e => Object.values(STREAK_EFFECTS).includes(e));
    const milestoneEffects = unlockedEffects.filter(e => Object.values(MILESTONE_EFFECTS).includes(e));

    const effectTabs = [
        { id: 'level', label: 'Level Effects', icon: '⭐', effects: levelEffects },
        { id: 'streak', label: 'Streak Effects', icon: '🔥', effects: streakEffects },
        { id: 'milestone', label: 'Milestone', icon: '🏆', effects: milestoneEffects }
    ];

    // Enhanced Avatar Component
    const EnhancedAvatar = ({ size = 'lg', showLevel = true, previewEffect = null }) => {
        const activeEffect = getActiveEffect(previewEffect || formData.selected_effect, currentLevel, profile?.streak || 0, totalWins);

        const sizes = {
            sm: { avatar: 'w-12 h-12', level: 'w-6 h-6 text-xs', text: 'text-sm' },
            md: { avatar: 'w-16 h-16', level: 'w-7 h-7 text-xs', text: 'text-lg' },
            lg: { avatar: 'w-24 h-24', level: 'w-10 h-10 text-sm', text: 'text-2xl' }
        };

        const getUserInitials = () => {
            if (formData.first_name && formData.last_name) {
                return `${formData.first_name[0]}${formData.last_name[0]}`.toUpperCase();
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
                    {formData.avatar_url ? (
                        <img
                            src={formData.avatar_url}
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
                {(profile?.streak || 0) >= 3 && (
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

    // Update form when profile changes
    React.useEffect(() => {
        if (profile) {
            setFormData({
                first_name: profile.first_name || '',
                last_name: profile.last_name || '',
                bio: profile.bio || '',
                avatar_url: profile.avatar_url || '',
                selected_effect: profile.selected_effect || 'none'
            });
        }
    }, [profile]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleEffectChange = (effectId) => {
        setFormData(prev => ({
            ...prev,
            selected_effect: effectId
        }));
        setShowEffectSelector(false);
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            setError('File size must be less than 2MB');
            return;
        }

        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${profile.id}-${Date.now()}.${fileExt}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            setFormData(prev => ({
                ...prev,
                avatar_url: publicUrl
            }));

            setMessage('Avatar uploaded successfully!');
        } catch (error) {
            setError('Failed to upload avatar: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Profile data:', profile);
        console.log('Profile user_id:', profile.user_id);
        console.log('Profile id:', profile.id);
        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    bio: formData.bio,
                    avatar_url: formData.avatar_url,
                    selected_effect: formData.selected_effect,
                })
                .eq('user_id', profile.user_id)

            if (error) {
                throw error;
            }

            onUpdate(formData);
            setMessage('Profile updated successfully!');

            setTimeout(() => {
                onClose();
            }, 1500);

        } catch (error) {
            setError('Failed to update profile: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-[60]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Slide Panel */}
                    <motion.div
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl z-[70] overflow-y-auto"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shadow-lg z-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">⚙️</span>
                                    <h2 className="text-xl font-bold">Edit Profile</h2>
                                </div>
                                <motion.button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <span className="text-lg font-bold">✕</span>
                                </motion.button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {/* Level Info Section */}
                            <motion.div
                                className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{levelTier.icon}</span>
                                        <div>
                                            <h3 className="font-bold text-lg" style={{ color: levelTier.color }}>
                                                Level {currentLevel}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {levelTier.name} Tier
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                            {profile?.points || 0} XP
                                        </div>
                                        {currentLevel < 100 && (
                                            <div className="text-xs text-gray-500">
                                                {pointsToNext} to next level
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* XP Progress Bar */}
                                {currentLevel < 100 && (
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <motion.div
                                            className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${xpProgress}%` }}
                                            transition={{ delay: 0.3, duration: 1 }}
                                        />
                                    </div>
                                )}

                                {currentLevel >= 100 && (
                                    <div className="text-center">
                                        <span className="text-yellow-500 font-bold">🏆 MAX LEVEL REACHED! 🏆</span>
                                    </div>
                                )}
                            </motion.div>

                            <form onSubmit={handleSubmit} className="space-y-6">

                                {/* Avatar Section */}
                                <motion.div
                                    className="text-center"
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <div className="relative inline-block mb-4">
                                        <EnhancedAvatar size="lg" />

                                        {/* Upload Button Overlay */}
                                        <motion.button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity"
                                            whileHover={{ scale: 1.05 }}
                                            disabled={isLoading}
                                        >
                                            <span className="text-2xl">📷</span>
                                        </motion.button>

                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarUpload}
                                            className="hidden"
                                        />
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Click avatar to change photo
                                    </p>
                                </motion.div>

                                {/* Avatar Effect Selector */}
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.25 }}
                                >
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        ✨ Avatar Effects
                                    </label>

                                    {/* Effect Selector Button */}
                                    <motion.button
                                        type="button"
                                        onClick={() => setShowEffectSelector(!showEffectSelector)}
                                        className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-400 transition-colors flex items-center justify-between"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <EnhancedAvatar size="sm" showLevel={false} />
                                            <div className="text-left">
                                                <div className="font-medium">Customize Effects</div>
                                                <div className="text-sm text-gray-500">
                                                    {unlockedEffects.length} effects unlocked
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-2xl">✨</span>
                                    </motion.button>

                                    {/* Effect Selector Modal */}
                                    <AnimatePresence>
                                        {showEffectSelector && (
                                            <motion.div
                                                className="mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden"
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                {/* Tabs */}
                                                <div className="flex border-b border-gray-200 dark:border-gray-700">
                                                    {effectTabs.map((tab) => (
                                                        <button
                                                            key={tab.id}
                                                            type="button"
                                                            onClick={() => setActiveTab(tab.id)}
                                                            className={`flex-1 px-3 py-2 text-xs font-medium flex items-center justify-center gap-1 transition-colors ${activeTab === tab.id
                                                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                                                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                                                }`}
                                                        >
                                                            <span>{tab.icon}</span>
                                                            <span className="hidden sm:inline">{tab.label}</span>
                                                            <span className="bg-gray-200 dark:bg-gray-700 text-xs px-1 py-0.5 rounded-full">
                                                                {tab.effects.length}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Effects Grid */}
                                                <div className="p-3 max-h-48 overflow-y-auto">
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {effectTabs.find(t => t.id === activeTab)?.effects.map((effect) => (
                                                            <motion.button
                                                                key={effect.id}
                                                                type="button"
                                                                onClick={() => handleEffectChange(effect.id)}
                                                                className={`p-2 rounded-lg border transition-all text-left hover:shadow-md ${formData.selected_effect === effect.id
                                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                                                    }`}
                                                                whileHover={{ scale: 1.02 }}
                                                                whileTap={{ scale: 0.98 }}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <EnhancedAvatar
                                                                        size="sm"
                                                                        showLevel={false}
                                                                        previewEffect={effect.id}
                                                                    />
                                                                    <div className="flex-1">
                                                                        <div className="font-medium text-xs">{effect.name}</div>
                                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                            {effect.description}
                                                                        </div>
                                                                    </div>
                                                                    {formData.selected_effect === effect.id && (
                                                                        <motion.div
                                                                            initial={{ scale: 0 }}
                                                                            animate={{ scale: 1 }}
                                                                            className="text-blue-500"
                                                                        >
                                                                            ✓
                                                                        </motion.div>
                                                                    )}
                                                                </div>
                                                            </motion.button>
                                                        ))}

                                                        {effectTabs.find(t => t.id === activeTab)?.effects.length === 0 && (
                                                            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                                                                <div className="text-2xl mb-1">🔒</div>
                                                                <div className="text-xs font-medium">No effects unlocked</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Close Button */}
                                                <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowEffectSelector(false)}
                                                        className="w-full py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                                                    >
                                                        Close
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>

                                {/* Form Fields */}
                                <motion.div
                                    className="space-y-4"
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    {/* Locked Username */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            🔒 Username (Locked)
                                        </label>
                                        <div className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 flex items-center justify-between">
                                            <span>{profile?.username}</span>
                                            <span className="text-xs bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 px-2 py-1 rounded-full">
                                                🔒 Locked
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Username cannot be changed for security reasons
                                        </p>
                                    </div>

                                    {/* Display Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            📝 Display Name (First Name)
                                        </label>
                                        <input
                                            type="text"
                                            name="first_name"
                                            value={formData.first_name}
                                            onChange={handleInputChange}
                                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            placeholder="Enter display name"
                                        />
                                    </div>

                                    {/* Last Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            📝 Last Name
                                        </label>
                                        <input
                                            type="text"
                                            name="last_name"
                                            value={formData.last_name}
                                            onChange={handleInputChange}
                                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            placeholder="Enter last name"
                                        />
                                    </div>

                                    {/* Bio */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            💬 Player Bio
                                        </label>
                                        <textarea
                                            name="bio"
                                            value={formData.bio}
                                            onChange={handleInputChange}
                                            rows={3}
                                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                            placeholder="Tell others about your gaming style..."
                                            maxLength={150}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            {formData.bio.length}/150 characters
                                        </p>
                                    </div>
                                </motion.div>

                                {/* Messages */}
                                {error && (
                                    <motion.div
                                        className="p-3 bg-red-50 border-l-4 border-red-400 text-red-700 rounded"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                    >
                                        {error}
                                    </motion.div>
                                )}

                                {message && (
                                    <motion.div
                                        className="p-3 bg-green-50 border-l-4 border-green-400 text-green-700 rounded"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                    >
                                        {message}
                                    </motion.div>
                                )}

                                {/* Action Buttons */}
                                <motion.div
                                    className="flex gap-3 pt-6"
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <motion.button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </motion.button>

                                    <motion.button
                                        type="submit"
                                        className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                💾 Save Changes
                                            </>
                                        )}
                                    </motion.button>
                                </motion.div>
                            </form>

                            {/* Effects Preview Info */}
                            <motion.div
                                className="mt-8 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-2 flex items-center gap-2">
                                    ✨ Unlock More Effects
                                </h3>
                                <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                                    <li>• 🔵 Blue Aura - Reach Level 5</li>
                                    <li>• 🔥 Fire Aura - Reach Level 20</li>
                                    <li>• 🥇 Gold Border - Reach Level 25</li>
                                    <li>• 💎 Diamond Shine - Reach Level 50</li>
                                    <li>• 🌈 Rainbow Glow - Reach Level 75</li>
                                    <li>• 👑 Champion Crown - Reach Level 100</li>
                                </ul>
                            </motion.div>

                            {/* Competitive Security Notice */}
                            <motion.div
                                className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                            >
                                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2 flex items-center gap-2">
                                    🛡️ Competitive Integrity
                                </h3>
                                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                                    <li>• Username is permanently locked for security</li>
                                    <li>• Level calculated from verified game results</li>
                                    <li>• Avatar effects unlock based on achievements</li>
                                    <li>• Fair play monitoring is active</li>
                                </ul>
                            </motion.div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default EditProfilePanel;