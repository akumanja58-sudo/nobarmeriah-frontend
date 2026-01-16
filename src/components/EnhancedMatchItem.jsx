import React, { memo } from 'react';

const EnhancedMatchItem = memo(({
    match,
    isChanged,
    onClick
}) => {
    return (
        <div
            className={`
        match-item p-4 border-b transition-all duration-300 cursor-pointer hover:bg-gray-50
        ${isChanged ? 'bg-yellow-50 border-yellow-200' : 'bg-white'}
      `}
            onClick={onClick}
        >
            <div className="flex items-center justify-between">
                {/* Teams */}
                <div className="flex-1">
                    <div className="flex items-center space-x-3">
                        <div className="text-sm font-medium">{match.home_team}</div>
                        <div className={`
              score text-lg font-bold transition-all duration-300
              ${isChanged ? 'text-green-600 scale-110' : 'text-gray-900'}
            `}>
                            {match.home_score}
                        </div>
                    </div>
                    <div className="flex items-center space-x-3 mt-1">
                        <div className="text-sm text-gray-600">{match.away_team}</div>
                        <div className={`
              score text-lg font-bold transition-all duration-300
              ${isChanged ? 'text-green-600 scale-110' : 'text-gray-900'}
            `}>
                            {match.away_score}
                        </div>
                    </div>
                </div>

                {/* Status */}
                <div className="text-right">
                    <div className={`
            status-badge px-2 py-1 rounded text-xs font-medium transition-all duration-300
            ${match.is_live ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-600'}
            ${isChanged ? 'ring-2 ring-yellow-400' : ''}
          `}>
                        {match.status === '2H' ? `${match.elapsed}'` : match.status}
                    </div>
                    {match.is_live && (
                        <div className="text-xs text-red-500 mt-1">LIVE</div>
                    )}
                </div>
            </div>

            {/* Change indicator */}
            {isChanged && (
                <div className="absolute -left-2 top-1/2 transform -translate-y-1/2">
                    <div className="w-1 h-8 bg-green-400 rounded-full animate-pulse"></div>
                </div>
            )}
        </div>
    );
}, (prevProps, nextProps) => {
    // Only re-render if match data actually changed
    return (
        prevProps.match.home_score === nextProps.match.home_score &&
        prevProps.match.away_score === nextProps.match.away_score &&
        prevProps.match.status === nextProps.match.status &&
        prevProps.match.elapsed === nextProps.match.elapsed &&
        prevProps.isChanged === nextProps.isChanged
    );
});

export default EnhancedMatchItem;