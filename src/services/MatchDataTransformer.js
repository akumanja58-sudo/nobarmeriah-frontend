// src/services/MatchDataTransformer.js
// Helper untuk transform data formats

export class MatchDataTransformer {
    // Transform untuk search/filter
    static prepareForSearch(matches) {
        return matches.map(match => ({
            ...match,
            searchText: [
                match.home_team,
                match.away_team,
                match.league,
                match.country
            ].filter(Boolean).join(' ').toLowerCase()
        }));
    }

    // Group matches by league
    static groupByLeague(matches) {
        const grouped = {};

        matches.forEach(match => {
            const league = match.league || 'Unknown League';
            if (!grouped[league]) {
                grouped[league] = [];
            }
            grouped[league].push(match);
        });

        return grouped;
    }

    // Filter live matches
    static getLiveMatches(matches) {
        return matches.filter(match => match.is_live);
    }

    // Filter today's matches
    static getTodayMatches(matches) {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        return matches.filter(match => {
            const matchDate = new Date(match.date);
            const matchDateStr = matchDate.toISOString().split('T')[0];
            return matchDateStr === todayStr;
        });
    }

    // Get match status display info
    static getStatusInfo(match) {
        const status = match.status;
        const elapsed = match.elapsed;

        switch (status) {
            case 'NS':
                return { text: 'Not Started', color: 'gray', isLive: false };
            case '1H':
                return { text: `${elapsed}'`, color: 'green', isLive: true };
            case 'HT':
                return { text: 'Half Time', color: 'yellow', isLive: true };
            case '2H':
                return { text: `${elapsed}'`, color: 'green', isLive: true };
            case 'FT':
                return { text: 'Full Time', color: 'blue', isLive: false };
            case 'ET':
                return { text: `${elapsed}' ET`, color: 'red', isLive: true };
            case 'P':
                return { text: 'Penalties', color: 'red', isLive: true };
            case 'SUSP':
                return { text: 'Suspended', color: 'orange', isLive: false };
            case 'CANC':
                return { text: 'Cancelled', color: 'red', isLive: false };
            case 'LIVE':
                return { text: 'LIVE', color: 'green', isLive: true };
            default:
                return { text: status, color: 'gray', isLive: match.is_live };
        }
    }
}

export default MatchDataTransformer;