'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2, Clock, TrendingUp, ChevronRight } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

// Sport icons mapping
const sportIcons = {
    football: '⚽',
    tennis: '🎾',
    basketball: '🏀',
    volleyball: '🏐',
    baseball: '⚾',
    formula1: '🏎️'
};

// Sport colors mapping
const sportColors = {
    football: 'bg-green-100 text-green-600',
    tennis: 'bg-lime-100 text-lime-600',
    basketball: 'bg-orange-100 text-orange-600',
    volleyball: 'bg-cyan-100 text-cyan-600',
    baseball: 'bg-red-100 text-red-600',
    formula1: 'bg-red-100 text-red-700'
};

// Type labels
const typeLabels = {
    team: 'Tim',
    league: 'Liga',
    player: 'Pemain',
    tournament: 'Turnamen'
};

export default function SearchModal({ isOpen, onClose }) {
    const router = useRouter();
    const inputRef = useRef(null);
    
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [recentSearches, setRecentSearches] = useState([]);
    const [showResults, setShowResults] = useState(false);

    // Load recent searches from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('recent_searches');
        if (saved) {
            setRecentSearches(JSON.parse(saved));
        }
    }, [isOpen]);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    // Fetch suggestions on query change (debounced)
    useEffect(() => {
        if (query.length < 2) {
            setSuggestions([]);
            setShowResults(false);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`${API_BASE_URL}/api/search/suggestions?q=${encodeURIComponent(query)}`);
                const data = await response.json();
                
                if (data.success) {
                    setSuggestions(data.suggestions || []);
                }
            } catch (error) {
                console.error('Suggestions error:', error);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Handle search submit
    const handleSearch = async (searchQuery) => {
        const q = searchQuery || query;
        if (!q || q.length < 2) return;

        try {
            setIsLoading(true);
            setShowResults(true);

            const response = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(q)}`);
            const data = await response.json();

            if (data.success) {
                setSearchResults(data.results?.matches || []);
                
                // Save to recent searches
                saveRecentSearch(q);
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Save recent search
    const saveRecentSearch = (searchQuery) => {
        const newRecent = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
        setRecentSearches(newRecent);
        localStorage.setItem('recent_searches', JSON.stringify(newRecent));
    };

    // Clear recent searches
    const clearRecentSearches = () => {
        setRecentSearches([]);
        localStorage.removeItem('recent_searches');
    };

    // Handle suggestion click
    const handleSuggestionClick = (suggestion) => {
        setQuery(suggestion.name);
        handleSearch(suggestion.name);
    };

    // Handle match click
    const handleMatchClick = (match) => {
        const sport = match.sport || 'football';
        const id = match.id || match.fixture?.id;
        
        // Navigate to match detail
        switch (sport) {
            case 'football':
                router.push(`/match/${id}`);
                break;
            case 'tennis':
                router.push(`/tennis/match/${id}`);
                break;
            case 'basketball':
                router.push(`/basketball/game/${id}`);
                break;
            case 'volleyball':
                router.push(`/volleyball/game/${id}`);
                break;
            case 'baseball':
                router.push(`/baseball/game/${id}`);
                break;
            default:
                router.push(`/match/${id}`);
        }
        
        onClose();
    };

    // Handle key press
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
        if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative max-w-2xl mx-auto mt-20 mx-4 lg:mx-auto">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* Search Input */}
                    <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
                        <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Cari pertandingan, tim, pemain, dan lain-lain"
                            className="flex-1 text-gray-800 placeholder-gray-400 outline-none font-condensed"
                        />
                        {isLoading && (
                            <Loader2 className="w-5 h-5 text-green-500 animate-spin flex-shrink-0" />
                        )}
                        {query && !isLoading && (
                            <button 
                                onClick={() => {
                                    setQuery('');
                                    setSuggestions([]);
                                    setShowResults(false);
                                }}
                                className="p-1 hover:bg-gray-100 rounded-full"
                            >
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="ml-2 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 font-condensed"
                        >
                            Batal
                        </button>
                    </div>

                    {/* Content */}
                    <div className="max-h-[60vh] overflow-y-auto">
                        {/* Suggestions */}
                        {suggestions.length > 0 && !showResults && (
                            <div className="p-4">
                                <p className="text-xs text-gray-500 font-condensed mb-2 flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    Saran
                                </p>
                                <div className="space-y-1">
                                    {suggestions.map((suggestion, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSuggestionClick(suggestion)}
                                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                                        >
                                            <span className="text-lg">{sportIcons[suggestion.sport] || '🏆'}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 font-condensed truncate">
                                                    {suggestion.name}
                                                </p>
                                                <p className="text-xs text-gray-400 font-condensed">
                                                    {typeLabels[suggestion.type] || suggestion.type}
                                                </p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-gray-300" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Search Results */}
                        {showResults && (
                            <div className="p-4">
                                {searchResults.length > 0 ? (
                                    <>
                                        <p className="text-xs text-gray-500 font-condensed mb-2">
                                            {searchResults.length} hasil ditemukan
                                        </p>
                                        <div className="space-y-2">
                                            {searchResults.map((match, idx) => {
                                                const homeTeam = match.homeTeam?.name || match.teams?.home?.name || '-';
                                                const awayTeam = match.awayTeam?.name || match.teams?.away?.name || '-';
                                                const league = match.league?.name || '-';
                                                const sport = match.sport || 'football';

                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handleMatchClick(match)}
                                                        className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left"
                                                    >
                                                        {/* Sport Badge */}
                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${sportColors[sport] || 'bg-gray-100'}`}>
                                                            <span className="text-lg">{sportIcons[sport] || '🏆'}</span>
                                                        </div>

                                                        {/* Match Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-gray-800 font-condensed truncate">
                                                                {homeTeam} vs {awayTeam}
                                                            </p>
                                                            <p className="text-xs text-gray-500 font-condensed truncate">
                                                                {league}
                                                            </p>
                                                        </div>

                                                        {/* Live Badge or Score */}
                                                        {match.isLive ? (
                                                            <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded font-condensed">
                                                                LIVE
                                                            </span>
                                                        ) : match.isFinished ? (
                                                            <span className="text-sm font-bold text-gray-800 font-condensed">
                                                                {match.homeScore ?? match.goals?.home ?? '-'} - {match.awayScore ?? match.goals?.away ?? '-'}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-gray-400 font-condensed">
                                                                {match.time?.substring(0, 5) || match.fixture?.time || '-'}
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-8">
                                        <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500 font-condensed">Tidak ada hasil untuk "{query}"</p>
                                        <p className="text-sm text-gray-400 font-condensed mt-1">Coba kata kunci lain</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Recent Searches (when no query) */}
                        {!query && recentSearches.length > 0 && (
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs text-gray-500 font-condensed flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        Pencarian Terakhir
                                    </p>
                                    <button 
                                        onClick={clearRecentSearches}
                                        className="text-xs text-red-500 hover:text-red-600 font-condensed"
                                    >
                                        Hapus
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    {recentSearches.map((search, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                setQuery(search);
                                                handleSearch(search);
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                                        >
                                            <Clock className="w-4 h-4 text-gray-300" />
                                            <span className="text-sm text-gray-600 font-condensed">{search}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {!query && recentSearches.length === 0 && (
                            <div className="p-8 text-center">
                                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 font-condensed">Cari pertandingan, tim, atau liga</p>
                                <p className="text-sm text-gray-400 font-condensed mt-1">Ketik minimal 2 karakter</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
