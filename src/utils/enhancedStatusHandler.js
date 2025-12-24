// src/utils/enhancedStatusHandler.js
// Step 1: Enhanced Status Handler - SIMPLE VERSION

export const getEnhancedStatusDisplay = (matchStatus, minute, additionalTime, isConnected) => {
    const status = matchStatus?.toLowerCase() || 'ns';

    // Format time dengan additional time
    const formatTime = (min, addTime = 0) => {
        if (!min || min <= 0) return '-';
        if (addTime > 0) return `${min}+${addTime}'`;
        return `${min}'`;
    };

    // Status colors
    const colors = {
        live: 'text-red-600',
        halftime: 'text-orange-600',
        finished: 'text-green-600',
        scheduled: 'text-gray-900',
        postponed: 'text-yellow-600',
        cancelled: 'text-gray-600'
    };

    // Main logic
    switch (status) {
        case 'ns':
        case 'upcoming':
        case 'scheduled':
            return {
                text: 'Not Started',
                subText: '-', // Will be replaced with kickoff time
                color: colors.scheduled,
                isLive: false
            };

        case 'live':
        case '1h':
        case '2h':
            const timeDisplay = formatTime(minute, additionalTime);
            const half = minute <= 45 ? 'Babak 1' : 'Babak 2';

            return {
                text: 'LIVE',
                subText: timeDisplay,
                color: colors.live,
                isLive: true,
                extraInfo: half
            };

        case 'halftime':
        case 'ht':
            return {
                text: 'Half Time',
                subText: '45\'',
                color: colors.halftime,
                isLive: false
            };

        case 'finished':
        case 'ft':
            return {
                text: 'Full Time',
                subText: '90\'',
                color: colors.finished,
                isLive: false
            };

        case 'postponed':
        case 'pst':
            return {
                text: 'DITUNDA',
                subText: '-',
                color: colors.postponed,
                isLive: false
            };

        case 'cancelled':
        case 'canc':
            return {
                text: 'DIBATALKAN',
                subText: '-',
                color: colors.cancelled,
                isLive: false
            };

        default:
            return {
                text: status.toUpperCase(),
                subText: '-',
                color: colors.scheduled,
                isLive: false
            };
    }
};