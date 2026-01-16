// ============= 🔥 MATCH ITEM COMPONENT =============
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const MatchItem = ({ match, showDate = false, layout = 'mobile' }) => {
    const [failedLogos, setFailedLogos] = useState(new Set());

    const isLive = match.status === 'LIVE' || match.status === 'live';
    const isFinished = match.status === 'FT' || match.status === 'finished';
    const isUpcoming = !isLive && !isFinished;

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short'
        });
    };

    // 🔥 ROBUST TIME DISPLAY FUNCTION
    const formatDisplayTime = (match) => {
        // Priority: local_time > calculated time from kickoff
        if (match.local_time && match.local_time !== 'undefined') {
            return match.local_time;
        }

        // Fallback: format dari kickoff
        if (match.kickoff) {
            return formatTime(match.kickoff);
        }

        // Last resort
        return '--:--';
    };

    // 🔥 ROBUST DATE DISPLAY FUNCTION  
    const formatDisplayDate = (match) => {
        // Priority: local_date > calculated date from kickoff
        if (match.local_date && match.local_date !== 'undefined') {
            const date = new Date(match.local_date + 'T00:00:00');
            return date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short'
            });
        }

        // Fallback: format dari kickoff
        if (match.kickoff) {
            return formatDate(match.kickoff);
        }

        return '--';
    };

    // 🔥 IMPROVED LOGO HANDLING
    const getTeamLogo = (logoUrl, teamName, teamId) => {
        const logoKey = `${teamId}-${teamName}`;

        // If this logo already failed, return fallback immediately
        if (failedLogos.has(logoKey)) {
            return null;
        }

        // Try multiple sources for team logos
        const logoSources = [
            logoUrl,
            `https://media.api-sports.io/football/teams/${teamId}.png`,
            `https://logos.footballapi.com/v2/${teamId}.png`,
            `https://media.api-sports.io/football/teams/${teamId}.svg`,
            `https://logo.clearbit.com/${teamName.toLowerCase().replace(/\s+/g, '')}.com`,
            `https://logo.clearbit.com/${teamName.toLowerCase().replace(/\s+/g, '-')}.com`,
            `https://ui-avatars.com/api/?name=${encodeURIComponent(teamName)}&background=0066cc&color=fff&size=128&format=png`,
            `https://avatar.iran.liara.run/username?username=${encodeURIComponent(teamName)}`
        ].filter(Boolean);

        return logoSources[0];
    };

    const handleLogoError = (teamName, teamId, e) => {
        const logoKey = `${teamId}-${teamName}`;
        setFailedLogos(prev => new Set([...prev, logoKey]));

        // Hide the broken image
        e.target.style.display = 'none';

        // Show the fallback div that should be the next sibling
        if (e.target.nextElementSibling) {
            e.target.nextElementSibling.style.display = 'flex';
        }
    };

    const TeamLogo = ({ logoUrl, teamName, teamId, size = 'w-5 h-5' }) => {
        const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
        const logoKey = `${teamId}-${teamName}`;

        const logoSources = [
            logoUrl,
            `https://media.api-sports.io/football/teams/${teamId}.png`,
            `https://logos.footballapi.com/v2/${teamId}.png`,
            `https://media.api-sports.io/football/teams/${teamId}.svg`,
            `https://logo.clearbit.com/${teamName.toLowerCase().replace(/\s+/g, '')}.com`,
            `https://avatar.iran.liara.run/username?username=${encodeURIComponent(teamName)}&background=random`
        ].filter(Boolean);

        const hasTriedAllSources = currentSourceIndex >= logoSources.length;
        const currentLogoUrl = logoSources[currentSourceIndex];

        const handleLogoError = () => {
            if (currentSourceIndex < logoSources.length - 1) {
                setCurrentSourceIndex(prev => prev + 1);
            } else {
                // All sources failed, mark as failed
                setFailedLogos(prev => new Set([...prev, logoKey]));
            }
        };

        const shouldShowFallback = failedLogos.has(logoKey) || hasTriedAllSources;

        return (
            <div className={`${size} rounded-full overflow-hidden bg-gray-100 flex-shrink-0 relative`}>
                {!shouldShowFallback && currentLogoUrl && (
                    <img
                        key={currentSourceIndex} // Force re-render when source changes
                        src={currentLogoUrl}
                        alt={teamName}
                        className="w-full h-full object-cover"
                        onError={handleLogoError}
                    />
                )}

                {/* Fallback - Team initials with nice gradient */}
                <div
                    className={`w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold ${shouldShowFallback ? 'flex' : 'hidden'}`}
                    style={{ display: shouldShowFallback ? 'flex' : 'none' }}
                >
                    {teamName.split(' ').map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase()}
                </div>
            </div>
        );
    };

    // Mobile Layout
    if (layout === 'mobile') {
        return (
            <motion.div
                className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0"
                whileHover={{ backgroundColor: "#f9fafb" }}
                whileTap={{ scale: 0.98 }}
            >
                {/* Left side - Time/Date */}
                <div className="flex flex-col items-center min-w-[50px]">
                    {showDate ? (
                        <span className="text-xs text-gray-500 font-medium">
                            {formatDisplayDate(match)}
                        </span>
                    ) : null}
                    <span className="text-sm font-medium text-gray-600">
                        {formatDisplayTime(match)}
                    </span>
                    {isLive && (
                        <span className="text-xs text-red-500 font-medium">LIVE</span>
                    )}
                    {isFinished && (
                        <span className="text-xs text-green-600 font-medium">FT</span>
                    )}
                </div>

                {/* Center - Teams */}
                <div className="flex-1 mx-4 space-y-1">
                    {/* Home Team */}
                    <div className="flex items-center space-x-3">
                        <TeamLogo
                            logoUrl={match.home_team_logo}
                            teamName={match.home_team}
                            teamId={match.home_team_id}
                            size="w-5 h-5"
                        />
                        <span className="text-sm font-medium text-gray-800 truncate">
                            {match.home_team}
                        </span>
                    </div>

                    {/* Away Team */}
                    <div className="flex items-center space-x-3">
                        <TeamLogo
                            logoUrl={match.away_team_logo}
                            teamName={match.away_team}
                            teamId={match.away_team_id}
                            size="w-5 h-5"
                        />
                        <span className="text-sm font-medium text-gray-800 truncate">
                            {match.away_team}
                        </span>
                    </div>
                </div>

                {/* Right side - Score or Favorite */}
                <div className="flex flex-col items-center min-w-[50px]">
                    {!isUpcoming ? (
                        // Show scores
                        <div className="text-right">
                            <div className="text-sm font-bold text-gray-800">
                                {match.home_score}
                            </div>
                            <div className="text-sm font-bold text-gray-800">
                                {match.away_score}
                            </div>
                        </div>
                    ) : (
                        // Show favorite star for upcoming matches
                        <button className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                            <Star className="w-5 h-5 text-gray-400 hover:text-yellow-500" />
                        </button>
                    )}
                </div>
            </motion.div>
        );
    }

    // Desktop Layout
    return (
        <motion.div
            className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer group"
            whileHover={{ backgroundColor: "#f9fafb" }}
        >
            {/* Time & Status */}
            <div className="flex flex-col items-center min-w-[80px]">
                {showDate ? (
                    <span className="text-xs text-gray-500 mb-1">
                        {formatDisplayDate(match)}
                    </span>
                ) : null}
                <span className="text-sm font-medium text-gray-600">
                    {formatDisplayTime(match)}
                </span>
                {isLive && (
                    <span className="text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded-full mt-1">
                        LIVE
                    </span>
                )}
                {isFinished && (
                    <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded-full mt-1">
                        FT
                    </span>
                )}
            </div>

            {/* Teams */}
            <div className="flex-1 max-w-md">
                {/* Home Team */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                        <TeamLogo
                            logoUrl={match.home_team_logo}
                            teamName={match.home_team}
                            teamId={match.home_team_id}
                            size="w-6 h-6"
                        />
                        <span className="font-medium text-gray-800">
                            {match.home_team}
                        </span>
                    </div>
                    {!isUpcoming && (
                        <span className="text-lg font-bold text-gray-800 min-w-[30px] text-right">
                            {match.home_score}
                        </span>
                    )}
                </div>

                {/* Away Team */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <TeamLogo
                            logoUrl={match.away_team_logo}
                            teamName={match.away_team}
                            teamId={match.away_team_id}
                            size="w-6 h-6"
                        />
                        <span className="font-medium text-gray-800">
                            {match.away_team}
                        </span>
                    </div>
                    {!isUpcoming && (
                        <span className="text-lg font-bold text-gray-800 min-w-[30px] text-right">
                            {match.away_score}
                        </span>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3 min-w-[100px] justify-end">
                <button className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                    <Star className="w-5 h-5 text-gray-400 hover:text-yellow-500" />
                </button>
            </div>
        </motion.div>
    );
};

export default MatchItem;