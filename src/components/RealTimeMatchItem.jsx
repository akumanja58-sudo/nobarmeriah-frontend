// RealTimeMatchItem.jsx
import React, { useState, useEffect } from 'react';
import { Star, MapPin, Wifi, WifiOff, Volume2 } from 'lucide-react';
import StatusManager from '../utils/StatusManager';

// Simple Team Logo Component
const SimpleTeamLogo = ({ teamId, teamName, logoUrl, size = 'w-5 h-5' }) => {
    const [imageSrc, setImageSrc] = useState(logoUrl);
    const [hasError, setHasError] = useState(false);
    const [fallbackIndex, setFallbackIndex] = useState(0);

    const BUNNYCDN_BASE = 'https://api-football-logos.b-cdn.net';

    const getFallbackUrls = () => {
        const urls = [];

        if (teamId) {
            urls.push(`${BUNNYCDN_BASE}/football/teams/${teamId}.png`);
        }

        if (logoUrl && !logoUrl.includes(BUNNYCDN_BASE)) {
            urls.push(logoUrl);
        }

        if (teamId) {
            urls.push(`https://media.api-sports.io/football/teams/${teamId}.png`);
        }

        return urls.filter(Boolean);
    };

    const fallbackUrls = getFallbackUrls();

    useEffect(() => {
        setFallbackIndex(0);
        setHasError(false);

        if (fallbackUrls.length > 0) {
            setImageSrc(fallbackUrls[0]);
        } else {
            setImageSrc(null);
            setHasError(true);
        }
    }, [teamId, logoUrl]);

    const handleError = () => {
        const nextIndex = fallbackIndex + 1;

        if (nextIndex < fallbackUrls.length) {
            setFallbackIndex(nextIndex);
            setImageSrc(fallbackUrls[nextIndex]);
        } else {
            setHasError(true);
        }
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

/**
 * Format waktu dari date string ke format WIB
 */
const formatKickoffTime = (dateString) => {
    if (!dateString) return null;

    try {
        const date = new Date(dateString);

        const options = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'Asia/Jakarta'
        };

        return date.toLocaleTimeString('id-ID', options);
    } catch (e) {
        return null;
    }
};

const getEnhancedStatusDisplay = (match) => {
    if (match.phase_info || match.status_color || match.display_text) {
        return {
            text: match.display_text || match.status,
            subText: match.contextual_info || '',
            color: match.status_color === 'red' ? 'text-red-600' :
                match.status_color === 'orange' ? 'text-orange-600' :
                    match.status_color === 'green' ? 'text-green-600' :
                        match.status_color === 'blue' ? 'text-blue-600' : 'text-gray-600',
            icon: match.status_icon || '',
            isCritical: match.is_critical_moment || false,
            isApproaching: match.approaching_break || match.approaching_end || false,
            remainingTime: match.estimated_remaining,
            phaseInfo: match.phase_info
        };
    }
    return null;
};

const RealTimeMatchItem = ({ match, layout = 'mobile', showDate = false, onMatchClick, statusInfo }) => {
    // Display helpers
    const shouldShowScore = () => {
        if (match.is_live || match.is_finished) return true;

        const liveStatuses = ['live', '1h', '2h', 'ht', 'halftime', 'et', 'finished', 'ft', 'selesai', 'babak pertama', 'babak kedua', 'istirahat'];
        const status = match.status_short || match.status || '';
        const statusMatch = liveStatuses.some(s =>
            status.toLowerCase().includes(s.toLowerCase())
        );

        return statusMatch || (match.home_score > 0 || match.away_score > 0);
    };

    // ✅ UPDATED: getStatusDisplay dengan jam kick-off
    const getStatusDisplay = () => {
        const status = match.status_short || match.status || 'NS';

        // Cek apakah match scheduled (belum mulai)
        const isScheduled = ['NS', 'TBD', 'scheduled'].includes(status) ||
            status.toLowerCase().includes('not started') ||
            status.toLowerCase().includes('scheduled');

        if (isScheduled) {
            // Ambil jam kick-off dari field date
            let kickoffTime = match.kickoff_wib || match.kickoff || match.local_time;

            if (!kickoffTime && match.date) {
                kickoffTime = formatKickoffTime(match.date);
            }

            if (kickoffTime && kickoffTime !== 'TBD') {
                return {
                    text: kickoffTime,
                    subText: 'WIB',
                    color: 'text-blue-600'
                };
            }

            return {
                text: 'TBD',
                subText: '',
                color: 'text-gray-500'
            };
        }

        // Untuk match yang sudah/sedang berlangsung
        if (statusInfo) {
            return statusInfo;
        }

        return StatusManager.getDisplayInfo(match);
    };

    const enhancedMatch = {
        ...match,
        lastUpdated: match.lastUpdated || new Date().toISOString()
    };

    // MOBILE LAYOUT
    if (layout === 'mobile') {
        return (
            <div
                className={`p-3 border-b border-gray-100 hover:bg-gray-50 transition-all cursor-pointer relative 
                    ${match.is_live ? 'bg-red-50 border-red-100' : ''}
                    ${match.is_critical_moment ? 'ring-2 ring-red-500 ring-opacity-50 bg-red-50' : ''}
                    ${match.approaching_break || match.approaching_end ? 'bg-yellow-50 border-yellow-200' : ''}
                `}
                onClick={() => onMatchClick && onMatchClick(enhancedMatch)}
                data-match-id={match.id}
            >

                {/* Match content mobile */}
                <div className="flex items-center justify-between">
                    {/* Status/Time */}
                    <div className="w-16 text-center flex-shrink-0">
                        {(() => {
                            const statusInfo = getStatusDisplay();
                            return (
                                <div>
                                    <div className={`text-sm font-semibold ${statusInfo.color}`}>
                                        {statusInfo.text}
                                    </div>
                                    {statusInfo.subText && (
                                        <div className="text-xs text-gray-500">
                                            {statusInfo.subText}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>

                    {/* Teams */}
                    <div className="flex-1 mx-3">
                        {/* Home */}
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                                <SimpleTeamLogo
                                    teamId={match.home_team_id}
                                    teamName={match.home_team}
                                    logoUrl={match.home_team_logo || match.home_logo}
                                    size="w-5 h-5"
                                />
                                <span className="text-sm truncate">{match.home_team}</span>
                            </div>
                            <span className={`font-bold ml-2 ${match.is_live ? 'text-red-600' : ''}`}>
                                {shouldShowScore() ? (match.home_score ?? 0) : '-'}
                            </span>
                        </div>
                        {/* Away */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                                <SimpleTeamLogo
                                    teamId={match.away_team_id}
                                    teamName={match.away_team}
                                    logoUrl={match.away_team_logo || match.away_logo}
                                    size="w-5 h-5"
                                />
                                <span className="text-sm truncate">{match.away_team}</span>
                            </div>
                            <span className={`font-bold ml-2 ${match.is_live ? 'text-red-600' : ''}`}>
                                {shouldShowScore() ? (match.away_score ?? 0) : '-'}
                            </span>
                        </div>
                    </div>

                    {/* Favorite */}
                    <button
                        className="p-1 flex-shrink-0"
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                    >
                        <Star className="w-4 h-4 text-gray-300 hover:text-yellow-500" />
                    </button>
                </div>
            </div>
        );
    }

    // DESKTOP LAYOUT
    return (
        <div
            className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-all cursor-pointer
                ${match.is_live ? 'bg-red-50 border-red-100' : ''}
                ${match.is_critical_moment ? 'ring-2 ring-red-500 ring-opacity-50' : ''}
            `}
            onClick={() => onMatchClick && onMatchClick(enhancedMatch)}
            data-match-id={match.id}
        >
            <div className="grid grid-cols-12 gap-4 items-center">
                {/* Time/Status - 2 columns */}
                <div className="col-span-2">
                    <div className="text-center">
                        {(() => {
                            const statusInfo = getStatusDisplay();
                            return (
                                <div>
                                    <div className={`text-lg font-medium ${statusInfo.color} ${(statusInfo.text === 'LIVE' || statusInfo.text === 'HT') ? 'font-bold' : ''}`}>
                                        {statusInfo.text}
                                    </div>
                                    {statusInfo.subText && (
                                        <div className={`text-sm ${statusInfo.text === 'LIVE' ? 'text-red-500 font-semibold' :
                                            statusInfo.text === 'HT' ? 'text-orange-500 font-semibold' :
                                                statusInfo.text === 'FT' ? 'text-green-500' :
                                                    'text-gray-500'
                                            }`}>
                                            {statusInfo.subText}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                </div>

                {/* Teams Section - 8 columns */}
                <div className="col-span-8">
                    {/* Home Team */}
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <SimpleTeamLogo
                                teamId={match.home_team_id}
                                teamName={match.home_team}
                                logoUrl={match.home_team_logo || match.home_logo}
                                size="w-6 h-6"
                            />
                            <span className={`text-base font-medium truncate ${match.is_live ? 'text-gray-900 font-semibold' : 'text-gray-900'}`}>
                                {match.home_team}
                            </span>
                        </div>
                        <span className={`text-lg font-bold ml-2 transition-all duration-300 ${match.is_live ? 'text-red-600' : 'text-gray-900'}`}>
                            {shouldShowScore() ? (
                                <>
                                    {match.home_score ?? 0}
                                    {(match.pen_home !== undefined && match.pen_away !== undefined && (match.pen_home > 0 || match.pen_away > 0)) && (
                                        <span className="text-purple-600 ml-1 text-sm">({match.pen_home})</span>
                                    )}
                                </>
                            ) : (
                                <span className="text-gray-400 text-sm">-</span>
                            )}
                        </span>
                    </div>

                    {/* Away Team */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <SimpleTeamLogo
                                teamId={match.away_team_id}
                                teamName={match.away_team}
                                logoUrl={match.away_team_logo || match.away_logo}
                                size="w-6 h-6"
                            />
                            <span className={`text-base font-medium truncate ${match.is_live ? 'text-gray-900 font-semibold' : 'text-gray-900'}`}>
                                {match.away_team}
                            </span>
                        </div>
                        <span className={`text-lg font-bold ml-2 transition-all duration-300 ${match.is_live ? 'text-red-600' : 'text-gray-900'}`}>
                            {shouldShowScore() ? (
                                <>
                                    {match.away_score ?? 0}
                                    {(match.pen_home !== undefined && match.pen_away !== undefined && (match.pen_home > 0 || match.pen_away > 0)) && (
                                        <span className="text-purple-600 ml-1 text-sm">({match.pen_away})</span>
                                    )}
                                </>
                            ) : (
                                <span className="text-gray-400 text-sm">-</span>
                            )}
                        </span>
                    </div>
                </div>

                {/* Actions - 2 columns */}
                <div className="col-span-2 flex items-center justify-end space-x-3">
                    {match.is_live && (
                        <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-red-600 font-semibold">LIVE</span>
                        </div>
                    )}

                    <button
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                    >
                        <Star className="w-5 h-5 text-gray-400 hover:text-yellow-500" />
                    </button>
                </div>
            </div>

            {/* Live Status Bar */}
            {(match.is_live || match.status_short === 'HT' || match.status === 'HT') && (
                <div className={`mt-4 flex items-center justify-between rounded-lg p-3 ${match.status_short === 'HT' || match.status === 'HT'
                    ? 'bg-orange-50 border-orange-200 border'
                    : 'bg-red-50 border-red-200 border'
                    }`}>
                    <div className="flex items-center space-x-4">
                        <div className={`flex items-center space-x-2 ${match.status_short === 'HT' || match.status === 'HT' ? 'text-orange-600' : 'text-red-600'
                            }`}>
                            <div className={`w-3 h-3 rounded-full animate-pulse ${match.status_short === 'HT' || match.status === 'HT' ? 'bg-orange-500' : 'bg-red-500'
                                }`}></div>
                            <span className="font-semibold">
                                {match.status_short === 'HT' || match.status === 'HT' ? 'Istirahat' : 'Match Sedang Berlangsung'}
                            </span>
                            {match.elapsed && (
                                <span className="text-sm bg-white bg-opacity-50 px-2 py-1 rounded">
                                    {match.elapsed}'
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <button className="text-sm bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                            Live Stats
                        </button>
                        <button className="text-sm border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                            Share
                        </button>
                    </div>
                </div>
            )}

            {/* Venue & Date Info */}
            <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center text-xs text-gray-500">
                    {match.venue && match.venue !== 'Unknown' && match.venue !== 'null' ? (
                        <>
                            <MapPin className="w-3 h-3 mr-1" />
                            {match.venue}
                        </>
                    ) : null}
                </div>

                {showDate && match.date && (
                    <div className="text-xs text-gray-500">
                        {new Date(match.date).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RealTimeMatchItem;
