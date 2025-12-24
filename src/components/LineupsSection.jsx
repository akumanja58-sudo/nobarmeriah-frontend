// LineupsSection.jsx - Match Lineups Component
import React, { useState, useEffect } from 'react';
import { Users, RefreshCw, AlertCircle } from 'lucide-react';

const API_BASE = 'http://localhost:5000';

// Simple Team Logo Component
const SimpleTeamLogo = ({ teamId, teamName, logoUrl, size = 'w-6 h-6' }) => {
    const [imageSrc, setImageSrc] = useState(logoUrl);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setImageSrc(logoUrl);
        setHasError(false);
    }, [logoUrl]);

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

const LineupsSection = ({ matchData }) => {
    const [lineups, setLineups] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchLineups = async () => {
        const fixtureId = matchData?.fixture_id || matchData?.id;
        if (!fixtureId) {
            console.log('No fixture ID available for lineups:', matchData);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log('Fetching lineups for fixture:', fixtureId);

            const response = await fetch(`${API_BASE}/api/fixtures/${fixtureId}/lineups`);
            const data = await response.json();

            console.log('Lineups API Response:', data);

            if (data.success) {
                // ✅ FIX - set data.data.lineups ke state
                setLineups(data.data.lineups);
                console.log('✅ Lineups set:', data.data.lineups);
            } else {
                throw new Error(data.error || 'Failed to fetch lineups');
            }
        } catch (err) {
            console.error('Lineups fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLineups();
    }, [matchData?.fixture_id, matchData?.id]);

    // Loading state
    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-purple-600" />
                    <h3 className="font-condensed text-gray-900">Team Lineups</h3>
                    <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin ml-auto"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className="space-y-3">
                            <div className="animate-pulse h-8 bg-gray-100 rounded"></div>
                            <div className="space-y-2">
                                {[...Array(11)].map((_, j) => (
                                    <div key={j} className="animate-pulse h-6 bg-gray-100 rounded"></div>
                                ))}
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
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-600" />
                        <h3 className="font-condensed text-gray-900">Team Lineups</h3>
                    </div>
                    <button
                        onClick={fetchLineups}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        title="Retry"
                    >
                        <RefreshCw className="w-4 h-4 text-gray-500" />
                    </button>
                </div>
                <div className="text-center py-8">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">{error}</p>
                    <button
                        onClick={fetchLineups}
                        className="text-xs text-blue-600 hover:text-blue-700 underline"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    // No data state
    if (!lineups || !lineups.teams || lineups.teams.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-purple-600" />
                    <h3 className="font-condensed text-gray-900">Team Lineups</h3>
                </div>
                <div className="text-center py-8">
                    <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">Lineups not available yet</p>
                    <p className="text-xs text-gray-500">
                        Fixture ID: {matchData?.fixture_id || matchData?.id || 'Unknown'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    <h3 className="font-condensed text-gray-900">Team Lineups</h3>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                        {lineups.summary?.teams_count || lineups.teams.length} teams
                    </span>
                    <button
                        onClick={fetchLineups}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className="w-4 h-4 text-gray-500" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {lineups.teams.map((team, index) => (
                    <div key={team.team_id || index} className="space-y-4">
                        {/* Team Header */}
                        <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                            <SimpleTeamLogo
                                teamId={team.team_id}
                                teamName={team.team_name}
                                logoUrl={team.team_logo}
                                size="w-8 h-8"
                            />
                            <div className="min-w-0 flex-1">
                                <h4 className="font-condensed text-gray-900 truncate">
                                    {team.team_name}
                                </h4>
                                <p className="text-sm text-gray-500">
                                    Formation: {team.formation || 'Unknown'}
                                </p>
                            </div>
                        </div>

                        {/* Starting XI */}
                        <div>
                            <h5 className="text-sm font-condensed text-gray-700 mb-2 flex items-center justify-between">
                                <span>Starting XI</span>
                                <span className="text-xs text-gray-500">
                                    ({team.starting_xi?.length || 0})
                                </span>
                            </h5>
                            <div className="space-y-1 max-h-64 overflow-y-auto">
                                {team.starting_xi && team.starting_xi.length > 0 ? (
                                    team.starting_xi.map((player, pIndex) => (
                                        <div
                                            key={player.id || pIndex}
                                            className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                    {player.number || '?'}
                                                </span>
                                                <span className="font-condensed truncate">
                                                    {player.name || 'Unknown Player'}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-500 uppercase ml-2 flex-shrink-0">
                                                {player.position || 'N/A'}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-4 text-gray-500 text-sm">
                                        No starting XI data
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Substitutes */}
                        {team.substitutes && team.substitutes.length > 0 && (
                            <div>
                                <h5 className="text-sm font-condensed text-gray-700 mb-2 flex items-center justify-between">
                                    <span>Substitutes</span>
                                    <span className="text-xs text-gray-500">
                                        ({team.substitutes.length})
                                    </span>
                                </h5>
                                <div className="space-y-1 max-h-48 overflow-y-auto">
                                    {team.substitutes.slice(0, 7).map((player, pIndex) => (
                                        <div
                                            key={player.id || `sub-${pIndex}`}
                                            className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <span className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                    {player.number || '?'}
                                                </span>
                                                <span className="font-condensed text-gray-700 truncate">
                                                    {player.name || 'Unknown Player'}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-400 uppercase ml-2 flex-shrink-0">
                                                {player.position || 'N/A'}
                                            </span>
                                        </div>
                                    ))}
                                    {team.substitutes.length > 7 && (
                                        <div className="text-xs text-gray-500 text-center pt-2 italic">
                                            +{team.substitutes.length - 7} more substitutes
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Coach */}
                        {team.coach && team.coach.name && (
                            <div className="pt-2 border-t border-gray-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-xs font-bold text-gray-600">C</span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm text-gray-600 truncate">
                                            <span className="font-condensed">Coach:</span> {team.coach.name}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Team Stats Summary */}
                        <div className="pt-2 border-t border-gray-100">
                            <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                                <div>
                                    <span className="font-condensed">Starters:</span> {team.starting_xi?.length || 0}
                                </div>
                                <div>
                                    <span className="font-condensed">Subs:</span> {team.substitutes?.length || 0}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Summary */}
            {lineups.summary && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="text-xs text-gray-500 text-center">
                        Total: {lineups.summary.total_players} players
                        ({lineups.summary.starters} starters, {lineups.summary.substitutes} substitutes)
                    </div>
                </div>
            )}

            {/* Debug info for development */}
            {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <details className="text-xs text-gray-500">
                        <summary className="cursor-pointer">Debug Info</summary>
                        <div className="mt-2 space-y-1">
                            <div>Fixture ID: {matchData?.fixture_id || matchData?.id}</div>
                            <div>Teams: {lineups.teams?.length || 0}</div>
                            <div>Source: {lineups.source || 'Unknown'}</div>
                        </div>
                    </details>
                </div>
            )}
        </div>
    );
};

export default LineupsSection;