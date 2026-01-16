import React from 'react';
import { motion } from 'framer-motion';
import { getActiveEffect } from '../utils/avatarEffects';

const EnhancedAvatar = ({
    profile,
    level,
    streak = 0,
    totalWins = 0,
    size = 'md',
    showLevel = true,
    selectedEffect = null,
    onClick = null
}) => {
    const activeEffect = getActiveEffect(selectedEffect, level, streak, totalWins);

    const sizes = {
        sm: { avatar: 'w-12 h-12', level: 'w-6 h-6 text-xs', text: 'text-sm' },
        md: { avatar: 'w-20 h-20', level: 'w-8 h-8 text-sm', text: 'text-xl' },
        lg: { avatar: 'w-24 h-24', level: 'w-10 h-10 text-sm', text: 'text-2xl' },
        xl: { avatar: 'w-32 h-32', level: 'w-12 h-12 text-base', text: 'text-3xl' }
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
            whileHover={{ scale: onClick ? 1.05 : 1 }}
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
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
                    className={`absolute -bottom-1 -right-1 ${sizes[size].level} bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                >
                    {level}
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
            {streak >= 3 && (
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

export default EnhancedAvatar;
