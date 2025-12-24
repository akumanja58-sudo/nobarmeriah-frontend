import React from 'react';
import { Clock, Play, Square } from 'lucide-react';

const LiveMatchIndicator = ({ match }) => {
    // Determine match status and styling
    const getMatchStatus = () => {
        const status = match.status?.toLowerCase() || 'upcoming';
        const apiStatus = match.api_status || 'NS';

        // Live statuses
        if (['1h', '2h', 'ht', 'et', 'bt', 'p', 'live'].includes(apiStatus.toLowerCase()) ||
            status === 'live') {
            return {
                type: 'live',
                display: getMinuteDisplay(apiStatus, match.minute),
                color: 'bg-red-500',
                textColor: 'text-white',
                icon: <Play className="w-3 h-3" />,
                pulse: true
            };
        }

        // Finished statuses  
        if (['ft', 'aet', 'pen'].includes(apiStatus.toLowerCase()) ||
            status === 'finished') {
            return {
                type: 'finished',
                display: 'FT',
                color: 'bg-gray-500',
                textColor: 'text-white',
                icon: <Square className="w-3 h-3" />,
                pulse: false
            };
        }

        // Half time
        if (apiStatus.toLowerCase() === 'ht') {
            return {
                type: 'halftime',
                display: 'HT',
                color: 'bg-orange-500',
                textColor: 'text-white',
                icon: <Clock className="w-3 h-3" />,
                pulse: false
            };
        }

        // Upcoming
        return {
            type: 'upcoming',
            display: match.local_time || '00:00',
            color: 'bg-gray-100',
            textColor: 'text-gray-600',
            icon: <Clock className="w-3 h-3" />,
            pulse: false
        };
    };

    // Get minute display for live matches
    const getMinuteDisplay = (apiStatus, minute) => {
        if (minute) return `${minute}'`;

        switch (apiStatus.toLowerCase()) {
            case '1h': return "1H";
            case '2h': return "2H";
            case 'ht': return "HT";
            case 'et': return "ET";
            case 'bt': return "BT";
            case 'p': return "PEN";
            default: return "LIVE";
        }
    };

    const statusInfo = getMatchStatus();

    return (
        <div className="flex flex-col items-center space-y-1">
            {/* Status Badge */}
            <div className={`
        flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-bold
        ${statusInfo.color} ${statusInfo.textColor}
        ${statusInfo.pulse ? 'animate-pulse' : ''}
      `}>
                {statusInfo.icon}
                <span>{statusInfo.display}</span>
            </div>

            {/* Live indicator dot */}
            {statusInfo.type === 'live' && (
                <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                    <span className="text-xs text-red-600 font-medium">LIVE</span>
                </div>
            )}
        </div>
    );
};

export default LiveMatchIndicator;