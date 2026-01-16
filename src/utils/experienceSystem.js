// ============================================================
// experienceSystem.js - Rank & Points System untuk Challenge
// Simpan di: src/utils/experienceSystem.js
// ============================================================

// 🏆 RANK TIERS - Based on Total Experience
export const RANK_TIERS = [
    {
        name: 'Bronze',
        minExp: 0,
        maxExp: 99,
        color: 'text-amber-700',
        bgColor: 'bg-amber-100',
        borderColor: 'border-amber-500',
        icon: '🥉',
        badge: '/images/badges/bronze.png'
    },
    {
        name: 'Silver',
        minExp: 100,
        maxExp: 499,
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
        borderColor: 'border-gray-400',
        icon: '🥈',
        badge: '/images/badges/silver.png'
    },
    {
        name: 'Gold',
        minExp: 500,
        maxExp: 999,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        borderColor: 'border-yellow-500',
        icon: '🥇',
        badge: '/images/badges/gold.png'
    },
    {
        name: 'Platinum',
        minExp: 1000,
        maxExp: 1999,
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-100',
        borderColor: 'border-cyan-500',
        icon: '💎',
        badge: '/images/badges/platinum.png'
    },
    {
        name: 'Diamond',
        minExp: 2000,
        maxExp: 3999,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        borderColor: 'border-blue-500',
        icon: '💠',
        badge: '/images/badges/diamond.png'
    },
    {
        name: 'Master',
        minExp: 4000,
        maxExp: 7999,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        borderColor: 'border-purple-500',
        icon: '👑',
        badge: '/images/badges/master.png'
    },
    {
        name: 'Legend',
        minExp: 8000,
        maxExp: 14999,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        borderColor: 'border-orange-500',
        icon: '🔥',
        badge: '/images/badges/legend.png'
    },
    {
        name: 'Mythic',
        minExp: 15000,
        maxExp: 99999,
        color: 'text-red-600',
        bgColor: 'bg-gradient-to-r from-red-100 to-orange-100',
        borderColor: 'border-red-500',
        icon: '⚡',
        badge: '/images/badges/mythic.png'
    }
];

// 🎯 BIG MATCH LEAGUES - Get bonus EXP
export const BIG_MATCH_LEAGUES = [
    'UEFA Champions League',
    'UEFA Europa League',
    'UEFA Europa Conference League',
    'Premier League',
    'La Liga',
    'Serie A',
    'Bundesliga',
    'Ligue 1',
    'FIFA World Cup',
    'UEFA European Championship',
    'Copa America',
    'Copa Libertadores',
    'Liga 1' // Indonesia
];

// 🔥 BIG MATCH TEAMS - Derby matches
export const BIG_MATCH_TEAMS = [
    // El Clasico
    { home: 'Real Madrid', away: 'Barcelona' },
    { home: 'Barcelona', away: 'Real Madrid' },
    // Manchester Derby
    { home: 'Manchester United', away: 'Manchester City' },
    { home: 'Manchester City', away: 'Manchester United' },
    // North London Derby
    { home: 'Arsenal', away: 'Tottenham' },
    { home: 'Tottenham', away: 'Arsenal' },
    // Milan Derby
    { home: 'AC Milan', away: 'Inter' },
    { home: 'Inter', away: 'AC Milan' },
    // Der Klassiker
    { home: 'Bayern Munich', away: 'Borussia Dortmund' },
    { home: 'Borussia Dortmund', away: 'Bayern Munich' },
    // Merseyside Derby
    { home: 'Liverpool', away: 'Everton' },
    { home: 'Everton', away: 'Liverpool' },
    // Indonesia Derbies
    { home: 'Persija', away: 'Persib' },
    { home: 'Persib', away: 'Persija' },
    { home: 'Arema', away: 'Persebaya' },
    { home: 'Persebaya', away: 'Arema' }
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get rank tier from experience points
 * @param {number} exp - Total experience points
 * @returns {object} Rank tier object
 */
export const getRankFromExp = (exp) => {
    const expNum = exp || 0;

    for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
        if (expNum >= RANK_TIERS[i].minExp) {
            return RANK_TIERS[i];
        }
    }

    return RANK_TIERS[0]; // Default Bronze
};

/**
 * Get next rank tier
 * @param {number} exp - Current experience points
 * @returns {object|null} Next rank tier or null if max
 */
export const getNextRank = (exp) => {
    const currentRank = getRankFromExp(exp);
    const currentIndex = RANK_TIERS.findIndex(r => r.name === currentRank.name);

    if (currentIndex < RANK_TIERS.length - 1) {
        return RANK_TIERS[currentIndex + 1];
    }

    return null; // Already at max rank
};

/**
 * Calculate progress to next rank (percentage)
 * @param {number} exp - Current experience points
 * @returns {number} Progress percentage (0-100)
 */
export const getRankProgress = (exp) => {
    const expNum = exp || 0;
    const currentRank = getRankFromExp(expNum);
    const nextRank = getNextRank(expNum);

    if (!nextRank) return 100; // Max rank

    const expInCurrentRank = expNum - currentRank.minExp;
    const expNeededForNext = nextRank.minExp - currentRank.minExp;

    return Math.min(100, Math.round((expInCurrentRank / expNeededForNext) * 100));
};

