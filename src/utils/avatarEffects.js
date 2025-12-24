export const AVATAR_EFFECTS = {
    // Basic Effects (unlock by level)
    NONE: {
        id: 'none',
        name: 'Default',
        unlockLevel: 1,
        type: 'basic',
        description: 'Basic avatar appearance',
        css: {}
    },
    BLUE_GLOW: {
        id: 'blue_glow',
        name: 'Blue Aura',
        unlockLevel: 5,
        type: 'glow',
        description: 'Mystical blue energy',
        css: {
            boxShadow: '0 0 20px #3b82f6, 0 0 40px #3b82f6, 0 0 60px #3b82f6',
            animation: 'pulseBlue 2s infinite'
        }
    },
    GREEN_GLOW: {
        id: 'green_glow',
        name: 'Nature Aura',
        unlockLevel: 10,
        type: 'glow',
        description: 'Forest spirit energy',
        css: {
            boxShadow: '0 0 20px #22c55e, 0 0 40px #22c55e, 0 0 60px #22c55e',
            animation: 'pulseGreen 2s infinite'
        }
    },
    FIRE_AURA: {
        id: 'fire_aura',
        name: 'Fire Aura',
        unlockLevel: 20,
        type: 'glow',
        description: 'Blazing fire energy',
        css: {
            boxShadow: '0 0 20px #ef4444, 0 0 40px #f97316, 0 0 60px #fbbf24',
            animation: 'pulseFire 1.5s infinite'
        }
    },
    GOLD_BORDER: {
        id: 'gold_border',
        name: 'Golden Frame',
        unlockLevel: 25,
        type: 'border',
        description: 'Luxurious golden border',
        css: {
            border: '4px solid #ffd700',
            boxShadow: 'inset 0 0 20px rgba(255, 215, 0, 0.3), 0 0 20px rgba(255, 215, 0, 0.5)',
            animation: 'shimmerGold 3s infinite'
        }
    },
    DIAMOND_EFFECT: {
        id: 'diamond_effect',
        name: 'Diamond Shine',
        unlockLevel: 50,
        type: 'premium',
        description: 'Brilliant diamond sparkle',
        css: {
            background: 'linear-gradient(45deg, #ffffff, #e5e7eb, #ffffff)',
            boxShadow: '0 0 30px #ffffff, 0 0 60px #e5e7eb',
            animation: 'diamondShine 2s infinite'
        }
    },
    RAINBOW_GLOW: {
        id: 'rainbow_glow',
        name: 'Rainbow Aura',
        unlockLevel: 75,
        type: 'legendary',
        description: 'Mythical rainbow energy',
        css: {
            boxShadow: '0 0 20px #ff0000, 0 0 40px #00ff00, 0 0 60px #0000ff',
            animation: 'rainbowPulse 1s infinite'
        }
    },
    CHAMPION_CROWN: {
        id: 'champion_crown',
        name: 'Champion Crown',
        unlockLevel: 100,
        type: 'ultimate',
        description: 'Ultimate champion status',
        css: {
            boxShadow: '0 0 30px #ffd700, 0 0 60px #ffed4a, 0 0 90px #fff59d',
            border: '3px solid #ffd700',
            animation: 'championGlow 1.5s infinite, rotate360 10s infinite linear'
        }
    }
};

