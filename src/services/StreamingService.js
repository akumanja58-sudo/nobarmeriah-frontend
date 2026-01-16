// StreamingService.js - Fetch live streaming via Backend Proxy (CORS fix)
// Uses backend proxy to avoid CORS issues with SportSRC API

class StreamingService {
    constructor() {
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes cache

        // Use backend proxy URL
        let baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
        baseUrl = baseUrl.replace(/\/+$/, '');
        if (!baseUrl.endsWith('/api')) {
            baseUrl = baseUrl + '/api';
        }
        this.backendUrl = baseUrl;

        console.log('[StreamingService] Using backend proxy:', this.backendUrl);
    }

    /**
     * Normalize team name for matching
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
     * Calculate similarity between two strings
     */
    similarity(str1, str2) {
        const s1 = this.normalizeTeamName(str1);
        const s2 = this.normalizeTeamName(str2);

        if (s1 === s2) return 1;
        if (s1.includes(s2) || s2.includes(s1)) return 0.9;

        const words1 = s1.split(' ');
        const words2 = s2.split(' ');
        const commonWords = words1.filter(w => words2.includes(w));

        return commonWords.length / Math.max(words1.length, words2.length);
    }

    /**
     * Get all available football matches from SportSRC (via backend proxy)
     */
    async getAvailableMatches() {
        try {
            const cacheKey = 'football_matches';
            const cached = this.cache.get(cacheKey);

            if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
                console.log('[StreamingService] Using cached matches');
                return cached.data;
            }

            console.log('[StreamingService] Fetching matches via backend proxy...');
            const response = await fetch(`${this.backendUrl}/streaming/matches?category=football`);

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
     * Find matching stream for a specific match (via backend proxy)
     */
    async findStream(homeTeam, awayTeam, matchDate = null) {
        try {
            console.log(`[StreamingService] Finding stream for: ${homeTeam} vs ${awayTeam}`);

            // Use backend search endpoint
            const params = new URLSearchParams({
                home: homeTeam,
                away: awayTeam,
                category: 'football'
            });

            const response = await fetch(`${this.backendUrl}/streaming/search?${params}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.success && result.match) {
                console.log(`[StreamingService] Found match: ${result.match.title} (confidence: ${result.confidence?.toFixed(2)})`);

                // Check confidence threshold (95%+)
                if (result.confidence && result.confidence < 0.95) {
                    console.log(`[StreamingService] Confidence too low (${(result.confidence * 100).toFixed(0)}%), rejecting match`);
                    return {
                        success: false,
                        error: 'No matching stream found',
                        lowConfidenceMatch: result.match,
                        confidence: result.confidence
                    };
                }

                return {
                    success: true,
                    match: result.match,
                    stream: result.stream,
                    confidence: result.confidence
                };
            }

            console.log('[StreamingService] No matching stream found');
            return { success: false, error: result.error || 'No matching stream found' };

        } catch (error) {
            console.error('[StreamingService] Error finding stream:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get stream details including embed URL (via backend proxy)
     */
    async getStreamDetails(matchId) {
        try {
            const cacheKey = `stream_${matchId}`;
            const cached = this.cache.get(cacheKey);

            if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
                return cached.data;
            }

            console.log(`[StreamingService] Fetching stream details for: ${matchId}`);
            const response = await fetch(`${this.backendUrl}/streaming/details/${matchId}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.success && result.data) {
                // Handle double nested response from backend
                // Could be: { data: { data: {...} } } or { data: {...} }
                let streamData = result.data;
                if (streamData.success && streamData.data) {
                    streamData = streamData.data;
                }

                this.cache.set(cacheKey, {
                    data: streamData,
                    timestamp: Date.now()
                });
                return streamData;
            }

            return null;
        } catch (error) {
            console.error('[StreamingService] Error fetching stream details:', error);
            return null;
        }
    }

    /**
     * Get embed URL from stream data
     */
    getEmbedUrl(streamData) {
        if (!streamData) return null;

        if (streamData.sources && streamData.sources.length > 0) {
            return streamData.sources[0].embedUrl || streamData.sources[0].embed || null;
        }

        const embed = streamData.embed ||
            streamData.embedUrl ||
            streamData.stream?.embed;

        return embed || null;
    }

    /**
     * Get multiple stream sources if available
     */
    getStreamSources(streamData) {
        if (!streamData) return [];

        const sources = [];

        if (streamData.sources && Array.isArray(streamData.sources)) {
            streamData.sources.forEach((source, idx) => {
                sources.push({
                    id: source.streamNo || idx + 1,
                    name: source.source ? `Source ${source.streamNo || idx + 1}` : `Source ${idx + 1}`,
                    embed: source.embedUrl || source.embed || source.url,
                    quality: source.hd ? 'HD' : 'SD',
                    language: source.language || '',
                    viewers: source.viewers || 0
                });
            });
        }

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
