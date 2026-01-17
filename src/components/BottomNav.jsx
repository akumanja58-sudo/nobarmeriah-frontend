'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Search, Star, User } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);

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
      action: () => router.push('/trending')
    },
    {
      id: 'favorite',
      name: 'Favorit',
      icon: Star,
      path: '/favorites',
      action: () => router.push('/trending')
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
    if (item.id === 'profile') {
      return pathname === '/profile';
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
      `}</style>
    </>
  );
}