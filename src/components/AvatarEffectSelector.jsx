import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUnlockedEffects, AVATAR_EFFECTS, STREAK_EFFECTS, MILESTONE_EFFECTS } from '../utils/avatarEffects';
import EnhancedAvatar from './EnhancedAvatar';

const AvatarEffectSelector = ({ profile, level, streak, totalWins, selectedEffect, onEffectChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('level');

    const unlockedEffects = getUnlockedEffects(level, streak, totalWins);

    const levelEffects = unlockedEffects.filter(e => Object.values(AVATAR_EFFECTS).includes(e));
    const streakEffects = unlockedEffects.filter(e => Object.values(STREAK_EFFECTS).includes(e));
    const milestoneEffects = unlockedEffects.filter(e => Object.values(MILESTONE_EFFECTS).includes(e));

    const tabs = [
        { id: 'level', label: 'Level Effects', icon: '⭐', effects: levelEffects },
        { id: 'streak', label: 'Streak Effects', icon: '🔥', effects: streakEffects },
        { id: 'milestone', label: 'Milestone', icon: '🏆', effects: milestoneEffects }
    ];

    return (
        <div className="relative">
            {/* Trigger Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-400 transition-colors flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <EnhancedAvatar
                    profile={profile}
                    level={level}
                    streak={streak}
                    totalWins={totalWins}
                    size="sm"
                    selectedEffect={selectedEffect}
                />
                <div className="text-left">
                    <div className="font-medium">Customize Avatar</div>
                    <div className="text-sm text-gray-500">
                        {unlockedEffects.length} effects unlocked
                    </div>
                </div>
                <span className="ml-auto">✨</span>
            </motion.button>

            {/* Effect Selector Modal */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* Tabs */}
                        <div className="flex border-b border-gray-200 dark:border-gray-700">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === tab.id
                                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                        }`}
                                >
                                    <span>{tab.icon}</span>
                                    <span className="hidden sm:inline">{tab.label}</span>
                                    <span className="bg-gray-200 dark:bg-gray-700 text-xs px-1.5 py-0.5 rounded-full">
                                        {tab.effects.length}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Effects Grid */}
                        <div className="p-4 max-h-64 overflow-y-auto">
                            <div className="grid grid-cols-1 gap-3">
                                {tabs.find(t => t.id === activeTab)?.effects.map((effect) => (
                                    <motion.button
                                        key={effect.id}
                                        onClick={() => {
                                            onEffectChange(effect.id);
                                            setIsOpen(false);
                                        }}
                                        className={`p-3 rounded-lg border transition-all text-left hover:shadow-md ${selectedEffect === effect.id
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                            }`}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <EnhancedAvatar
                                                profile={profile}
                                                level={level}
                                                size="sm"
                                                showLevel={false}
                                                selectedEffect={effect.id}
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">{effect.name}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {effect.description}
                                                </div>
                                                <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mt-1">
                                                    {effect.type === 'basic' && `Level ${effect.unlockLevel}`}
                                                    {effect.type === 'glow' && `Level ${effect.unlockLevel}`}
                                                    {effect.type === 'border' && `Level ${effect.unlockLevel}`}
                                                    {effect.type === 'premium' && `Level ${effect.unlockLevel}`}
                                                    {effect.type === 'legendary' && `Level ${effect.unlockLevel}`}
                                                    {effect.type === 'ultimate' && `Level ${effect.unlockLevel}`}
                                                    {effect.type === 'streak' && `${effect.unlockStreak} Win Streak`}
                                                    {effect.type === 'milestone' && `${effect.unlockWins} Total Wins`}
                                                </div>
                                            </div>
                                            {selectedEffect === effect.id && (
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

                                {tabs.find(t => t.id === activeTab)?.effects.length === 0 && (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        <div className="text-4xl mb-2">🔒</div>
                                        <div className="font-medium">No effects unlocked</div>
                                        <div className="text-sm">
                                            {activeTab === 'level' && `Reach level ${Object.values(AVATAR_EFFECTS)[1]?.unlockLevel || 5} to unlock effects`}
                                            {activeTab === 'streak' && `Get a 3 win streak to unlock effects`}
                                            {activeTab === 'milestone' && `Win 10 games to unlock milestone effects`}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Close Button */}
                        <div className="border-t border-gray-200 dark:border-gray-700 p-3">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AvatarEffectSelector;
