// src/utils/matchUtils.js
export const generateMatchSlug = (homeTeam, awayTeam, matchId) => {
    // Clean team names for URL
    const cleanName = (name) => {
        return name
            .toLowerCase()
            .replace(/\s+/g, '-')           // spaces to hyphens
            .replace(/[^a-z0-9-]/g, '')     // remove special chars
            .replace(/-+/g, '-')            // multiple hyphens to single
            .replace(/^-|-$/g, '');         // remove leading/trailing hyphens
    };

    const homeSlug = cleanName(homeTeam);
    const awaySlug = cleanName(awayTeam);

    // Add match ID to ensure uniqueness
    return `${homeSlug}-vs-${awaySlug}-${matchId}`;
};

export const parseMatchSlug = (slug) => {
    console.log('Parsing slug:', slug); // Debug

    const parts = slug.split('-');
    const matchId = parts[parts.length - 1];

    console.log('Extracted matchId:', matchId); // Debug

    // Find "vs" index to separate teams
    const vsIndex = parts.indexOf('vs');
    if (vsIndex === -1) {
        console.log('No "vs" found in slug'); // Debug
        return null;
    }

    const homeTeamParts = parts.slice(0, vsIndex);
    const awayTeamParts = parts.slice(vsIndex + 1, -1);

    const result = {
        matchId: matchId,
        homeTeamSlug: homeTeamParts.join('-'),
        awayTeamSlug: awayTeamParts.join('-')
    };

    console.log('Parse result:', result); // Debug
    return result;
};