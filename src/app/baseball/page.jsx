'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';

import SofaHeader from '@/components/SofaHeader';
import BaseballMatchList from '@/components/BaseballMatchList';
import BaseballMatchPreview from '@/components/BaseballMatchPreview';
import SofaFooter from '@/components/SofaFooter';
import UserProfileModal from '@/components/UserProfileModal';
import LoginRequiredModal from '@/components/LoginRequiredModal';
import OrbitLoader from '@/components/OrbitLoader';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function BaseballPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [points, setPoints] = useState(0);
  const [lifetimePoints, setLifetimePoints] = useState(0);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [games, setGames] = useState([]);
  const [grouped, setGrouped] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [stats, setStats] = useState({ live: 0, finished: 0, scheduled: 0 });
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [showProfile, setShowProfile] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const filteredGames = useMemo(() => {
    switch (activeFilter) {
      case 'Live': return games.filter(g => g.isLive);
      case 'Selesai': return games.filter(g => g.isFinished);
      default: return games;
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

  // Auth
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoadingAuth(true);
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.user) { setUser(null); setIsLoadingAuth(false); return; }
        setUser(session.user);
        const { data: profile } = await supabase.from('profiles').select('username, points, lifetime_points, season_points, total_experience').eq('email', session.user.email).single();
        if (profile?.username) setUsername(profile.username);
        if (profile?.season_points != null) setPoints(profile.season_points);
        else if (profile?.points != null) setPoints(profile.points);
        if (profile?.total_experience != null) setLifetimePoints(profile.total_experience);
        else if (profile?.lifetime_points != null) setLifetimePoints(profile.lifetime_points);
      } catch (e) { console.error('Auth error:', e); setUser(null); }
      finally { setIsLoadingAuth(false); }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        const { data: profile } = await supabase.from('profiles').select('username, points, lifetime_points').eq('email', session.user.email).single();
        if (profile?.username) setUsername(profile.username);
        if (profile?.points != null) setPoints(profile.points);
        if (profile?.lifetime_points != null) setLifetimePoints(profile.lifetime_points);
      } else if (event === 'SIGNED_OUT') { setUser(null); setUsername(''); setPoints(0); setLifetimePoints(0); setIsLoadingAuth(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch
  const fetchGames = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setIsLoadingGames(true);
      const res = await fetch(`${API_BASE_URL}/api/baseball`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      if (data.success) {
        setGames(data.games || []);
        setGrouped(data.grouped || []);
        setStats(data.stats || { live: 0, finished: 0, scheduled: 0 });
        setLastUpdated(new Date());
        if (!isBackground && data.games?.length > 0) {
          const liveGame = data.games.find(g => g.isLive);
          setSelectedGame(liveGame || data.games[0]);
        }
      }
    } catch (e) { console.error('❌ Error fetching baseball:', e); }
    finally { if (!isBackground) setIsLoadingGames(false); }
  }, []);

  useEffect(() => { fetchGames(false); }, [fetchGames]);
  useEffect(() => { const i = setInterval(() => fetchGames(true), 60000); return () => clearInterval(i); }, [fetchGames]);

  const handleAuthRedirect = () => router.push('/auth');
  const handleGameClick = (game) => { setSelectedGame(game); };

  return (
    <div className="min-h-screen bg-gray-100">
      <SofaHeader user={user} username={username} onAuthRedirect={handleAuthRedirect} onShowProfile={() => setShowProfile(true)} liveCount={stats.live} finishedCount={stats.finished} upcomingCount={stats.scheduled} activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      <main className="pb-20 lg:pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Desktop */}
          <div className="hidden lg:block px-4 py-4">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-5">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-red-600 to-red-500 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center"><span className="text-2xl">⚾</span></div>
                        <div>
                          <h1 className="text-white font-bold text-lg font-condensed">Baseball</h1>
                          <p className="text-red-100 text-xs font-condensed">MLB • NPB • KBO • Liga Domestik</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold text-lg font-condensed">{games.length}</p>
                        <p className="text-red-100 text-xs font-condensed">Pertandingan</p>
                      </div>
                    </div>
                  </div>
                  <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
                    {isLoadingGames ? (
                      <div className="flex items-center justify-center py-12"><OrbitLoader color="#EF4444" colorAlt="#DC2626" /></div>
                    ) : (
                      <BaseballMatchList games={filteredGames} grouped={filteredGrouped} onGameClick={handleGameClick} selectedGame={selectedGame} />
                    )}
                  </div>
                </div>
              </div>
              <div className="col-span-4">
                <BaseballMatchPreview games={filteredGames} game={selectedGame} user={user} onGameClick={handleGameClick} />
              </div>
              <div className="col-span-3 space-y-4">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-gray-100 px-3 py-1 text-xs text-gray-500 font-condensed">Iklan</div>
                  <div className="aspect-[300/250] bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                    <div className="text-center text-white p-4">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2"><span className="text-3xl">⚾</span></div>
                      <p className="text-xl font-bold font-condensed mb-1">Baseball Live</p>
                      <p className="text-sm font-condensed">Nonton MLB & NPB!</p>
                      <button className="mt-3 px-4 py-2 bg-white text-red-600 rounded-lg text-sm font-bold font-condensed hover:bg-red-50 transition-colors">STREAMING</button>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-gray-100 px-3 py-1 text-xs text-gray-500 font-condensed">Iklan</div>
                  <div className="aspect-[300/250] bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center">
                    <div className="text-center text-white p-4">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2"><span className="text-3xl">⚾</span></div>
                      <p className="text-xl font-bold font-condensed mb-1">MLB Season</p>
                      <p className="text-sm font-condensed">Jangan lewatkan!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile */}
          <div className="lg:hidden">
            <div className="p-3">
              {isLoadingGames ? (
                <div className="flex items-center justify-center py-12"><OrbitLoader color="#EF4444" colorAlt="#DC2626" /></div>
              ) : (
                <BaseballMatchList games={filteredGames} grouped={filteredGrouped} onGameClick={handleGameClick} selectedGame={selectedGame} />
              )}
            </div>
          </div>
        </div>
      </main>

      <SofaFooter />
      <UserProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} user={user} />
      <LoginRequiredModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLogin={() => { setShowLoginModal(false); router.push('/auth'); }} />
    </div>
  );
}
