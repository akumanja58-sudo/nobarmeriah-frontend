// ============= src/components/TeamLogo.jsx =============
import React, { useState, useEffect } from 'react';
import { generateSmartLogoSources } from '../utils/bunnyCdnHelper.js';

const TeamLogo = ({
    teamId,
    teamName,
    existingUrl = null,
    size = 'md',
    className = '',
    fallbackText = null,
    onError = null,
    onSuccess = null
}) => {
    const [logoState, setLogoState] = useState({
        currentUrl: null,
        isLoading: true,
        error: null,
        sourceUsed: null,
        attemptedSources: []
    });

    // Size mapping
    const sizeClasses = {
        xs: 'w-4 h-4',
        sm: 'w-6 h-6',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16',
        '2xl': 'w-20 h-20'
    };

    useEffect(() => {
        // Generate smart logo sources using your existing helper
        const logoSources = generateSmartLogoSources(teamId, teamName, existingUrl);

        if (logoSources.length === 0) {
            setLogoState({
                currentUrl: null,
                isLoading: false,
                error: 'No logo sources available',
                sourceUsed: null,
                attemptedSources: []
            });
            onError?.('No logo sources available');
            return;
        }

        let currentIndex = 0;
        const attemptedSources = [];

        const tryNextSource = () => {
            if (currentIndex >= logoSources.length) {
                // All sources failed
                setLogoState({
                    currentUrl: null,
                    isLoading: false,
                    error: 'All logo sources failed',
                    sourceUsed: null,
                    attemptedSources
                });
                onError?.('All logo sources failed');
                return;
            }

            const currentSource = logoSources[currentIndex];
            attemptedSources.push(currentSource);

            const img = new Image();

            // Set timeout for each attempt (3 seconds)
            const timeout = setTimeout(() => {
                img.onload = null;
                img.onerror = null;
                currentIndex++;
                tryNextSource();
            }, 3000);

            img.onload = () => {
                clearTimeout(timeout);
                setLogoState({
                    currentUrl: currentSource.url,
                    isLoading: false,
                    error: null,
                    sourceUsed: currentSource,
                    attemptedSources
                });
                onSuccess?.(currentSource);
            };

            img.onerror = () => {
                clearTimeout(timeout);
                currentIndex++;
                tryNextSource();
            };

            img.src = currentSource.url;
        };

        setLogoState(prev => ({ ...prev, isLoading: true }));
        tryNextSource();

    }, [teamId, teamName, existingUrl]);

    // Loading state
    if (logoState.isLoading) {
        return (
            <div className={`${sizeClasses[size]} ${className} bg-gray-200 animate-pulse rounded-full flex items-center justify-center`}>
                <div className="w-1/2 h-1/2 bg-gray-300 rounded-full"></div>
            </div>
        );
    }

    // Error state - show fallback
    if (logoState.error || !logoState.currentUrl) {
        const displayText = fallbackText ||
            (teamName ? teamName.substring(0, 2).toUpperCase() : 'FC');

        return (
            <div
                className={`${sizeClasses[size]} ${className} bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold`}
                title={`${teamName || 'Team'} - Logo not available`}
            >
                <span className="text-xs">{displayText}</span>
            </div>
        );
    }

    // Success state - show logo
    return (
        <img
            src={logoState.currentUrl}
            alt={`${teamName || 'Team'} logo`}
            className={`${sizeClasses[size]} ${className} object-cover rounded-full border border-gray-200`}
            title={`${teamName || 'Team'} (${logoState.sourceUsed?.type})`}
            onError={() => {
                // If the img element fails after successful preload, show fallback
                setLogoState(prev => ({
                    ...prev,
                    currentUrl: null,
                    error: 'Image display failed'
                }));
            }}
        />
    );
};

// ============= src/components/LeagueLogo.jsx =============
import React, { useState, useEffect } from 'react';
import { getLeagueLogo } from '../utils/bunnyCdnHelper.js';