/**
 * Check if match is a "big match" (bonus EXP)
 * @param {object} match - Match object with league, home_team, away_team
 * @returns {boolean}
 */
export const isBigMatch = (match) => {
    if (!match) return false;

    // Check if league is big
    const league = match.league || '';
    const isTopLeague = BIG_MATCH_LEAGUES.some(l =>
        league.toLowerCase().includes(l.toLowerCase())
    );

    if (isTopLeague) return true;

    // Check if it's a derby match
    const homeTeam = (match.home_team || '').toLowerCase();
    const awayTeam = (match.away_team || '').toLowerCase();

    const isDerby = BIG_MATCH_TEAMS.some(derby =>
        homeTeam.includes(derby.home.toLowerCase()) &&
        awayTeam.includes(derby.away.toLowerCase())
    );

    return isDerby;
};

/**
 * Calculate rewards for a prediction
 * @param {object} match - Match object
 * @returns {object} Rewards object with exp and points
 */
export const calculateRewards = (match) => {
    const big = isBigMatch(match);

    return {
        winner: {
            correct: big ? 10 : 5,      // EXP for correct winner
            points: big ? 15 : 10        // Points for correct winner
        },
        score: {
            exact: big ? 25 : 20,        // EXP for exact score
            points: big ? 30 : 25        // Points for exact score
        },
        bonus: {
            streak3: 5,                   // Bonus for 3 streak
            streak5: 10,                  // Bonus for 5 streak
            streak10: 25,                 // Bonus for 10 streak
            firstPrediction: 2,           // First prediction of the day
            bigMatchBonus: 5              // Extra bonus for big match
        }
    };
};

/**
 * Get potential rewards for display (before prediction)
 * @param {object} match - Match object
 * @returns {object} Potential rewards
 */
export const getPotentialRewards = (match) => {
    return calculateRewards(match);
};

/**
 * Calculate total EXP earned from a prediction result
 * @param {object} params - Prediction result params
 * @returns {number} Total EXP earned
 */
export const calculateEarnedExp = ({
    match,
    winnerCorrect,
    scoreExact,
    currentStreak
}) => {
    const rewards = calculateRewards(match);
    let totalExp = 0;

    // Winner prediction reward
    if (winnerCorrect) {
        totalExp += rewards.winner.correct;
    }

    // Score prediction reward
    if (scoreExact) {
        totalExp += rewards.score.exact;
    }

    // Streak bonuses
    if (currentStreak >= 10) {
        totalExp += rewards.bonus.streak10;
    } else if (currentStreak >= 5) {
        totalExp += rewards.bonus.streak5;
    } else if (currentStreak >= 3) {
        totalExp += rewards.bonus.streak3;
    }

    // Big match bonus
    if (isBigMatch(match) && (winnerCorrect || scoreExact)) {
        totalExp += rewards.bonus.bigMatchBonus;
    }

    return totalExp;
};

/**
 * Calculate total Points earned from a prediction result
 * @param {object} params - Prediction result params
 * @returns {number} Total points earned
 */
export const calculateEarnedPoints = ({
    match,
    winnerCorrect,
    scoreExact
}) => {
    const rewards = calculateRewards(match);
    let totalPoints = 0;

    if (winnerCorrect) {
        totalPoints += rewards.winner.points;
    }

    if (scoreExact) {
        totalPoints += rewards.score.points;
    }

    return totalPoints;
};

/**
 * Format EXP number with suffix
 * @param {number} exp - Experience points
 * @returns {string} Formatted string
 */
export const formatExp = (exp) => {
    if (exp >= 1000000) {
        return (exp / 1000000).toFixed(1) + 'M';
    }
    if (exp >= 1000) {
        return (exp / 1000).toFixed(1) + 'K';
    }
    return exp.toString();
};

/**
 * Get rank badge emoji based on position
 * @param {number} position - Leaderboard position (1-indexed)
 * @returns {string} Badge emoji
 */
export const getPositionBadge = (position) => {
    switch (position) {
        case 1: return '🥇';
        case 2: return '🥈';
        case 3: return '🥉';
        default: return `#${position}`;
    }
};

/**
 * Get trophy icon based on rank position
 * @param {number} position - Leaderboard position
 * @returns {string} Trophy color class
 */
export const getTrophyColor = (position) => {
    if (position === 1) return 'text-yellow-500'; // Gold
    if (position === 2) return 'text-gray-400';   // Silver
    if (position === 3) return 'text-amber-600';  // Bronze
    if (position <= 10) return 'text-blue-500';   // Top 10
    return 'text-gray-300';                        // Others
};

// ============================================================
// EXPORT DEFAULT
// ============================================================

export default {
    RANK_TIERS,
    BIG_MATCH_LEAGUES,
    BIG_MATCH_TEAMS,
    getRankFromExp,
    getNextRank,
    getRankProgress,
    isBigMatch,
    calculateRewards,
    getPotentialRewards,
    calculateEarnedExp,
    calculateEarnedPoints,
    formatExp,
    getPositionBadge,
    getTrophyColor
};
