'use client';

import { Users, BarChart3, Swords, Trophy, Tv, Info } from 'lucide-react';

export default function MatchTabs({ activeTab, onTabChange, isLive }) {
  // Tabs untuk Desktop (tanpa Rincian)
  const desktopTabs = [
    { id: 'lineup', name: 'Lineup', icon: Users },
    { id: 'statistik', name: 'Statistik', icon: BarChart3 },
    { id: 'h2h', name: 'H2H', icon: Swords },
    { id: 'klasemen', name: 'Klasemen', icon: Trophy },
    { id: 'media', name: 'Media', icon: Tv },
  ];

  // Tabs untuk Mobile (dengan Rincian di depan)
  const mobileTabs = [
    { id: 'rincian', name: 'Rincian', icon: Info },
    { id: 'lineup', name: 'Lineup', icon: Users },
    { id: 'statistik', name: 'Statistik', icon: BarChart3 },
    { id: 'h2h', name: 'H2H', icon: Swords },
    { id: 'klasemen', name: 'Klasemen', icon: Trophy },
    { id: 'media', name: 'Media', icon: Tv },
  ];

  return (
    <div className="match-tabs bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Desktop Tabs - Tanpa Rincian */}
      <div className="hidden sm:flex items-center border-b border-gray-100">
        {desktopTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-all font-condensed ${activeTab === tab.id
                  ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile Tabs - Dengan Rincian di depan */}
      <div className="sm:hidden overflow-x-auto scrollbar-hide">
        <div className="flex items-center min-w-max">
          {mobileTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center justify-center gap-1.5 py-3 px-4 text-xs font-medium transition-all font-condensed whitespace-nowrap ${activeTab === tab.id
                    ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-b-2 border-transparent'
                  }`}
              >
                <Icon className={`w-4 h-4 ${activeTab === tab.id ? 'stroke-[2.5px]' : ''}`} />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
