'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Search, Star, User } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [showWcLoading, setShowWcLoading] = useState(false);

  // Check auth status
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // World Cup loading → redirect
  useEffect(() => {
    if (!showWcLoading) return;
    const t = setTimeout(() => {
      window.location.href = '/world-cup-simulator';
    }, 2500);
    return () => clearTimeout(t);
  }, [showWcLoading]);

  const navItems = [
    {
      id: 'home',
      name: 'Home',
      icon: Home,
      path: '/',
      action: () => router.push('/')
    },
    {
      id: 'search',
      name: 'Cari',
      icon: Search,
      path: '/search',
      action: () => router.push('/search')  // ✅ Fixed: go to search page
    },
    {
      id: 'favorite',
      name: 'Favorit',
      icon: Star,
      path: '/favorites',
      action: () => router.push('/favorites')  // ✅ Fixed: go to favorites page
    },
    {
      id: 'profile',
      name: 'Profil',
      icon: User,
      path: '/profile',
      action: () => user ? router.push('/profile') : router.push('/auth')
    },
  ];

  const isActive = (item) => {
    if (item.id === 'home') {
      return pathname === '/' || pathname.startsWith('/match');
    }
    if (item.id === 'search') {
      return pathname === '/search';
    }
    if (item.id === 'favorite') {
      return pathname === '/favorites';
    }
    if (item.id === 'profile') {
      return pathname === '/profile' || pathname.startsWith('/auth');
    }
    return pathname === item.path;
  };

  return (
    <>
      {/* Spacer to prevent content from being hidden behind fixed nav */}
      <div className="h-16 lg:hidden"></div>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 lg:hidden safe-area-bottom">
        <div className="flex items-center justify-around py-2 px-2">
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <button
                key={item.id}
                onClick={item.action}
                className={`relative flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl transition-all flex-1 max-w-[80px] ${active
                  ? 'text-green-600 bg-green-50'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                  }`}
              >
                {/* World Cup floating icon above Profil */}
                {item.id === 'profile' && pathname !== '/world-cup-simulator' && (
                  <div
                    onClick={(e) => { e.stopPropagation(); setShowWcLoading(true); }}
                    className="absolute -top-16 -right-2 flex items-center gap-1.5 bg-gradient-to-r from-green-600 to-emerald-700 pl-1.5 pr-3 py-1.5 rounded-full shadow-lg border-2 border-white cursor-pointer active:scale-95 transition-transform"
                    style={{ animation: 'wcIconPulse 3s ease-in-out infinite' }}
                  >
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                      <img
                        src="/images/fifa-world-cup-2026.png"
                        alt="World Cup"
                        className="w-5 h-5 object-contain"
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                      />
                      <span className="text-sm leading-none" style={{ display: 'none' }}>🏆</span>
                    </div>
                    <span className="text-[10px] font-bold font-condensed text-white leading-tight whitespace-nowrap">World<br />Cup</span>
                  </div>
                )}
                <item.icon className={`w-5 h-5 ${active ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
                <span className={`text-[11px] font-condensed leading-none ${active ? 'font-semibold' : 'font-medium'}`}>
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <style jsx>{`
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom, 0);
        }
        @keyframes wcIconPulse {
          0%, 100% { box-shadow: 0 2px 8px rgba(22,101,52,0.3); }
          50% { box-shadow: 0 2px 16px rgba(22,101,52,0.6), 0 0 0 4px rgba(34,197,94,0.15); }
        }
        @keyframes wcFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes wcSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes wcTextFade { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
        .wc-loader {
          transform: rotateZ(45deg);
          perspective: 1000px;
          border-radius: 50%;
          width: 48px;
          height: 48px;
          color: #fff;
          position: relative;
          display: inline-block;
        }
        .wc-loader:before,
        .wc-loader:after {
          content: '';
          display: block;
          position: absolute;
          top: 0; left: 0;
          width: inherit; height: inherit;
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
      `}</style>

      {/* World Cup Loading Screen */}
      {showWcLoading && (
        <div className="fixed inset-0 z-[100] bg-gradient-to-b from-[#1a472a] via-[#0d2818] to-[#0a1f14] flex flex-col items-center justify-center"
          style={{ animation: 'wcFadeIn 0.4s ease-out' }}>
          <div style={{ animation: 'wcSlideUp 0.5s ease-out' }} className="text-center">
            <p className="text-5xl mb-4">🏆</p>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Oswald', sans-serif" }}>
              FIFA WORLD CUP
            </h1>
            <p className="text-yellow-400 text-lg font-bold tracking-[0.3em]" style={{ fontFamily: "'Oswald', sans-serif" }}>
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
    </>
  );
}
