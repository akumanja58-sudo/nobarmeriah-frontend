'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Flag } from 'lucide-react';

import SofaHeader from '@/components/SofaHeader';
import SofaFooter from '@/components/SofaFooter';
import F1RaceList from '@/components/F1RaceList';
import F1Preview from '@/components/F1Preview';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function Formula1Page() {
  const router = useRouter();

  // State
  const [races, setRaces] = useState([]);
  const [nextRace, setNextRace] = useState(null);
  const [driverStandings, setDriverStandings] = useState([]);
  const [teamStandings, setTeamStandings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    remaining: 0
  });

  // ============================================================
  // FETCH DATA
  // ============================================================

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/formula1`);
      const data = await response.json();

      if (data.success) {
        // Combine upcoming and recent races for the list
        const allRaces = [
          ...(data.upcomingRaces || []),
          ...(data.recentRaces || [])
        ];
        setRaces(allRaces);
        setNextRace(data.nextRace || null);
        setDriverStandings(data.driverStandings || []);
        setTeamStandings(data.teamStandings || []);
        setStats(data.stats || { total: 0, completed: 0, remaining: 0 });
      } else {
        setError(data.error || 'Gagal memuat data');
      }
    } catch (err) {
      console.error('Error fetching F1 data:', err);
      setError('Gagal memuat data. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all races for the calendar
  const fetchAllRaces = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/formula1/races`);
      const data = await response.json();

      if (data.success) {
        setRaces(data.races || []);
      }
    } catch (err) {
      console.error('Error fetching all races:', err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchAllRaces();
  }, []);

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleRaceClick = (race) => {
    router.push(`/formula1/race/${race.id}`);
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <SofaHeader />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-red-600" />
            <span className="ml-3 text-gray-500 font-condensed">Memuat data Formula 1...</span>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <p className="text-red-500 font-condensed mb-4">{error}</p>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-condensed"
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - Race Calendar */}
            <div className="lg:col-span-5">
              {/* Stats Header */}
              <div className="bg-gradient-to-r from-red-700 to-red-600 rounded-xl p-4 mb-4 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🏎️</span>
                  </div>
                  <div>
                    <h1 className="font-bold text-lg font-condensed">Formula 1</h1>
                    <p className="text-red-100 text-sm font-condensed">
                      Season {new Date().getFullYear()}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/20">
                  <div className="text-center">
                    <p className="text-2xl font-bold font-condensed">{stats.total}</p>
                    <p className="text-xs text-red-200 font-condensed">Total Race</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold font-condensed">{stats.completed}</p>
                    <p className="text-xs text-red-200 font-condensed">Selesai</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold font-condensed">{stats.remaining}</p>
                    <p className="text-xs text-red-200 font-condensed">Sisa</p>
                  </div>
                </div>
              </div>

              {/* Race List */}
              <F1RaceList
                races={races}
                onRaceClick={handleRaceClick}
              />
            </div>

            {/* Middle Column - Preview (Desktop) */}
            <div className="hidden lg:block lg:col-span-4">
              <F1Preview
                nextRace={nextRace}
                driverStandings={driverStandings}
                teamStandings={teamStandings}
                onRaceClick={handleRaceClick}
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
                <div className="bg-gradient-to-br from-red-700 to-red-800 rounded-lg p-4 text-white text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl">🏎️</span>
                  </div>
                  <p className="font-bold font-condensed">F1 Live</p>
                  <p className="text-sm text-red-200 font-condensed">Nonton Race Live!</p>
                  <button className="mt-3 px-4 py-2 bg-white text-red-700 rounded-lg text-sm font-bold font-condensed hover:bg-red-50 transition-colors">
                    STREAMING
                  </button>
                </div>
              </div>

              {/* Quick Facts */}
              <div className="bg-white rounded-xl shadow-sm p-4 mt-4">
                <h3 className="font-bold text-gray-800 mb-3 font-condensed">F1 Quick Facts</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-condensed">Top Speed</span>
                    <span className="font-semibold text-gray-800 font-condensed">~370 km/h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-condensed">0-100 km/h</span>
                    <span className="font-semibold text-gray-800 font-condensed">~2.6 detik</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-condensed">G-Force (Corners)</span>
                    <span className="font-semibold text-gray-800 font-condensed">~6G</span>
                  </div>
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