// Streak-based effects
export const STREAK_EFFECTS = {
    HOT_STREAK_3: {
        id: 'hot_streak_3',
        name: 'Hot Streak',
        unlockStreak: 3,
        type: 'streak',
        description: 'On fire! 3 wins in a row',
        css: {
            boxShadow: '0 0 15px #f97316, 0 0 30px #ea580c',
            animation: 'fireFlicker 0.5s infinite alternate'
        }
    },
    UNSTOPPABLE_5: {
        id: 'unstoppable_5',
        name: 'Unstoppable',
        unlockStreak: 5,
        type: 'streak',
        description: 'Unstoppable! 5 wins in a row',
        css: {
            boxShadow: '0 0 20px #dc2626, 0 0 40px #b91c1c, 0 0 60px #991b1b',
            animation: 'bloodRage 1s infinite'
        }
    },
    LEGENDARY_10: {
        id: 'legendary_10',
        name: 'Legendary',
        unlockStreak: 10,
        type: 'streak',
        description: 'LEGENDARY STREAK! 10+ wins!',
        css: {
            boxShadow: '0 0 30px #8b5cf6, 0 0 60px #7c3aed, 0 0 90px #6d28d9',
            border: '2px solid #8b5cf6',
            animation: 'legendaryPulse 0.8s infinite, floatUp 3s infinite ease-in-out'
        }
    }
};

// Win milestone effects
export const MILESTONE_EFFECTS = {
    WINNER_10: {
        id: 'winner_10',
        name: 'Winner',
        unlockWins: 10,
        type: 'milestone',
        description: '10 total wins achieved',
        css: {
            boxShadow: '0 0 15px #059669',
            animation: 'victoryGlow 2s infinite'
        }
    },
    CHAMPION_50: {
        id: 'champion_50',
        name: 'Champion',
        unlockWins: 50,
        type: 'milestone',
        description: '50 total wins achieved',
        css: {
            boxShadow: '0 0 25px #d97706, 0 0 50px #f59e0b',
            border: '2px solid #f59e0b',
            animation: 'championBadge 2.5s infinite'
        }
    },
    LEGEND_100: {
        id: 'legend_100',
        name: 'Living Legend',
        unlockWins: 100,
        type: 'milestone',
        description: '100 total wins! You are a legend!',
        css: {
            background: 'linear-gradient(45deg, #ffd700, #ffed4a, #ffd700)',
            boxShadow: '0 0 40px #ffd700, 0 0 80px #ffed4a',
            border: '3px solid #ffd700',
            animation: 'legendStatus 1s infinite, rotate360 15s infinite linear'
        }
    }
};

