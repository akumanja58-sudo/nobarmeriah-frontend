'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Trash2, ChevronRight, Loader2, ArrowLeft } from 'lucide-react';

import BottomNav from '@/components/BottomNav';

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
    baseball: 'Baseball'
};

export default function FavoritesPage() {
    const router = useRouter();

    const [favorites, setFavorites] = useState({
        football: [],
        tennis: [],
        basketball: [],
        volleyball: [],
        baseball: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [activeSport, setActiveSport] = useState('all');

    // Load favorites from localStorage
    useEffect(() => {
        const loadFavorites = () => {
            const favs = {
                football: JSON.parse(localStorage.getItem('football_favorites') || '[]'),
                tennis: JSON.parse(localStorage.getItem('tennis_favorites') || '[]'),
                basketball: JSON.parse(localStorage.getItem('basketball_favorites') || '[]'),
                volleyball: JSON.parse(localStorage.getItem('volleyball_favorites') || '[]'),
                baseball: JSON.parse(localStorage.getItem('baseball_favorites') || '[]')
            };
            setFavorites(favs);
            return favs;
        };

        loadFavorites();
        setIsLoading(false);
    }, []);

    // Get total favorites count
    const getTotalCount = () => {
        return Object.values(favorites).reduce((sum, arr) => sum + arr.length, 0);
    };

    // Get favorites for a sport
    const getSportCount = (sport) => {
        return favorites[sport]?.length || 0;
    };

    // Remove favorite
    const removeFavorite = (sport, matchId) => {
        const key = `${sport}_favorites`;
        const current = JSON.parse(localStorage.getItem(key) || '[]');
        const updated = current.filter(id => id !== matchId);
        localStorage.setItem(key, JSON.stringify(updated));

        setFavorites(prev => ({
            ...prev,
            [sport]: updated
        }));
    };

    // Clear all favorites
    const clearAllFavorites = () => {
        Object.keys(favorites).forEach(sport => {
            localStorage.setItem(`${sport}_favorites`, '[]');
        });

        setFavorites({
            football: [],
            tennis: [],
            basketball: [],
            volleyball: [],
            baseball: []
        });
    };

    // Navigate to match
    const goToMatch = (sport, matchId) => {
        switch (sport) {
            case 'football':
                router.push(`/match/${matchId}`);
                break;
            case 'tennis':
                router.push(`/tennis/match/${matchId}`);
                break;
            case 'basketball':
                router.push(`/basketball/game/${matchId}`);
                break;
            case 'volleyball':
                router.push(`/volleyball/game/${matchId}`);
                break;
            case 'baseball':
                router.push(`/baseball/game/${matchId}`);
                break;
            default:
                router.push(`/match/${matchId}`);
        }
    };

    // Get filtered favorites
    const getFilteredFavorites = () => {
        if (activeSport === 'all') {
            const all = [];
            Object.entries(favorites).forEach(([sport, ids]) => {
                ids.forEach(id => {
                    all.push({ sport, id });
                });
            });
            return all;
        }
        return (favorites[activeSport] || []).map(id => ({ sport: activeSport, id }));
    };

    const filteredFavorites = getFilteredFavorites();

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-green-600 text-white sticky top-0 z-40">
                <div className="px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.back()}
                                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-2">
                                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                <div>
                                    <h1 className="text-lg font-bold font-condensed">Favorit</h1>
                                    <p className="text-xs text-green-100 font-condensed">
                                        {getTotalCount()} pertandingan disimpan
                                    </p>
                                </div>
                            </div>
                        </div>

                        {getTotalCount() > 0 && (
                            <button
                                onClick={clearAllFavorites}
                                className="text-xs text-green-200 hover:text-white font-condensed"
                            >
                                Hapus Semua
                            </button>
                        )}
                    </div>
                </div>

                {/* Sport Filter Tabs */}
                {getTotalCount() > 0 && (
                    <div className="px-4 pb-3">
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                            <button
                                onClick={() => setActiveSport('all')}
                                className={`px-3 py-1.5 rounded-full text-xs font-condensed whitespace-nowrap transition-colors ${activeSport === 'all'
                                        ? 'bg-white text-green-600'
                                        : 'bg-white/20 text-white'
                                    }`}
                            >
                                Semua ({getTotalCount()})
                            </button>
                            {Object.keys(favorites).map((sport) => {
                                const count = getSportCount(sport);
                                if (count === 0) return null;

                                return (
                                    <button
                                        key={sport}
                                        onClick={() => setActiveSport(sport)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-condensed whitespace-nowrap transition-colors flex items-center gap-1 ${activeSport === sport
                                                ? 'bg-white text-green-600'
                                                : 'bg-white/20 text-white'
                                            }`}
                                    >
                                        <span>{sportIcons[sport]}</span>
                                        <span>{sportLabels[sport]}</span>
                                        <span>({count})</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            <main className="pb-20">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                    </div>
                ) : filteredFavorites.length > 0 ? (
                    <div className="bg-white">
                        <div className="divide-y divide-gray-100">
                            {filteredFavorites.map((fav, idx) => (
                                <div
                                    key={`${fav.sport}-${fav.id}`}
                                    className="flex items-center gap-3 p-4"
                                >
                                    {/* Sport Badge */}
                                    <div
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer ${sportColors[fav.sport]}`}
                                        onClick={() => goToMatch(fav.sport, fav.id)}
                                    >
                                        <span className="text-xl">{sportIcons[fav.sport]}</span>
                                    </div>

                                    {/* Match Info */}
                                    <div
                                        className="flex-1 min-w-0 cursor-pointer"
                                        onClick={() => goToMatch(fav.sport, fav.id)}
                                    >
                                        <p className="text-sm font-semibold text-gray-800 font-condensed">
                                            Match #{fav.id}
                                        </p>
                                        <p className="text-xs text-gray-500 font-condensed">
                                            {sportLabels[fav.sport]}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <button
                                        onClick={() => removeFavorite(fav.sport, fav.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>

                                    <button
                                        onClick={() => goToMatch(fav.sport, fav.id)}
                                        className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-full transition-colors"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white p-8 text-center mt-2">
                        <Star className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-600 font-condensed font-semibold">Belum ada favorit</p>
                        <p className="text-sm text-gray-400 font-condensed mt-1">
                            Tambahkan pertandingan ke favorit untuk melihatnya di sini
                        </p>
                        <button
                            onClick={() => router.push('/')}
                            className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg font-condensed text-sm hover:bg-green-600 transition-colors"
                        >
                            Jelajahi Pertandingan
                        </button>
                    </div>
                )}
            </main>

            {/* Bottom Nav */}
            <BottomNav />
        </div>
    );
}
