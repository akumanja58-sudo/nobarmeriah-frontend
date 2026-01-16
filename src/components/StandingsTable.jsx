// StandingsTable.jsx - League Standings Component
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, TrendingUp, TrendingDown, Minus,
    RefreshCw, Loader2, AlertCircle, Crown,
    ChevronUp, ChevronDown, Users
} from 'lucide-react';

const API_BASE = 'http://localhost:5000';

// Team logo component (reuse from PredictionForm)
const TeamLogo = ({ teamId, teamName, logoUrl, size = 'w-6 h-6' }) => {
    const [imageSrc, setImageSrc] = useState(logoUrl);
    const [hasError, setHasError] = useState(false);

    // Generate team logo URL
    const generateTeamLogoUrl = (teamId, teamName) => {
        if (teamId) {
            return `https://api-football-logos.b-cdn.net/football/teams/${teamId}.png`;
        }
        return null;
    };

    useEffect(() => {
        const logoUrl = generateTeamLogoUrl(teamId, teamName) || imageSrc;
        setImageSrc(logoUrl);
        setHasError(false);
    }, [teamId, teamName, logoUrl]);

    const handleError = () => {
        setHasError(true);
    };

    if (hasError || !imageSrc) {
        const initials = teamName ? teamName.substring(0, 2).toUpperCase() : 'FC';
        return (
            <div
                className={`${size} bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}
                title={teamName}
            >
                {initials}
            </div>
        );
    }

    return (
        <img
            src={imageSrc}
            alt={`${teamName} logo`}
            className={`${size} object-cover rounded-full border border-gray-200 flex-shrink-0`}
            onError={handleError}
            title={teamName}
        />
    );
};

// Position badge component
const PositionBadge = ({ position, description }) => {
    const getPositionColor = (pos, desc) => {
        if (pos === 1) return 'bg-yellow-500 text-white'; // Champion
        if (pos <= 4) return 'bg-blue-500 text-white'; // Champions League
        if (pos <= 6) return 'bg-green-500 text-white'; // Europa League
        if (desc && desc.toLowerCase().includes('relegation')) return 'bg-red-500 text-white';
        return 'bg-gray-500 text-white';
    };

    const getPositionIcon = (pos, desc) => {
        if (pos === 1) return <Crown className="w-3 h-3" />;
        if (pos <= 4) return <Trophy className="w-3 h-3" />;
        if (pos <= 6) return <TrendingUp className="w-3 h-3" />;
        if (desc && desc.toLowerCase().includes('relegation')) return <TrendingDown className="w-3 h-3" />;
        return null;
    };

    return (
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getPositionColor(position, description)}`}>
            {getPositionIcon(position, description) || position}
        </div>
    );
};

// Form display component
const FormDisplay = ({ form }) => {
    if (!form) return null;

    const getFormColor = (result) => {
        switch (result) {
            case 'W': return 'bg-green-500';
            case 'D': return 'bg-yellow-500';
            case 'L': return 'bg-red-500';
            default: return 'bg-gray-400';
        }
    };

    return (
        <div className="flex gap-1">
            {form.split('').slice(-5).map((result, index) => (
                <div
                    key={index}
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-xs text-white font-bold ${getFormColor(result)}`}
                    title={result === 'W' ? 'Win' : result === 'D' ? 'Draw' : 'Loss'}
                >
                    {result}
                </div>
            ))}
        </div>
    );
};

// Main Standings component
const StandingsTable = ({ leagueId, matchData = null }) => {
    const [standings, setStandings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [leagueInfo, setLeagueInfo] = useState(null);
    const [expandedTeam, setExpandedTeam] = useState(null);

    // Determine league ID from match data if not provided
    const currentLeagueId = leagueId || matchData?.league_id;
    const currentSeason = new Date().getFullYear();

    // Fetch standings data
    const fetchStandings = async (forceRefresh = false) => {
        if (!currentLeagueId) {
            console.log('No league ID available');
            setError('No league ID available');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            console.log('Making API request to:', `${API_BASE}/api/standings/league/${currentLeagueId}`);

            const response = await fetch(
                `${API_BASE}/api/standings/league/${currentLeagueId}?season=${currentSeason}`
            );

            console.log('API response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('API response data:', data);

            // ✅ FIX INI BAGIAN - Set data ke state
            if (data.success && data.data && data.data.standings) {
                setStandings(data.data.standings); // <- YANG INI YANG KURANG
                setLastUpdated(new Date());

                // Set league info jika ada
                if (data.data.league_info) {
                    setLeagueInfo(data.data.league_info);
                }

                console.log('✅ Standings set:', data.data.standings.length, 'teams');
            } else {
                throw new Error('No standings data available');
            }

        } catch (error) {
            console.error('Fetch error:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Highlight current match teams
    const getTeamHighlight = (teamName) => {
        if (!matchData) return '';

        if (teamName === matchData.home_team) return 'bg-blue-50 border-l-4 border-blue-500';
        if (teamName === matchData.away_team) return 'bg-green-50 border-l-4 border-green-500';
        return '';
    };

    // Get team position change indicator
    const getPositionTrend = (position) => {
        // This would normally compare with previous week/month data
        // For now, just show neutral
        return <Minus className="w-3 h-3 text-gray-400" />;
    };

    // Toggle expanded team details
    const toggleExpandedTeam = (teamId) => {
        setExpandedTeam(expandedTeam === teamId ? null : teamId);
    };

    useEffect(() => {
        fetchStandings();
    }, [currentLeagueId, currentSeason]);

    // Loading state
    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-condensed text-gray-900">League Standing</h3>
                    <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                </div>
                <div className="space-y-3">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                            <div className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg">
                                <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                                <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                                <div className="h-4 bg-gray-300 rounded flex-1"></div>
                                <div className="w-16 h-4 bg-gray-300 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-condensed text-gray-900">League Standing</h3>
                    <button
                        onClick={() => fetchStandings(true)}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        title="Retry"
                    >
                        <RefreshCw className="w-4 h-4 text-gray-500" />
                    </button>
                </div>
                <div className="text-center py-8">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-3">{error}</p>
                    <button
                        onClick={() => fetchStandings(true)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-condensed hover:bg-red-600 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // Empty state
    if (!standings || standings.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-condensed text-gray-900">League Standing</h3>
                    <button
                        onClick={() => fetchStandings(true)}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <RefreshCw className="w-4 h-4 text-gray-500" />
                    </button>
                </div>
                <div className="text-center py-8">
                    <Trophy className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No standings available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-lg p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-600" />
                    <h3 className="font-condensed text-gray-900">
                        {leagueInfo?.name || matchData?.league || 'League Standing'}
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    {lastUpdated && (
                        <span className="text-xs text-gray-500">
                            {lastUpdated.toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </span>
                    )}
                    <button
                        onClick={() => fetchStandings(true)}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        title="Refresh standings"
                    >
                        <RefreshCw className="w-4 h-4 text-gray-500" />
                    </button>
                </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50 rounded-lg text-xs font-condensed text-gray-600 mb-2">
                <div className="col-span-1">#</div>
                <div className="col-span-4">Team</div>
                <div className="col-span-1 text-center">P</div>
                <div className="col-span-1 text-center">W</div>
                <div className="col-span-1 text-center">D</div>
                <div className="col-span-1 text-center">L</div>
                <div className="col-span-1 text-center">GD</div>
                <div className="col-span-2 text-center">Pts</div>
            </div>

            {/* Standings List */}
            <div className="space-y-1">
                <AnimatePresence>
                    {standings.map((team, index) => (
                        <motion.div
                            key={team.team_id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`relative ${getTeamHighlight(team.team_name)}`}
                        >
                            {/* Main Row */}
                            <div
                                className="grid grid-cols-12 gap-2 px-3 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={() => toggleExpandedTeam(team.team_id)}
                            >
                                {/* Position */}
                                <div className="col-span-1 flex items-center gap-1">
                                    <PositionBadge
                                        position={team.position}
                                        description={team.description}
                                    />
                                    {getPositionTrend(team.position)}
                                </div>

                                {/* Team */}
                                <div className="col-span-4 flex items-center gap-2 min-w-0">
                                    <TeamLogo
                                        teamId={team.team_id}
                                        teamName={team.team_name}
                                        logoUrl={team.team_logo}
                                        size="w-6 h-6"
                                    />
                                    <span className="font-condensed text-gray-900 truncate flex-1">
                                        {team.team_name}
                                    </span>
                                    {expandedTeam === team.team_id ? (
                                        <ChevronUp className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                    ) : (
                                        <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                    )}
                                </div>

                                {/* Stats */}
                                <div className="col-span-1 text-center text-sm font-condensed text-gray-700">
                                    {team.played}
                                </div>
                                <div className="col-span-1 text-center text-sm font-condensed text-green-600">
                                    {team.won}
                                </div>
                                <div className="col-span-1 text-center text-sm font-condensed text-yellow-600">
                                    {team.drawn}
                                </div>
                                <div className="col-span-1 text-center text-sm font-condensed text-red-600">
                                    {team.lost}
                                </div>
                                <div className="col-span-1 text-center text-sm font-condensed text-gray-700">
                                    {team.goal_difference > 0 ? '+' : ''}{team.goal_difference}
                                </div>
                                <div className="col-span-2 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-sm font-bold text-gray-900">
                                            {team.points}
                                        </span>
                                        {team.form && (
                                            <FormDisplay form={team.form} />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            <AnimatePresence>
                                {expandedTeam === team.team_id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden bg-gray-50 border-t border-gray-200"
                                    >
                                        <div className="px-3 py-3 space-y-2">
                                            {/* Home/Away Stats */}
                                            <div className="grid grid-cols-2 gap-4 text-xs">
                                                <div>
                                                    <h5 className="font-condensed text-gray-600 mb-1">Home</h5>
                                                    <div className="flex justify-between">
                                                        <span>Played: {team.home_played}</span>
                                                        <span>Points: {(team.home_won * 3) + team.home_drawn}</span>
                                                    </div>
                                                    <div className="text-gray-500">
                                                        {team.home_won}W {team.home_drawn}D {team.home_lost}L
                                                    </div>
                                                </div>
                                                <div>
                                                    <h5 className="font-condensed text-gray-600 mb-1">Away</h5>
                                                    <div className="flex justify-between">
                                                        <span>Played: {team.away_played}</span>
                                                        <span>Points: {(team.away_won * 3) + team.away_drawn}</span>
                                                    </div>
                                                    <div className="text-gray-500">
                                                        {team.away_won}W {team.away_drawn}D {team.away_lost}L
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Goals */}
                                            <div className="flex justify-between text-xs text-gray-600">
                                                <span>Goals For: {team.goals_for}</span>
                                                <span>Goals Against: {team.goals_against}</span>
                                            </div>

                                            {/* Description/Qualification */}
                                            {team.description && (
                                                <div className="text-xs text-gray-600 italic">
                                                    {team.description}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Footer Info */}
            <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500">
                <div className="flex justify-between items-center">
                    <span>{standings.length} teams</span>
                    <span>Season {currentSeason}</span>
                </div>

                {/* Legend */}
                <div className="mt-2 flex flex-wrap gap-2">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span>Champion</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Champions League</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Europa League</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span>Relegation</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StandingsTable;