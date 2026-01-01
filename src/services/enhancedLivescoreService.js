// ==================== ENHANCED BACKEND SERVICE ====================
// File: src/services/enhancedLivescoreService.js

import axios from 'axios';
import SmartRefreshService from './SmartRefreshService';

const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

class EnhancedLivescoreService {
    constructor() {
        this.emergencyMode = false;
        this.consecutiveErrors = 0;
        this.requestDedupeMap = new Map();

        this.circuitOpen = false;
        this.lastError = null;
        this.errorCount = 0;

        this.baseURL = (typeof window !== 'undefined' && window.REACT_APP_LIVESCORE_API) || 'http://localhost:3000/api';
        this.isConnected = false;
        this.listeners = new Map();
        this.pollInterval = null;
        this.retryCount = 0;
        this.maxRetries = 3;

        this.smartRefresh = new SmartRefreshService(this);
        this.setupSmartRefreshListeners();

        // Initialize axios instance
        this.api = axios.create({
            baseURL: this.baseURL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Setup interceptors
        this.setupInterceptors();

        console.log('[EnhancedLivescoreService] Initialized with base URL:', this.baseURL);
    }

    async makeRequest(url, params = {}) {
        if (this.emergencyMode) {
            console.warn('[Emergency] All requests blocked due to rate limiting');
            throw new Error('Emergency mode active - requests blocked');
        }

        try {
            const result = await this.api.get(url, { params });
            this.consecutiveErrors = 0; // Reset on success
            return result;
        } catch (error) {
            if (error.response?.status === 429) {
                this.consecutiveErrors++;

                if (this.consecutiveErrors >= 2) {
                    console.error('[Emergency] Activating emergency mode');
                    this.emergencyMode = true;

                    // Auto-disable emergency mode after 5 minutes
                    setTimeout(() => {
                        this.emergencyMode = false;
                        this.consecutiveErrors = 0;
                        console.log('[Emergency] Emergency mode deactivated');
                    }, 300000); // 5 menit
                }
            }
            throw error;
        }
    }

    async callWithCircuitBreaker(fn) {
        if (this.circuitOpen) {
            console.log('[Circuit] OPEN - blocking request');
            throw new Error('Circuit breaker is open');
        }

        try {
            const result = await fn();
            this.errorCount = 0; // Reset on success
            return result;
        } catch (error) {
            this.errorCount++;

            if (error.response?.status === 429) {
                console.log(`[Circuit] 429 error count: ${this.errorCount}`);

                if (this.errorCount >= 3) {
                    this.circuitOpen = true;
                    console.log('[Circuit] OPENING - too many 429 errors');

                    // Auto-reset setelah 60 detik
                    setTimeout(() => {
                        this.circuitOpen = false;
                        this.errorCount = 0;
                        console.log('[Circuit] RESET');
                    }, 60000);
                }
            }

            throw error;
        }
    }

    async deduplicatedRequest(url, params = {}) {
        const key = `${url}:${JSON.stringify(params)}`;

        console.log('🔄 [deduplicatedRequest] Request:', url);
        console.log('🔄 [deduplicatedRequest] Params:', params);
        console.log('🔄 [deduplicatedRequest] Key:', key);

        if (this.requestDedupeMap && this.requestDedupeMap.has(key)) {
            console.log(`🔄 [deduplicatedRequest] DEDUPE HIT: ${url}`);
            return this.requestDedupeMap.get(key);
        }

        console.log(`🔄 [deduplicatedRequest] NEW REQUEST: ${url}`);

        // Initialize map if not exists
        if (!this.requestDedupeMap) {
            this.requestDedupeMap = new Map();
        }

        const promise = this.api.get(url, { params });
        this.requestDedupeMap.set(key, promise);

        try {
            const result = await promise;
            console.log(`🔄 [deduplicatedRequest] SUCCESS: ${url}`);
            return result;
        } finally {
            // Cleanup after 5 seconds
            setTimeout(() => {
                if (this.requestDedupeMap) {
                    this.requestDedupeMap.delete(key);
                }
            }, 300000);
        }
    }

    setupSmartRefreshListeners() {
        console.log('[EnhancedLivescoreService] Smart refresh listeners DISABLED');

        // COMMENT SEMUA:
        /*
        this.smartRefresh.on('live_update', (data) => {
            this.emit('match_update', data);
            this.emit('live_matches_updated', data);
        });
    
        this.smartRefresh.on('today_update', (data) => {
            this.emit('today_matches_updated', data);
        });
    
        this.smartRefresh.on('data_refresh', (data) => {
            this.emit('data_refreshed', data);
        });
    
        this.smartRefresh.on('refresh_error', (data) => {
            this.emit('refresh_error', data);
        });
        */
    }

    setupInterceptors() {
        // Request interceptor
        this.api.interceptors.request.use(
            (config) => {
                console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            (error) => {
                console.error('[API Request Error]', error);
                return Promise.reject(error);
            }
        );

        // Response interceptor
        this.api.interceptors.response.use(
            (response) => {
                this.isConnected = true;
                this.retryCount = 0;
                return response;
            },
            (error) => {
                this.isConnected = false;
                console.error('[API Response Error]', error.message);

                if (error.code === 'ECONNABORTED') {
                    console.warn('[API] Request timeout');
                } else if (error.response?.status >= 500) {
                    console.warn('[API] Server error');
                } else if (!error.response) {
                    console.warn('[API] Network error');
                }

                return Promise.reject(error);
            }
        );
    }

    // ==================== LIVE MATCHES METHODS ====================

    async getLiveMatches() {
        try {
            const response = await this.api.get('/live');
            return this.formatResponse(response.data);
        } catch (error) {
            console.error('[getLiveMatches] Error:', error);
            return this.formatError(error);
        }
    }

    async getTodayMatches() {
        try {
            console.log('🔍 [getTodayMatches] ===== METHOD CALLED =====');
            console.log('🔍 [getTodayMatches] Timestamp:', new Date().toISOString());
            console.trace('[getTodayMatches] Call stack:'); // Show who called this

            const today = new Date().toISOString().split('T')[0];
            console.log('📅 [getTodayMatches] Date:', today);

            const response = await this.deduplicatedRequest('/fixtures', {
                date: today,
                timezone: 'Asia/Jakarta'
            });

            console.log('📡 [getTodayMatches] Raw response status:', response.status);
            console.log('📡 [getTodayMatches] Response length:', response.data?.response?.length);

            const result = this.formatResponse(response.data);
            console.log('📄 [getTodayMatches] Formatted result success:', result.success);
            console.log('📄 [getTodayMatches] ===== METHOD END =====');

            return result;
        } catch (error) {
            console.error('❌ [getTodayMatches] Error:', error);
            console.error('❌ [getTodayMatches] ===== METHOD ERROR END =====');
            return this.formatError(error);
        }
    }

    async getMatchesByDate(date) {
        try {
            const response = await this.api.get('/fixtures', {
                params: { date }
            });
            return this.formatResponse(response.data);
        } catch (error) {
            console.error('[getMatchesByDate] Error:', error);
            return this.formatError(error);
        }
    }

    async getMatchesByDateRange(from, to, options = {}) {
        try {
            const response = await this.api.get('/fixtures', {
                params: {
                    from,
                    to,
                    timezone: 'Asia/Jakarta',
                    ...options
                }
            });
            return this.formatResponse(response.data);
        } catch (error) {
            return this.formatError(error);
        }
    }

    // ==================== FIXTURE DETAILS METHODS ====================

    async getFixtureDetails(fixtureId) {
        try {
            const response = await this.api.get('/fixtures', {
                params: { id: fixtureId }
            });
            return this.formatResponse(response.data);
        } catch (error) {
            console.error('[getFixtureDetails] Error:', error);
            return this.formatError(error);
        }
    }

    async getFixtureStatistics(fixtureId) {
        try {
            const response = await this.api.get('/fixtures/statistics', {
                params: { fixture: fixtureId }
            });
            return this.formatResponse(response.data);
        } catch (error) {
            console.error('[getFixtureStatistics] Error:', error);
            return this.formatError(error);
        }
    }

    async getFixtureEvents(fixtureId) {
        try {
            const response = await this.api.get('/fixtures/events', {
                params: { fixture: fixtureId }
            });
            return this.formatResponse(response.data);
        } catch (error) {
            console.error('[getFixtureEvents] Error:', error);
            return this.formatError(error);
        }
    }

    async getFixtureLineups(fixtureId) {
        try {
            const response = await this.api.get('/fixtures/lineups', {
                params: { fixture: fixtureId }
            });
            return this.formatResponse(response.data);
        } catch (error) {
            console.error('[getFixtureLineups] Error:', error);
            return this.formatError(error);
        }
    }

    async getHeadToHead(team1Id, team2Id, last = 10) {
        try {
            const response = await this.api.get('/fixtures/head2head', {
                params: {
                    h2h: `${team1Id}-${team2Id}`,
                    last
                }
            });
            return this.formatResponse(response.data);
        } catch (error) {
            console.error('[getHeadToHead] Error:', error);
            return this.formatError(error);
        }
    }

    // ==================== STANDINGS METHODS ====================

    async getStandings(leagueId, season) {
        try {
            const response = await this.api.get('/standings', {
                params: { league: leagueId, season }
            });
            return this.formatResponse(response.data);
        } catch (error) {
            console.error('[getStandings] Error:', error);
            return this.formatError(error);
        }
    }

    // ==================== TEAMS METHODS ====================

    async getTeams(params = {}) {
        try {
            const response = await this.api.get('/teams', { params });
            return this.formatResponse(response.data);
        } catch (error) {
            console.error('[getTeams] Error:', error);
            return this.formatError(error);
        }
    }

    async getTeamStatistics(leagueId, season, teamId) {
        try {
            const response = await this.api.get('/teams/statistics', {
                params: { league: leagueId, season, team: teamId }
            });
            return this.formatResponse(response.data);
        } catch (error) {
            console.error('[getTeamStatistics] Error:', error);
            return this.formatError(error);
        }
    }

    // ==================== PLAYERS METHODS ====================

    async getTopScorers(leagueId, season) {
        try {
            const response = await this.api.get('/players/topscorers', {
                params: { league: leagueId, season }
            });
            return this.formatResponse(response.data);
        } catch (error) {
            console.error('[getTopScorers] Error:', error);
            return this.formatError(error);
        }
    }

    async getTopAssists(leagueId, season) {
        try {
            const response = await this.api.get('/players/topassists', {
                params: { league: leagueId, season }
            });
            return this.formatResponse(response.data);
        } catch (error) {
            console.error('[getTopAssists] Error:', error);
            return this.formatError(error);
        }
    }

    // ==================== PREDICTIONS METHODS ====================

    async getPredictions(fixtureId) {
        try {
            const response = await this.api.get('/predictions', {
                params: { fixture: fixtureId }
            });
            return this.formatResponse(response.data);
        } catch (error) {
            console.error('[getPredictions] Error:', error);
            return this.formatError(error);
        }
    }

    // ==================== ODDS METHODS ====================

    async getOdds(params = {}) {
        try {
            const response = await this.api.get('/odds', { params });
            return this.formatResponse(response.data);
        } catch (error) {
            console.error('[getOdds] Error:', error);
            return this.formatError(error);
        }
    }

    async getLiveOdds(params = {}) {
        try {
            const response = await this.api.get('/odds/live', { params });
            return this.formatResponse(response.data);
        } catch (error) {
            console.error('[getLiveOdds] Error:', error);
            return this.formatError(error);
        }
    }

    // ==================== LEAGUES METHODS ====================

    async getLeagues(params = {}) {
        try {
            const response = await this.api.get('/leagues', { params });
            return this.formatResponse(response.data);
        } catch (error) {
            console.error('[getLeagues] Error:', error);
            return this.formatError(error);
        }
    }

    // ==================== UTILITY METHODS ====================

    async checkServerStatus() {
        try {
            console.log('🏥 [checkServerStatus] ===== HEALTH CHECK CALLED =====');
            console.trace('[checkServerStatus] Call stack:');

            const response = await this.api.get('/status');
            this.isConnected = true;

            console.log('🏥 [checkServerStatus] Server OK');
            return {
                success: true,
                data: response.data,
                connected: true
            };
        } catch (error) {
            console.error('🏥 [checkServerStatus] Server error:', error.message);
            this.isConnected = false;
            return {
                success: false,
                error: error.message,
                connected: false
            };
        }
    }

    async healthCheck() {
        try {
            const response = await this.api.get('/health');
            return this.formatResponse(response.data);
        } catch (error) {
            console.error('[healthCheck] Error:', error);
            return this.formatError(error);
        }
    }

    async forceRefresh() {
        return await this.smartRefresh.forceRefresh();
    }

    // Get refresh status
    getRefreshStatus() {
        return this.smartRefresh.getStatus();
    }

    // Pause auto refresh
    pauseRefresh() {
        this.smartRefresh.pause();
    }

    // Resume auto refresh
    resumeRefresh() {
        this.smartRefresh.resume();
    }

    // ==================== DATA TRANSFORMATION ====================

    transformMatchData(apiMatch) {
        if (!apiMatch) return null;

        const fixture = apiMatch.fixture || {};
        const teams = apiMatch.teams || {};
        const goals = apiMatch.goals || {};
        const score = apiMatch.score || {};
        const league = apiMatch.league || {};

        // COUNTRY INFO ADA DI LEAGUE OBJECT - FIX INI
        const country = {
            name: league.country || 'Unknown',
            code: '', // Ga ada di fixtures response
            flag: league.flag || ''
        };

        console.log('Fixed country extraction:', country);

        const elapsed = fixture.status?.elapsed || 0;

        return {
            // IDs
            id: fixture.id,
            fixture_id: fixture.id,
            match_number: fixture.id,

            // Teams
            home_team: teams.home?.name || 'Unknown',
            away_team: teams.away?.name || 'Unknown',
            home_team_id: teams.home?.id,
            away_team_id: teams.away?.id,
            home_team_logo: teams.home?.logo,
            away_team_logo: teams.away?.logo,

            // Scores
            home_score: goals.home ?? 0,
            away_score: goals.away ?? 0,

            // Penalty scores
            pen_home_goals: score.penalty?.home ?? 0,
            pen_away_goals: score.penalty?.away ?? 0,

            // Half-time scores
            ht_home_goals: score.halftime?.home ?? 0,
            ht_away_goals: score.halftime?.away ?? 0,

            // Match info
            league: league.name || 'Unknown League',
            league_id: league.id,
            league_logo: league.logo,
            venue: fixture.venue?.name || 'Unknown Venue',

            // TAMBAH COUNTRY INFO - INI YANG PENTING
            country: country.name,
            country_code: country.code,
            country_flag: country.flag,
            season: fixture.season,
            round: fixture.round,
            referee: fixture.referee || 'Unknown',

            // Timing
            kickoff: fixture.date,
            kick_off: fixture.date,
            local_date: this.formatLocalDate(fixture.date),
            local_time: this.formatLocalTime(fixture.date),

            // Status
            status: this.formatStatus(fixture.status?.long, elapsed),
            status_indonesian: this.translateStatus(fixture.status?.long, elapsed),
            minute: elapsed,
            elapsed: elapsed,
            status_raw: fixture.status?.long,
            status_short: fixture.status?.short,

            // Flags
            is_live: this.isMatchLive(fixture.status?.short),
            is_finished: this.isMatchFinished(fixture.status?.short),

            // Meta
            source: 'livescore_api',
            lastUpdated: Date.now()
        };
    }

    formatLocalDate(dateString) {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    formatLocalTime(dateString) {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Jakarta'
        }) + ' WIB';
    }

    formatStatus(status, elapsed = 0) {
        // Mapping status via NobarMeriah ke format simple
        const statusMap = {
            'Not Started': 'Belum Dimulai',
            'First Half': `${elapsed}'`, // Show minutes untuk babak pertama
            'Halftime': 'HT', // Half Time
            'Second Half': `${elapsed}'`, // Show minutes untuk babak kedua
            'Extra Time': `${elapsed}'`, // Show minutes untuk extra time
            'Penalty In Progress': 'PEN', // Penalty shootout
            'Match Finished': 'FT', // Full Time
            'Match Cancelled': 'Batal',
            'Match Postponed': 'Ditunda',
            'Match Suspended': 'Ditangguhkan',
            'Abandoned': 'Dibatalkan',
            'Technical Loss': 'FT',
            'WalkOver': 'FT'
        };

        return statusMap[status] || status || 'TBD';
    }

    translateStatus(status, elapsed = 0) {
        return this.formatStatus(status, elapsed);
    }

    isMatchLive(statusShort) {
        const liveStatuses = ['1H', '2H', 'HT', 'ET', 'P', 'SUSP', 'INT'];
        return liveStatuses.includes(statusShort);
    }

    isMatchFinished(statusShort) {
        const finishedStatuses = ['FT', 'AET', 'PEN', 'PST', 'CANC', 'ABD', 'AWD', 'WO'];
        return finishedStatuses.includes(statusShort);
    }

    // ==================== RESPONSE FORMATTING ====================

    formatResponse(data) {
        console.log('formatResponse Input:', data);

        const result = {
            success: true,
            data: data,
            response: data?.data?.response || data?.response || [], // Fix ini
            message: data?.message || 'Success'
        };

        console.log('formatResponse Output length:', result.response.length);
        return result;
    }

    formatError(error) {
        return {
            success: false,
            error: error.message || 'Unknown error',
            data: null,
            response: []
        };
    }

    // ==================== EVENT SYSTEM (Compatible with existing code) ====================

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
        console.log(`[EnhancedLivescoreService] Listener added for event: ${event}`);
    }

    off(event, callback = null) {
        if (!this.listeners.has(event)) return;

        if (callback) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        } else {
            this.listeners.delete(event);
        }
        console.log(`[EnhancedLivescoreService] Listener removed for event: ${event}`);
    }

