// services/unifiedService.js - FIXED VERSION
import { io } from 'socket.io-client';

class UnifiedService {
    constructor() {
        const isDev = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';
        const baseURL = isDev ? 'http://localhost:5000' : window.location.origin;

        this.apiURL = baseURL;
        this.socketURL = baseURL;

        this.socket = null;
        this.isConnected = false;
        this.cache = new Map();
        this.cacheExpiry = 2 * 60 * 1000;
        this.lastUpdate = new Map();
        this.listeners = new Map();

        this.stats = {
            apiCalls: 0,
            cacheHits: 0,
            socketEvents: 0,
            errors: 0
        };

        this.init();
    }

    async init() {
        try {
            await this.connectSocket();
            this.warmupCache();
        } catch (error) {
            console.error('Init failed:', error);
        }
    }

    // ============= WEBSOCKET - FIXED =============
    async connectSocket() {
        if (this.socket?.connected) {
            return true;
        }

        try {
            this.socket = io(this.socketURL, {
                transports: ['websocket', 'polling'],
                timeout: 10000,
                autoConnect: true,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 2000
            });

            this.setupSocketEvents();

            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Socket connection timeout'));
                }, 15000);

                this.socket.on('connect', () => {
                    clearTimeout(timeout);
                    this.isConnected = true;
                    console.log('Socket connected:', this.socket.id);

                    // Join livescore room
                    this.socket.emit('join_livescore');
                    resolve(true);
                });

