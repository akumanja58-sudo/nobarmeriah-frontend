'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Star, Trophy, Award, Circle } from 'lucide-react';

// ============================================================
// VOLLEYBALL MATCH LIST COMPONENT
// ============================================================

export default function VolleyballMatchList({ 
    games = [], 
    grouped = [], 
    onGameClick,
    favorites = [],
    onToggleFavorite 
}) {
    const router = useRouter();
    const [collapsedLeagues, setCollapsedLeagues] = useState({});

    // Toggle league collapse
    const toggleLeague = (leagueId) => {
        setCollapsedLeagues(prev => ({
            ...prev,
            [leagueId]: !prev[leagueId]
        }));
    };

    // Check if game is favorite
    const isFavorite = (gameId) => favorites.includes(gameId);

    // Handle game click
    const handleGameClick = (game) => {
        if (onGameClick) {
            onGameClick(game);
        } else {
            router.push(`/volleyball/game/${game.id}`);
        }
    };

    // Get league icon based on tier
    const getLeagueIcon = (tier, leagueName) => {
        const name = leagueName?.toLowerCase() || '';
        
        if (name.includes('champions') || name.includes('cev')) {
            return <Trophy className="w-5 h-5 text-cyan-500" />;
        }
        if (tier === 1) {
            return <Trophy className="w-5 h-5 text-cyan-500" />;
        }
        if (tier === 2) {
            return <Award className="w-5 h-5 text-cyan-400" />;
        }
        return <Circle className="w-5 h-5 text-gray-400" />;
    };

    // Format set scores display
    const formatSetScores = (sets) => {
        if (!sets) return null;
        
        const setScores = [];
        for (let i = 1; i <= 5; i++) {
            const homeSet = sets.home?.[`set${i}`];
            const awaySet = sets.away?.[`set${i}`];
            if (homeSet !== null && homeSet !== undefined) {
                setScores.push({ home: homeSet, away: awaySet });
            }
        }
        return setScores;
    };

    // ============================================================
    // RENDER
    // ============================================================

    if (grouped.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Circle className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-condensed">Tidak ada pertandingan</p>
                <p className="text-sm text-gray-400 font-condensed mt-1">Coba pilih tanggal lain</p>
            </div>
        );
    }

    return (
        <div className="volleyball-match-list space-y-3">
            {grouped.map((league) => (
                <div key={league.league_id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {/* League Header */}
                    <button
                        onClick={() => toggleLeague(league.league_id)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 text-white hover:from-cyan-700 hover:to-cyan-600 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            {league.league_logo ? (
                                <img 
                                    src={league.league_logo} 
                                    alt="" 
                                    className="w-6 h-6 object-contain"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            ) : (
                                getLeagueIcon(league.tier, league.league_name)
                            )}
                            <div className="text-left">
                                <p className="font-semibold text-sm font-condensed">{league.league_name}</p>
                                <p className="text-xs text-cyan-100 font-condensed">
                                    {league.country} • {league.games.length} pertandingan
                                </p>
                            </div>
                        </div>
                        {collapsedLeagues[league.league_id] ? (
                            <ChevronDown className="w-5 h-5" />
                        ) : (
                            <ChevronUp className="w-5 h-5" />
                        )}
                    </button>

                    {/* Games List */}
                    {!collapsedLeagues[league.league_id] && (
                        <div className="divide-y divide-gray-100">
                            {league.games.map((game) => {
                                const setScores = formatSetScores(game.sets);
                                
                                return (
                                    <div 
                                        key={game.id}
                                        className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => handleGameClick(game)}
                                    >
                                        {/* Status / Time */}
                                        <div className="w-16 flex-shrink-0 text-center">
                                            {game.isLive ? (
                                                <div>
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">
                                                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                                                        LIVE
                                                    </span>
                                                    <p className="text-[10px] text-red-500 mt-0.5 font-condensed">
                                                        {game.status}
                                                    </p>
                                                </div>
                                            ) : game.isFinished ? (
                                                <span className="text-xs font-medium text-gray-500 font-condensed">FT</span>
                                            ) : (
                                                <span className="text-xs font-medium text-gray-600 font-condensed">
                                                    {game.time?.substring(0, 5) || '-'}
                                                </span>
                                            )}
                                        </div>

                                        {/* Teams & Scores */}
                                        <div className="flex-1 min-w-0">
                                            {/* Home Team */}
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    {game.homeTeam?.logo ? (
                                                        <img 
                                                            src={game.homeTeam.logo} 
                                                            alt="" 
                                                            className="w-5 h-5 object-contain flex-shrink-0"
                                                            onError={(e) => { e.target.style.display = 'none'; }}
                                                        />
                                                    ) : (
                                                        <div className="w-5 h-5 bg-cyan-100 rounded-full flex items-center justify-center text-[10px] font-bold text-cyan-600 flex-shrink-0">
                                                            {game.homeTeam?.name?.[0] || 'H'}
                                                        </div>
                                                    )}
                                                    <span className={`text-sm font-condensed truncate ${
                                                        game.isFinished && game.homeScore > game.awayScore
                                                            ? 'font-semibold text-gray-900'
                                                            : 'text-gray-700'
                                                    }`}>
                                                        {game.homeTeam?.name || 'Home'}
                                                    </span>
                                                </div>
                                                <span className={`text-sm font-bold font-condensed ml-2 ${
                                                    game.isFinished && game.homeScore > game.awayScore
                                                        ? 'text-cyan-600'
                                                        : 'text-gray-900'
                                                }`}>
                                                    {game.isLive || game.isFinished ? game.homeScore : '-'}
                                                </span>
                                            </div>

                                            {/* Away Team */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    {game.awayTeam?.logo ? (
                                                        <img 
                                                            src={game.awayTeam.logo} 
                                                            alt="" 
                                                            className="w-5 h-5 object-contain flex-shrink-0"
                                                            onError={(e) => { e.target.style.display = 'none'; }}
                                                        />
                                                    ) : (
                                                        <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-[10px] font-bold text-blue-600 flex-shrink-0">
                                                            {game.awayTeam?.name?.[0] || 'A'}
                                                        </div>
                                                    )}
                                                    <span className={`text-sm font-condensed truncate ${
                                                        game.isFinished && game.awayScore > game.homeScore
                                                            ? 'font-semibold text-gray-900'
                                                            : 'text-gray-700'
                                                    }`}>
                                                        {game.awayTeam?.name || 'Away'}
                                                    </span>
                                                </div>
                                                <span className={`text-sm font-bold font-condensed ml-2 ${
                                                    game.isFinished && game.awayScore > game.homeScore
                                                        ? 'text-cyan-600'
                                                        : 'text-gray-900'
                                                }`}>
                                                    {game.isLive || game.isFinished ? game.awayScore : '-'}
                                                </span>
                                            </div>

                                            {/* Set Scores */}
                                            {(game.isLive || game.isFinished) && setScores && setScores.length > 0 && (
                                                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                                                    <span className="text-[10px] text-gray-400 font-condensed">SET:</span>
                                                    <div className="flex gap-1">
                                                        {setScores.map((set, idx) => (
                                                            <div 
                                                                key={idx} 
                                                                className="text-center bg-gray-50 rounded px-1.5 py-0.5"
                                                            >
                                                                <span className={`text-[10px] font-bold ${
                                                                    set.home > set.away ? 'text-cyan-600' : 'text-gray-500'
                                                                }`}>
                                                                    {set.home}
                                                                </span>
                                                                <span className="text-[10px] text-gray-300 mx-0.5">-</span>
                                                                <span className={`text-[10px] font-bold ${
                                                                    set.away > set.home ? 'text-cyan-600' : 'text-gray-500'
                                                                }`}>
                                                                    {set.away}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Favorite Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onToggleFavorite?.(game.id);
                                            }}
                                            className="ml-3 p-1.5 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                                        >
                                            <Star 
                                                className={`w-4 h-4 ${
                                                    isFavorite(game.id) 
                                                        ? 'fill-yellow-400 text-yellow-400' 
                                                        : 'text-gray-300'
                                                }`} 
                                            />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
