'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';

// Components
import SofaHeader from '@/components/SofaHeader';
import SofaMatchList from '@/components/SofaMatchList';
import SofaMatchPreview from '@/components/SofaMatchPreview';
import SofaFooter from '@/components/SofaFooter';
import ChallengePage from '@/components/ChallengePage';
import UserProfileModal from '@/components/UserProfileModal';
import RewardHistoryModal from '@/components/RewardHistoryModal';
import LoginRequiredModal from '@/components/LoginRequiredModal';
import OrbitLoader from '@/components/OrbitLoader';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function HomePage() {
  const router = useRouter();

  // Auth State
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [points, setPoints] = useState(0);
  const [lifetimePoints, setLifetimePoints] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Match State
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Filter State
  const [activeFilter, setActiveFilter] = useState('Semua');

  // ============================================================
  // FILTER LOGIC - Filter matches berdasarkan status
  // ============================================================
  const isLiveMatch = (match) => {
    const status = match.status_short || match.status || '';
    return ['1H', '2H', 'HT', 'LIVE', 'ET', 'BT', 'P'].includes(status.toUpperCase()) || match.is_live;
  };

  const isFinishedMatch = (match) => {
    const status = match.status_short || match.status || '';
    return ['FT', 'AET', 'PEN'].includes(status.toUpperCase());
  };

  // Count untuk setiap filter (dari data asli)
  const liveCount = useMemo(() => matches.filter(isLiveMatch).length, [matches]);
  const finishedCount = useMemo(() => matches.filter(isFinishedMatch).length, [matches]);
  const upcomingCount = useMemo(() => matches.filter(m => !isLiveMatch(m) && !isFinishedMatch(m)).length, [matches]);

  // Filtered matches berdasarkan activeFilter
  const filteredMatches = useMemo(() => {
    switch (activeFilter) {
      case 'Live':
        return matches.filter(isLiveMatch);
      case 'Selesai':
        return matches.filter(isFinishedMatch);
      case 'Semua':
      default:
        return matches;
    }
  }, [matches, activeFilter]);

  // Modal State
  const [showProfile, setShowProfile] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showChallenge, setShowChallenge] = useState(false);
  const [challengeClosing, setChallengeClosing] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showWcLoading, setShowWcLoading] = useState(false);

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
          .select('username, points, lifetime_points, is_admin, season_points, total_experience')
          .eq('email', session.user.email)
          .single();

        if (profile?.username) setUsername(profile.username);
        if (profile?.season_points != null) setPoints(profile.season_points);
        else if (profile?.points != null) setPoints(profile.points);
        if (profile?.total_experience != null) setLifetimePoints(profile.total_experience);
        else if (profile?.lifetime_points != null) setLifetimePoints(profile.lifetime_points);
        if (profile?.is_admin) setIsAdmin(true);

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
          .select('username, points, lifetime_points, is_admin')
          .eq('email', session.user.email)
          .single();

        if (profile?.username) setUsername(profile.username);
        if (profile?.points != null) setPoints(profile.points);
        if (profile?.lifetime_points != null) setLifetimePoints(profile.lifetime_points);
        if (profile?.is_admin) setIsAdmin(true);

      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUsername('');
        setPoints(0);
        setLifetimePoints(0);
        setIsAdmin(false);
        setIsLoadingAuth(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ============================================================
  // FETCH MATCHES
  // ============================================================
  const fetchMatches = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) {
        setIsLoadingMatches(true);
      }

      const response = await fetch(`${API_BASE_URL}/api/matches`);

      if (!response.ok) {
        throw new Error('Failed to fetch matches');
      }

      const data = await response.json();

      if (data.success && data.matches) {
        setMatches(data.matches);
        setLastUpdated(new Date());

        if (!isBackground) {
          const liveMatch = data.matches.find(m =>
            ['1H', '2H', 'HT', 'LIVE'].includes((m.status_short || '').toUpperCase()) || m.is_live
          );
          setSelectedMatch(liveMatch || data.matches[0] || null);
        }
      }

    } catch (error) {
      console.error('❌ Error fetching matches:', error);
    } finally {
      if (!isBackground) {
        setIsLoadingMatches(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchMatches(false);
  }, [fetchMatches]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchMatches(true);
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchMatches]);

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleAuthRedirect = () => {
    router.push('/auth');
  };

  const handleMatchClick = (match) => {
    const matchId = match.id || match.match_id;
    const homeTeam = match.home_team_name || match.home_team || 'home';
    const awayTeam = match.away_team_name || match.away_team || 'away';

    const slug = `${homeTeam}-vs-${awayTeam}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    router.push(`/match/${slug}-${matchId}`);
  };

  // Hover disabled - selectedMatch diset otomatis ke match live atau match pertama

  const handleChallengeClick = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    setChallengeClosing(false);
    setShowChallenge(true);
  };

  const handleCloseChallenge = () => {
    setChallengeClosing(true);
    setTimeout(() => {
      setShowChallenge(false);
      setChallengeClosing(false);
    }, 400);
  };

  const handleManualRefresh = () => {
    fetchMatches(false);
  };

  // World Cup loading screen → redirect
  useEffect(() => {
    if (!showWcLoading) return;
    const t = setTimeout(() => {
      router.push('/world-cup-simulator');
    }, 2500);
    return () => clearTimeout(t);
  }, [showWcLoading]);

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500 font-condensed">Memuat...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <SofaHeader
        user={user}
        username={username}
        onAuthRedirect={handleAuthRedirect}
        onShowProfile={() => setShowProfile(true)}
        liveCount={liveCount}
        finishedCount={finishedCount}
        upcomingCount={upcomingCount}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
      />

      {/* Main Content */}
      <main className="flex-1">
        {/* ============================================================ */}
        {/* MOBILE LAYOUT - Full width match list */}
        {/* ============================================================ */}
        <div className="lg:hidden bg-white">
          {isLoadingMatches ? (
            <div className="flex items-center justify-center py-20">
              <OrbitLoader size={48} text="Memuat pertandingan..." />
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <span className="text-4xl mb-3 block">⚽</span>
                <p className="text-gray-500 font-condensed">
                  {activeFilter === 'Live' && 'Tidak ada pertandingan live saat ini'}
                  {activeFilter === 'Selesai' && 'Tidak ada pertandingan selesai hari ini'}
                  {activeFilter === 'Semua' && 'Tidak ada pertandingan'}
                </p>
              </div>
            </div>
          ) : (
            <SofaMatchList
              matches={filteredMatches}
              onMatchClick={handleMatchClick}
              selectedMatch={selectedMatch}
            />
          )}
        </div>

        {/* ============================================================ */}
        {/* DESKTOP LAYOUT - 3 columns */}
        {/* ============================================================ */}
        <div className="hidden lg:block">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

              {/* Left Column - Match List */}
              <div className="lg:col-span-5">
                {isLoadingMatches ? (
                  <div className="bg-white rounded-xl shadow-sm p-8 flex items-center justify-center">
                    <OrbitLoader size={48} text="Memuat pertandingan..." />
                  </div>
                ) : (
                  <>
                    {lastUpdated && (
                      <div className="flex items-center justify-between mb-2 px-1">
                        <span className="text-xs text-gray-400 font-condensed">
                          Updated: {lastUpdated.toLocaleTimeString('id-ID')}
                        </span>
                        <button
                          onClick={handleManualRefresh}
                          className="text-xs text-green-600 hover:text-green-700 font-condensed"
                        >
                          🔄 Refresh
                        </button>
                      </div>
                    )}
                    {filteredMatches.length === 0 ? (
                      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                        <span className="text-4xl mb-3 block">⚽</span>
                        <p className="text-gray-500 font-condensed">
                          {activeFilter === 'Live' && 'Tidak ada pertandingan live saat ini'}
                          {activeFilter === 'Selesai' && 'Tidak ada pertandingan selesai hari ini'}
                          {activeFilter === 'Semua' && 'Tidak ada pertandingan'}
                        </p>
                      </div>
                    ) : (
                      <SofaMatchList
                        matches={filteredMatches}
                        onMatchClick={handleMatchClick}
                        selectedMatch={selectedMatch}
                      />
                    )}
                  </>
                )}
              </div>

              {/* Center Column - Match Preview (NEW STYLE) */}
              <div className="lg:col-span-4">
                <SofaMatchPreview
                  matches={filteredMatches}
                  match={selectedMatch}
                  user={user}
                  onMatchClick={handleMatchClick}
                  onChallengeClick={handleChallengeClick}
                />

                {/* Quick Stats - Only show if user logged in */}
                {user && (
                  <div className="mt-4 bg-white rounded-xl shadow-sm p-4">
                    <h3 className="font-bold text-gray-800 mb-3 font-condensed">📊 Stats Kamu</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-green-600 font-condensed">{points}</p>
                        <p className="text-xs text-gray-500 font-condensed">Season Points</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-blue-600 font-condensed">{lifetimePoints}</p>
                        <p className="text-xs text-gray-500 font-condensed">Total XP</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <button
                        onClick={() => setShowHistory(true)}
                        className="py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-condensed hover:bg-gray-200 transition-colors"
                      >
                        📜 Riwayat
                      </button>
                      <button
                        onClick={() => router.push('/reward-shop')}
                        className="py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-condensed hover:from-purple-600 hover:to-pink-600 transition-colors"
                      >
                        🎁 Reward
                      </button>
                    </div>
                  </div>
                )}

                {/* World Cup 2026 Simulator Banner */}
                <div
                  onClick={() => setShowWcLoading(true)}
                  className="mt-4 bg-gradient-to-br from-green-700 via-green-600 to-emerald-700 rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <div className="p-4 flex items-center gap-3">
                    <span className="text-3xl">🏆</span>
                    <div className="flex-1">
                      <p className="font-bold text-white font-condensed text-sm">FIFA World Cup 2026™</p>
                      <p className="text-[11px] text-green-200 font-condensed">Simulator — Pilih tim & bawa juara!</p>
                    </div>
                    <span className="text-white/60 text-xl">›</span>
                  </div>
                </div>
              </div>

              {/* Right Column - Ads Sidebar */}
              <div className="lg:col-span-3 space-y-4">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-gray-100 px-3 py-1 text-xs text-gray-500 font-condensed">Iklan</div>
                  <div className="aspect-[300/250] bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
                    <div className="text-center text-white p-4">
                      <p className="text-2xl font-bold font-condensed mb-2">NobarMeriah</p>
                      <p className="text-sm font-condensed">Nonton Bola Gratis!</p>
                      <button className="mt-3 px-4 py-2 bg-white text-green-600 rounded-lg text-sm font-bold font-condensed hover:bg-green-50 transition-colors">
                        STREAMING
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-gray-100 px-3 py-1 text-xs text-gray-500 font-condensed">Iklan</div>
                  <div className="aspect-[300/250] bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                    <div className="text-center text-white p-4">
                      <p className="text-4xl mb-2">🎁</p>
                      <p className="text-xl font-bold font-condensed mb-1">DAILY BONUS</p>
                      <p className="text-sm font-condensed">Tukar poin dengan hadiah!</p>
                      <button
                        onClick={() => router.push('/reward-shop')}
                        className="mt-3 px-4 py-2 bg-white text-orange-600 rounded-lg text-sm font-bold font-condensed hover:bg-orange-50 transition-colors"
                      >
                        CLAIM NOW
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-gray-100 px-3 py-1 text-xs text-gray-500 font-condensed">Iklan</div>
                  <div className="p-4 flex items-center gap-3">
                    <span className="text-3xl">📺</span>
                    <div>
                      <p className="font-bold text-gray-800 font-condensed">Streaming Gratis</p>
                      <p className="text-xs text-gray-500 font-condensed">Nonton pertandingan live HD</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer - Both Desktop & Mobile */}
      <SofaFooter />

      {/* ============================================================ */}
      {/* MODALS */}
      {/* ============================================================ */}

      {/* Search Modal - Mobile */}
      {showSearch && (
        <div className="fixed inset-0 bg-white z-50 lg:hidden">
          <div className="flex items-center gap-2 p-3 border-b border-gray-200">
            <button
              onClick={() => setShowSearch(false)}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
            >
              ✕
            </button>
            <input
              type="text"
              placeholder="Cari tim, liga, pertandingan..."
              autoFocus
              className="flex-1 py-2 px-3 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-500 font-condensed mb-3">Pencarian populer</p>
            <div className="flex flex-wrap gap-2">
              {['Premier League', 'Real Madrid', 'Barcelona', 'Liverpool', 'Manchester United'].map((term) => (
                <button
                  key={term}
                  className="px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700 font-condensed hover:bg-gray-200"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Challenge Modal */}
      {showChallenge && (
        <div className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 ${challengeClosing ? 'animate-fade-out' : 'animate-fade-in'}`}>
          <div className={`relative w-full max-w-6xl max-h-[90vh] overflow-hidden ${challengeClosing ? 'animate-scale-out' : 'animate-scale-in'}`}>
            <ChallengePage
              onClose={handleCloseChallenge}
              user={user}
              username={username}
              points={points}
              lifetimePoints={lifetimePoints}
            />
          </div>
        </div>
      )}

      {/* Profile Modal */}
      <UserProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        user={user}
      />

      {/* History Modal */}
      <RewardHistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        user={user}
      />

      {/* Login Modal */}
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={() => {
          setShowLoginModal(false);
          router.push('/auth');
        }}
      />

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes scaleOut {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0; transform: scale(0.9); }
        }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        .animate-fade-out { animation: fadeOut 0.3s ease-in forwards; }
        .animate-scale-in { animation: scaleIn 0.3s ease-out forwards; }
        .animate-scale-out { animation: scaleOut 0.3s ease-in forwards; }

        .wc-loader {
          transform: rotateZ(45deg);
          perspective: 1000px;
          border-radius: 50%;
          width: 48px;
          height: 48px;
          color: #fff;
          position: relative;
        }
        .wc-loader:before,
        .wc-loader:after {
          content: '';
          display: block;
          position: absolute;
          top: 0;
          left: 0;
          width: inherit;
          height: inherit;
          border-radius: 50%;
          transform: rotateX(70deg);
          animation: 1s wcSpin linear infinite;
        }
        .wc-loader:after {
          color: #FF3D00;
          transform: rotateY(70deg);
          animation-delay: .4s;
        }
        @keyframes wcSpin {
          0%, 100% { box-shadow: .2em 0px 0 0px currentcolor; }
          12% { box-shadow: .2em .2em 0 0 currentcolor; }
          25% { box-shadow: 0 .2em 0 0px currentcolor; }
          37% { box-shadow: -.2em .2em 0 0 currentcolor; }
          50% { box-shadow: -.2em 0 0 0 currentcolor; }
          62% { box-shadow: -.2em -.2em 0 0 currentcolor; }
          75% { box-shadow: 0px -.2em 0 0 currentcolor; }
          87% { box-shadow: .2em -.2em 0 0 currentcolor; }
        }
        @keyframes wcTextFade {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes wcSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* World Cup Loading Screen */}
      {showWcLoading && (
        <div className="fixed inset-0 z-[100] bg-gradient-to-b from-[#1a472a] via-[#0d2818] to-[#0a1f14] flex flex-col items-center justify-center"
          style={{ animation: 'fadeIn 0.4s ease-out' }}>
          <div style={{ animation: 'wcSlideUp 0.5s ease-out' }} className="text-center">
            <p className="text-5xl mb-4">🏆</p>
            <h1 className="text-2xl lg:text-3xl font-bold text-white" style={{ fontFamily: "'Oswald', sans-serif" }}>
              FIFA WORLD CUP
            </h1>
            <p className="text-yellow-400 text-lg lg:text-xl font-bold tracking-[0.3em]" style={{ fontFamily: "'Oswald', sans-serif" }}>
              2026™
            </p>
            <div className="flex items-center justify-center gap-3 mt-2">
              <span className="h-px w-8 bg-green-500/50" />
              <p className="text-green-400/80 text-xs tracking-widest uppercase" style={{ fontFamily: "'Oswald', sans-serif" }}>
                Simulator
              </p>
              <span className="h-px w-8 bg-green-500/50" />
            </div>
          </div>

          <div className="mt-12 flex items-center justify-center" style={{ animation: 'wcSlideUp 0.8s ease-out', width: 48, height: 48 }}>
            <span className="wc-loader" />
          </div>

          <p className="mt-12 text-green-300/60 text-xs tracking-wider" style={{ fontFamily: "'Oswald', sans-serif", animation: 'wcTextFade 2s ease-in-out infinite' }}>
            Memuat turnamen...
          </p>

          <div className="absolute bottom-8 flex items-center gap-2" style={{ animation: 'wcSlideUp 1s ease-out' }}>
            <span className="text-[10px] text-green-500/40">⚽</span>
            <p className="text-[10px] text-green-500/40 tracking-wider" style={{ fontFamily: "'Oswald', sans-serif" }}>
              NOBARMERIAH.COM
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
