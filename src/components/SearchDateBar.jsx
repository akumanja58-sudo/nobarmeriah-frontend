import React, { useState } from 'react';
import { Search, X, Calendar, ChevronDown } from 'lucide-react';

const SearchDateBar = ({ matches = [], onFilteredMatches, selectedDate, onDateSelect }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [searchResults, setSearchResults] = useState([]);

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
        setSearchResults(results);
        onFilteredMatches(results);
    };

    // Clear search
    const clearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
        onFilteredMatches(matches);
    };

    // Format date display
    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return "Semua Tanggal";

        const date = new Date(dateStr);
        const today = new Date();
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

        if (dateStr === today.toISOString().split('T')[0]) {
            return "Hari Ini";
        } else if (dateStr === tomorrow.toISOString().split('T')[0]) {
            return "Besok";
        } else {
            return date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short'
            });
        }
    };

    // Get available dates from matches
    const getAvailableDates = () => {
        const dates = new Set();
        matches.forEach(match => {
            if (match.local_date?.includes('-')) {
                dates.add(match.local_date);
            }
        });
        return Array.from(dates).sort();
    };

    const availableDates = getAvailableDates();

    // Quick date filters
    const getQuickDates = () => {
        const today = new Date();
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

        return [
            {
                label: "Hari Ini",
                value: today.toISOString().split('T')[0]
            },
            {
                label: "Besok",
                value: tomorrow.toISOString().split('T')[0]
            },
            ...availableDates.slice(0, 5).map(date => ({
                label: formatDisplayDate(date),
                value: date
            }))
        ].filter((item, index, self) =>
            index === self.findIndex(t => t.value === item.value)
        );
    };

    return (
        <div className="space-y-3">
            {/* Combined Search + Date Bar */}
            <div className="flex items-center space-x-3">
                {/* Search Input */}
                <div className="flex-1 relative">
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

                {/* Date Picker Button */}
                <div className="relative">
                    <button
                        onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                        className="flex items-center space-x-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm min-w-[140px] justify-between"
                    >
                        <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700">
                                {formatDisplayDate(selectedDate)}
                            </span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDatePickerOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Date Dropdown */}
                    {isDatePickerOpen && (
                        <>
                            {/* Backdrop */}
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setIsDatePickerOpen(false)}
                            />

                            {/* Dropdown Menu */}
                            <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[180px]">
                                <div className="p-2">
                                    {/* All Dates Option */}
                                    <button
                                        onClick={() => {
                                            onDateSelect(null);
                                            setIsDatePickerOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${!selectedDate
                                            ? 'bg-blue-100 text-blue-700 font-medium'
                                            : 'hover:bg-gray-100 text-gray-700'
                                            }`}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <Calendar className="w-4 h-4" />
                                            <span>Semua Tanggal</span>
                                        </div>
                                    </button>

                                    <div className="my-2 border-t border-gray-100"></div>

                                    {/* Quick Date Options */}
                                    {getQuickDates().map((dateOption) => (
                                        <button
                                            key={dateOption.value}
                                            onClick={() => {
                                                onDateSelect(dateOption.value);
                                                setIsDatePickerOpen(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedDate === dateOption.value
                                                ? 'bg-blue-100 text-blue-700 font-medium'
                                                : 'hover:bg-gray-100 text-gray-700'
                                                }`}
                                        >
                                            {dateOption.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between text-xs text-gray-500">
                <div>
                    {searchQuery ? (
                        <span>
                            Ditemukan <span className="font-semibold text-blue-600">{searchResults.length}</span> hasil
                            {searchQuery && (
                                <span> untuk "<span className="font-medium">{searchQuery}</span>"</span>
                            )}
                        </span>
                    ) : (
                        <span>
                            Menampilkan <span className="font-semibold">{matches.length}</span> pertandingan
                            {selectedDate && (
                                <span> untuk {formatDisplayDate(selectedDate)}</span>
                            )}
                        </span>
                    )}
                </div>

                {/* Active Filters */}
                {(searchQuery || selectedDate) && (
                    <div className="flex items-center space-x-1">
                        <span>Filter aktif:</span>
                        {searchQuery && (
                            <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                                "{searchQuery}"
                                <button onClick={clearSearch} className="ml-1">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}
                        {selectedDate && (
                            <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                                {formatDisplayDate(selectedDate)}
                                <button onClick={() => onDateSelect(null)} className="ml-1">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchDateBar;