'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';
import SofaHeader from '@/components/SofaHeader';
import SofaFooter from '@/components/SofaFooter';
import MMAFightList from '@/components/MMAFightList';
import MMAPreview from '@/components/MMAPreview';
import UserProfileModal from '@/components/UserProfileModal';
import LoginRequiredModal from '@/components/LoginRequiredModal';
import OrbitLoader from '@/components/OrbitLoader';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function MMAPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [fights, setFights] = useState([]);
  const [grouped, setGrouped] = useState([]);
  const [selectedFight, setSelectedFight] = useState(null);
  const [isLoadingFights, setIsLoadingFights] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [stats, setStats] = useState({ live: 0, finished: 0, scheduled: 0 });
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [showProfile, setShowProfile] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const filteredFights = useMemo(() => {
    switch (activeFilter) {
      case 'Live': return fights.filter(f => f.isLive);
      case 'Selesai': return fights.filter(f => f.isFinished);
      default: return fights;
    }
  }, [fights, activeFilter]);

  const filteredGrouped = useMemo(() => {
    if (activeFilter === 'Semua') return grouped;
    return grouped.map(g => ({ ...g, fights: g.fights.filter(f => { if (activeFilter === 'Live') return f.isLive; if (activeFilter === 'Selesai') return f.isFinished; return true; }) })).filter(g => g.fights.length > 0);
  }, [grouped, activeFilter]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoadingAuth(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { setUser(null); setIsLoadingAuth(false); return; }
        setUser(session.user);
        const { data: profile } = await supabase.from('profiles').select('username, season_points, total_experience').eq('email', session.user.email).single();
        if (profile?.username) setUsername(profile.username);
      } catch (e) { setUser(null); } finally { setIsLoadingAuth(false); }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) { setUser(session.user); const { data: p } = await supabase.from('profiles').select('username').eq('email', session.user.email).single(); if (p?.username) setUsername(p.username); }
      else if (event === 'SIGNED_OUT') { setUser(null); setUsername(''); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const [upcomingFights, setUpcomingFights] = useState([]);

  const fetchFights = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setIsLoadingFights(true);
      // Fetch today + upcoming in parallel
      const [todayRes, upcomingRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/mma`),
        fetch(`${API_BASE_URL}/api/mma/upcoming?limit=20`)
      ]);
      const todayData = todayRes.ok ? await todayRes.json() : { success: false };
      const upcomingData = upcomingRes.ok ? await upcomingRes.json() : { success: false };

      if (todayData.success) {
        setFights(todayData.fights || []); setGrouped(todayData.grouped || []); setStats(todayData.stats || { live: 0, finished: 0, scheduled: 0 }); setLastUpdated(new Date());
        if (!isBackground && todayData.fights?.length > 0) { setSelectedFight(todayData.fights.find(f => f.isLive) || todayData.fights[0]); }
      }
      if (upcomingData.success) {
        setUpcomingFights(upcomingData.fights || []);
        // If no fights today, use upcoming for preview
        if (!isBackground && (!todayData.fights || todayData.fights.length === 0) && upcomingData.fights?.length > 0) {
          setSelectedFight(upcomingData.fights[0]);
        }
      }
    } catch (e) { console.error('MMA fetch error:', e); }
    finally { if (!isBackground) setIsLoadingFights(false); }
  }, []);

  useEffect(() => { fetchFights(false); }, [fetchFights]);
  useEffect(() => { const i = setInterval(() => fetchFights(true), 60000); return () => clearInterval(i); }, [fetchFights]);

  const handleAuthRedirect = () => router.push('/auth');
  const handleFightClick = (fight) => { setSelectedFight(fight); };

  return (
    <div className="min-h-screen bg-gray-100">
      <SofaHeader user={user} username={username} onAuthRedirect={handleAuthRedirect} onShowProfile={() => setShowProfile(true)} liveCount={stats.live} finishedCount={stats.finished} upcomingCount={stats.scheduled} activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      <main className="pb-20 lg:pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="hidden lg:block px-4 py-4">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-5">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center"><span className="text-2xl">🥊</span></div>
                        <div><h1 className="text-white font-bold text-lg font-condensed">MMA</h1><p className="text-gray-300 text-xs font-condensed">UFC • Bellator • ONE • PFL</p></div>
                      </div>
                      <div className="text-right"><p className="text-white font-bold text-lg font-condensed">{fights.length}</p><p className="text-gray-300 text-xs font-condensed">Pertandingan</p></div>
                    </div>
                  </div>
                  <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
                    {isLoadingFights ? <div className="flex items-center justify-center py-12"><OrbitLoader color="#374151" colorAlt="#1F2937" /></div> : <MMAFightList fights={filteredFights} grouped={filteredGrouped} upcomingFights={upcomingFights} onFightClick={handleFightClick} selectedFight={selectedFight} />}
                  </div>
                </div>
              </div>
              <div className="col-span-4"><MMAPreview fights={filteredFights} upcomingFights={upcomingFights} fight={selectedFight} user={user} onFightClick={handleFightClick} /></div>
              <div className="col-span-3 space-y-4">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-gray-100 px-3 py-1 text-xs text-gray-500 font-condensed">Iklan</div>
                  <div className="aspect-[300/250] bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                    <div className="text-center text-white p-4">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2"><span className="text-3xl">🥊</span></div>
                      <p className="text-xl font-bold font-condensed mb-1">MMA Live</p><p className="text-sm font-condensed">Nonton UFC & MMA!</p>
                      <button className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold font-condensed hover:bg-red-700 transition-colors">STREAMING</button>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4">
                  <h3 className="font-bold text-gray-800 mb-3 font-condensed text-sm">🏆 Top Promotions</h3>
                  <div className="space-y-2 text-sm">
                    {['UFC', 'Bellator', 'ONE Championship', 'PFL', 'RIZIN', 'KSW'].map((p, i) => (
                      <div key={p} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                        <span className="text-gray-600 font-condensed">{i + 1}. {p}</span>
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded font-condensed">{i === 0 ? 'Premier' : i < 3 ? 'Major' : 'Regional'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:hidden">
            <div className="p-3">
              {isLoadingFights ? <div className="flex items-center justify-center py-12"><OrbitLoader color="#374151" colorAlt="#1F2937" /></div> : <MMAFightList fights={filteredFights} grouped={filteredGrouped} upcomingFights={upcomingFights} onFightClick={handleFightClick} selectedFight={selectedFight} />}
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
