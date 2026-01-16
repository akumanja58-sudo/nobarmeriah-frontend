// ============= src/utils/bunnyCdnHelper.js - ENHANCED =============
// BunnyCDN Configuration and Helper Functions dengan Fallback System

// BunnyCDN Configuration
const BUNNYCDN_CONFIG = {
    // 🎯 Your actual BunnyCDN pull zone URL
    pullZoneUrl: 'https://api-football-logos.b-cdn.net',

    // Original via NobarMeriah domain
    originalDomain: 'https://media.api-sports.io',

    // Enable/disable BunnyCDN
    enabled: true,

    // Fallback options
    enableFallback: true,
    fallbackDelay: 3000, // 3 seconds timeout before fallback
};

/**
 * 🆕 ENHANCED: Smart logo URL generator dengan multiple fallbacks
 * @param {number|string} teamId - Team ID from via NobarMeriah  
 * @param {string} teamName - Team name as fallback
 * @param {string} existingUrl - Existing logo URL from backend
 * @returns {Array} Array of logo URLs in priority order
 */
export const generateSmartLogoSources = (teamId, teamName, existingUrl = null) => {
    const sources = [];

    // 1. Highest Priority: Backend provided URL (sudah dari BunnyCDN)
    if (existingUrl) {
        sources.push({
            url: existingUrl,
            type: 'backend_provided',
            priority: 1
        });
    }

    // 2. BunnyCDN with team ID
    if (teamId) {
        sources.push({
            url: `${BUNNYCDN_CONFIG.pullZoneUrl}/football/teams/${teamId}.png`,
            type: 'bunnycdn_id',
            priority: 2
        });
    }

    // 3. via NobarMeriah fallback with team ID  
    if (teamId && BUNNYCDN_CONFIG.enableFallback) {
        sources.push({
            url: `https://media.api-sports.io/football/teams/${teamId}.png`,
            type: 'api_football_id',
            priority: 3
        });
    }

    // 4. Generic team logo from name (last resort)
    if (teamName) {
        const teamSlug = teamName.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');

        sources.push({
            url: `${BUNNYCDN_CONFIG.pullZoneUrl}/football/teams/${teamSlug}.png`,
            type: 'bunnycdn_name',
            priority: 4
        });
    }

    return sources;
};

/**
 * 🆕 ENHANCED: League logo dengan mapping lengkap
 * @param {string} leagueName - League name
 * @param {number} leagueId - League ID (optional)
 * @returns {string|null} League logo URL
 */
export const getLeagueLogo = (leagueName, leagueId = null) => {
    const BASE = BUNNYCDN_CONFIG.pullZoneUrl;

    // Priority 1: Use league ID if available
    if (leagueId) {
        return `${BASE}/football/leagues/${leagueId}.png`;
    }

    // Priority 2: League name mapping
    const leagueMapping = {
        'Premier League': 39,
        'La Liga': 140,
        'Bundesliga': 78,
        'Serie A': 135,
        'Ligue 1': 61,
        'Eredivisie': 88,
        'Liga 1': 274,
        'UEFA Champions League': 2,
        'UEFA Europa League': 3,
        'UEFA Europa Conference League': 848,
        'UEFA Conference League': 848, // Alternative name
        'Major League Soccer': 253,
        'MLS': 253,
        'National League': 66,
        'FA Cup': 45,
        'US Open Cup': 257,
        'Championship': 40,
        'Primeira Liga': 94,
        'Pro League': 144,
        'Süper Lig': 203
    };

    const leagueIdFromName = leagueMapping[leagueName];
    if (leagueIdFromName) {
        return `${BASE}/football/leagues/${leagueIdFromName}.png`;
    }

    return null;
};

/**
 * 🆕 React Hook untuk logo loading dengan fallback
 * @param {Array} logoSources - Array of logo sources from generateSmartLogoSources
 * @returns {Object} { logoUrl, isLoading, error, currentSource }
 */
