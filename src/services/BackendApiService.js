// Updated BackendService.js - Connect to new backend
class BackendService {
    constructor() {
        // UPDATED: Use environment variable for backend URL
        // Normalize URL - ensure it ends with /api
        let rawUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

        // Remove trailing slash if exists
        rawUrl = rawUrl.replace(/\/+$/, '');

        // Add /api if not present
        if (!rawUrl.endsWith('/api')) {
            rawUrl = rawUrl + '/api';
        }

        this.baseUrl = rawUrl;
        this.isConnected = true;
        this.listeners = new Map();

        // Polling control
        this.isPolling = false;
        this.pollTimeoutId = null;
        this.maxConsecutiveErrors = 5;
        this.consecutiveErrors = 0;
        this.lastDataSnapshots = new Map();

        // Resource monitoring
        this.maxMemoryUsage = 400 * 1024 * 1024; // 400MB limit
        this.pollingInterval = 30000; // Default 30s

        // Bind context
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);

        console.log('[BackendService] Initialized with URL:', this.baseUrl);
    }

    // Mock WebSocket-like event system using polling
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);

        if (event === 'match_update' && !this.isPolling) {
            this.startLivePolling();
        }
    }

    off(event, callback = null) {
        if (callback) {
            const callbacks = this.listeners.get(event) || [];
            const index = callbacks.indexOf(callback);
            if (index > -1) callbacks.splice(index, 1);
        } else {
            this.listeners.delete(event);
        }

        if (!this.listeners.has('match_update') || this.listeners.get('match_update').length === 0) {
            this.stopLivePolling();
        }
    }

    emit(event, data) {
        const callbacks = this.listeners.get(event) || [];
        callbacks.forEach(callback => callback(data));
    }

    // UPDATED: Check server health
    async checkServerStatus() {
        try {
            // Remove /api from baseUrl for health check
            const healthUrl = this.baseUrl.replace('/api', '/health');
            const response = await fetch(healthUrl, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const data = await response.json();
                this.isConnected = true;
                console.log('[BackendService] Health check OK:', data.status);
                return { success: true, data };
            } else {
                this.isConnected = false;
                return { success: false, error: `HTTP ${response.status}` };
            }
        } catch (error) {
            this.isConnected = false;
            console.error('[BackendService] Health check failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Start polling for live match updates
    startLivePolling() {
        if (this.isPolling) {
            console.log('[BackendService] Polling already running');
            return;
        }

        console.log('[BackendService] Starting live polling...');
        this.isPolling = true;
        this.consecutiveErrors = 0;

        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        this.pollLoop();
    }

    async pollLoop() {
        if (!this.isPolling) {
            console.log('[BackendService] Polling stopped');
            return;
        }

        try {
            const startTime = Date.now();

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 10000)
            );

            const liveMatchesPromise = this.getLiveFixtures();
            const liveMatches = await Promise.race([liveMatchesPromise, timeoutPromise]);

            const responseTime = Date.now() - startTime;
            let updateCount = 0;

            if (liveMatches.success && liveMatches.data) {
                updateCount = this.processMatchUpdates(liveMatches.data);
            }

            this.consecutiveErrors = 0;

            const liveCount = liveMatches.data?.length || 0;
            this.pollingInterval = this.calculateInterval(liveCount, responseTime);

            if (updateCount > 0) {
                console.log(`[BackendService] ${updateCount} updates, next poll in ${this.pollingInterval / 1000}s`);
            }

        } catch (error) {
            this.consecutiveErrors++;
            console.error(`[BackendService] Poll error ${this.consecutiveErrors}:`, error.message);

            if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
                console.error('[BackendService] Too many errors - stopping');
                this.emergencyStop();
                return;
            }

            this.pollingInterval = Math.min(5000 * this.consecutiveErrors, 60000);
        }

        this.scheduleNextPoll();
    }

    scheduleNextPoll() {
        if (!this.isPolling) return;

        if (this.pollTimeoutId) {
            clearTimeout(this.pollTimeoutId);
            this.pollTimeoutId = null;
        }

        this.pollTimeoutId = setTimeout(() => {
            this.pollLoop();
        }, this.pollingInterval);
    }

    calculateInterval(liveCount, responseTime) {
        let interval = 30000; // Default 30s

        if (liveCount === 0) {
            interval = 60000; // 1 minute no live
        } else if (liveCount > 3) {
            interval = 20000; // 20s many live
        }

        if (responseTime > 3000) {
            interval += 10000;
        }

        if (document.hidden) {
            interval *= 2;
        }

        return interval;
    }

    processMatchUpdates(matches) {
        let updateCount = 0;

        matches.forEach(match => {
            const key = `live_${match.fixture_id || match.id}`;
            const snapshot = `${match.home_score || 0}-${match.away_score || 0}-${match.status}`;

            if (this.lastDataSnapshots.get(key) !== snapshot) {
                this.emit('match_update', {
                    match_id: match.fixture_id || match.id,
                    home_score: match.home_score || 0,
                    away_score: match.away_score || 0,
                    status: match.status,
                    is_live: true,
                    timestamp: Date.now()
                });

                this.lastDataSnapshots.set(key, snapshot);
                updateCount++;
            }
        });

        return updateCount;
    }

    handleVisibilityChange() {
        if (document.hidden) {
            console.log('[BackendService] Tab hidden - slowing down');
        } else {
            console.log('[BackendService] Tab visible - resuming');
            if (this.isPolling) {
                this.scheduleNextPoll();
            }
        }
    }

    emergencyStop() {
        console.error('[BackendService] EMERGENCY STOP');
        this.stopLivePolling();

        setTimeout(() => {
            console.log('[BackendService] Attempting restart...');
            if (!this.isPolling) {
                this.startLivePolling();
            }
        }, 300000);
    }

    // UPDATED: Get all matches (live + today from new backend)
    async getMatches(options = {}) {
        try {
            console.log('[BackendService] Fetching matches from:', this.baseUrl);

            // Fetch live matches
            const liveResponse = await fetch(`${this.baseUrl}/matches/live`);
            const liveResult = await liveResponse.json();

            // Fetch today matches
            const todayResponse = await fetch(`${this.baseUrl}/matches/today`);
            const todayResult = await todayResponse.json();

            console.log('[BackendService] Live matches:', liveResult.count || 0);
            console.log('[BackendService] Today matches:', todayResult.count || 0);

            // Combine matches
            const allMatches = [
                ...(liveResult.data || []),
                ...(todayResult.data || [])
            ];

            // Remove duplicates
            const uniqueMatches = allMatches.reduce((acc, match) => {
                if (!acc.find(m => m.fixture_id === match.fixture_id)) {
                    acc.push(this.transformBackendMatch(match));
                }
                return acc;
            }, []);

            return {
                success: true,
                data: {
                    matches: uniqueMatches,
                    total: uniqueMatches.length
                }
            };

        } catch (error) {
            console.error('[BackendService] Error fetching matches:', error);
            return {
                success: false,
                error: error.message,
                data: { matches: [], total: 0 }
            };
        }
    }

    // UPDATED: Transform backend match data to frontend format
    transformBackendMatch(match) {
        return {
            id: match.fixture_id,
            fixture_id: match.fixture_id,
            home_team: match.home_team_name || 'Unknown',
            away_team: match.away_team_name || 'Unknown',
            home_score: match.home_score || 0,
            away_score: match.away_score || 0,
            status: match.status || match.status_short,
            status_short: match.status_short,
            status_long: match.status,
            minute: match.elapsed,
            elapsed: match.elapsed,
            date: match.match_date,
            match_date: match.match_date,
            league: match.league_name || 'Unknown',
            league_id: match.league_id,
            league_name: match.league_name,
            country: match.league_country,
            country_flag: match.league_flag,
            venue: match.venue,
            venue_city: match.venue_city,
            referee: match.referee,
            home_logo: match.home_team_logo,
            away_logo: match.away_team_logo,
            league_logo: match.league_logo,
            flag: match.league_flag,
            is_live: match.is_live || false,
            is_finished: ['FT', 'AET', 'PEN'].includes(match.status_short?.toUpperCase()),
            source: 'backend',
            lastUpdated: Date.now()
        };
    }

    // UPDATED: Get live fixtures specifically
    async getLiveFixtures() {
        try {
            const response = await fetch(`${this.baseUrl}/matches/live`);

            if (response.ok) {
                const result = await response.json();

                if (result.success) {
                    const transformedMatches = (result.data || []).map(match =>
                        this.transformBackendMatch(match)
                    );
                    return {
                        success: true,
                        data: transformedMatches
                    };
                } else {
                    return {
                        success: false,
                        error: result.error || 'Failed to fetch live fixtures',
                        data: []
                    };
                }
            } else {
                return {
                    success: false,
                    error: `HTTP ${response.status}`,
                    data: []
                };
            }
        } catch (error) {
            console.error('[BackendService] Error fetching live fixtures:', error);
            return {
                success: false,
                error: error.message,
                data: []
            };
        }
    }

    // UPDATED: Get today matches
    async getTodayMatches() {
        try {
            const response = await fetch(`${this.baseUrl}/matches/today`);

            if (response.ok) {
                const result = await response.json();

                if (result.success) {
                    const transformedMatches = (result.data || []).map(match =>
                        this.transformBackendMatch(match)
                    );
                    return {
                        success: true,
                        data: transformedMatches
                    };
                } else {
                    return {
                        success: false,
                        error: result.error || 'Failed to fetch today matches',
                        data: []
                    };
                }
            }
            return { success: false, error: `HTTP ${response.status}`, data: [] };
        } catch (error) {
            console.error('[BackendService] Error fetching today matches:', error);
            return { success: false, error: error.message, data: [] };
        }
    }

    // ============================================
    // NEW: ARCHIVE METHODS
    // ============================================

    /**
     * Get archived/finished matches from database
     * @param {number} limit - Number of matches to fetch (default: 20)
     * @param {number} offset - Offset for pagination (default: 0)
     * @param {object} filters - Optional filters (league, date_from, date_to)
     */
    async getArchivedMatches(limit = 20, offset = 0, filters = {}) {
        try {
            console.log('[BackendService] Fetching archived matches...');

            // Build query params
            const params = new URLSearchParams({
                limit: limit.toString(),
                offset: offset.toString()
            });

            if (filters.league) {
                params.append('league', filters.league);
            }
            if (filters.date_from) {
                params.append('date_from', filters.date_from);
            }
            if (filters.date_to) {
                params.append('date_to', filters.date_to);
            }

            const response = await fetch(`${this.baseUrl}/matches/archived?${params}`);

            if (response.ok) {
                const result = await response.json();

                if (result.success) {
                    console.log(`[BackendService] Archived matches: ${result.data.matches.length}`);
                    return {
                        success: true,
                        data: result.data
                    };
                } else {
                    return {
                        success: false,
                        error: result.error || 'Failed to fetch archived matches',
                        data: { matches: [], total: 0 }
                    };
                }
            } else {
                return {
                    success: false,
                    error: `HTTP ${response.status}`,
                    data: { matches: [], total: 0 }
                };
            }
        } catch (error) {
            console.error('[BackendService] Error fetching archived matches:', error);
            return {
                success: false,
                error: error.message,
                data: { matches: [], total: 0 }
            };
        }
    }

    /**
     * Get archive statistics
     */
    async getArchiveStats() {
        try {
            console.log('[BackendService] Fetching archive stats...');

            const response = await fetch(`${this.baseUrl}/matches/archived/stats`);

            if (response.ok) {
                const result = await response.json();

                if (result.success) {
                    console.log('[BackendService] Archive stats:', result.stats);
                    return {
                        success: true,
                        stats: result.stats
                    };
                } else {
                    return {
                        success: false,
                        error: result.error || 'Failed to fetch archive stats',
                        stats: {}
                    };
                }
            } else {
                return {
                    success: false,
                    error: `HTTP ${response.status}`,
                    stats: {}
                };
            }
        } catch (error) {
            console.error('[BackendService] Error fetching archive stats:', error);
            return {
                success: false,
                error: error.message,
                stats: {}
            };
        }
    }

    // Connection status
    isSocketConnected() {
        return this.isConnected;
    }

    onConnectionChange(callback) {
        callback(this.isConnected ? 'connected' : 'disconnected');
    }

    // Cleanup methods
    stopLivePolling() {
        console.log('[BackendService] Stopping polling...');
        this.isPolling = false;

        if (this.pollTimeoutId) {
            clearTimeout(this.pollTimeoutId);
            this.pollTimeoutId = null;
        }

        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        this.lastDataSnapshots.clear();
    }

    destroy() {
        console.log('[BackendService] Destroying...');
        this.stopLivePolling();
        this.listeners.clear();
        this.lastDataSnapshots.clear();
        console.log('[BackendService] Destroyed');
    }

    cleanup() {
        this.destroy();
    }
}

// Export singleton instance
const backendService = new BackendService();

if (typeof window !== 'undefined') {
    window.backendService = backendService;
}

export default backendService;