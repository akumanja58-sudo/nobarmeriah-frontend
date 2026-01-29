'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2, Clock, TrendingUp, ChevronRight, ArrowLeft } from 'lucide-react';

import SofaHeader from '@/components/SofaHeader';
import SofaFooter from '@/components/SofaFooter';

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

// Sport labels
const sportLabels = {
    football: 'Sepak Bola',
    tennis: 'Tenis',
    basketball: 'Basket',
    volleyball: 'Voli',
    baseball: 'Baseball',
    formula1: 'F1'
};

// Type labels
const typeLabels = {
    team: 'Tim',
    league: 'Liga',
    player: 'Pemain',
    tournament: 'Turnamen'
};

export default function SearchPage() {
    const router = useRouter();
    const inputRef = useRef(null);
    
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [groupedResults, setGroupedResults] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [recentSearches, setRecentSearches] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [activeSportFilter, setActiveSportFilter] = useState('all');

    // Load recent searches from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('recent_searches');
        if (saved) {
            setRecentSearches(JSON.parse(saved));
        }
        
        // Focus input on mount
        setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
    }, []);

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

            const sportParam = activeSportFilter !== 'all' ? `&sport=${activeSportFilter}` : '';
            const response = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(q)}${sportParam}`);
            const data = await response.json();

            if (data.success) {
                setSearchResults(data.results?.matches || []);
                setGroupedResults(data.results?.grouped || {});
                
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
    };

    // Handle key press
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // Get filtered results
    const getFilteredResults = () => {
        if (activeSportFilter === 'all') return searchResults;
        return searchResults.filter(match => match.sport === activeSportFilter);
    };

    const filteredResults = getFilteredResults();

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Search Header */}
            <div className="bg-green-600 text-white sticky top-0 z-40">
                <div className="px-4 py-3">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => router.back()}
                            className="p-1 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        
                        <div className="flex-1 flex items-center gap-2 bg-white rounded-full px-4 py-2">
                            <Search className="w-4 h-4 text-gray-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="Cari pertandingan, tim, liga..."
                                className="flex-1 text-gray-800 placeholder-gray-400 outline-none font-condensed text-sm"
                            />
                            {isLoading && (
                                <Loader2 className="w-4 h-4 text-green-500 animate-spin" />
                            )}
                            {query && !isLoading && (
                                <button 
                                    onClick={() => {
                                        setQuery('');
                                        setSuggestions([]);
                                        setShowResults(false);
                                    }}
                                >
                                    <X className="w-4 h-4 text-gray-400" />
                                </button>
                            )}
                        </div>
                        
                        <button
                            onClick={() => handleSearch()}
                            disabled={query.length < 2}
                            className="px-3 py-2 bg-white/20 rounded-lg font-condensed text-sm disabled:opacity-50"
                        >
                            Cari
                        </button>
                    </div>
                </div>

                {/* Sport Filter Tabs (show when results exist) */}
                {showResults && searchResults.length > 0 && (
                    <div className="px-4 pb-3">
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                            <button
                                onClick={() => setActiveSportFilter('all')}
                                className={`px-3 py-1.5 rounded-full text-xs font-condensed whitespace-nowrap transition-colors ${
                                    activeSportFilter === 'all' 
                                        ? 'bg-white text-green-600' 
                                        : 'bg-white/20 text-white'
                                }`}
                            >
                                Semua ({searchResults.length})
                            </button>
                            {Object.entries(groupedResults).map(([sport, matches]) => (
                                <button
                                    key={sport}
                                    onClick={() => setActiveSportFilter(sport)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-condensed whitespace-nowrap transition-colors flex items-center gap-1 ${
                                        activeSportFilter === sport 
                                            ? 'bg-white text-green-600' 
                                            : 'bg-white/20 text-white'
                                    }`}
                                >
                                    <span>{sportIcons[sport]}</span>
                                    <span>{sportLabels[sport] || sport}</span>
                                    <span>({matches.length})</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            <main className="pb-20">
                {/* Suggestions */}
                {suggestions.length > 0 && !showResults && (
                    <div className="bg-white">
                        <div className="px-4 py-2 border-b border-gray-100">
                            <p className="text-xs text-gray-500 font-condensed flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                Saran Pencarian
                            </p>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {suggestions.map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                                >
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${sportColors[suggestion.sport] || 'bg-gray-100'}`}>
                                        <span className="text-lg">{sportIcons[suggestion.sport] || '🏆'}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 font-condensed truncate">
                                            {suggestion.name}
                                        </p>
                                        <p className="text-xs text-gray-400 font-condensed">
                                            {typeLabels[suggestion.type] || suggestion.type} • {sportLabels[suggestion.sport] || suggestion.sport}
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
                    <div>
                        {filteredResults.length > 0 ? (
                            <div className="bg-white">
                                <div className="px-4 py-2 border-b border-gray-100">
                                    <p className="text-xs text-gray-500 font-condensed">
                                        {filteredResults.length} hasil ditemukan untuk "{query}"
                                    </p>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {filteredResults.map((match, idx) => {
                                        const homeTeam = match.homeTeam?.name || match.teams?.home?.name || '-';
                                        const awayTeam = match.awayTeam?.name || match.teams?.away?.name || '-';
                                        const league = match.league?.name || '-';
                                        const sport = match.sport || 'football';

                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => handleMatchClick(match)}
                                                className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left"
                                            >
                                                {/* Sport Badge */}
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${sportColors[sport] || 'bg-gray-100'}`}>
                                                    <span className="text-xl">{sportIcons[sport] || '🏆'}</span>
                                                </div>

                                                {/* Match Info */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-800 font-condensed truncate">
                                                        {homeTeam} vs {awayTeam}
                                                    </p>
                                                    <p className="text-xs text-gray-500 font-condensed truncate">
                                                        {league}
                                                    </p>
                                                    <p className="text-xs text-gray-400 font-condensed mt-0.5">
                                                        {sportLabels[sport] || sport}
                                                    </p>
                                                </div>

                                                {/* Status */}
                                                <div className="text-right">
                                                    {match.isLive ? (
                                                        <div>
                                                            <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded font-condensed">
                                                                LIVE
                                                            </span>
                                                            <p className="text-sm font-bold text-gray-800 font-condensed mt-1">
                                                                {match.homeScore ?? match.goals?.home ?? 0} - {match.awayScore ?? match.goals?.away ?? 0}
                                                            </p>
                                                        </div>
                                                    ) : match.isFinished ? (
                                                        <div>
                                                            <span className="text-xs text-gray-400 font-condensed">FT</span>
                                                            <p className="text-sm font-bold text-gray-800 font-condensed">
                                                                {match.homeScore ?? match.goals?.home ?? '-'} - {match.awayScore ?? match.goals?.away ?? '-'}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-600 font-condensed">
                                                            {match.time?.substring(0, 5) || match.fixture?.time || '-'}
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white p-8 text-center">
                                <Search className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-600 font-condensed font-semibold">Tidak ada hasil</p>
                                <p className="text-sm text-gray-400 font-condensed mt-1">
                                    Tidak ada pertandingan ditemukan untuk "{query}"
                                </p>
                                <p className="text-xs text-gray-400 font-condensed mt-2">
                                    Coba kata kunci lain atau periksa ejaan
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Recent Searches (when no query) */}
                {!query && !showResults && recentSearches.length > 0 && (
                    <div className="bg-white mt-2">
                        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                            <p className="text-xs text-gray-500 font-condensed flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Pencarian Terakhir
                            </p>
                            <button 
                                onClick={clearRecentSearches}
                                className="text-xs text-red-500 hover:text-red-600 font-condensed"
                            >
                                Hapus Semua
                            </button>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {recentSearches.map((search, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setQuery(search);
                                        handleSearch(search);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                                >
                                    <Clock className="w-5 h-5 text-gray-300" />
                                    <span className="flex-1 text-sm text-gray-700 font-condensed">{search}</span>
                                    <ChevronRight className="w-4 h-4 text-gray-300" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!query && !showResults && recentSearches.length === 0 && (
                    <div className="bg-white p-8 text-center mt-2">
                        <Search className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-600 font-condensed font-semibold">Cari Pertandingan</p>
                        <p className="text-sm text-gray-400 font-condensed mt-1">
                            Cari tim, liga, atau pemain favorit kamu
                        </p>
                        <div className="flex flex-wrap justify-center gap-2 mt-4">
                            {['Manchester United', 'Barcelona', 'Lakers', 'Persib'].map((term) => (
                                <button
                                    key={term}
                                    onClick={() => {
                                        setQuery(term);
                                        handleSearch(term);
                                    }}
                                    className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-xs font-condensed hover:bg-gray-200 transition-colors"
                                >
                                    {term}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* Footer - hide on search page for cleaner UX */}
        </div>
    );
}
