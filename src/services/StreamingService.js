// StreamingService.js - Fetch live streaming from SportSRC API
// API Documentation: https://sportsrc.org/

const SPORTSRC_BASE_URL = 'https://api.sportsrc.org';

class StreamingService {
    constructor() {
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes cache
    }

    /**
     * Normalize team name for matching
     * Remove common suffixes and normalize spacing
     */
    normalizeTeamName(name) {
        if (!name) return '';
        return name
            .toLowerCase()
            .replace(/\s+fc$/i, '')
            .replace(/\s+cf$/i, '')
            .replace(/^fc\s+/i, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Calculate similarity between two strings (Levenshtein-based)
     */
    similarity(str1, str2) {
        const s1 = this.normalizeTeamName(str1);
        const s2 = this.normalizeTeamName(str2);

        if (s1 === s2) return 1;
        if (s1.includes(s2) || s2.includes(s1)) return 0.9;

        // Simple word matching
        const words1 = s1.split(' ');
        const words2 = s2.split(' ');
        const commonWords = words1.filter(w => words2.includes(w));

        return commonWords.length / Math.max(words1.length, words2.length);
    }

    /**
     * Get all available football matches from SportSRC
     */
    async getAvailableMatches() {
        try {
            const cacheKey = 'football_matches';
            const cached = this.cache.get(cacheKey);

            if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
                console.log('[StreamingService] Using cached matches');
                return cached.data;
            }

            console.log('[StreamingService] Fetching matches from SportSRC...');
            const response = await fetch(`${SPORTSRC_BASE_URL}/?data=matches&category=football`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.success && result.data) {
                this.cache.set(cacheKey, {
                    data: result.data,
                    timestamp: Date.now()
                });
                console.log(`[StreamingService] Fetched ${result.data.length} matches`);
                return result.data;
            }

            return [];
        } catch (error) {
            console.error('[StreamingService] Error fetching matches:', error);
            return [];
        }
    }

    /**
     * Find matching stream for a specific match
     * @param {string} homeTeam - Home team name from API-Football
     * @param {string} awayTeam - Away team name from API-Football
     * @param {number} matchDate - Match timestamp (optional, for better matching)
     */
    async findStream(homeTeam, awayTeam, matchDate = null) {
        try {
            console.log(`[StreamingService] Finding stream for: ${homeTeam} vs ${awayTeam}`);

            const matches = await this.getAvailableMatches();

            if (!matches || matches.length === 0) {
                return { success: false, error: 'No matches available' };
            }

            // Find best matching match
            let bestMatch = null;
            let bestScore = 0;

            for (const match of matches) {
                const srcHome = match.teams?.home?.name || '';
                const srcAway = match.teams?.away?.name || '';

                // Calculate similarity scores
                const homeScore = this.similarity(homeTeam, srcHome);
                const awayScore = this.similarity(awayTeam, srcAway);
                const totalScore = (homeScore + awayScore) / 2;

                // Check date if provided (within 2 hours)
                let dateBonus = 0;
                if (matchDate && match.date) {
                    const timeDiff = Math.abs(matchDate - match.date);
                    if (timeDiff < 2 * 60 * 60 * 1000) { // 2 hours
                        dateBonus = 0.1;
                    }
                }

                const finalScore = totalScore + dateBonus;

                if (finalScore > bestScore && finalScore >= 0.6) {
                    bestScore = finalScore;
                    bestMatch = match;
                }
            }

            if (bestMatch) {
                console.log(`[StreamingService] Found match: ${bestMatch.title} (score: ${bestScore.toFixed(2)})`);

                // Minimum confidence threshold - must be 95%+ to be considered valid
                if (bestScore < 0.95) {
                    console.log(`[StreamingService] Confidence too low (${(bestScore * 100).toFixed(0)}%), rejecting match`);
                    return {
                        success: false,
                        error: 'No matching stream found',
                        lowConfidenceMatch: bestMatch,
                        confidence: bestScore
                    };
                }

                // Get stream details
                const streamData = await this.getStreamDetails(bestMatch.id);

                return {
                    success: true,
                    match: bestMatch,
                    stream: streamData,
                    confidence: bestScore
                };
            }

            console.log('[StreamingService] No matching stream found');
            return { success: false, error: 'No matching stream found' };

        } catch (error) {
            console.error('[StreamingService] Error finding stream:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get stream details including embed URL
     * @param {string} matchId - SportSRC match ID
     */
    async getStreamDetails(matchId) {
        try {
            const cacheKey = `stream_${matchId}`;
            const cached = this.cache.get(cacheKey);

            if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
                return cached.data;
            }

            console.log(`[StreamingService] Fetching stream details for: ${matchId}`);
            const response = await fetch(
                `${SPORTSRC_BASE_URL}/?data=detail&category=football&id=${matchId}`
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.success && result.data) {
                this.cache.set(cacheKey, {
                    data: result.data,
                    timestamp: Date.now()
                });
                return result.data;
            }

            return null;
        } catch (error) {
            console.error('[StreamingService] Error fetching stream details:', error);
            return null;
        }
    }

    /**
     * Get embed URL from stream data
     * @param {object} streamData - Stream data from getStreamDetails
     */
    getEmbedUrl(streamData) {
        if (!streamData) return null;

        // SportSRC returns embedUrl in sources array
        if (streamData.sources && streamData.sources.length > 0) {
            return streamData.sources[0].embedUrl || streamData.sources[0].embed || null;
        }

        // Fallback to other possible fields
        const embed = streamData.embed ||
            streamData.embedUrl ||
            streamData.stream?.embed;

        return embed || null;
    }

    /**
     * Get multiple stream sources if available
     * @param {object} streamData - Stream data from getStreamDetails
     */
    getStreamSources(streamData) {
        if (!streamData) return [];

        const sources = [];

        // SportSRC API structure: sources[].embedUrl
        if (streamData.sources && Array.isArray(streamData.sources)) {
            streamData.sources.forEach((source, idx) => {
                sources.push({
                    id: source.streamNo || idx + 1,
                    name: source.source ? `Source ${source.streamNo || idx + 1}` : `Source ${idx + 1}`,
                    embed: source.embedUrl || source.embed || source.url,  // embedUrl is the correct field!
                    quality: source.hd ? 'HD' : 'SD',
                    language: source.language || '',
                    viewers: source.viewers || 0
                });
            });
        }

        // Fallback to single embed
        if (sources.length === 0 && (streamData.embed || streamData.embedUrl)) {
            sources.push({
                id: 1,
                name: 'Main Stream',
                embed: streamData.embed || streamData.embedUrl,
                quality: 'HD'
            });
        }

        return sources;
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('[StreamingService] Cache cleared');
    }
}

// Export singleton instance
const streamingService = new StreamingService();

export default streamingService;
