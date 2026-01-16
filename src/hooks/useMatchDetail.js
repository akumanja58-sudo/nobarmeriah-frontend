// hooks/useMatchDetail.js
// Hook untuk fetch match detail dari backend livescore

import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

/**
 * Hook untuk fetch detail match lengkap (stats, events, lineups)
 */
export const useMatchDetail = (matchId, options = {}) => {
    const {
        autoFetch = true,
        refreshInterval = 30000, // 30 detik untuk live match
        includeStats = true,
        includeEvents = true,
        includeLineups = true
    } = options;

    const [match, setMatch] = useState(null);
    const [statistics, setStatistics] = useState(null);
    const [events, setEvents] = useState(null);
    const [lineups, setLineups] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [isLive, setIsLive] = useState(false);

    const intervalRef = useRef(null);

    /**
     * Fetch match detail dari backend
     */
    const fetchMatchDetail = useCallback(async (isBackground = false) => {
        if (!matchId) return;

        try {
            if (!isBackground) setLoading(true);
            setError(null);

            // Build query params
            const params = new URLSearchParams();
            if (includeStats) params.set('stats', 'true');
            if (includeEvents) params.set('events', 'true');
            if (includeLineups) params.set('lineups', 'true');

            const queryString = params.toString();
            const url = `${API_BASE_URL}/api/matches/${matchId}${queryString ? `?${queryString}` : ''}`;

            console.log(`📡 Fetching match detail: ${url}`);

            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to fetch match detail');
            }

            // Transform match data
            const matchData = data.match;
            const transformedMatch = {
                ...matchData,
                // Map untuk kompatibilitas dengan component lama
                home_team: matchData.home_team_name || matchData.home_team,
                away_team: matchData.away_team_name || matchData.away_team,
                league: matchData.league_name || matchData.league,
                country: matchData.league_country || matchData.country,
                country_flag: matchData.league_flag || matchData.country_flag,
                home_team_logo: matchData.home_team_logo,
                away_team_logo: matchData.away_team_logo,
                league_logo: matchData.league_logo,
            };

            setMatch(transformedMatch);

            // Check if match is live
            const liveStatuses = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'];
            const matchIsLive = liveStatuses.includes(matchData.status_short) || matchData.is_live;
            setIsLive(matchIsLive);

            // Set additional data
            if (data.statistics) {
                setStatistics(transformStatistics(data.statistics));
            }
            if (data.events) {
                setEvents(transformEvents(data.events));
            }
            if (data.lineups) {
                setLineups(data.lineups);
            }

            setLastUpdated(new Date());
            console.log(`✅ Match detail fetched: ${matchData.home_team_name} vs ${matchData.away_team_name}`);

        } catch (err) {
            console.error('❌ Fetch match detail error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [matchId, includeStats, includeEvents, includeLineups]);

    /**
     * Transform statistics dari API format
     */
    const transformStatistics = (stats) => {
        if (!stats || !Array.isArray(stats) || stats.length < 2) return null;

        const homeStats = stats[0]?.statistics || [];
        const awayStats = stats[1]?.statistics || [];

        const statMap = {};
        homeStats.forEach(stat => {
            statMap[stat.type] = {
                home: stat.value,
                away: null
            };
        });
        awayStats.forEach(stat => {
            if (statMap[stat.type]) {
                statMap[stat.type].away = stat.value;
            } else {
                statMap[stat.type] = {
                    home: null,
                    away: stat.value
                };
            }
        });

        return {
            raw: stats,
            mapped: statMap,
            homeTeam: stats[0]?.team,
            awayTeam: stats[1]?.team
        };
    };

    /**
     * Transform events dari API format
     */
    const transformEvents = (eventsData) => {
        if (!eventsData || !Array.isArray(eventsData)) return [];

        return eventsData.map(event => ({
            time: event.time?.elapsed || 0,
            extraTime: event.time?.extra || null,
            team: event.team?.name || 'Unknown',
            teamId: event.team?.id,
            teamLogo: event.team?.logo,
            player: event.player?.name || 'Unknown',
            playerId: event.player?.id,
            assist: event.assist?.name || null,
            type: event.type, // Goal, Card, Subst, Var
            detail: event.detail, // Normal Goal, Yellow Card, Red Card, Substitution 1, etc
            comments: event.comments
        }));
    };

    // Auto fetch on mount
    useEffect(() => {
        if (autoFetch && matchId) {
            fetchMatchDetail();
        }
    }, [autoFetch, matchId, fetchMatchDetail]);

    // Setup auto refresh for live matches
    useEffect(() => {
        if (isLive && refreshInterval > 0) {
            intervalRef.current = setInterval(() => {
                fetchMatchDetail(true);
            }, refreshInterval);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isLive, refreshInterval, fetchMatchDetail]);

    return {
        match,
        statistics,
        events,
        lineups,
        loading,
        error,
        lastUpdated,
        isLive,
        refresh: fetchMatchDetail
    };
};

/**
 * Hook untuk check connection status ke backend
 */
export const useConnectionStatus = () => {
    const [connected, setConnected] = useState(false);
    const [lastCheck, setLastCheck] = useState(null);
    const [quota, setQuota] = useState(null);

    const checkConnection = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/health`);
            const data = await response.json();

            setConnected(data.status === 'ok');
            setLastCheck(new Date());

            if (data.apiFootball?.quota) {
                setQuota(data.apiFootball.quota);
            }

            return data;
        } catch (err) {
            setConnected(false);
            return null;
        }
    }, []);

    useEffect(() => {
        checkConnection();

        // Check every 30 seconds
        const interval = setInterval(checkConnection, 30000);
        return () => clearInterval(interval);
    }, [checkConnection]);

    return {
        connected,
        lastCheck,
        quota,
        checkConnection
    };
};

/**
 * Hook untuk fetch H2H (Head to Head)
 */
export const useHeadToHead = (homeTeamId, awayTeamId) => {
    const [h2h, setH2h] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchH2H = useCallback(async () => {
        if (!homeTeamId || !awayTeamId) return;

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(
                `${API_BASE_URL}/api/matches/h2h?home=${homeTeamId}&away=${awayTeamId}`
            );
            const data = await response.json();

            if (data.success) {
                setH2h(data.data);
            } else {
                throw new Error(data.error || 'Failed to fetch H2H');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [homeTeamId, awayTeamId]);

    useEffect(() => {
        fetchH2H();
    }, [fetchH2H]);

    return { h2h, loading, error, refresh: fetchH2H };
};

/**
 * Hook untuk fetch standings/klasemen
 */
export const useStandings = (leagueId, season) => {
    const [standings, setStandings] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchStandings = useCallback(async () => {
        if (!leagueId) return;

        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams({ league: leagueId });
            if (season) params.set('season', season);

            const response = await fetch(
                `${API_BASE_URL}/api/standings?${params.toString()}`
            );
            const data = await response.json();

            if (data.success) {
                setStandings(data.data);
            } else {
                throw new Error(data.error || 'Failed to fetch standings');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [leagueId, season]);

    useEffect(() => {
        fetchStandings();
    }, [fetchStandings]);

    return { standings, loading, error, refresh: fetchStandings };
};

export const useOdds = (fixtureId) => {
    const [odds, setOdds] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [bookmaker, setBookmaker] = useState(null);

    const fetchOdds = useCallback(async () => {
        if (!fixtureId) return;

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(
                `${API_BASE_URL}/api/odds/${fixtureId}`
            );
            const data = await response.json();

            if (data.success) {
                setOdds(data.data);
                setBookmaker(data.bookmaker);
                console.log(`✅ Odds fetched for fixture ${fixtureId}:`, data.data?.length, 'bet types');
            } else {
                throw new Error(data.error || 'Failed to fetch odds');
            }
        } catch (err) {
            console.log('📊 Odds not available:', err.message);
            setError(err.message);
            setOdds(null);
        } finally {
            setLoading(false);
        }
    }, [fixtureId]);

    useEffect(() => {
        fetchOdds();
    }, [fetchOdds]);

    return { odds, loading, error, bookmaker, refresh: fetchOdds };
};

export default useMatchDetail;