const LeagueLogo = ({
    leagueName,
    leagueId = null,
    size = 'md',
    className = '',
    fallbackText = null,
    showName = false
}) => {
    const [logoState, setLogoState] = useState({
        logoUrl: null,
        isLoading: true,
        error: null
    });

    const sizeClasses = {
        xs: 'w-4 h-4',
        sm: 'w-6 h-6',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16'
    };

    useEffect(() => {
        const logoUrl = getLeagueLogo(leagueName, leagueId);

        if (!logoUrl) {
            setLogoState({
                logoUrl: null,
                isLoading: false,
                error: 'No league logo available'
            });
            return;
        }

        setLogoState(prev => ({ ...prev, isLoading: true }));

        const img = new Image();

        const timeout = setTimeout(() => {
            img.onload = null;
            img.onerror = null;
            setLogoState({
                logoUrl: null,
                isLoading: false,
                error: 'Logo loading timeout'
            });
        }, 3000);

        img.onload = () => {
            clearTimeout(timeout);
            setLogoState({
                logoUrl,
                isLoading: false,
                error: null
            });
        };

        img.onerror = () => {
            clearTimeout(timeout);
            setLogoState({
                logoUrl: null,
                isLoading: false,
                error: 'Logo failed to load'
            });
        };

        img.src = logoUrl;

    }, [leagueName, leagueId]);

    // Loading state
    if (logoState.isLoading) {
        return (
            <div className={`${sizeClasses[size]} ${className} bg-gray-200 animate-pulse rounded`}>
            </div>
        );
    }

    // Error state - show fallback
    if (logoState.error || !logoState.logoUrl) {
        const displayText = fallbackText ||
            (leagueName ? leagueName.substring(0, 2).toUpperCase() : 'LG');

        return (
            <div className="flex items-center gap-2">
                <div
                    className={`${sizeClasses[size]} ${className} bg-gradient-to-br from-green-500 to-blue-600 rounded flex items-center justify-center text-white font-bold`}
                    title={`${leagueName || 'League'} - Logo not available`}
                >
                    <span className="text-xs">{displayText}</span>
                </div>
                {showName && (
                    <span className="text-sm text-gray-600">{leagueName}</span>
                )}
            </div>
        );
    }

    // Success state
    return (
        <div className="flex items-center gap-2">
            <img
                src={logoState.logoUrl}
                alt={`${leagueName || 'League'} logo`}
                className={`${sizeClasses[size]} ${className} object-cover rounded`}
                title={leagueName || 'League'}
            />
            {showName && (
                <span className="text-sm font-medium">{leagueName}</span>
            )}
        </div>
    );
};

// ============= src/components/MatchCard.jsx - Example Usage =============
import React from 'react';
import TeamLogo from './TeamLogo';
import LeagueLogo from './LeagueLogo';

const MatchCard = ({ match }) => {
    return (
        <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
            {/* League Header */}
            <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                <LeagueLogo
                    leagueName={match.league_name}
                    leagueId={match.league_id}
                    size="sm"
                />
                <span className="text-sm text-gray-600">{match.league_name}</span>
            </div>

            {/* Match Info */}
            <div className="flex items-center justify-between">
                {/* Home Team */}
                <div className="flex items-center gap-3 flex-1">
                    <TeamLogo
                        teamId={match.home_team_id}
                        teamName={match.home_team}
                        existingUrl={match.home_team_logo}
                        size="lg"
                        onError={(error) => console.log('Home team logo error:', error)}
                        onSuccess={(source) => console.log('Home team logo loaded from:', source.type)}
                    />
                    <div>
                        <div className="font-medium">{match.home_team}</div>
                        <div className="text-xs text-gray-500">Home</div>
                    </div>
                </div>

                {/* Score/Status */}
                <div className="flex flex-col items-center px-4">
                    {match.is_live ? (
                        <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                            LIVE
                        </div>
                    ) : null}
                    <div className="text-lg font-bold">
                        {match.score_display}
                    </div>
                    <div className="text-xs text-gray-500">
                        {match.kickoff_time}
                    </div>
                </div>

                {/* Away Team */}
                <div className="flex items-center gap-3 flex-1 justify-end">
                    <div className="text-right">
                        <div className="font-medium">{match.away_team}</div>
                        <div className="text-xs text-gray-500">Away</div>
                    </div>
                    <TeamLogo
                        teamId={match.away_team_id}
                        teamName={match.away_team}
                        existingUrl={match.away_team_logo}
                        size="lg"
                        onError={(error) => console.log('Away team logo error:', error)}
                        onSuccess={(source) => console.log('Away team logo loaded from:', source.type)}
                    />
                </div>
            </div>

            {/* Additional Info */}
            {match.venue && (
                <div className="mt-3 pt-2 border-t text-xs text-gray-500 text-center">
                    📍 {match.venue}
                </div>
            )}
        </div>
    );
};

