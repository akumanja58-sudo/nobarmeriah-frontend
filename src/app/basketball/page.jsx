'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Circle } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';

// Components
import SofaHeader from '@/components/SofaHeader';
import BasketballMatchList from '@/components/BasketballMatchList';
import BasketballMatchPreview from '@/components/BasketballMatchPreview';
import SofaFooter from '@/components/SofaFooter';
import UserProfileModal from '@/components/UserProfileModal';
import LoginRequiredModal from '@/components/LoginRequiredModal';
import OrbitLoader from '@/components/OrbitLoader';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function BasketballPage() {
  const router = useRouter();

  // Auth State
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [points, setPoints] = useState(0);
  const [lifetimePoints, setLifetimePoints] = useState(0);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Game State
  const [games, setGames] = useState([]);
  const [grouped, setGrouped] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [stats, setStats] = useState({ live: 0, finished: 0, scheduled: 0 });

  // Filter State
  const [activeFilter, setActiveFilter] = useState('Semua');

  // Modal State
  const [showProfile, setShowProfile] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // ============================================================
  // FILTER LOGIC
  // ============================================================
  const filteredGames = useMemo(() => {
    switch (activeFilter) {
      case 'Live':
        return games.filter(g => g.isLive);
      case 'Selesai':
        return games.filter(g => g.isFinished);
      case 'Semua':
      default:
        return games;
    }
  }, [games, activeFilter]);

  const filteredGrouped = useMemo(() => {
    if (activeFilter === 'Semua') return grouped;

    return grouped.map(group => ({
      ...group,
      games: group.games.filter(g => {
        if (activeFilter === 'Live') return g.isLive;
        if (activeFilter === 'Selesai') return g.isFinished;
        return true;
      })
    })).filter(group => group.games.length > 0);
  }, [grouped, activeFilter]);

  // ============================================================
  // AUTH CHECK
  // ============================================================
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoadingAuth(true);
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          setUser(null);
          setIsLoadingAuth(false);
          return;
        }

        setUser(session.user);

        const { data: profile } = await supabase
          .from('profiles')
          .select('username, points, lifetime_points, season_points, total_experience')
          .eq('email', session.user.email)
          .single();

        if (profile?.username) setUsername(profile.username);
        if (profile?.season_points != null) setPoints(profile.season_points);
        else if (profile?.points != null) setPoints(profile.points);
        if (profile?.total_experience != null) setLifetimePoints(profile.total_experience);
        else if (profile?.lifetime_points != null) setLifetimePoints(profile.lifetime_points);

      } catch (error) {
        console.error('Error in checkAuth:', error);
        setUser(null);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    checkAuth();
  }, []);

  // ============================================================
  // AUTH LISTENER
  // ============================================================
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);

        const { data: profile } = await supabase
          .from('profiles')
          .select('username, points, lifetime_points')
          .eq('email', session.user.email)
          .single();

        if (profile?.username) setUsername(profile.username);
        if (profile?.points != null) setPoints(profile.points);
        if (profile?.lifetime_points != null) setLifetimePoints(profile.lifetime_points);

      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUsername('');
        setPoints(0);
        setLifetimePoints(0);
        setIsLoadingAuth(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ============================================================
  // FETCH BASKETBALL GAMES
  // ============================================================
  const fetchGames = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) {
        setIsLoadingGames(true);
      }

      const response = await fetch(`${API_BASE_URL}/api/basketball`);

      if (!response.ok) {
        throw new Error('Failed to fetch basketball games');
      }

      const data = await response.json();

      if (data.success) {
        setGames(data.games || []);
        setGrouped(data.grouped || []);
        setStats(data.stats || { live: 0, finished: 0, scheduled: 0 });
        setLastUpdated(new Date());

        // Select first live game or first game
        if (!isBackground && data.games?.length > 0) {
          const liveGame = data.games.find(g => g.isLive);
          setSelectedGame(liveGame || data.games[0]);
        }
      }

    } catch (error) {
      console.error('❌ Error fetching basketball games:', error);
    } finally {
      if (!isBackground) {
        setIsLoadingGames(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchGames(false);
  }, [fetchGames]);

  // Auto refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchGames(true);
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchGames]);

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleAuthRedirect = () => {
    router.push('/auth');
  };

  const handleGameClick = (game) => {
    setSelectedGame(game);
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <SofaHeader
        user={user}
        username={username}
        onAuthRedirect={handleAuthRedirect}
        onShowProfile={() => setShowProfile(true)}
        liveCount={stats.live}
        finishedCount={stats.finished}
        upcomingCount={stats.scheduled}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Main Content */}
      <main className="pb-20 lg:pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Desktop Layout */}
          <div className="hidden lg:block px-4 py-4">
            <div className="grid grid-cols-12 gap-4">
              {/* Left Column - Game List */}
              <div className="col-span-5">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  {/* Basketball Header */}
                  <div className="bg-gradient-to-r from-orange-600 to-orange-500 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                          <Circle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h1 className="text-white font-bold text-lg font-condensed">Basketball</h1>
                          <p className="text-orange-100 text-xs font-condensed">
                            NBA • Euroleague • Liga Domestik
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold text-lg font-condensed">{games.length}</p>
                        <p className="text-orange-100 text-xs font-condensed">Pertandingan</p>
                      </div>
                    </div>
                  </div>

                  {/* Game List */}
                  <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
                    {isLoadingGames ? (
                      <div className="flex items-center justify-center py-12">
                        <OrbitLoader />
                      </div>
                    ) : (
                      <BasketballMatchList
                        games={filteredGames}
                        grouped={filteredGrouped}
                        onGameClick={handleGameClick}
                        selectedGame={selectedGame}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Center Column - Game Preview */}
              <div className="col-span-4">
                <BasketballMatchPreview
                  games={filteredGames}
                  game={selectedGame}
                  user={user}
                  onGameClick={handleGameClick}
                />
              </div>

              {/* Right Column - Ads */}
              <div className="col-span-3 space-y-4">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-gray-100 px-3 py-1 text-xs text-gray-500 font-condensed">Iklan</div>
                  <div className="aspect-[300/250] bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center">
                    <div className="text-center text-white p-4">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Circle className="w-10 h-10 text-white" />
                      </div>
                      <p className="text-xl font-bold font-condensed mb-1">Basketball Live</p>
                      <p className="text-sm font-condensed">Nonton NBA & Euroleague!</p>
                      <button className="mt-3 px-4 py-2 bg-white text-orange-600 rounded-lg text-sm font-bold font-condensed hover:bg-orange-50 transition-colors">
                        STREAMING
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-gray-100 px-3 py-1 text-xs text-gray-500 font-condensed">Iklan</div>
                  <div className="aspect-[300/250] bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                    <div className="text-center text-white p-4">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Circle className="w-10 h-10 text-white" />
                      </div>
                      <p className="text-xl font-bold font-condensed mb-1">NBA Season</p>
                      <p className="text-sm font-condensed">Jangan lewatkan!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="lg:hidden">
            {/* Game List */}
            <div className="p-3">
              {isLoadingGames ? (
                <div className="flex items-center justify-center py-12">
                  <OrbitLoader />
                </div>
              ) : (
                <BasketballMatchList
                  games={filteredGames}
                  grouped={filteredGrouped}
                  onGameClick={handleGameClick}
                  selectedGame={selectedGame}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <SofaFooter />

      {/* Modals */}
      <UserProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        user={user}
      />

      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={() => {
          setShowLoginModal(false);
          router.push('/auth');
        }}
      />
    </div>
  );
}
