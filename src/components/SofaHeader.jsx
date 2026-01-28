'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search, User, Settings, Star, ChevronLeft, ChevronRight,
  Trophy, LogOut
} from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';

export default function SofaHeader({
  user,
  username,
  onAuthRedirect,
  onShowProfile,
  liveCount = 0,
  finishedCount = 0,
  upcomingCount = 0,
  activeFilter = 'Semua',
  onFilterChange
}) {
  const router = useRouter();
  const pathname = usePathname();
  const activeSport = pathname === '/' ? 'football' : pathname.replace('/', '') || 'football';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('Hari ini');

  // Dropdown state
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Logout
  const handleLogout = async (e) => {
    // Prevent event bubbling yang bisa close dropdown
    e?.preventDefault();
    e?.stopPropagation();

    console.log('🚪 Logging out...');
    setShowDropdown(false);

    // Get email - dari session ATAU localStorage (fallback kalau session expired)
    let userEmail = null;

    // Coba ambil dari localStorage dulu (lebih reliable)
    userEmail = localStorage.getItem('user_email');

    // Kalau gak ada di localStorage, coba dari session
    if (!userEmail) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        userEmail = session?.user?.email;
      } catch (err) {
        console.log('Session error:', err);
      }
    }

    console.log('📧 Logout email:', userEmail);

    // PRIORITAS 1: Hapus active_sessions (PENTING biar bisa login lagi)
    if (userEmail) {
      try {
        const { error } = await supabase
          .from('active_sessions')
          .delete()
          .eq('account_email', userEmail.toLowerCase());

        if (error) {
          console.error('❌ Failed to delete active_session:', error);
        } else {
          console.log('✅ Active session cleared for:', userEmail);
        }
      } catch (err) {
        console.error('❌ Error deleting active_session:', err);
      }
    }

    // PRIORITAS 2: Sign out dari Supabase
    try {
      await supabase.auth.signOut();
      console.log('✅ Signed out from Supabase');
    } catch (err) {
      console.log('SignOut error (ignored):', err);
    }

    // PRIORITAS 3: Clear ALL storage & redirect
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('sb-localhost-auth-token');
    localStorage.removeItem('sb-vqbwpjmrsjjcidlzbfz-auth-token');
    localStorage.removeItem('user_email');
    sessionStorage.clear();

    // Force redirect
    window.location.href = '/';
  };

  // Sports categories dengan badge count
  const sportsCategories = [
    { id: 'trending', name: 'Trending', icon: '/icons/sports/trending.png', count: null },
    { id: 'football', name: 'Sepak Bola', icon: '/icons/sports/football.png', count: liveCount || null },
    { id: 'tennis', name: 'Tenis', icon: '/icons/sports/tennis.png', count: null },
    { id: 'basketball', name: 'Bola Basket', icon: '/icons/sports/basketball.png', count: null },
    { id: 'volleyball', name: 'Bola Voli', icon: '/icons/sports/volleyball.png', count: null },
    { id: 'badminton', name: 'Bulutangkis', icon: '/icons/sports/badminton.png', count: null },
    { id: 'motorsport', name: 'Motorsport', icon: '/icons/sports/motorsport.png', count: null },
    { id: 'mma', name: 'MMA', icon: '/icons/sports/mma.png', count: null },
    { id: 'hockey', name: 'Hoki', icon: '/icons/sports/hockey.png', count: null },
    { id: 'handball', name: 'Bola Tangan', icon: '/icons/sports/handball.png', count: null },
    { id: 'rugby', name: 'Rugby', icon: '/icons/sports/rugby.png', count: null },
    { id: 'cricket', name: 'Kriket', icon: '/icons/sports/cricket.png', count: null },
  ];

  // Helper: Check if icon is emoji or image path
  const isEmoji = (icon) => {
    return !icon.startsWith('/') && !icon.startsWith('http');
  };

  // Filter tabs dengan count dari data asli
  const filters = [
    { id: 'semua', name: 'Semua', count: null },
    { id: 'live', name: 'Live', count: liveCount > 0 ? liveCount : null, isLive: true },
    { id: 'selesai', name: 'Selesai', count: finishedCount > 0 ? finishedCount : null },
  ];

  const handleFilterClick = (filterName) => {
    onFilterChange?.(filterName);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Searching:', searchQuery);
    }
  };

  return (
    <div className="sofa-header">
      {/* ============================================================ */}
      {/* DESKTOP HEADER */}
      {/* ============================================================ */}
      <div className="hidden lg:block">
        {/* Top Header - Logo, Search, Actions */}
        <div className="bg-green-600 text-white">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              {/* Logo */}
              <div
                className="cursor-pointer flex-shrink-0"
                onClick={() => router.push('/')}
              >
                <img
                  src="/images/NobarMeriahLogoText.png"
                  alt="NobarMeriah"
                  className="h-10 object-contain"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="flex-1 max-w-xl">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari pertandingan, tim, pemain, dan lain-lain"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
                  />
                </div>
              </form>

              {/* Right Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {user ? (
                  // User logged in - Show dropdown
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="flex items-center gap-2 bg-white text-green-600 px-4 py-2 rounded-full font-medium text-sm hover:bg-green-50 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span className="font-condensed">{username || 'User'}</span>
                    </button>

                    {/* Dropdown Menu */}
                    {showDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-fade-in">
                        {/* Profil */}
                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            router.push('/profile');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <User className="w-5 h-5 text-gray-500" />
                          <span className="font-medium">Profil</span>
                        </button>

                        {/* Divider */}
                        <div className="border-t border-gray-100 my-1"></div>

                        {/* Keluar */}
                        <button
                          type="button"
                          onClick={() => {
                            // Close dropdown
                            setShowDropdown(false);

                            // Get email
                            const userEmail = user?.email;
                            console.log('📧 Logout email:', userEmail);

                            // Clear session via BACKEND API (bypass Supabase auth)
                            if (userEmail) {
                              fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/logout`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email: userEmail })
                              })
                                .then(res => res.json())
                                .then(data => console.log('✅ Session cleared:', data))
                                .catch(err => console.log('Session clear error:', err));
                            }

                            // Sign out (fire & forget)
                            supabase.auth.signOut().catch(() => { });

                            // Clear storage
                            localStorage.clear();
                            sessionStorage.clear();

                            // Redirect
                            window.location.href = '/';
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-5 h-5 text-red-500" />
                          <span className="font-medium">Keluar</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={onAuthRedirect}
                    className="flex items-center gap-2 bg-white text-green-600 px-4 py-2 rounded-full font-medium text-sm hover:bg-green-50 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span className="font-condensed">MASUK</span>
                  </button>
                )}
                <button className="p-2 hover:bg-green-500 rounded-full transition-colors">
                  <Star className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-green-500 rounded-full transition-colors">
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* Sports Navigation - SOFASCORE STYLE */}
        {/* ============================================================ */}
        <div className="bg-green-700 text-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center py-2 overflow-x-auto scrollbar-hide">
              {sportsCategories.map((sport) => (
                <button
                  key={sport.id}
                  onClick={() => {
                    if (sport.id !== 'football') {
                      router.push(`/${sport.id}`);
                    } else {
                      router.push('/');
                    }
                  }}
                  className={`relative flex flex-col items-center justify-center min-w-[70px] px-3 py-2 rounded-xl transition-all cursor-pointer ${sport.id === activeSport
                    ? 'bg-green-500'
                    : 'hover:bg-green-600/50'
                    }`}
                >
                  {/* Badge count */}
                  {sport.count && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-yellow-400 text-green-800 text-[10px] font-bold rounded-full px-1">
                      {sport.count}
                    </span>
                  )}

                  {/* Icon - Support emoji atau custom image */}
                  <div className="mb-1 flex items-center justify-center h-7">
                    {isEmoji(sport.icon) ? (
                      <span className="text-2xl">{sport.icon}</span>
                    ) : (
                      <>
                        <img
                          src={sport.icon}
                          alt={sport.name}
                          className="w-7 h-7 object-contain"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling?.classList.remove('hidden');
                          }}
                        />
                        {/* Fallback emoji */}
                        <span className="text-2xl hidden">⚽</span>
                      </>
                    )}
                  </div>

                  <span className="text-xs font-condensed whitespace-nowrap">
                    {sport.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* Sub Header - Title, Tabs, Filters */}
        {/* ============================================================ */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Left: Title */}
              <span className="text-sm text-gray-500 font-condensed">
                Skor langsung dan jadwal sepak bola hari ini
              </span>

              {/* Center: Tabs */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 font-condensed mr-2">Semua</span>
                <span className="text-sm text-gray-500 font-condensed mr-2">Favorit</span>
                <span className="text-sm text-gray-500 font-condensed mr-2">Turnamen</span>
              </div>

              {/* Right: Date & Filters */}
              <div className="flex items-center gap-3">
                {/* Date Picker */}
                <div className="flex items-center gap-1 mr-2">
                  <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                    <ChevronLeft className="w-4 h-4 text-gray-500" />
                  </button>
                  <span className="text-sm font-medium text-gray-700 font-condensed px-2">
                    {selectedDate}
                  </span>
                  <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </button>
                </div>

                {/* Filter Buttons */}
                {filters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => handleFilterClick(filter.name)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors font-condensed ${activeFilter === filter.name
                      ? 'bg-green-500 text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    {filter.name}
                    {filter.count && (
                      <span className={`text-xs ${activeFilter === filter.name ? 'text-green-100' : 'text-gray-400'}`}>
                        ({filter.count})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MOBILE HEADER - SofaScore Style */}
      {/* ============================================================ */}
      <div className="lg:hidden">
        {/* Row 1: Logo + Download Button */}
        <div className="bg-green-600 px-4 py-2.5 flex items-center justify-between">
          {/* Logo Text */}
          <div
            className="cursor-pointer"
            onClick={() => router.push('/')}
          >
            <img
              src="/images/NobarMeriahLogoText.png"
              alt="NobarMeriah"
              className="h-8 object-contain"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>

          {/* Download Button */}
          <button className="bg-white text-green-600 px-3 py-1.5 rounded-full text-xs font-bold font-condensed">
            Unduh aplikasi
          </button>
        </div>

        {/* Row 2: Sports Navigation - Swipeable */}
        <div className="bg-green-600 overflow-x-auto scrollbar-hide">
          <div className="flex items-center px-2 pb-2 gap-1 min-w-max">
            {sportsCategories.map((sport) => (
              <button
                key={sport.id}
                onClick={() => {
                  if (sport.id !== 'football') {
                    router.push(`/${sport.id}`);
                  } else {
                    router.push('/');
                  }
                }}
                className={`relative flex flex-col items-center justify-center px-3 py-2 rounded-lg min-w-[65px] transition-all cursor-pointer ${sport.id === activeSport
                  ? 'bg-green-500'
                  : 'hover:bg-green-500/50'
                  }`}
              >
                {/* Badge count - Mobile */}
                {sport.count && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] flex items-center justify-center bg-yellow-400 text-green-800 text-[9px] font-bold rounded-full px-1">
                    {sport.count}
                  </span>
                )}

                {/* Icon - Support emoji atau custom image */}
                <div className="mb-0.5 flex items-center justify-center h-6">
                  {isEmoji(sport.icon) ? (
                    <span className="text-xl">{sport.icon}</span>
                  ) : (
                    <>
                      <img
                        src={sport.icon}
                        alt={sport.name}
                        className="w-6 h-6 object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling?.classList.remove('hidden');
                        }}
                      />
                      {/* Fallback emoji */}
                      <span className="text-xl hidden">⚽</span>
                    </>
                  )}
                </div>

                <span className="text-[10px] text-white font-condensed whitespace-nowrap">
                  {sport.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: Date Picker (NO Peluang Toggle) */}
        <div className="bg-white flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
          {/* Date Picker */}
          <div className="flex items-center gap-1">
            <button className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-500" />
            </button>
            <span className="text-sm font-semibold text-gray-800 font-condensed px-2">
              {selectedDate}
            </span>
            <button className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Row 4: Filter Tabs */}
        <div className="bg-white px-3 py-2 border-b border-gray-200">
          <div className="flex items-center gap-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => handleFilterClick(filter.name)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium font-condensed transition-colors ${activeFilter === filter.name
                  ? filter.isLive
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {filter.name}
                {filter.count && (
                  <span className={`ml-1 text-xs ${activeFilter === filter.name ? 'text-white/80' : 'text-gray-400'}`}>
                    ({filter.count})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Row 5: Description - Dynamic based on active sport */}
        <div className="bg-white px-3 py-2 border-b border-gray-200">
          <p className="text-xs text-gray-500 font-condensed">
            {(() => {
              const sportDescriptions = {
                'football': 'Skor langsung dan jadwal sepak bola hari ini',
                'tennis': 'Skor langsung dan jadwal tennis hari ini',
                'basketball': 'Skor langsung dan jadwal bola basket hari ini',
                'volleyball': 'Skor langsung dan jadwal bola voli hari ini',
                'badminton': 'Skor langsung dan jadwal bulutangkis hari ini',
                'motorsport': 'Jadwal dan hasil motorsport hari ini',
                'mma': 'Jadwal dan hasil MMA hari ini',
                'hockey': 'Skor langsung dan jadwal hoki hari ini',
                'handball': 'Skor langsung dan jadwal bola tangan hari ini',
                'rugby': 'Skor langsung dan jadwal rugby hari ini',
                'cricket': 'Skor langsung dan jadwal kriket hari ini',
                'trending': 'Pertandingan trending hari ini',
              };
              return sportDescriptions[activeSport] || 'Skor langsung dan jadwal hari ini';
            })()}
          </p>
        </div>
      </div>

      {/* Scrollbar Hide Style + Animation */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.15s ease-out;
        }
      `}</style>
    </div>
  );
}