// CSS Animations (add to global CSS or component styles)
export const AVATAR_ANIMATIONS_CSS = `
@keyframes pulseBlue {
    0%, 100% { box-shadow: 0 0 20px #3b82f6, 0 0 40px #3b82f6; }
    50% { box-shadow: 0 0 30px #3b82f6, 0 0 60px #3b82f6, 0 0 80px #3b82f6; }
}

@keyframes pulseGreen {
    0%, 100% { box-shadow: 0 0 20px #22c55e, 0 0 40px #22c55e; }
    50% { box-shadow: 0 0 30px #22c55e, 0 0 60px #22c55e, 0 0 80px #22c55e; }
}

@keyframes pulseFire {
    0%, 100% { box-shadow: 0 0 20px #ef4444, 0 0 40px #f97316; }
    50% { box-shadow: 0 0 30px #ef4444, 0 0 60px #f97316, 0 0 80px #fbbf24; }
}

@keyframes shimmerGold {
    0% { box-shadow: inset 0 0 20px rgba(255, 215, 0, 0.3), 0 0 20px rgba(255, 215, 0, 0.5); }
    50% { box-shadow: inset 0 0 30px rgba(255, 215, 0, 0.5), 0 0 40px rgba(255, 215, 0, 0.8); }
    100% { box-shadow: inset 0 0 20px rgba(255, 215, 0, 0.3), 0 0 20px rgba(255, 215, 0, 0.5); }
}

@keyframes diamondShine {
    0%, 100% { box-shadow: 0 0 30px #ffffff, 0 0 60px #e5e7eb; }
    50% { box-shadow: 0 0 50px #ffffff, 0 0 100px #f3f4f6, 0 0 150px #ffffff; }
}

@keyframes rainbowPulse {
    0% { box-shadow: 0 0 20px #ff0000, 0 0 40px #ff0000; }
    16% { box-shadow: 0 0 20px #ff8000, 0 0 40px #ff8000; }
    33% { box-shadow: 0 0 20px #ffff00, 0 0 40px #ffff00; }
    50% { box-shadow: 0 0 20px #00ff00, 0 0 40px #00ff00; }
    66% { box-shadow: 0 0 20px #0080ff, 0 0 40px #0080ff; }
    83% { box-shadow: 0 0 20px #8000ff, 0 0 40px #8000ff; }
    100% { box-shadow: 0 0 20px #ff0000, 0 0 40px #ff0000; }
}

@keyframes championGlow {
    0%, 100% { box-shadow: 0 0 30px #ffd700, 0 0 60px #ffed4a; }
    50% { box-shadow: 0 0 50px #ffd700, 0 0 100px #ffed4a, 0 0 150px #fff59d; }
}

@keyframes fireFlicker {
    0% { box-shadow: 0 0 15px #f97316, 0 0 30px #ea580c; }
    100% { box-shadow: 0 0 25px #f97316, 0 0 50px #ea580c, 0 0 75px #dc2626; }
}

@keyframes bloodRage {
    0%, 100% { box-shadow: 0 0 20px #dc2626, 0 0 40px #b91c1c; }
    50% { box-shadow: 0 0 40px #dc2626, 0 0 80px #b91c1c, 0 0 120px #991b1b; }
}

@keyframes legendaryPulse {
    0%, 100% { box-shadow: 0 0 30px #8b5cf6, 0 0 60px #7c3aed; }
    50% { box-shadow: 0 0 50px #8b5cf6, 0 0 100px #7c3aed, 0 0 150px #6d28d9; }
}

@keyframes floatUp {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
}

@keyframes victoryGlow {
    0%, 100% { box-shadow: 0 0 15px #059669; }
    50% { box-shadow: 0 0 30px #059669, 0 0 45px #10b981; }
}

@keyframes championBadge {
    0%, 100% { box-shadow: 0 0 25px #d97706, 0 0 50px #f59e0b; }
    50% { box-shadow: 0 0 40px #d97706, 0 0 80px #f59e0b, 0 0 120px #fbbf24; }
}

@keyframes legendStatus {
    0%, 100% { box-shadow: 0 0 40px #ffd700, 0 0 80px #ffed4a; }
    50% { box-shadow: 0 0 60px #ffd700, 0 0 120px #ffed4a, 0 0 180px #fff59d; }
}

@keyframes rotate360 {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
`;

// Effect checker functions
export const getUnlockedEffects = (level, streak, totalWins) => {
    const unlockedEffects = [];

    // Level-based effects
    Object.values(AVATAR_EFFECTS).forEach(effect => {
        if (level >= effect.unlockLevel) {
            unlockedEffects.push(effect);
        }
    });

    // Streak-based effects
    Object.values(STREAK_EFFECTS).forEach(effect => {
        if (streak >= effect.unlockStreak) {
            unlockedEffects.push(effect);
        }
    });

    // Milestone-based effects
    Object.values(MILESTONE_EFFECTS).forEach(effect => {
        if (totalWins >= effect.unlockWins) {
            unlockedEffects.push(effect);
        }
    });

    return unlockedEffects;
};

export const getActiveEffect = (selectedEffectId, level, streak, totalWins) => {
    const unlockedEffects = getUnlockedEffects(level, streak, totalWins);

    // If no effect selected, return highest priority unlocked effect
    if (!selectedEffectId) {
        // Priority: Ultimate > Legendary > Premium > Streak > Milestone > Glow > Border > Basic
        const priorities = ['ultimate', 'legendary', 'premium', 'streak', 'milestone', 'glow', 'border', 'basic'];

        for (const priority of priorities) {
            const effect = unlockedEffects.find(e => e.type === priority);
            if (effect) return effect;
        }

        return AVATAR_EFFECTS.NONE;
    }

    // Check if selected effect is unlocked
    const selectedEffect = unlockedEffects.find(e => e.id === selectedEffectId);
    return selectedEffect || AVATAR_EFFECTS.NONE;
};