                this.socket.on('connect_error', (error) => {
                    clearTimeout(timeout);
                    console.error('Socket connection failed:', error);
                    reject(error);
                });
            });

        } catch (error) {
            console.error('Socket setup error:', error);
            this.isConnected = false;
            return false;
        }
    }

    setupSocketEvents() {
        if (!this.socket) return;

        // Connection events
        this.socket.on('connect', () => {
            this.isConnected = true;
            this.emit('connection_change', 'connected');
            console.log('Socket connected successfully');

            // FIXED: Join with proper data
            this.socket.emit('join_livescore', {
                timestamp: Date.now(),
                client: 'unified_service'
            });
        });

        this.socket.on('disconnect', (reason) => {
            this.isConnected = false;
            this.emit('connection_change', 'disconnected');
            console.log('Socket disconnected:', reason);
        });

        // FIXED: Match exact backend event names
        this.socket.on('live_batch_update', (data) => {
            this.stats.socketEvents++;
            console.log('Batch update received:', data);

            // FIXED: Handle nested data structure
            const payload = data.data || data;

            if (payload && payload.matches) {
                payload.matches.forEach(match => {
                    this.emit('match_update', {
                        match_id: match.id,
                        home_score: match.home_score,
                        away_score: match.away_score,
                        minute: match.minute,
                        status: match.status,
                        home_team: match.home_team,
                        away_team: match.away_team
                    });
                });
            }
        });

        this.socket.on('goal_scored', (data) => {
            this.stats.socketEvents++;
            console.log('Goal scored:', data);
            this.emit('goal_scored', data);
        });

        this.socket.on('status_change', (data) => {
            this.stats.socketEvents++;
            console.log('Status change:', data);
            this.emit('status_change', data);
        });

        // Backend specific events
        this.socket.on('livescore_connected', (data) => {
            console.log('Livescore connected:', data);
        });

        this.socket.on('welcome', (data) => {
            console.log('Welcome message:', data);
        });

        this.socket.on('server_ready', (message) => {
            console.log('Server ready:', message);
        });

        // Error handling
        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
            this.stats.errors++;
        });
    }

    getSocket() {
        return this.socket;
    }

    // ============= API CALLS - FIXED =============
    async apiCall(endpoint, options = {}) {
        try {
            this.stats.apiCalls++;
            const url = `${this.apiURL}${endpoint}`;

            const config = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                ...options,
            };

            console.log(`API Call: ${config.method} ${url}`);
            const response = await fetch(url, config);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`API Response [${endpoint}]:`, data);
            return data;

        } catch (error) {
            this.stats.errors++;
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    }

    // ============= CACHE - SIMPLIFIED =============
    setCache(key, data) {
        this.cache.set(key, data);
        this.lastUpdate.set(key, Date.now());
    }

    getCache(key) {
        if (!this.cache.has(key) || !this.lastUpdate.has(key)) {
            return null;
        }

        const age = Date.now() - this.lastUpdate.get(key);
        if (age > this.cacheExpiry) {
            this.cache.delete(key);
            this.lastUpdate.delete(key);
            return null;
        }

        this.stats.cacheHits++;
        return this.cache.get(key);
    }

    // ============= MATCHES - FIXED =============
    async getMatches(options = {}) {
        try {
            const cacheKey = `matches_${JSON.stringify(options)}`;

            // Check cache
            const cached = this.getCache(cacheKey);
            if (cached) {
                return {
                    success: true,
                    data: cached,
                    cached: true
                };
            }

            // Build query params
            const params = new URLSearchParams();
            if (options.date) params.append('date', options.date);
            if (options.limit) params.append('limit', options.limit);
            if (options.league) params.append('league', options.league);

            // FIXED: Use correct backend endpoint
            const endpoint = `/api/react/matches?${params.toString()}`;
            const result = await this.apiCall(endpoint);

            if (result.success && result.data) {
                // FIXED: Transform backend data format
                const transformedData = this.transformMatchesData(result.data);
                this.setCache(cacheKey, transformedData);

                return {
                    success: true,
                    data: transformedData,
                    cached: false
                };
            }

            return result;

        } catch (error) {
            console.error('getMatches error:', error);
            return {
                success: false,
                error: error.message,
                data: { matches: [], summary: { total: 0 } }
            };
        }
    }

    // FIXED: Transform backend data to frontend format
    transformMatchesData(backendData) {
        try {
            // Backend returns: { date: "2024-01-01", matches: [league objects], summary: {...} }
            if (!backendData.matches || !Array.isArray(backendData.matches)) {
                return { matches: [], summary: { total: 0 } };
            }

            let flattenedMatches = [];

            // Transform each league's matches
            backendData.matches.forEach(league => {
                if (league.matches && Array.isArray(league.matches)) {
                    const transformedLeagueMatches = league.matches.map(match => ({
                        // Core match data
                        id: match.id,
                        home_team: match.home_team,
                        away_team: match.away_team,
                        home_score: match.home_score || 0,
                        away_score: match.away_score || 0,

                        // League info
                        league: league.league_name || match.league,
                        league_id: league.league_id || match.league_id,
                        league_logo: league.league_logo || match.league_logo,

                        // Time info
                        kickoff: match.kickoff,
                        kickoff_time: match.kickoff_time,
                        local_date: backendData.date, // Use date from parent
                        local_time: match.kickoff_time,

                        // Status
                        status: match.status_display || match.status,
                        is_live: match.is_live || false,
                        is_finished: match.is_finished || false,

                        // Additional data
                        venue: match.venue,
                        referee: match.referee,
                        home_team_id: match.home_team_id,
                        away_team_id: match.away_team_id,
                        home_team_logo: match.home_team_logo,
                        away_team_logo: match.away_team_logo,

                        // Display helpers
                        score_display: match.score_display || `${match.home_score || 0} - ${match.away_score || 0}`,
                        status_display: match.status_display || 'Scheduled'
                    }));

                    flattenedMatches = flattenedMatches.concat(transformedLeagueMatches);
                }
            });

            return {
                matches: flattenedMatches,
                summary: backendData.summary || { total: flattenedMatches.length },
                date: backendData.date,
                last_updated: backendData.last_updated
            };

        } catch (error) {
            console.error('Transform data error:', error);
            return { matches: [], summary: { total: 0 } };
        }
    }

    async getTodayMatches() {
        const today = new Date().toISOString().split('T')[0];
        return this.getMatches({ date: today });
    }

    async getLiveMatches() {
        try {
            const result = await this.apiCall('/api/react/live');

            if (result.success && result.data) {
                // Transform live matches data
                let flattenedLiveMatches = [];

                if (result.data.live_matches && Array.isArray(result.data.live_matches)) {
                    result.data.live_matches.forEach(league => {
                        if (league.matches && Array.isArray(league.matches)) {
                            const transformedMatches = league.matches.map(match => ({
                                ...match,
                                league: league.league_name,
                                league_logo: league.league_logo,
                                isLive: true
                            }));
                            flattenedLiveMatches = flattenedLiveMatches.concat(transformedMatches);
                        }
                    });
                }

                return {
                    success: true,
                    data: {
                        matches: flattenedLiveMatches,
                        summary: result.data.summary || { total_live: flattenedLiveMatches.length }
                    }
                };
            }

            return result;

        } catch (error) {
            return {
                success: false,
                error: error.message,
                data: { matches: [], summary: { total_live: 0 } }
            };
        }
    }

    async searchMatches(query) {
        try {
            const params = new URLSearchParams({ q: query, limit: 20 });
            const result = await this.apiCall(`/api/react/search?${params}`);
            return result;
        } catch (error) {
            return {
                success: false,
                error: error.message,
                data: { results: [] }
            };
        }
    }

    // ============= SERVER STATUS =============
    async checkServerStatus() {
        try {
            const result = await this.apiCall('/api/status');
            return {
                success: true,
                data: result
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ============= EVENT SYSTEM - SIMPLIFIED =============
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            if (callback) {
                this.listeners.get(event).delete(callback);
            } else {
                this.listeners.delete(event);
            }
        }
    }

    emit(event, ...args) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(...args);
                } catch (error) {
                    console.error(`Event listener error [${event}]:`, error);
                }
            });
        }
    }

    // ============= CONVENIENCE METHODS =============
    onMatchUpdate(callback) {
        this.on('match_update', callback);
    }

    onGoalScored(callback) {
        this.on('goal_scored', callback);
    }

    onStatusChange(callback) {
        this.on('status_change', callback);
    }

    onConnectionChange(callback) {
        this.on('connection_change', callback);
        // Immediately call with current status
        callback(this.isConnected ? 'connected' : 'disconnected');
    }

    // ============= MATCH SUBSCRIPTIONS =============
    subscribeToMatch(matchId, callbacks = {}) {
        console.log(`Subscribing to match: ${matchId}`);

        if (this.socket?.connected) {
            this.socket.emit('subscribe_match', matchId);
        }

        const unsubscribeFunctions = [];

        if (callbacks.onUpdate) {
            const updateHandler = (data) => {
                if (this.isMatchData(data, matchId)) {
                    callbacks.onUpdate(data);
                }
            };
            this.onMatchUpdate(updateHandler);
            unsubscribeFunctions.push(() => this.off('match_update', updateHandler));
        }

        if (callbacks.onGoal) {
            const goalHandler = (data) => {
                if (this.isMatchData(data, matchId)) {
                    callbacks.onGoal(data);
                }
            };
            this.onGoalScored(goalHandler);
            unsubscribeFunctions.push(() => this.off('goal_scored', goalHandler));
        }

        return {
            unsubscribe: () => {
                if (this.socket?.connected) {
                    this.socket.emit('unsubscribe_match', matchId);
                }
                unsubscribeFunctions.forEach(fn => fn());
            }
        };
    }

    isMatchData(data, matchId) {
        return (
            String(data.match_id) === String(matchId) ||
            String(data.fixture_id) === String(matchId) ||
            String(data.id) === String(matchId)
        );
    }

    // ============= UTILITIES =============
    async warmupCache() {
        try {
            console.log('Warming up cache...');
            await this.getTodayMatches();
            console.log('Cache warmup completed');
        } catch (error) {
            console.warn('Cache warmup failed:', error);
        }
    }

    isSocketConnected() {
        return this.socket && this.isConnected && this.socket.connected;
    }

    async reconnect() {
        console.log('Force reconnecting...');
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.connectSocket();
    }

    clearCache() {
        this.cache.clear();
        this.lastUpdate.clear();
        console.log('Cache cleared');
    }

    getStats() {
        const hitRate = this.stats.apiCalls + this.stats.cacheHits > 0
            ? ((this.stats.cacheHits / (this.stats.apiCalls + this.stats.cacheHits)) * 100).toFixed(2)
            : 0;

        return {
            connected: this.isSocketConnected(),
            socketId: this.socket?.id || null,
            cacheSize: this.cache.size,
            apiCalls: this.stats.apiCalls,
            cacheHits: this.stats.cacheHits,
            hitRate: `${hitRate}%`,
            socketEvents: this.stats.socketEvents,
            errors: this.stats.errors
        };
    }

    async healthCheck() {
        try {
            const serverHealth = await this.checkServerStatus();
            const socketHealth = this.isSocketConnected();

            return {
                server: serverHealth.success,
                socket: socketHealth,
                cache: this.cache.size > 0,
                overall: serverHealth.success && socketHealth,
                stats: this.getStats()
            };
        } catch (error) {
            return {
                server: false,
                socket: false,
                cache: false,
                overall: false,
                error: error.message
            };
        }
    }

    destroy() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.isConnected = false;
        this.listeners.clear();
        this.cache.clear();
        this.lastUpdate.clear();
    }
}

const unifiedService = new UnifiedService();

// Debug access
if (typeof window !== 'undefined') {
    window.unifiedService = unifiedService;
}

export default unifiedService;