'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';

import SofaHeader from '@/components/SofaHeader';
import SofaFooter from '@/components/SofaFooter';
import F1RaceList from '@/components/F1RaceList';
import F1Preview from '@/components/F1Preview';
import UserProfileModal from '@/components/UserProfileModal';
import LoginRequiredModal from '@/components/LoginRequiredModal';
import OrbitLoader from '@/components/OrbitLoader';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function Formula1Page() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [races, setRaces] = useState([]);
  const [nextRace, setNextRace] = useState(null);
  const [driverStandings, setDriverStandings] = useState([]);
  const [teamStandings, setTeamStandings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, completed: 0, remaining: 0 });
  const [showProfile, setShowProfile] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

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
      } catch (e) { console.error('Auth error:', e); setUser(null); }
      finally { setIsLoadingAuth(false); }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        const { data: profile } = await supabase.from('profiles').select('username').eq('email', session.user.email).single();
        if (profile?.username) setUsername(profile.username);
      } else if (event === 'SIGNED_OUT') { setUser(null); setUsername(''); setIsLoadingAuth(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch
  const fetchData = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setIsLoading(true);
      const [mainRes, racesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/formula1`),
        fetch(`${API_BASE_URL}/api/formula1/races`)
      ]);
      const mainData = await mainRes.json();
      const racesData = await racesRes.json();

      if (mainData.success) {
        setNextRace(mainData.nextRace || null);
        setDriverStandings(mainData.driverStandings || []);
        setTeamStandings(mainData.teamStandings || []);
        setStats(mainData.stats || { total: 0, completed: 0, remaining: 0 });
      }
      if (racesData.success) {
        setRaces(racesData.races || []);
      }
    } catch (e) { console.error('❌ Error fetching F1:', e); }
    finally { if (!isBackground) setIsLoading(false); }
  }, []);

  useEffect(() => { fetchData(false); }, [fetchData]);
  useEffect(() => { const i = setInterval(() => fetchData(true), 120000); return () => clearInterval(i); }, [fetchData]);

  const handleAuthRedirect = () => router.push('/auth');
  const handleRaceClick = (race) => { };

  return (
    <div className="min-h-screen bg-gray-100">
      <SofaHeader user={user} username={username} onAuthRedirect={handleAuthRedirect} onShowProfile={() => setShowProfile(true)} />

      <main className="pb-20 lg:pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Desktop */}
          <div className="hidden lg:block px-4 py-4">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-5">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-red-700 to-red-600 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center"><span className="text-2xl">🏎️</span></div>
                        <div>
                          <h1 className="text-white font-bold text-lg font-condensed">Formula 1</h1>
                          <p className="text-red-100 text-xs font-condensed">Season {new Date().getFullYear()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold text-lg font-condensed">{stats.total}</p>
                        <p className="text-red-100 text-xs font-condensed">Total Race</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/20">
                      <div className="text-center"><p className="text-lg font-bold text-white font-condensed">{stats.total}</p><p className="text-[10px] text-red-200 font-condensed">Total</p></div>
                      <div className="text-center"><p className="text-lg font-bold text-white font-condensed">{stats.completed}</p><p className="text-[10px] text-red-200 font-condensed">Selesai</p></div>
                      <div className="text-center"><p className="text-lg font-bold text-white font-condensed">{stats.remaining}</p><p className="text-[10px] text-red-200 font-condensed">Sisa</p></div>
                    </div>
                  </div>
                  <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-12"><OrbitLoader color="#DC2626" colorAlt="#991B1B" /></div>
                    ) : (
                      <F1RaceList races={races} onRaceClick={handleRaceClick} />
                    )}
                  </div>
                </div>
              </div>
              <div className="col-span-4">
                <F1Preview nextRace={nextRace} driverStandings={driverStandings} teamStandings={teamStandings} onRaceClick={handleRaceClick} />
              </div>
              <div className="col-span-3 space-y-4">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-gray-100 px-3 py-1 text-xs text-gray-500 font-condensed">Iklan</div>
                  <div className="aspect-[300/250] bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center">
                    <div className="text-center text-white p-4">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2"><span className="text-3xl">🏎️</span></div>
                      <p className="text-xl font-bold font-condensed mb-1">F1 Live</p>
                      <p className="text-sm font-condensed">Nonton Race Live!</p>
                      <button className="mt-3 px-4 py-2 bg-white text-red-700 rounded-lg text-sm font-bold font-condensed hover:bg-red-50 transition-colors">STREAMING</button>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4">
                  <h3 className="font-bold text-gray-800 mb-3 font-condensed">F1 Quick Facts</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500 font-condensed">Top Speed</span><span className="font-semibold text-gray-800 font-condensed">~370 km/h</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 font-condensed">0-100 km/h</span><span className="font-semibold text-gray-800 font-condensed">~2.6 detik</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 font-condensed">G-Force</span><span className="font-semibold text-gray-800 font-condensed">~6G</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile */}
          <div className="lg:hidden">
            <div className="p-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-12"><OrbitLoader color="#DC2626" colorAlt="#991B1B" /></div>
              ) : (
                <>
                  <div className="bg-gradient-to-r from-red-700 to-red-600 rounded-xl p-4 mb-4 text-white">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center"><span className="text-2xl">🏎️</span></div>
                      <div>
                        <h1 className="font-bold text-lg font-condensed">Formula 1</h1>
                        <p className="text-red-100 text-sm font-condensed">Season {new Date().getFullYear()}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/20">
                      <div className="text-center"><p className="text-xl font-bold font-condensed">{stats.total}</p><p className="text-xs text-red-200 font-condensed">Total</p></div>
                      <div className="text-center"><p className="text-xl font-bold font-condensed">{stats.completed}</p><p className="text-xs text-red-200 font-condensed">Selesai</p></div>
                      <div className="text-center"><p className="text-xl font-bold font-condensed">{stats.remaining}</p><p className="text-xs text-red-200 font-condensed">Sisa</p></div>
                    </div>
                  </div>
                  <F1RaceList races={races} onRaceClick={handleRaceClick} />
                </>
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