    emit(event, data) {
        if (!this.listeners.has(event)) return;

        this.listeners.get(event).forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`[EnhancedLivescoreService] Error in event callback for ${event}:`, error);
            }
        });
    }

    onConnectionChange(callback) {
        this.on('connection_change', callback);
    }

    // ==================== POLLING SYSTEM ====================

    startPolling(matches = [], interval = 30000) {
        console.warn('[EnhancedLivescoreService] AUTO-POLLING DISABLED to prevent rate limit');
        console.log('[EnhancedLivescoreService] Original interval would be:', interval);
        console.log('[EnhancedLivescoreService] Matches count:', matches.length);

        // COMMENT SEMUA POLLING CODE:
        /*
        setTimeout(() => {
            this.smartRefresh.tryRefresh('initial_load');
        }, 1000);
        */

        // Just log that polling is disabled
        console.log('[EnhancedLivescoreService] Use manual refresh instead');
    }

    stopPolling() {
        console.log('[EnhancedLivescoreService] stopPolling called (already disabled)');
        // COMMENT INI:
        // this.smartRefresh.pause();
    }

    isSocketConnected() {
        return this.isConnected;
    }

    // ==================== LEGACY COMPATIBILITY ====================

    // Methods to maintain compatibility with existing backendService
    async getMatches(options = {}) {
        try {
            let response;

            if (options.live) {
                response = await this.getLiveMatches();
            } else if (options.date) {
                response = await this.getMatchesByDate(options.date);
            } else {
                response = await this.getTodayMatches();
            }

            if (response.success && response.response) {
                // Transform via NobarMeriah data to match expected format
                const transformedMatches = response.response.map(match =>
                    this.transformMatchData(match)
                ).filter(Boolean);

                return {
                    success: true,
                    data: {
                        matches: transformedMatches
                    }
                };
            }

            return response;
        } catch (error) {
            console.error('[getMatches] Error:', error);
            return this.formatError(error);
        }
    }

    // ==================== CLEANUP ====================

    destroy() {
        this.smartRefresh.destroy(); // TAMBAH INI
        this.listeners.clear();
        console.log('[EnhancedLivescoreService] Service destroyed');
    }
}

// Export singleton instance
const enhancedLivescoreService = new EnhancedLivescoreService();
export default enhancedLivescoreService;