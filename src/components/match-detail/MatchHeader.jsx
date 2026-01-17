'use client';

import { useState } from 'react';
import { Star, Share2, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MatchHeader({ match, isLive, isFinished }) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);

  const formatMatchDate = () => {
    const kickoff = match?.date || match?.kickoff || match?.timestamp;
    if (!kickoff) return { date: '-', time: '-' };

    const date = new Date(kickoff);
    return {
      date: date.toLocaleDateString('id-ID', { day: 'numeric', month: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })
    };
  };

  const matchDateTime = formatMatchDate();

  const getStatusText = () => {
    if (isLive) {
      const minute = match?.minute || match?.elapsed;
      if (match?.status_short === 'HT') return 'HT';
      return minute ? `${minute}'` : 'LIVE';
    }
    if (isFinished) return 'Selesai';
    return matchDateTime.time;
  };

  return (
    <div className="match-header bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Main Header - Desktop */}
      <div className="hidden md:block p-6 relative">
        {/* LIVE Badge - Top Left */}
        {isLive && (
          <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            LIVE
          </div>
        )}

        <div className="flex items-center justify-between">
          {/* Home Team */}
          <div className="flex-1 flex flex-col items-center text-center">
            <div className="w-20 h-20 mb-3 flex items-center justify-center">
              {match?.home_team_logo ? (
                <img
                  src={match.home_team_logo}
                  alt={match.home_team_name}
                  className="w-full h-full object-contain"
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
              ) : null}
              <div className="w-20 h-20 bg-gray-100 rounded-full hidden items-center justify-center">
                <span className="text-3xl">⚽</span>
              </div>
            </div>
            <h2 className="text-lg font-bold text-gray-800 font-condensed">
              {match?.home_team_name || match?.home_team || 'Home Team'}
            </h2>
          </div>

          {/* Score / Time */}
          <div className="flex-1 flex flex-col items-center">
            {isLive || isFinished ? (
              <>
                <div className="text-5xl font-bold text-gray-900 font-condensed mb-2">
                  {match?.home_score ?? 0} - {match?.away_score ?? 0}
                </div>
                <div className={`flex items-center gap-2 ${isLive ? 'text-green-600' : 'text-gray-500'}`}>
                  {isLive && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>}
                  <span className="text-sm font-medium font-condensed">{getStatusText()}</span>
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-900 font-condensed mb-1">
                  {matchDateTime.date}
                </div>
                <div className="text-lg text-gray-600 font-condensed">
                  {matchDateTime.time}
                </div>
              </>
            )}
          </div>

          {/* Away Team */}
          <div className="flex-1 flex flex-col items-center text-center">
            <div className="w-20 h-20 mb-3 flex items-center justify-center">
              {match?.away_team_logo ? (
                <img
                  src={match.away_team_logo}
                  alt={match.away_team_name}
                  className="w-full h-full object-contain"
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
              ) : null}
              <div className="w-20 h-20 bg-gray-100 rounded-full hidden items-center justify-center">
                <span className="text-3xl">⚽</span>
              </div>
            </div>
            <h2 className="text-lg font-bold text-gray-800 font-condensed">
              {match?.away_team_name || match?.away_team || 'Away Team'}
            </h2>
          </div>

          {/* Action Buttons - Desktop */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all font-condensed text-sm ${isFavorite
                ? 'bg-yellow-50 border-yellow-400 text-yellow-600'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'fill-yellow-400' : ''}`} />
              FAVORIT
            </button>
            <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
              <Share2 className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Match Info - Desktop */}
        <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-500">
          <span className="flex items-center gap-1.5 font-condensed">
            🗓️ {matchDateTime.date} • {matchDateTime.time}
          </span>
          <span className="flex items-center gap-2 font-condensed">
            <img
              src={match?.league_logo || `https://media.api-sports.io/football/leagues/${match?.league_id}.png`}
              alt=""
              className="w-5 h-5 object-contain"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            {match?.league_name || match?.league || 'Football'}
          </span>
          {match?.venue && (
            <span className="flex items-center gap-1.5 font-condensed">
              🏟️ {match.venue}
            </span>
          )}
        </div>
      </div>

      {/* Main Header - Mobile */}
      <div className="md:hidden p-4 relative">
        {/* LIVE Badge - Top Left Mobile */}
        {isLive && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded-md text-[10px] font-bold">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
            LIVE
          </div>
        )}

        {/* Favorite & Share - Top Right Mobile */}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className={`p-1.5 rounded-full transition-all ${isFavorite ? 'text-yellow-500' : 'text-gray-400'}`}
          >
            <Star className={`w-5 h-5 ${isFavorite ? 'fill-yellow-400' : ''}`} />
          </button>
          <button className="p-1.5 text-gray-400">
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 pt-6">
          {/* Home Team */}
          <div className="flex-1 flex flex-col items-center text-center min-w-0">
            <div className="w-14 h-14 mb-2 flex items-center justify-center">
              {match?.home_team_logo ? (
                <img
                  src={match.home_team_logo}
                  alt={match.home_team_name}
                  className="w-full h-full object-contain"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">⚽</span>
                </div>
              )}
            </div>
            <h2 className="text-sm font-bold text-gray-800 font-condensed line-clamp-2 leading-tight">
              {match?.home_team_name || match?.home_team || 'Home'}
            </h2>
          </div>

          {/* Score / Time - Mobile */}
          <div className="flex-shrink-0 flex flex-col items-center px-3">
            {isLive || isFinished ? (
              <>
                <div className="text-3xl font-bold text-gray-900 font-condensed">
                  {match?.home_score ?? 0} - {match?.away_score ?? 0}
                </div>
                <div className={`flex items-center gap-1.5 mt-1 ${isLive ? 'text-green-600' : 'text-gray-500'}`}>
                  {isLive && <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>}
                  <span className="text-xs font-medium font-condensed">{getStatusText()}</span>
                </div>
              </>
            ) : (
              <>
                <div className="text-xl font-bold text-gray-900 font-condensed">
                  {matchDateTime.date}
                </div>
                <div className="text-base text-gray-600 font-condensed">
                  {matchDateTime.time}
                </div>
              </>
            )}
          </div>

          {/* Away Team */}
          <div className="flex-1 flex flex-col items-center text-center min-w-0">
            <div className="w-14 h-14 mb-2 flex items-center justify-center">
              {match?.away_team_logo ? (
                <img
                  src={match.away_team_logo}
                  alt={match.away_team_name}
                  className="w-full h-full object-contain"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">⚽</span>
                </div>
              )}
            </div>
            <h2 className="text-sm font-bold text-gray-800 font-condensed line-clamp-2 leading-tight">
              {match?.away_team_name || match?.away_team || 'Away'}
            </h2>
          </div>
        </div>

        {/* Match Info - Mobile (Simplified) */}
        <div className="flex items-center justify-center gap-3 mt-3 text-xs text-gray-500">
          <div className="flex items-center gap-1.5 font-condensed">
            {match?.league_logo ? (
              <img
                src={match.league_logo}
                alt={match?.league_name}
                className="w-5 h-5 object-contain"
              />
            ) : (
              <span>🏆</span>
            )}
            <span>{match?.league_name || match?.league || 'Football'}</span>
          </div>
          {match?.venue && (
            <>
              <span className="text-gray-300">•</span>
              <span className="font-condensed truncate max-w-[120px]">
                🏟️ {match.venue}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
