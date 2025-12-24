import React from 'react';

const LeagueSelector = ({ selectedLeague, onLeagueSelect }) => {
    const leagues = [
        { id: 'Premier League', name: 'Premier League' },
        { id: 'La Liga', name: 'La Liga' },
        { id: 'Serie A', name: 'Serie A' },
        { id: 'Bundesliga', name: 'Bundesliga' },
        { id: 'Ligue 1', name: 'Ligue 1' }
    ];

    return (
        <div className="flex gap-2 mb-4 overflow-x-auto p-2">
            <button
                onClick={() => onLeagueSelect(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium 
                    ${!selectedLeague
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
            >
                All Leagues
            </button>
            {leagues.map(league => (
                <button
                    key={league.id}
                    onClick={() => onLeagueSelect(league.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
                        ${selectedLeague === league.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    {league.name}
                </button>
            ))}
        </div>
    );
};

export default LeagueSelector;
