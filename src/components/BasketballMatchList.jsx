'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, ChevronDown, ChevronUp, Trophy, Circle, Award } from 'lucide-react';

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function getLeagueIcon(leagueName, leagueId) {
    const name = (leagueName || '').toLowerCase();
    
    // NBA
    if (name.includes('nba') || leagueId === 12) {
        return <Trophy className="w-5 h-5 text-orange-500" />;
    }
    
    // Euroleague / Eurocup
    if (name.includes('euroleague') || name.includes('eurocup')) {
        return <Trophy className="w-5 h-5 text-blue-500" />;
    }
    
    // Major leagues
    if (name.includes('acb') || name.includes('lega') || name.includes('bbl')) {
        return <Award className="w-5 h-5 text-purple-500" />;
    }
    
    // Default
    return <Circle className="w-5 h-5 text-orange-500" />;
}

function formatGameStatus(game) {
    if (game.isFinished) return 'Selesai';
    if (game.isLive) {
        return game.status || 'Live';
    }
    // Format time from timestamp or time field
    if (game.time) {
        return game.time.substring(0, 5); // HH:MM
    }
    return '-';
}

function getQuarterLabel(status) {
    const labels = {
        'Q1': 'Q1',
        'Q2': 'Q2',
        'Q3': 'Q3',
        'Q4': 'Q4',
        'OT': 'OT',
        'HT': 'HT',
        'BT': 'Break'
    };
    return labels[status] || status;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function BasketballMatchList({ 
    games = [], 
    grouped = [],
    onGameClick, 
    selectedGame 
}) {
    const router = useRouter();
    const [expandedLeagues, setExpandedLeagues] = useState({});
    const [favoriteGames, setFavoriteGames] = useState([]);

    const toggleLeague = (key) => {
        setExpandedLeagues(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const toggleFavorite = (e, gameId) => {
        e.stopPropagation();
        setFavoriteGames(prev => 
            prev.includes(gameId) 
                ? prev.filter(id => id !== gameId)
                : [...prev, gameId]
        );
    };

    const leagueGroups = grouped.length > 0 ? grouped : [];

    if (leagueGroups.length === 0 && games.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Circle className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-condensed">Tidak ada pertandingan basketball</p>
                <p className="text-sm text-gray-400 font-condensed mt-1">Coba cek lagi nanti</p>
            </div>
        );
    }

    return (
        <div className="basketball-match-list">
            {leagueGroups.map((group) => {
                const key = group.league_id || group.league_name;
                const isCollapsed = expandedLeagues[key];
                
                return (
                    <div key={key} className="league-group bg-white rounded-xl shadow-sm mb-3 overflow-hidden">
                        {/* League Header */}
                        <div 
                            className="league-header flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => toggleLeague(key)}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg">
                                    {group.league_logo ? (
                                        <img 
                                            src={group.league_logo} 
                                            alt={group.league_name}
                                            className="w-6 h-6 object-contain"
                                            onError={(e) => { 
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                    ) : null}
                                    <div className={`${group.league_logo ? 'hidden' : 'flex'} items-center justify-center`}>
                                        {getLeagueIcon(group.league_name, group.league_id)}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800 font-condensed">
                                        {group.league_name}
                                    </p>
                                    <p className="text-xs text-gray-500 font-condensed">
                                        {group.country}
                                        {group.league_type && ` • ${group.league_type}`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 font-condensed">
                                    {group.games?.length || 0} game
                                </span>
                                {isCollapsed ? (
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                ) : (
                                    <ChevronUp className="w-4 h-4 text-gray-400" />
                                )}
                            </div>
                        </div>

                        {/* Games */}
                        {!isCollapsed && (
                            <div className="games">
                                {group.games?.map((game) => {
                                    const gameId = game.id;
                                    const isLive = game.isLive;
                                    const isFinished = game.isFinished;
                                    const isSelected = selectedGame?.id === gameId;
                                    const isFavorite = favoriteGames.includes(gameId);

                                    return (
                                        <div
                                            key={gameId}
                                            className={`game-row px-4 py-3 border-b border-gray-50 cursor-pointer transition-all ${
                                                isSelected
                                                    ? 'bg-orange-50 border-l-4 border-l-orange-500'
                                                    : 'hover:bg-gray-50'
                                            }`}
                                            onClick={() => {
                                                onGameClick?.(game);
                                                router.push(`/basketball/game/${gameId}`);
                                            }}
                                        >
                                            {/* Status / Time */}
                                            <div className="flex items-center gap-3">
                                                <div className="w-14 flex-shrink-0 text-center">
                                                    {isLive ? (
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded font-condensed animate-pulse">
                                                                LIVE
                                                            </span>
                                                            <span className="text-[10px] text-gray-500 font-condensed mt-0.5">
                                                                {getQuarterLabel(game.status)}
                                                            </span>
                                                        </div>
                                                    ) : isFinished ? (
                                                        <span className="text-xs font-medium text-gray-500 font-condensed">
                                                            Selesai
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs font-medium text-gray-600 font-condensed">
                                                            {formatGameStatus(game)}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Teams & Scores */}
                                                <div className="flex-1 min-w-0">
                                                    {/* Home Team */}
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            {game.homeTeam?.logo ? (
                                                                <img 
                                                                    src={game.homeTeam.logo} 
                                                                    alt="" 
                                                                    className="w-5 h-5 object-contain"
                                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                                />
                                                            ) : (
                                                                <div className="w-5 h-5 bg-gray-200 rounded-full flex-shrink-0"></div>
                                                            )}
                                                            <span className={`text-sm truncate font-condensed ${
                                                                isFinished && game.homeScore > game.awayScore
                                                                    ? 'font-bold text-gray-900'
                                                                    : 'text-gray-700'
                                                            }`}>
                                                                {game.homeTeam?.name}
                                                            </span>
                                                        </div>
                                                        
                                                        {/* Home Score */}
                                                        {(isLive || isFinished) && (
                                                            <span className={`text-lg font-bold font-condensed min-w-[32px] text-right ${
                                                                game.homeScore > game.awayScore
                                                                    ? 'text-gray-900'
                                                                    : 'text-gray-500'
                                                            }`}>
                                                                {game.homeScore}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Away Team */}
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            {game.awayTeam?.logo ? (
                                                                <img 
                                                                    src={game.awayTeam.logo} 
                                                                    alt="" 
                                                                    className="w-5 h-5 object-contain"
                                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                                />
                                                            ) : (
                                                                <div className="w-5 h-5 bg-gray-200 rounded-full flex-shrink-0"></div>
                                                            )}
                                                            <span className={`text-sm truncate font-condensed ${
                                                                isFinished && game.awayScore > game.homeScore
                                                                    ? 'font-bold text-gray-900'
                                                                    : 'text-gray-700'
                                                            }`}>
                                                                {game.awayTeam?.name}
                                                            </span>
                                                        </div>
                                                        
                                                        {/* Away Score */}
                                                        {(isLive || isFinished) && (
                                                            <span className={`text-lg font-bold font-condensed min-w-[32px] text-right ${
                                                                game.awayScore > game.homeScore
                                                                    ? 'text-gray-900'
                                                                    : 'text-gray-500'
                                                            }`}>
                                                                {game.awayScore}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Favorite */}
                                                <div className="w-8 flex-shrink-0 flex justify-end">
                                                    <button
                                                        onClick={(e) => toggleFavorite(e, gameId)}
                                                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                    >
                                                        <Star className={`w-4 h-4 ${
                                                            isFavorite 
                                                                ? 'text-yellow-500 fill-yellow-500' 
                                                                : 'text-gray-300 hover:text-gray-400'
                                                        }`} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Quarter Scores - Show for live/finished */}
                                            {(isLive || isFinished) && game.quarters && (
                                                <div className="flex justify-center gap-2 mt-2 pt-2 border-t border-gray-100">
                                                    {['q1', 'q2', 'q3', 'q4'].map((q, idx) => {
                                                        const homeQ = game.quarters?.home?.[q];
                                                        const awayQ = game.quarters?.away?.[q];
                                                        if (homeQ === undefined && awayQ === undefined) return null;
                                                        
                                                        return (
                                                            <div key={q} className="text-center">
                                                                <div className="text-[10px] text-gray-400 font-condensed">Q{idx + 1}</div>
                                                                <div className="text-xs font-condensed">
                                                                    <span className={homeQ > awayQ ? 'font-bold text-gray-800' : 'text-gray-500'}>{homeQ || 0}</span>
                                                                    <span className="text-gray-300 mx-0.5">-</span>
                                                                    <span className={awayQ > homeQ ? 'font-bold text-gray-800' : 'text-gray-500'}>{awayQ || 0}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {game.quarters?.home?.ot !== null && (
                                                        <div className="text-center">
                                                            <div className="text-[10px] text-gray-400 font-condensed">OT</div>
                                                            <div className="text-xs font-condensed">
                                                                <span className="text-gray-600">{game.quarters?.home?.ot || 0}</span>
                                                                <span className="text-gray-300 mx-0.5">-</span>
                                                                <span className="text-gray-600">{game.quarters?.away?.ot || 0}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
