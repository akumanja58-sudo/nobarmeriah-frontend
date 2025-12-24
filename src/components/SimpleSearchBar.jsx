import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

const SimpleSearchBar = ({ matches = [], onFilteredMatches }) => {
    const [searchQuery, setSearchQuery] = useState('');

    // Search function
    const searchMatches = (query) => {
        if (!query.trim()) {
            return matches;
        }

        const lowercaseQuery = query.toLowerCase();

        return matches.filter(match => {
            const homeTeam = match.home_team?.toLowerCase() || '';
            const awayTeam = match.away_team?.toLowerCase() || '';
            const league = match.league?.toLowerCase() || '';

            return (
                homeTeam.includes(lowercaseQuery) ||
                awayTeam.includes(lowercaseQuery) ||
                league.includes(lowercaseQuery)
            );
        });
    };

    // Handle search
    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        const results = searchMatches(query);
        onFilteredMatches(results);
    };

    // Clear search
    const clearSearch = () => {
        setSearchQuery('');
        onFilteredMatches(matches);
    };

    return (
        <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
                type="text"
                placeholder="Cari tim atau liga..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            {searchQuery && (
                <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <X className="w-4 h-4 text-gray-400" />
                </button>
            )}
        </div>
    );
};

export default SimpleSearchBar;