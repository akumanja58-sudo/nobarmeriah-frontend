'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import SofaHeader from '@/components/SofaHeader';
import SofaFooter from '@/components/SofaFooter';
import VolleyballMatchList from '@/components/VolleyballMatchList';
import VolleyballMatchPreview from '@/components/VolleyballMatchPreview';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function VolleyballPage() {
  const router = useRouter();

  // State
  const [games, setGames] = useState([]);
  const [grouped, setGrouped] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [favorites, setFavorites] = useState([]);

  // Stats
  const [stats, setStats] = useState({
    live: 0,
    finished: 0,
    scheduled: 0
  });

  // ============================================================
  // FETCH DATA
  // ============================================================

  const fetchGames = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/volleyball`);
      const data = await response.json();

      if (data.success) {
        setGames(data.games || []);
        setGrouped(data.grouped || []);
        setStats(data.stats || { live: 0, finished: 0, scheduled: 0 });
      } else {
        setError(data.error || 'Gagal memuat data');
      }
    } catch (err) {
      console.error('Error fetching volleyball games:', err);
      setError('Gagal memuat data. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();

    // Auto refresh every 60 seconds
    const interval = setInterval(fetchGames, 60000);
    return () => clearInterval(interval);
  }, []);

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('volleyball_favorites');
    if (saved) {
      setFavorites(JSON.parse(saved));
    }
  }, []);

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  const handleToggleFavorite = (gameId) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(gameId)
        ? prev.filter(id => id !== gameId)
        : [...prev, gameId];

      localStorage.setItem('volleyball_favorites', JSON.stringify(newFavorites));
      return newFavorites;
    });
  };

  const handleGameClick = (game) => {
    router.push(`/volleyball/game/${game.id}`);
  };

  // ============================================================
  // FILTER DATA
  // ============================================================

  const getFilteredData = () => {
    if (activeFilter === 'Semua') {
      return { games, grouped };
    }

    const filteredGames = games.filter(game => {
      if (activeFilter === 'Live') return game.isLive;
      if (activeFilter === 'Selesai') return game.isFinished;
      return true;
    });

    // Regroup filtered games
    const filteredGrouped = grouped.map(league => ({
      ...league,
      games: league.games.filter(game => {
        if (activeFilter === 'Live') return game.isLive;
        if (activeFilter === 'Selesai') return game.isFinished;
        return true;
      })
    })).filter(league => league.games.length > 0);

    return { games: filteredGames, grouped: filteredGrouped };
  };

  const filteredData = getFilteredData();

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <SofaHeader
        liveCount={stats.live}
        finishedCount={stats.finished}
        upcomingCount={stats.scheduled}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            <span className="ml-3 text-gray-500 font-condensed">Memuat pertandingan...</span>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <p className="text-red-500 font-condensed mb-4">{error}</p>
            <button
              onClick={fetchGames}
              className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors font-condensed"
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - Match List */}
            <div className="lg:col-span-5">
              {/* Stats Header */}
              <div className="bg-gradient-to-r from-cyan-600 to-cyan-500 rounded-xl p-4 mb-4 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🏐</span>
                  </div>
                  <div>
                    <h1 className="font-bold text-lg font-condensed">Volleyball</h1>
                    <p className="text-cyan-100 text-sm font-condensed">
                      CEV Champions • SuperLega • Liga Domestik
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/20">
                  <span className="text-sm font-condensed">{games.length} Pertandingan</span>
                  <div className="flex items-center gap-3 text-sm">
                    {stats.live > 0 && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
                        {stats.live} Live
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Match List */}
              <VolleyballMatchList
                games={filteredData.games}
                grouped={filteredData.grouped}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onGameClick={handleGameClick}
              />
            </div>

            {/* Middle Column - Preview (Desktop) */}
            <div className="hidden lg:block lg:col-span-4">
              <VolleyballMatchPreview
                games={games}
                onGameClick={handleGameClick}
              />
            </div>

            {/* Right Column - Ads Placeholder */}
            <div className="hidden lg:block lg:col-span-3">
              <div className="bg-white rounded-xl shadow-sm p-4 sticky top-4">
                <div className="bg-gray-100 rounded-lg h-[250px] flex items-center justify-center">
                  <span className="text-gray-400 text-sm font-condensed">Iklan</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-4 mt-4">
                <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg p-4 text-white text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl">🏐</span>
                  </div>
                  <p className="font-bold font-condensed">Volleyball Live</p>
                  <p className="text-sm text-cyan-100 font-condensed">Nonton CEV & SuperLega!</p>
                  <button className="mt-3 px-4 py-2 bg-white text-cyan-600 rounded-lg text-sm font-bold font-condensed hover:bg-cyan-50 transition-colors">
                    STREAMING
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <SofaFooter />
    </div>
  );
}
