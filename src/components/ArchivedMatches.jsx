import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Archive, Calendar, Trophy, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import backendService from '../services/BackendApiService';
import RealTimeMatchItem from './RealTimeMatchItem';

const ArchivedMatches = ({ onMatchClick }) => {
    const [archivedMatches, setArchivedMatches] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [archiveStats, setArchiveStats] = useState({});
    const [currentPage, setCurrentPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const MATCHES_PER_PAGE = 20;

    // Fetch archived matches
    const fetchArchivedMatches = async (page = 0, append = false) => {
        try {
            setIsLoading(true);
            const offset = page * MATCHES_PER_PAGE;

            const result = await backendService.getArchivedMatches(MATCHES_PER_PAGE, offset);

            if (result.success) {
                const newMatches = result.data.matches || [];

                if (append) {
                    setArchivedMatches(prev => [...prev, ...newMatches]);
                } else {
                    setArchivedMatches(newMatches);
                }

                setHasMore(newMatches.length === MATCHES_PER_PAGE);
                setCurrentPage(page);
            } else {
                console.error('Failed to fetch archived matches:', result.error);
                setArchivedMatches([]);
            }
        } catch (error) {
            console.error('Archive fetch error:', error);
            setArchivedMatches([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch archive stats
    const fetchArchiveStats = async () => {
        try {
            const result = await backendService.getArchiveStats();
            if (result.success) {
                setArchiveStats(result.stats);
            }
        } catch (error) {
            console.error('Archive stats error:', error);
        }
    };

    // Load more matches
    const loadMoreMatches = () => {
        if (!isLoading && hasMore) {
            fetchArchivedMatches(currentPage + 1, true);
        }
    };

    // Refresh
    const handleRefresh = () => {
        setCurrentPage(0);
        fetchArchivedMatches(0, false);
        fetchArchiveStats();
    };

    // Initial load
    useEffect(() => {
        fetchArchivedMatches();
        fetchArchiveStats();
    }, []);

    // Group matches by date
    const groupedMatches = archivedMatches.reduce((acc, match) => {
        const date = match.local_date || match.kickoff_date || 'Unknown Date';
        if (!acc[date]) acc[date] = [];
        acc[date].push(match);
        return acc;
    }, {});

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Archive className="w-6 h-6 text-gray-600" />
                    <div>
                        <h1 className="text-xl sm:text-2xl font-condensed text-gray-900">Match Archive</h1>
                        <p className="text-sm text-gray-600">Finished matches history</p>
                    </div>
                </div>

                <button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Refresh</span>
                </button>
            </div>

            {/* Stats */}
            {archiveStats.archived_matches !== undefined && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg p-4 shadow-sm border">
                        <div className="text-2xl font-condensed text-gray-900">{archiveStats.archived_matches}</div>
                        <div className="text-sm text-gray-600">Archived</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border">
                        <div className="text-2xl font-condensed text-gray-900">{archiveStats.active_matches}</div>
                        <div className="text-sm text-gray-600">Active</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border">
                        <div className="text-2xl font-condensed text-gray-900">{archiveStats.total_matches}</div>
                        <div className="text-sm text-gray-600">Total</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border">
                        <div className="text-2xl font-condensed text-green-600">{archivedMatches.length}</div>
                        <div className="text-sm text-gray-600">Loaded</div>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {isLoading && archivedMatches.length === 0 && (
                <div className="flex items-center justify-center py-20">
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-gray-600">Loading archived matches...</span>
                    </div>
                </div>
            )}

            {/* Matches */}
            <div className="space-y-6">
                {Object.entries(groupedMatches).map(([date, matches]) => (
                    <motion.div
                        key={date}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-xl shadow-sm border overflow-hidden"
                    >
                        {/* Date Header */}
                        <div className="flex items-center gap-3 px-4 sm:px-6 py-3 bg-gray-50 border-b">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="font-condensed text-gray-900">{date}</span>
                            <span className="text-sm text-gray-500">({matches.length} matches)</span>
                        </div>

                        {/* Matches */}
                        <div className="divide-y divide-gray-100">
                            {matches.map((match, idx) => (
                                <RealTimeMatchItem
                                    key={`${match.id}-${idx}`}
                                    match={match}
                                    layout="desktop"
                                    showDate={false}
                                    onMatchClick={onMatchClick}
                                    isArchived={true}
                                />
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Load More */}
            {hasMore && archivedMatches.length > 0 && (
                <div className="text-center mt-8">
                    <button
                        onClick={loadMoreMatches}
                        disabled={isLoading}
                        className="flex items-center gap-2 mx-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Loading...</span>
                            </>
                        ) : (
                            <>
                                <ChevronRight className="w-4 h-4" />
                                <span>Load More Matches</span>
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Empty State */}
            {archivedMatches.length === 0 && !isLoading && (
                <div className="text-center py-20">
                    <Archive className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg text-gray-600 mb-2">No Archived Matches</h3>
                    <p className="text-gray-500">Finished matches will appear here</p>
                </div>
            )}
        </div>
    );
};

export default ArchivedMatches;