export const useLogoWithFallback = (logoSources) => {
    const [logoState, setLogoState] = React.useState({
        logoUrl: null,
        isLoading: true,
        error: null,
        currentSource: null,
        attemptedSources: []
    });

    React.useEffect(() => {
        if (!logoSources || logoSources.length === 0) {
            setLogoState({
                logoUrl: null,
                isLoading: false,
                error: 'No logo sources provided',
                currentSource: null,
                attemptedSources: []
            });
            return;
        }

        let currentIndex = 0;
        const attemptedSources = [];

        const tryNextSource = () => {
            if (currentIndex >= logoSources.length) {
                // All sources failed
                setLogoState(prev => ({
                    ...prev,
                    logoUrl: null,
                    isLoading: false,
                    error: 'All logo sources failed',
                    attemptedSources
                }));
                return;
            }

            const currentSource = logoSources[currentIndex];
            attemptedSources.push(currentSource);

            setLogoState(prev => ({
                ...prev,
                isLoading: true,
                currentSource,
                attemptedSources: [...attemptedSources]
            }));

            const img = new Image();

            const timeout = setTimeout(() => {
                img.onload = null;
                img.onerror = null;
                currentIndex++;
                tryNextSource();
            }, BUNNYCDN_CONFIG.fallbackDelay);

            img.onload = () => {
                clearTimeout(timeout);
                setLogoState(prev => ({
                    ...prev,
                    logoUrl: currentSource.url,
                    isLoading: false,
                    error: null,
                    currentSource,
                    attemptedSources
                }));
            };

            img.onerror = () => {
                clearTimeout(timeout);
                currentIndex++;
                tryNextSource();
            };

            img.src = currentSource.url;
        };

        tryNextSource();

    }, [logoSources]);

    return logoState;
};

/**
 * Transform via NobarMeriah URL to BunnyCDN URL (original function)
 */
export const transformToBunnyCdn = (originalUrl) => {
    if (!originalUrl || !BUNNYCDN_CONFIG.enabled) {
        return originalUrl;
    }

    if (originalUrl.includes('media.api-sports.io')) {
        return originalUrl.replace(
            BUNNYCDN_CONFIG.originalDomain,
            BUNNYCDN_CONFIG.pullZoneUrl
        );
    }

    return originalUrl;
};

/**
 * Test BunnyCDN performance
 */
export const testBunnyCdnPerformance = async () => {
    const testImageId = 33; // Manchester United
    const originalUrl = `https://media.api-sports.io/football/teams/${testImageId}.png`;
    const bunnyCdnUrl = `${BUNNYCDN_CONFIG.pullZoneUrl}/football/teams/${testImageId}.png`;

    const results = {
        original: null,
        bunnycdn: null,
        improvement: null,
        bunnycdn_available: false
    };

    try {
        // Test BunnyCDN first
        const bunnyCdnStart = performance.now();
        await new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                results.bunnycdn_available = true;
                resolve();
            };
            img.onerror = reject;
            img.src = bunnyCdnUrl;
        });
        results.bunnycdn = performance.now() - bunnyCdnStart;

        // Test original via NobarMeriah
        const originalStart = performance.now();
        await new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = reject;
            img.src = originalUrl;
        });
        results.original = performance.now() - originalStart;

        // Calculate improvement
        results.improvement = ((results.original - results.bunnycdn) / results.original * 100).toFixed(1);

        return results;

    } catch (error) {
        console.warn('BunnyCDN performance test failed:', error);
        return { ...results, error: error.message };
    }
};

/**
 * Get configuration
 */
export const getBunnyCdnConfig = () => ({ ...BUNNYCDN_CONFIG });

/**
 * Update configuration
 */
export const updateBunnyCdnConfig = (newConfig) => {
    Object.assign(BUNNYCDN_CONFIG, newConfig);
};

// Export enhanced helper object
export default {
    generateSources: generateSmartLogoSources,
    getLeagueLogo,
    useLogoWithFallback,
    transform: transformToBunnyCdn,
    testPerformance: testBunnyCdnPerformance,
    getConfig: getBunnyCdnConfig,
    updateConfig: updateBunnyCdnConfig
};