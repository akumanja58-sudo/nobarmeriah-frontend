// components/SimplifiedLiveMatch.jsx - Update model kayak screenshot
import React from 'react';
import { Star } from 'lucide-react';

const SimplifiedLiveMatch = ({ match, layout = "mobile", showDate = true, onMatchClick }) => {
    // Handle professional livescore data format
    const {
        home_team,
        away_team,
        home_score,
        away_score,
        local_time,
        status,
        is_live,
        is_finished,
        league,
        home_team_logo,
        away_team_logo,
        minute,
        home_team_id,
        away_team_id,
        venue
    } = match;

    // Format time untuk display (HH:MM format)
    const formatTime = () => {
        if (local_time) {
            return local_time; // Sudah format HH:MM
        }
        return '00:00';
    };

    // Format status untuk display
    const formatStatus = () => {
        if (is_live) {
            return minute ? `${minute}'` : 'LIVE';
        }
        if (is_finished) {
            return 'FT';
        }
        return '-'; // Akan dimulai
    };

    // Format score display
    const formatScore = () => {
        if (home_score !== undefined && away_score !== undefined) {
            return {
                home: home_score,
                away: away_score,
                hasScore: true
            };
        }
        return { hasScore: false };
    };

    const score = formatScore();

    return (
        <div
            className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 cursor-pointer"
            onClick={() => onMatchClick?.(match)}
        >
            {/* Left: Time & Status */}
            <div className="flex flex-col items-center w-12 flex-shrink-0">
                <span className="text-sm text-gray-900 font-medium">
                    {formatTime()}
                </span>
                <span className={`text-xs ${is_live ? 'text-red-500 font-semibold' :
                    is_finished ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                    {formatStatus()}
                </span>
            </div>

            {/* Center: Teams */}
            <div className="flex-1 mx-4">
                {/* Home Team */}
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2 flex-1">
                        <img
                            src={home_team_logo || `https://media.api-sports.io/football/teams/${home_team_id}.png`}
                            alt={home_team}
                            className="w-5 h-5 object-contain"
                            onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/20x20/e5e7eb/6b7280?text=' + (home_team?.charAt(0) || '?');
                            }}
                        />
                        <span className="text-sm text-gray-900 truncate">
                            {home_team}
                        </span>
                    </div>
                    {score.hasScore && (
                        <span className={`text-sm font-semibold w-6 text-right ${is_live ? 'text-red-600' : 'text-gray-900'
                            }`}>
                            {score.home}
                        </span>
                    )}
                </div>

                {/* Away Team */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 flex-1">
                        <img
                            src={away_team_logo || `https://media.api-sports.io/football/teams/${away_team_id}.png`}
                            alt={away_team}
                            className="w-5 h-5 object-contain"
                            onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/20x20/e5e7eb/6b7280?text=' + (away_team?.charAt(0) || '?');
                            }}
                        />
                        <span className="text-sm text-gray-900 truncate">
                            {away_team}
                        </span>
                    </div>
                    {score.hasScore && (
                        <span className={`text-sm font-semibold w-6 text-right ${is_live ? 'text-red-600' : 'text-gray-900'
                            }`}>
                            {score.away}
                        </span>
                    )}
                </div>
            </div>

            {/* Right: Favorite Star */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    console.log('Favorite toggled:', match);
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
                <Star className="w-5 h-5 text-gray-300 hover:text-yellow-500" />
            </button>
        </div>
    );
};

export default SimplifiedLiveMatch;