// ============= src/components/MatchList.jsx - List Component =============
import React, { useState, useEffect } from 'react';
import MatchCard from './MatchCard';

const MatchList = () => {
    const [matchData, setMatchData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchMatches();
    }, []);

    const fetchMatches = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5000/api/react/matches');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setMatchData(data);

            // Log logo statistics
            console.log('📊 Logo Statistics:', data.logo_info);

        } catch (err) {
            setError(err.message);
            console.error('❌ Error fetching matches:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2">Loading matches...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-red-600">❌ Error: {error}</p>
                <button
                    onClick={fetchMatches}
                    className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!matchData || !matchData.matches?.length) {
        return (
            <div className="text-center py-8 text-gray-500">
                📅 No matches found for this date
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-2">⚽ Matches for {matchData.date}</h2>
                <div className="flex gap-4 text-sm text-gray-600">
                    <span>📊 Total: {matchData.summary.total}</span>
                    <span>🔴 Live: {matchData.summary.live}</span>
                    <span>✅ Finished: {matchData.summary.finished}</span>
                    <span>⏰ Scheduled: {matchData.summary.scheduled}</span>
                    <span>🎨 Logos: {matchData.logo_info.team_logos_generated} teams, {matchData.logo_info.league_logos_generated} leagues</span>
                </div>
            </div>

            {/* Matches by League */}
            {matchData.matches.map((league, index) => (
                <div key={index} className="space-y-3">
                    {/* League Header */}
                    <div className="flex items-center gap-3 py-2 border-b-2 border-gray-200">
                        <LeagueLogo
                            leagueName={league.league_name}
                            leagueId={league.league_id}
                            size="md"
                        />
                        <h3 className="text-lg font-semibold">{league.league_name}</h3>
                        <span className="text-sm text-gray-500">({league.matches.length} matches)</span>
                    </div>

                    {/* League Matches */}
                    <div className="grid gap-4">
                        {league.matches.map((match) => (
                            <MatchCard key={match.id} match={match} />
                        ))}
                    </div>
                </div>
            ))}

            {/* Footer Stats */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                        <div className="font-semibold text-blue-600">{matchData.logo_info.total_team_logos}</div>
                        <div className="text-gray-600">Team Logos</div>
                    </div>
                    <div>
                        <div className="font-semibold text-green-600">{matchData.logo_info.total_league_logos}</div>
                        <div className="text-gray-600">League Logos</div>
                    </div>
                    <div>
                        <div className="font-semibold text-purple-600">{matchData.source}</div>
                        <div className="text-gray-600">Data Source</div>
                    </div>
                    <div>
                        <div className="font-semibold text-orange-600">BunnyCDN</div>
                        <div className="text-gray-600">Logo CDN</div>
                    </div>
                </div>

                <div className="mt-3 pt-3 border-t text-xs text-gray-500 text-center">
                    Last updated: {new Date(matchData.last_updated).toLocaleString()}
                </div>
            </div>
        </div>
    );
};

export { TeamLogo, LeagueLogo, MatchCard, MatchList };