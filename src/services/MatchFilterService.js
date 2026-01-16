// src/services/MatchFilterService.js
class MatchFilterService {
    constructor() {
        this.popularLeagues = [
            'Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1',
            'UEFA Champions League', 'UEFA Europa League', 'Liga 1'
        ];
    }

    filterMatches(matches, options = {}) {
        const {
            maxMatches = 50,
            showFinished = false,
            selectedLeagues = [],
            timeRange = 'all',
            searchQuery = '',
            userPreferences = []
        } = options;

        console.log(`[MatchFilter] Starting with ${matches.length} matches`);

        let filtered = [...matches];

        // 1. Search filter (paling penting dulu)
        if (searchQuery && searchQuery.trim().length >= 2) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(match =>
                match.home_team?.toLowerCase().includes(query) ||
                match.away_team?.toLowerCase().includes(query) ||
                match.league?.toLowerCase().includes(query)
            );
            console.log(`[MatchFilter] After search: ${filtered.length} matches`);
        }

        // 2. League filter
        if (selectedLeagues.length > 0) {
            filtered = filtered.filter(match => selectedLeagues.includes(match.league));
            console.log(`[MatchFilter] After league filter: ${filtered.length} matches`);
        }

        // 3. Time range filter
        filtered = this.applyTimeRangeFilter(filtered, timeRange);
        console.log(`[MatchFilter] After time filter: ${filtered.length} matches`);

        // 4. Finished matches filter
        if (!showFinished) {
            filtered = filtered.filter(match => !match.is_finished);
            console.log(`[MatchFilter] After finished filter: ${filtered.length} matches`);
        }

        // 5. Priority sorting dan limiting
        const prioritized = this.prioritizeMatches(filtered, userPreferences);
        const limited = prioritized.slice(0, maxMatches);

        console.log(`[MatchFilter] Final result: ${limited.length} matches`);
        return limited;
    }

    applyTimeRangeFilter(matches, timeRange) {
        const now = Date.now();

        switch (timeRange) {
            case 'live':
                return matches.filter(m => m.is_live);

            case 'next2h':
                return matches.filter(m => {
                    const matchTime = new Date(m.kickoff).getTime();
                    return matchTime > now && matchTime <= now + (2 * 60 * 60 * 1000);
                });

            case 'today':
                return matches.filter(m => this.isToday(m.kickoff));

            case 'tomorrow':
                return matches.filter(m => this.isTomorrow(m.kickoff));

            case 'popular':
                return matches.filter(m => this.popularLeagues.includes(m.league));

            default:
                return matches;
        }
    }

    prioritizeMatches(matches, userPreferences = []) {
        return matches
            .map(match => ({
                ...match,
                priority_score: this.calculatePriorityScore(match, userPreferences)
            }))
            .sort((a, b) => b.priority_score - a.priority_score);
    }

    calculatePriorityScore(match, userPreferences = []) {
        let score = 0;

        // Live matches = highest priority
        if (match.is_live) score += 1000;

        // Starting soon
        const hoursUntilKickoff = this.getHoursUntilMatch(match.kickoff);
        if (hoursUntilKickoff <= 2 && hoursUntilKickoff > 0) {
            score += 800;
        } else if (hoursUntilKickoff <= 6 && hoursUntilKickoff > 0) {
            score += 500;
        }

        // Popular leagues
        if (this.popularLeagues.includes(match.league)) {
            score += 300;
        }

        // User preferences
        if (userPreferences.includes(match.league)) {
            score += 400;
        }

        // Indonesian league boost (customize for your users)
        if (match.league === 'Liga 1') {
            score += 250;
        }

        // Recent kickoff time (prefer matches happening today)
        if (this.isToday(match.kickoff)) {
            score += 100;
        }

        return score;
    }

    // Quick filter counts for UI
    getFilterCounts(matches) {
        const now = Date.now();

        return {
            all: matches.length,
            live: matches.filter(m => m.is_live).length,
            next2h: matches.filter(m => {
                const matchTime = new Date(m.kickoff).getTime();
                return matchTime > now && matchTime <= now + (2 * 60 * 60 * 1000);
            }).length,
            today: matches.filter(m => this.isToday(m.kickoff)).length,
            popular: matches.filter(m => this.popularLeagues.includes(m.league)).length,
            finished: matches.filter(m => m.is_finished).length
        };
    }

    // Get available leagues sorted by popularity
    getAvailableLeagues(matches) {
        const leagues = [...new Set(matches.map(m => m.league))].filter(Boolean);

        return leagues.sort((a, b) => {
            const aPopular = this.popularLeagues.includes(a);
            const bPopular = this.popularLeagues.includes(b);

            if (aPopular && bPopular) {
                return this.popularLeagues.indexOf(a) - this.popularLeagues.indexOf(b);
            }
            if (aPopular) return -1;
            if (bPopular) return 1;
            return a.localeCompare(b);
        });
    }

    // Helper methods
    isToday(kickoffTime) {
        if (!kickoffTime) return false;
        const matchDate = new Date(kickoffTime).toDateString();
        const today = new Date().toDateString();
        return matchDate === today;
    }

    isTomorrow(kickoffTime) {
        if (!kickoffTime) return false;
        const matchDate = new Date(kickoffTime).toDateString();
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString();
        return matchDate === tomorrow;
    }

    getHoursUntilMatch(kickoffTime) {
        if (!kickoffTime) return Infinity;
        return (new Date(kickoffTime).getTime() - Date.now()) / (1000 * 60 * 60);
    }
}

export default MatchFilterService;