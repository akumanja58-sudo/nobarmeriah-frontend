'use client';

import { useState } from 'react';

export default function MatchOdds({ match }) {
  const [showMoreOdds, setShowMoreOdds] = useState(false);

  return (
    <div className="match-odds bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 font-condensed">Asian handicap</h3>
        <span className="bg-green-600 text-white text-xs px-2 py-1 rounded font-bold">1XBET</span>
      </div>

      {/* Main Odds */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 mb-1 font-condensed">
            (-0.5) {match?.home_team_name?.split(' ')[0] || 'Home'}
          </p>
          <p className="text-lg font-bold text-green-600 font-condensed">▲ 1.93</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 mb-1 font-condensed">
            (0.5) {match?.away_team_name?.split(' ')[0] || 'Away'}
          </p>
          <p className="text-lg font-bold text-red-500 font-condensed">▼ 1.88</p>
        </div>
      </div>

      {/* More Odds Toggle */}
      <button 
        onClick={() => setShowMoreOdds(!showMoreOdds)}
        className="w-full text-center text-sm text-green-600 hover:text-green-700 font-medium py-2 font-condensed"
      >
        Peluang tambahan {showMoreOdds ? '▲' : '▼'}
      </button>

      {/* Extended Odds */}
      {showMoreOdds && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
          {/* 1X2 */}
          <div>
            <p className="text-xs text-gray-500 mb-2 font-condensed">1X2</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-50 rounded p-2 text-center">
                <p className="text-xs text-gray-500 font-condensed">1</p>
                <p className="font-bold text-gray-800 font-condensed">1.85</p>
              </div>
              <div className="bg-gray-50 rounded p-2 text-center">
                <p className="text-xs text-gray-500 font-condensed">X</p>
                <p className="font-bold text-gray-800 font-condensed">3.40</p>
              </div>
              <div className="bg-gray-50 rounded p-2 text-center">
                <p className="text-xs text-gray-500 font-condensed">2</p>
                <p className="font-bold text-gray-800 font-condensed">4.50</p>
              </div>
            </div>
          </div>

          {/* Over/Under */}
          <div>
            <p className="text-xs text-gray-500 mb-2 font-condensed">Over/Under 2.5</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded p-2 text-center">
                <p className="text-xs text-gray-500 font-condensed">Over</p>
                <p className="font-bold text-gray-800 font-condensed">2.10</p>
              </div>
              <div className="bg-gray-50 rounded p-2 text-center">
                <p className="text-xs text-gray-500 font-condensed">Under</p>
                <p className="font-bold text-gray-800 font-condensed">1.72</p>
              </div>
            </div>
          </div>

          {/* Both Teams to Score */}
          <div>
            <p className="text-xs text-gray-500 mb-2 font-condensed">Kedua Tim Mencetak Gol</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded p-2 text-center">
                <p className="text-xs text-gray-500 font-condensed">Ya</p>
                <p className="font-bold text-gray-800 font-condensed">1.95</p>
              </div>
              <div className="bg-gray-50 rounded p-2 text-center">
                <p className="text-xs text-gray-500 font-condensed">Tidak</p>
                <p className="font-bold text-gray-800 font-condensed">1.85</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
