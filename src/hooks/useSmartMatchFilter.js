// src/hooks/useSmartMatchFilter.js
import { useState, useEffect, useMemo } from 'react';
import MatchFilterService from '../services/MatchFilterService';

const useSmartMatchFilter = (matches, userPreferences = []) => {
    const [filters, setFilters] = useState({
        searchQuery: '',
        selectedLeagues: [],
        timeRange: 'all',
        showFinished: false,
        maxMatches: 50
    });

    const [filteredMatches, setFilteredMatches] = useState([]);
    const [loading, setLoading] = useState(false);

    // Initialize filter service
    const filterService = useMemo(() => new MatchFilterService(), []);

    // Get filter counts and available leagues
    const filterCounts = useMemo(() => {
        return filterService.getFilterCounts(matches);
    }, [matches, filterService]);

    const availableLeagues = useMemo(() => {
        return filterService.getAvailableLeagues(matches);
    }, [matches, filterService]);

    // Apply filters when matches or filters change
    useEffect(() => {
        const applyFilters = async () => {
            setLoading(true);

            // Small delay untuk smooth UX
            await new Promise(resolve => setTimeout(resolve, 100));

            try {
                const filtered = filterService.filterMatches(matches, {
                    ...filters,
                    userPreferences
                });

                setFilteredMatches(filtered);
            } catch (error) {
                console.error('[useSmartMatchFilter] Filter error:', error);
                setFilteredMatches(matches); // Fallback to all matches
            } finally {
                setLoading(false);
            }
        };

        applyFilters();
    }, [matches, filters, userPreferences, filterService]);

    // Filter update functions
    const updateFilters = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    const setSearchQuery = (query) => {
        updateFilters({ searchQuery: query });
    };

    const setTimeRange = (range) => {
        updateFilters({ timeRange: range });
    };

    const toggleLeague = (league) => {
        setFilters(prev => ({
            ...prev,
            selectedLeagues: prev.selectedLeagues.includes(league)
                ? prev.selectedLeagues.filter(l => l !== league)
                : [...prev.selectedLeagues, league]
        }));
    };

    const toggleShowFinished = () => {
        updateFilters({ showFinished: !filters.showFinished });
    };

    const clearFilters = () => {
        setFilters({
            searchQuery: '',
            selectedLeagues: [],
            timeRange: 'all',
            showFinished: false,
            maxMatches: 50
        });
    };

    // Quick filter methods
    const setQuickFilter = (type) => {
        switch (type) {
            case 'live':
                updateFilters({ timeRange: 'live', showFinished: false });
                break;
            case 'next2h':
                updateFilters({ timeRange: 'next2h', showFinished: false });
                break;
            case 'today':
                updateFilters({ timeRange: 'today', showFinished: false });
                break;
            case 'popular':
                updateFilters({ timeRange: 'popular', showFinished: false });
                break;
            case 'all':
                clearFilters();
                break;
            default:
                break;
        }
    };

    // Check if any filters are active
    const hasActiveFilters = Boolean(
        filters.searchQuery ||
        filters.selectedLeagues.length > 0 ||
        filters.timeRange !== 'all' ||
        filters.showFinished
    );

    return {
        // Filtered data
        filteredMatches,
        loading,

        // Filter state
        filters,
        hasActiveFilters,

        // Update methods
        updateFilters,
        setSearchQuery,
        setTimeRange,
        toggleLeague,
        toggleShowFinished,
        clearFilters,
        setQuickFilter,

        // Helper data
        filterCounts,
        availableLeagues
    };
};

export default useSmartMatchFilter;