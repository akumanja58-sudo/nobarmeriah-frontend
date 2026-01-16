import { supabase } from './supabaseClient';

// Season System
export const SEASONS = {
    S1_2025: {
        id: 'S1_2025',
        name: 'Season 1 - 2025',
        startDate: '2025-01-01',
        endDate: '2025-03-31',
        rewards: {
            rank_bronze: { title: 'Bronze Warrior', avatar_border: 'bronze_border' },
            rank_silver: { title: 'Silver Guardian', avatar_border: 'silver_border' },
            rank_gold: { title: 'Golden Champion', avatar_border: 'gold_border' },
            rank_platinum: { title: 'Platinum Elite', avatar_border: 'platinum_border' },
            rank_diamond: { title: 'Diamond Legend', avatar_border: 'diamond_border' }
        }
    }
};

// Title System
export const TITLES = {
    // Achievement-based titles
    FIRST_BLOOD: {
        id: 'first_blood',
        name: 'First Blood',
        description: 'Won your first match',
        icon: '🩸',
        rarity: 'common',
        unlockCondition: { type: 'wins', value: 1 }
    },
    KILLER_STREAK: {
        id: 'killer_streak',
        name: 'Killer Streak',
        description: 'Won 5 matches in a row',
        icon: '💀',
        rarity: 'rare',
        unlockCondition: { type: 'streak', value: 5 }
    },
    SAVAGE: {
        id: 'savage',
        name: 'Savage',
        description: 'Reached level 50',
        icon: '🔥',
        rarity: 'epic',
        unlockCondition: { type: 'level', value: 50 }
    },
    LEGEND: {
        id: 'legend',
        name: 'Living Legend',
        description: 'Won 100 total matches',
        icon: '👑',
        rarity: 'legendary',
        unlockCondition: { type: 'total_wins', value: 100 }
    },
    MYTHIC: {
        id: 'mythic',
        name: 'Mythic Glory',
        description: 'Reached level 100',
        icon: '🌟',
        rarity: 'mythic',
        unlockCondition: { type: 'level', value: 100 }
    }
};

// Badge Collection System
export const BADGES = {
    // Performance badges
    WINRATE_MASTER: {
        id: 'winrate_master',
        name: 'Win Rate Master',
        description: 'Maintain 80%+ win rate with 20+ matches',
        icon: '📊',
        category: 'performance'
    },
    COMEBACK_KING: {
        id: 'comeback_king',
        name: 'Comeback King',
        description: 'Won 10 matches after losing streak',
        icon: '↗️',
        category: 'performance'
    },
    CONSISTENCY: {
        id: 'consistency',
        name: 'Mr. Consistent',
        description: 'Play 30 days in a row',
        icon: '📅',
        category: 'dedication'
    },
    EARLY_BIRD: {
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Beta tester achievement',
        icon: '🐦',
        category: 'special'
    }
};

// Profile Theme System
export const PROFILE_THEMES = {
    DEFAULT: {
        id: 'default',
        name: 'Default',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        unlockLevel: 1
    },
    FIRE: {
        id: 'fire',
        name: 'Blazing Fire',
        background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
        unlockLevel: 20
    },
    OCEAN: {
        id: 'ocean',
        name: 'Deep Ocean',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        unlockLevel: 35
    },
    GALAXY: {
        id: 'galaxy',
        name: 'Galaxy',
        background: 'linear-gradient(135deg, #8360c3 0%, #2ebf91 100%)',
        unlockLevel: 50
    },
    LEGENDARY: {
        id: 'legendary',
        name: 'Legendary',
        background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        unlockLevel: 75
    }
};

// Enhanced Profile Analytics
export class ProfileAnalytics {
    constructor(userId) {
        this.userId = userId;
    }

    async getDetailedStats() {
        try {
            // Get user profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', this.userId)
                .single();

            // Get match history
            const { data: matches } = await supabase
                .from('game_results')
                .select('*')
                .eq('user_id', this.userId)
                .order('created_at', { ascending: false });

            // Calculate advanced stats
            const stats = this.calculateAdvancedStats(profile, matches);

            return stats;
        } catch (error) {
            console.error('Error getting profile analytics:', error);
            return null;
        }
    }

    calculateAdvancedStats(profile, matches) {
        const totalMatches = matches?.length || 0;
        const wins = matches?.filter(m => m.result === 'WIN').length || 0;
        const losses = matches?.filter(m => m.result === 'LOSS').length || 0;
        const draws = matches?.filter(m => m.result === 'DRAW').length || 0;

        // Win rate
        const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

        // Best streak calculation
        let bestStreak = 0;
        let currentStreak = 0;

        matches?.forEach(match => {
            if (match.result === 'WIN') {
                currentStreak++;
                bestStreak = Math.max(bestStreak, currentStreak);
            } else {
                currentStreak = 0;
            }
        });

        // Recent performance (last 10 matches)
        const recentMatches = matches?.slice(0, 10) || [];
        const recentWins = recentMatches.filter(m => m.result === 'WIN').length;
        const recentWinRate = recentMatches.length > 0 ? Math.round((recentWins / recentMatches.length) * 100) : 0;

        // Activity analysis
        const today = new Date();
        const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const weeklyMatches = matches?.filter(m => new Date(m.created_at) >= lastWeek).length || 0;

        // Rank progression
        const level = Math.min(Math.floor((profile?.points || 0) / 10) + 1, 100);
        const pointsToNext = level < 100 ? (level * 10) - (profile?.points || 0) : 0;

        return {
            profile,
            level,
            totalMatches,
            wins,
            losses,
            draws,
            winRate,
            bestStreak,
            currentStreak: profile?.streak || 0,
            recentWinRate,
            weeklyMatches,
            pointsToNext,
            // Performance ratings
            performance: {
                overall: this.calculateOverallRating(winRate, totalMatches, bestStreak),
                recent: this.calculateRecentRating(recentWinRate, recentMatches.length),
                consistency: this.calculateConsistencyRating(weeklyMatches, matches?.length || 0)
            }
        };
    }

    calculateOverallRating(winRate, totalMatches, bestStreak) {
        let rating = 0;

        // Win rate contribution (0-40 points)
        rating += (winRate / 100) * 40;

        // Experience contribution (0-30 points)
        rating += Math.min(totalMatches / 50, 1) * 30;

        // Best streak contribution (0-30 points)
        rating += Math.min(bestStreak / 10, 1) * 30;

        return Math.round(rating);
    }

    calculateRecentRating(recentWinRate, recentMatchCount) {
        if (recentMatchCount === 0) return 0;
        return Math.round((recentWinRate / 100) * 100);
    }

    calculateConsistencyRating(weeklyMatches, totalMatches) {
        if (totalMatches === 0) return 0;
        const activityRatio = Math.min(weeklyMatches / 7, 1); // Max 1 match per day
        return Math.round(activityRatio * 100);
    }
}