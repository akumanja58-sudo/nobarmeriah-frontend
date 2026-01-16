export const LEVEL_TIERS = {
    ROOKIE: { min: 1, max: 10, name: 'Rookie', color: '#8B4513', icon: '🥉' },
    AMATEUR: { min: 11, max: 25, name: 'Amateur', color: '#C0C0C0', icon: '🥈' },
    PRO: { min: 26, max: 50, name: 'Pro', color: '#FFD700', icon: '🥇' },
    EXPERT: { min: 51, max: 75, name: 'Expert', color: '#E5E4E2', icon: '💎' },
    LEGEND: { min: 76, max: 100, name: 'Legend', color: '#B9F2FF', icon: '👑' }
};

export const calculateLevel = (points) => {
    // Every 10 points = 1 level (you can adjust this formula)
    return Math.min(Math.floor(points / 10) + 1, 100);
};

export const getPointsForNextLevel = (currentLevel) => {
    if (currentLevel >= 100) return 0;
    return (currentLevel * 10) - ((currentLevel - 1) * 10);
};

export const getPointsToNextLevel = (points) => {
    const currentLevel = calculateLevel(points);
    if (currentLevel >= 100) return 0;

    const pointsForCurrentLevel = (currentLevel - 1) * 10;
    const pointsForNextLevel = currentLevel * 10;

    return pointsForNextLevel - points;
};

export const getLevelTier = (level) => {
    for (const [key, tier] of Object.entries(LEVEL_TIERS)) {
        if (level >= tier.min && level <= tier.max) {
            return tier;
        }
    }
    return LEVEL_TIERS.ROOKIE; // fallback
};

export const getXPProgress = (points) => {
    const currentLevel = calculateLevel(points);
    const pointsForCurrentLevel = (currentLevel - 1) * 10;
    const pointsForNextLevel = currentLevel * 10;

    if (currentLevel >= 100) return 100;

    const progressInLevel = points - pointsForCurrentLevel;
    const totalPointsInLevel = pointsForNextLevel - pointsForCurrentLevel;

    return Math.round((progressInLevel / totalPointsInLevel) * 100);
};