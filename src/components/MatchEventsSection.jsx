// MatchEventsSection.jsx - Match Events Component (Updated for new backend)
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, RefreshCw, Timer, Filter } from 'lucide-react';
import backendService from '../services/backendService';


const API_BASE = 'http://localhost:3000';

const MatchEventsSection = ({ matchData, isLive }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [eventFilter, setEventFilter] = useState('all');

    const fetchEvents = async (filterType = 'all') => {
        const fixtureId = matchData?.fixture_id || matchData?.id || matchData?.match_number;
        if (!fixtureId) {
            console.log('No fixture ID available:', matchData);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log('Fetching events for fixture:', fixtureId);

            // Build URL with filter parameter
            const filterParam = filterType !== 'all' ? `?type=${filterType}` : '';
            const url = `${API_BASE}/api/fixtures/${fixtureId}/events${filterParam}`;

            const response = await fetch(url);
            const data = await response.json();

            console.log('Events API Response:', data);

            if (data.success) {
                // Updated: backend returns data.events (not data.data)
                const eventsArray = Array.isArray(data.events) ? data.events : [];
                setEvents(eventsArray);
                setLastUpdate(new Date());

                console.log('Events data:', data.events);
                console.log('Events array length:', eventsArray.length);
            } else {
                throw new Error(data.message || data.error || 'Failed to fetch events');
            }
        } catch (err) {
            console.error('Events fetch error:', err);
            setError(err.message);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchEvents(eventFilter);

        // Listen to backendService events instead of polling
        const handleMatchUpdate = (updateData) => {
            const isOurMatch = (
                String(updateData.match_id) === String(matchData?.id) ||
                String(updateData.fixture_id) === String(matchData?.id) ||
                String(updateData.match_id) === String(matchData?.fixture_id) ||
                String(updateData.fixture_id) === String(matchData?.match_number)
            );

            if (isOurMatch) {
                console.log('[MatchEventsSection] Refreshing events due to match update');
                fetchEvents(eventFilter);
            }
        };

        // Import backendService di atas file
        // import backendService from '../services/backendService';

        backendService.on('match_update', handleMatchUpdate);

        return () => {
            backendService.off('match_update', handleMatchUpdate);
        };
    }, [matchData?.id, eventFilter]);

    // Updated to use new backend response format
    const getEventIcon = (event) => {
        const eventType = event.type?.toLowerCase();
        const eventDetail = event.detail?.toLowerCase() || '';

        switch (eventType) {
            case 'goal':
                if (eventDetail.includes('penalty')) return '🎯';
                if (eventDetail.includes('own')) return '🥅';
                return '⚽';
            case 'card':
                return eventDetail.includes('yellow') ? '🟨' : '🟥';
            case 'substitution':
                return '🔄';
            case 'var':
                return '📺';
            default:
                return event.icon || '📝';
        }
    };

    const getEventColor = (event) => {
        const eventType = event.type?.toLowerCase();
        const eventDetail = event.detail?.toLowerCase() || '';

        switch (eventType) {
            case 'goal':
                return 'bg-green-50 border-green-200';
            case 'card':
                return eventDetail.includes('yellow') ?
                    'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200';
            case 'substitution':
                return 'bg-blue-50 border-blue-200';
            case 'var':
                return 'bg-purple-50 border-purple-200';
            default:
                return 'bg-gray-50 border-gray-200';
        }
    };

    // Filter options
    const filterOptions = [
        { value: 'all', label: 'All Events', icon: '📋' },
        { value: 'goals', label: 'Goals', icon: '⚽' },
        { value: 'cards', label: 'Cards', icon: '🟨' },
        { value: 'substitutions', label: 'Subs', icon: '🔄' }
    ];

    // Loading state
    if (loading && events.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-5 h-5 text-green-600" />
                    <h3 className="font-condensed text-gray-900">Match Events</h3>
                    <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin ml-auto"></div>
                </div>
                <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse h-16 bg-gray-100 rounded-lg"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-600" />
                    <h3 className="font-condensed text-gray-900">Match Events</h3>
                    {isLive && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full animate-pulse">
                            LIVE
                        </span>
                    )}
                    {events.length > 0 && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {events.length}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {lastUpdate && (
                        <span className="text-xs text-gray-500">
                            {lastUpdate.toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </span>
                    )}
                    <button
                        onClick={() => fetchEvents(eventFilter)}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        disabled={loading}
                        title="Refresh events"
                    >
                        <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Event Filter */}
            {events.length > 0 && (
                <div className="flex gap-1 mb-4 overflow-x-auto pb-2">
                    {filterOptions.map(option => (
                        <button
                            key={option.value}
                            onClick={() => {
                                setEventFilter(option.value);
                                fetchEvents(option.value);
                            }}
                            className={`flex items-center gap-1 px-3 py-1 text-xs rounded-full border whitespace-nowrap transition-all ${eventFilter === option.value
                                ? 'bg-blue-100 border-blue-300 text-blue-700'
                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                }`}
                            disabled={loading}
                        >
                            <span>{option.icon}</span>
                            <span>{option.label}</span>
                            {option.value !== 'all' && events.filter(e => {
                                if (option.value === 'goals') return e.type === 'goal';
                                if (option.value === 'cards') return e.type === 'card';
                                if (option.value === 'substitutions') return e.type === 'substitution';
                                return true;
                            }).length > 0 && (
                                    <span className="bg-white rounded-full px-1 text-xs">
                                        {events.filter(e => {
                                            if (option.value === 'goals') return e.type === 'goal';
                                            if (option.value === 'cards') return e.type === 'card';
                                            if (option.value === 'substitutions') return e.type === 'substitution';
                                            return true;
                                        }).length}
                                    </span>
                                )}
                        </button>
                    ))}
                </div>
            )}

            {/* Error display */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-center py-2 text-red-600 text-sm">{error}</div>
                    <button
                        onClick={() => fetchEvents(eventFilter)}
                        className="w-full mt-2 px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* Events list */}
            {events.length === 0 ? (
                <div className="text-center py-8">
                    <Timer className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">
                        {isLive ? 'Waiting for events...' : 'Events akan muncul jika pertandingan sudah dimulai'}
                    </p>
                    <p className="text-xs text-gray-500">
                        {eventFilter !== 'all' ? `No ${eventFilter} events yet` : 'No events recorded yet'}
                    </p>
                    {isLive && (
                        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span>Auto-refreshing every 30 seconds</span>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {eventFilter !== 'all' && (
                        <div className="text-xs text-gray-500 mb-3 text-center">
                            Showing {events.length} {eventFilter} events
                        </div>
                    )}

                    {events.map((event, index) => (
                        <motion.div
                            key={event.id || `event-${index}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`flex items-start gap-3 p-3 rounded-lg border ${getEventColor(event)}`}
                        >
                            {/* Event Icon */}
                            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                                <span className="text-lg">
                                    {getEventIcon(event)}
                                </span>
                            </div>

                            {/* Event Details */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-condensed text-gray-900 truncate">
                                            {event.player?.name || 'Unknown Player'}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {event.team?.name} • {event.detail_indonesian || event.detail}
                                        </p>
                                        {event.assist?.name && (
                                            <p className="text-xs text-blue-600 truncate">
                                                Assist: {event.assist.name}
                                            </p>
                                        )}
                                        {event.comments && (
                                            <p className="text-xs text-gray-400 truncate mt-1">
                                                {event.comments}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-2">
                                        <span className="text-sm font-bold text-gray-900">
                                            {event.time_display || `${event.time?.elapsed || 0}'`}
                                        </span>
                                        <div className="text-xs text-gray-500 capitalize">
                                            {event.detail_indonesian || event.type}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Live match info */}
            {isLive && events.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span>Live updates active</span>
                        </div>
                        <span>Auto-refresh: 30s</span>
                    </div>
                </div>
            )}

            {/* Summary for completed events */}
            {events.length > 5 && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="bg-green-50 rounded-lg p-2">
                            <div className="text-lg">⚽</div>
                            <div className="text-xs text-gray-600">
                                {events.filter(e => e.type === 'goal').length} Goals
                            </div>
                        </div>
                        <div className="bg-yellow-50 rounded-lg p-2">
                            <div className="text-lg">🟨</div>
                            <div className="text-xs text-gray-600">
                                {events.filter(e => e.type === 'card' && e.detail?.includes('Yellow')).length} Yellow
                            </div>
                        </div>
                        <div className="bg-red-50 rounded-lg p-2">
                            <div className="text-lg">🟥</div>
                            <div className="text-xs text-gray-600">
                                {events.filter(e => e.type === 'card' && e.detail?.includes('Red')).length} Red
                            </div>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-2">
                            <div className="text-lg">🔄</div>
                            <div className="text-xs text-gray-600">
                                {events.filter(e => e.type === 'substitution').length} Subs
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MatchEventsSection;