// ============= CLEAN ADMIN SERVICE - REPLACE ALL OLD SERVICES =============
// File: src/services/adminService.js

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Clean AdminService - Replaces all broken old services
 * Uses your working server.js backend (port 5000)
 * No more direct Supabase calls from frontend
 * No more broken apiFootballService.js
 */
class AdminService {
    constructor() {
        this.baseURL = `${API_BASE_URL}/api/admin`;
        this.isHealthy = true;
    }

    // ============= CORE API METHOD =============
    async apiCall(endpoint, options = {}) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                ...options,
            };

            console.log(`🔥 [AdminService] ${options.method || 'GET'}: ${url}`);

            const response = await fetch(url, config);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            // Handle your server.js response format
            if (result.success) {
                return result.data;
            } else {
                throw new Error(result.error || 'API call failed');
            }

        } catch (error) {
            console.error(`❌ [AdminService] Error:`, error);
            this.isHealthy = false;
            throw error;
        }
    }

    // ============= DASHBOARD & STATS =============
    async getDashboard() {
        return await this.apiCall('/dashboard');
    }

    // ============= MATCH MANAGEMENT =============
    async getAllMatches(filters = {}) {
        const query = new URLSearchParams(filters).toString();
        const endpoint = query ? `/matches?${query}` : '/matches';
        return await this.apiCall(endpoint);
    }

    async getMatchById(id) {
        return await this.apiCall(`/matches/${id}`);
    }

    async createMatch(matchData) {
        return await this.apiCall('/matches', {
            method: 'POST',
            body: JSON.stringify(matchData),
        });
    }

    async updateMatch(id, updateData) {
        return await this.apiCall(`/matches/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updateData),
        });
    }

    async deleteMatch(id) {
        return await this.apiCall(`/matches/${id}`, {
            method: 'DELETE',
        });
    }

    async updateMatchStatus(id, status) {
        return await this.apiCall(`/matches/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
    }

    // ============= LIVE MATCHES =============
    async getLiveMatches() {
        return await this.apiCall('/live-matches');
    }

    // ============= SEARCH & FILTER =============
    async searchMatches(query, filters = {}) {
        const params = new URLSearchParams({ q: query, ...filters }).toString();
        return await this.apiCall(`/search?${params}`);
    }

    async getMatchesByStatus(status) {
        return await this.getAllMatches({ status });
    }

    async getMatchesByLeague(leagueId) {
        return await this.getAllMatches({ league: leagueId });
    }

    // ============= BULK OPERATIONS =============
    async bulkUpdateMatches(updates) {
        return await this.apiCall('/matches/bulk-update', {
            method: 'POST',
            body: JSON.stringify({ updates }),
        });
    }

    // ============= UTILITY METHODS =============
    async refreshMatchData(matchId) {
        try {
            console.log(`🔄 [AdminService] Refreshing match: ${matchId}`);
            const match = await this.getMatchById(matchId);
            return match;
        } catch (error) {
            console.error('❌ [AdminService] Refresh failed:', error);
            return null;
        }
    }

    async healthCheck() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/status`);
            this.isHealthy = response.ok;
            return response.ok;
        } catch (error) {
            console.error('❌ [AdminService] Health check failed:', error);
            this.isHealthy = false;
            return false;
        }
    }

    // ============= CONVENIENCE METHODS =============

    // Get today's matches for admin
    async getTodayMatches() {
        const today = new Date().toISOString().split('T')[0];
        const matches = await this.getAllMatches();
        return matches.matches?.filter(match =>
            match.kickoff?.startsWith(today)
        ) || [];
    }

    // Get scheduled matches
    async getScheduledMatches() {
        return await this.getMatchesByStatus('scheduled');
    }

    // Get completed matches
    async getCompletedMatches() {
        return await this.getMatchesByStatus('completed');
    }

    // Quick create match with validation
    async quickCreateMatch(homeTeam, awayTeam, kickoff, venue = 'TBD') {
        if (!homeTeam || !awayTeam || !kickoff) {
            throw new Error('Missing required fields: homeTeam, awayTeam, kickoff');
        }

        return await this.createMatch({
            homeTeam: { name: homeTeam },
            awayTeam: { name: awayTeam },
            kickoff,
            venue,
            status: 'scheduled'
        });
    }

    // ============= ERROR RECOVERY =============
    async retryApiCall(endpoint, options = {}, maxRetries = 3) {
        let lastError;

        for (let i = 0; i < maxRetries; i++) {
            try {
                return await this.apiCall(endpoint, options);
            } catch (error) {
                lastError = error;
                console.warn(`⚠️ [AdminService] Retry ${i + 1}/${maxRetries} for ${endpoint}`);

                if (i < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
                }
            }
        }

        throw lastError;
    }

    // ============= STATUS HELPERS =============
    isOnline() {
        return this.isHealthy;
    }

    getApiUrl() {
        return this.baseURL;
    }

    getServerUrl() {
        return API_BASE_URL;
    }
}

// ============= EXPORT =============

// Singleton instance
const adminService = new AdminService();

// Default export
export default adminService;

// Named exports for easy migration from old services
export const {
    getDashboard,
    getAllMatches,
    getMatchById,
    createMatch,
    updateMatch,
    deleteMatch,
    updateMatchStatus,
    getLiveMatches,
    searchMatches,
    getMatchesByStatus,
    getMatchesByLeague,
    bulkUpdateMatches,
    refreshMatchData,
    healthCheck,
    getTodayMatches,
    getScheduledMatches,
    getCompletedMatches,
    quickCreateMatch
} = adminService;

// Legacy compatibility - for smooth migration
export const apiFootballService = adminService; // Replace old broken service
export const liveTrackingService = adminService; // Replace old broken service
export const supabaseService = adminService; // Replace direct DB calls

console.log('✅ AdminService initialized - Ready to replace all old services!');