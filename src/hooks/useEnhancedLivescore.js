// hooks/useEnhancedLivescore.js
import { useState, useEffect, useCallback, useRef } from 'react';
import backendService from '../services/BackendApiService';

export const useEnhancedLiveMatches = (autoStart = true, refreshInterval = 30000, dateRange = 'today_tomorrow') => {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState(null);
    const [connected, setConnected] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [liveUpdateCount, setLiveUpdateCount] = useState(0);
    const [changedMatches, setChangedMatches] = useState(new Set());
    const [currentDateRange, setCurrentDateRange] = useState(dateRange);

    const intervalRef = useRef(null);
    const previousDataRef = useRef([]);

    const fetchMatches = useCallback(async (isBackground = false) => {
        try {
            if (!isBackground) setLoading(true);
            else setUpdating(true);

            setError(null);

            const healthResult = await backendService.checkServerStatus();
            setConnected(healthResult.success);

            if (!healthResult.success) {
                throw new Error('Backend not available');
            }

            // FIXED: Use existing getMatches method instead of getMatchesByDateRange
            const matchesResult = await backendService.getMatches();

            if (matchesResult.success) {
                const allMatches = matchesResult.data.matches || [];

                allMatches.sort((a, b) => new Date(a.date) - new Date(b.date));

                console.log(`[Hook] Fetched ${allMatches.length} matches`);

                setMatches(allMatches);
                setLastUpdated(new Date());
                setLiveUpdateCount(prev => prev + 1);
            } else {
                throw new Error(matchesResult.error || 'Failed to fetch matches');
            }

        } catch (err) {
            console.error('[Hook] Error fetching matches:', err);
            setError(err.message);
            setConnected(false);
        } finally {
            setLoading(false);
            setUpdating(false);
        }
    }, []);

    const changeDateRange = useCallback((newDateRange) => {
        setCurrentDateRange(newDateRange);
        // Trigger refresh with new date range
        setTimeout(() => fetchMatches(false), 100);
    }, [fetchMatches]);

    // Auto refresh
    useEffect(() => {
        if (autoStart) {
            fetchMatches();

            if (refreshInterval > 0) {
                intervalRef.current = setInterval(() => {
                    fetchMatches(true);
                }, refreshInterval);
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [autoStart, refreshInterval, fetchMatches]);

    const refresh = useCallback(() => {
        fetchMatches(false);
    }, [fetchMatches]);

    return {
        matches,
        loading,
        updating,
        error,
        connected,
        lastUpdated,
        liveUpdateCount,
        changedMatches,
        refresh: fetchMatches,
        changeDateRange,
        currentDateRange
    };
};