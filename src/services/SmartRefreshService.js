// SmartRefreshService.js - Replace polling dengan smart refresh
class SmartRefreshService {
    constructor(livescoreService) {
        this.service = livescoreService;
        this.lastRefresh = 0;
        this.minInterval = 180000; // 3 menit minimum
        this.listeners = new Map();
        this.isActive = true;

        // Check if it's match time (3PM - 11PM)
        this.updateMatchTimeStatus();

        // Setup event listeners
        this.setupListeners();

        console.log('[SmartRefresh] Initialized - polling disabled, smart refresh enabled');
    }

    updateMatchTimeStatus() {
        const hour = new Date().getHours();
        this.isMatchTime = hour >= 15 && hour <= 23;
        console.log(`[SmartRefresh] Match time: ${this.isMatchTime} (hour: ${hour})`);
    }

    setupListeners() {
        // Refresh when user returns to tab
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isActive) {
                this.tryRefresh('tab_focus');
            }
        });

        // Refresh on window focus
        window.addEventListener('focus', () => {
            if (this.isActive) {
                this.tryRefresh('window_focus');
            }
        });

        // Update match time status every hour
        setInterval(() => {
            this.updateMatchTimeStatus();
        }, 3600000); // 1 hour

        console.log('[SmartRefresh] Event listeners setup complete');
    }

    async tryRefresh(trigger = 'manual') {
        const now = Date.now();
        const timeDiff = now - this.lastRefresh;

        // Calculate dynamic interval based on match time
        const baseInterval = this.isMatchTime ? this.minInterval : this.minInterval * 2;

        // Skip if too recent
        if (timeDiff < this.minInterval) {
            console.log(`[SmartRefresh] Skipping refresh - too recent (${Math.round(timeDiff / 1000)}s ago)`);
            return false;
        }

        if (timeDiff > baseInterval) {
            console.log(`[SmartRefresh] Refreshing data - trigger: ${trigger}, time diff: ${Math.round(timeDiff / 1000)}s`);

            try {
                await this.refreshData(trigger);
                this.lastRefresh = now;
                return true;
            } catch (error) {
                console.error('[SmartRefresh] Refresh failed:', error.message);
                return false;
            }
        } else {
            console.log(`[SmartRefresh] Not time for refresh yet - waiting ${Math.round((baseInterval - timeDiff) / 1000)}s more`);
            return false;
        }
    }

    async refreshData(trigger = 'manual') {
        try {
            console.log(`[SmartRefresh] Fetching fresh data...`);

            // Get live matches first (most important)
            const liveData = await this.service.getLiveMatches();

            if (liveData.success) {
                this.emit('live_update', {
                    data: liveData,
                    trigger: trigger,
                    timestamp: Date.now()
                });
            }

            // If it's match time, also get today's matches
            if (this.isMatchTime) {
                const todayData = await this.service.getTodayMatches();
                if (todayData.success) {
                    this.emit('today_update', {
                        data: todayData,
                        trigger: trigger,
                        timestamp: Date.now()
                    });
                }
            }

            // Emit general update event
            this.emit('data_refresh', {
                trigger: trigger,
                timestamp: Date.now(),
                isMatchTime: this.isMatchTime
            });

            console.log(`[SmartRefresh] Data refresh complete - trigger: ${trigger}`);

        } catch (error) {
            console.error('[SmartRefresh] Error refreshing data:', error);

            // Emit error event
            this.emit('refresh_error', {
                error: error.message,
                trigger: trigger,
                timestamp: Date.now()
            });

            throw error;
        }
    }

    // Manual refresh method (can be called from UI)
    async forceRefresh() {
        console.log('[SmartRefresh] Force refresh requested');
        this.lastRefresh = 0; // Reset timer
        return await this.tryRefresh('force');
    }

    // Event system for UI updates
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
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
    }

    emit(event, data) {
        if (!this.listeners.has(event)) return;

        this.listeners.get(event).forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`[SmartRefresh] Error in event callback for ${event}:`, error);
            }
        });
    }

    // Status methods
    getStatus() {
        return {
            isActive: this.isActive,
            isMatchTime: this.isMatchTime,
            lastRefresh: this.lastRefresh,
            timeSinceLastRefresh: Date.now() - this.lastRefresh,
            nextRefreshIn: Math.max(0, this.minInterval - (Date.now() - this.lastRefresh))
        };
    }

    // Control methods
    pause() {
        this.isActive = false;
        console.log('[SmartRefresh] Paused');
    }

    resume() {
        this.isActive = true;
        console.log('[SmartRefresh] Resumed');
    }

    // Cleanup
    destroy() {
        this.listeners.clear();
        this.isActive = false;
        console.log('[SmartRefresh] Destroyed');
    }
}

export default SmartRefreshService;