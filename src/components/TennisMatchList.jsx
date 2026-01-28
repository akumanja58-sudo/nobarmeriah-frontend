'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, ChevronDown, ChevronUp, Trophy, Target, Award, Leaf, Circle } from 'lucide-react';

// ============================================================
// COUNTRY FLAGS MAPPING
// ============================================================
const COUNTRY_FLAGS = {
    'serbia': '🇷🇸',
    'spain': '🇪🇸',
    'italy': '🇮🇹',
    'germany': '🇩🇪',
    'russia': '🇷🇺',
    'greece': '🇬🇷',
    'norway': '🇳🇴',
    'usa': '🇺🇸',
    'united states': '🇺🇸',
    'canada': '🇨🇦',
    'australia': '🇦🇺',
    'france': '🇫🇷',
    'uk': '🇬🇧',
    'great britain': '🇬🇧',
    'poland': '🇵🇱',
    'czech republic': '🇨🇿',
    'czechia': '🇨🇿',
    'switzerland': '🇨🇭',
    'argentina': '🇦🇷',
    'brazil': '🇧🇷',
    'japan': '🇯🇵',
    'china': '🇨🇳',
    'kazakhstan': '🇰🇿',
    'belarus': '🇧🇾',
    'ukraine': '🇺🇦',
    'croatia': '🇭🇷',
    'denmark': '🇩🇰',
    'netherlands': '🇳🇱',
    'belgium': '🇧🇪',
    'tunisia': '🇹🇳',
    'estonia': '🇪🇪',
    'latvia': '🇱🇻',
    'romania': '🇷🇴',
    'bulgaria': '🇧🇬',
    'indonesia': '🇮🇩',
};

// ============================================================
// TOURNAMENT LOGOS
// ============================================================
const TOURNAMENT_LOGOS = {
    'australian open': '🎾',
    'roland garros': '🎾',
    'french open': '🎾',
    'wimbledon': '🎾',
    'us open': '🎾',
    'atp finals': '🏆',
    'wta finals': '🏆',
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function getCountryFlag(country) {
    if (!country) return '🌍';
    return COUNTRY_FLAGS[country.toLowerCase()] || '🌍';
}

function getTournamentIcon(tournamentName, eventType) {
    const name = (tournamentName || '').toLowerCase();
    const type = (eventType || '').toLowerCase();

    // Grand Slams - Trophy icon dengan warna gold
    if (name.includes('australian open') ||
        name.includes('roland garros') ||
        name.includes('french open') ||
        name.includes('wimbledon') ||
        name.includes('us open')) {
        return <Trophy className="w-5 h-5 text-yellow-500" />;
    }

    // ATP Finals / WTA Finals
    if (name.includes('finals')) {
        return <Trophy className="w-5 h-5 text-purple-500" />;
    }

    // ATP events
    if (type.includes('atp')) {
        return <Award className="w-5 h-5 text-blue-500" />;
    }

    // WTA events
    if (type.includes('wta')) {
        return <Award className="w-5 h-5 text-pink-500" />;
    }

    // Challenger
    if (type.includes('challenger')) {
        return <Target className="w-5 h-5 text-orange-500" />;
    }

    // ITF
    if (type.includes('itf')) {
        return <Leaf className="w-5 h-5 text-green-500" />;
    }

    // Default - Tennis ball style
    return <Circle className="w-5 h-5 text-green-500" />;
}

function formatMatchStatus(match) {
    if (match.isFinished) return 'Selesai';
    if (match.isLive) {
        return match.status || 'Live';
    }
    return match.time || '-';
}

function getEventTypeLabel(eventType) {
    if (!eventType) return '';

    const labels = {
        'Atp Singles': 'ATP',
        'Wta Singles': 'WTA',
        'Atp Doubles': 'ATP Ganda',
        'Wta Doubles': 'WTA Ganda',
        'Challenger Men Singles': 'Challenger',
        'Challenger Women Singles': 'Challenger W',
        'Itf Men Singles': 'ITF M',
        'Itf Women Singles': 'ITF W',
        'Itf Men Doubles': 'ITF M Ganda',
        'Itf Women Doubles': 'ITF W Ganda',
    };

    return labels[eventType] || eventType;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function TennisMatchList({
    matches = [],
    grouped = [],
    onMatchClick,
    selectedMatch
}) {
    const router = useRouter();
    const [expandedTournaments, setExpandedTournaments] = useState({});
    const [favoriteMatches, setFavoriteMatches] = useState([]);

    const toggleTournament = (key) => {
        setExpandedTournaments(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const toggleFavorite = (e, matchId) => {
        e.stopPropagation();
        setFavoriteMatches(prev =>
            prev.includes(matchId)
                ? prev.filter(id => id !== matchId)
                : [...prev, matchId]
        );
    };

    // Use grouped data if available, otherwise group by tournament
    const tournamentGroups = grouped.length > 0 ? grouped : [];

    if (tournamentGroups.length === 0 && matches.length === 0) {
        return (
            <div className="text-center py-12">
                <span className="text-4xl mb-4 block">🎾</span>
                <p className="text-gray-500 font-condensed">Tidak ada pertandingan tennis</p>
                <p className="text-sm text-gray-400 font-condensed mt-1">Coba cek lagi nanti</p>
            </div>
        );
    }

    return (
        <div className="tennis-match-list">
            {tournamentGroups.map((group) => {
                const key = group.tournament_key || group.tournament_name;
                const isCollapsed = expandedTournaments[key];

                return (
                    <div key={key} className="tournament-group bg-white rounded-xl shadow-sm mb-3 overflow-hidden">
                        {/* Tournament Header */}
                        <div
                            className="tournament-header flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => toggleTournament(key)}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg">
                                    {getTournamentIcon(group.tournament_name, group.event_type)}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800 font-condensed">
                                        {group.tournament_name}
                                    </p>
                                    <p className="text-xs text-gray-500 font-condensed">
                                        {getEventTypeLabel(group.event_type)}
                                        {group.tournament_round && ` • ${group.tournament_round}`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 font-condensed">
                                    {group.matches?.length || 0} match
                                </span>
                                {isCollapsed ? (
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                ) : (
                                    <ChevronUp className="w-4 h-4 text-gray-400" />
                                )}
                            </div>
                        </div>

                        {/* Matches */}
                        {!isCollapsed && (
                            <div className="matches">
                                {group.matches?.map((match) => {
                                    const matchId = match.id;
                                    const isLive = match.isLive;
                                    const isFinished = match.isFinished;
                                    const isSelected = selectedMatch?.id === matchId;
                                    const isFavorite = favoriteMatches.includes(matchId);

                                    return (
                                        <div
                                            key={matchId}
                                            className={`match-row px-4 py-3 border-b border-gray-50 cursor-pointer transition-all ${isSelected
                                                    ? 'bg-green-50 border-l-4 border-l-green-500'
                                                    : 'hover:bg-gray-50'
                                                }`}
                                            onClick={() => {
                                                onMatchClick?.(match);
                                                router.push(`/tennis/match/${matchId}`);
                                            }}
                                        >
                                            {/* Status / Time */}
                                            <div className="flex items-start gap-3">
                                                <div className="w-14 flex-shrink-0 text-center pt-1">
                                                    {isLive ? (
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded font-condensed animate-pulse">
                                                                LIVE
                                                            </span>
                                                            <span className="text-[10px] text-gray-500 font-condensed mt-0.5">
                                                                {match.status}
                                                            </span>
                                                        </div>
                                                    ) : isFinished ? (
                                                        <span className="text-xs font-medium text-gray-500 font-condensed">
                                                            Selesai
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs font-medium text-gray-600 font-condensed">
                                                            {match.time}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Players & Scores */}
                                                <div className="flex-1 min-w-0">
                                                    {/* Player 1 */}
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            {match.player1.isServing && isLive && (
                                                                <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" title="Serving"></span>
                                                            )}
                                                            {match.player1.logo ? (
                                                                <img
                                                                    src={match.player1.logo}
                                                                    alt=""
                                                                    className="w-5 h-5 rounded-full object-cover"
                                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                                />
                                                            ) : (
                                                                <div className="w-5 h-5 bg-gray-200 rounded-full flex-shrink-0"></div>
                                                            )}
                                                            <span className={`text-sm truncate font-condensed ${isFinished && match.winner === 'First Player'
                                                                    ? 'font-bold text-gray-900'
                                                                    : 'text-gray-700'
                                                                }`}>
                                                                {match.player1.name}
                                                            </span>
                                                        </div>

                                                        {/* Player 1 Sets */}
                                                        <div className="flex items-center gap-1">
                                                            {match.scores?.map((set, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className={`w-5 text-center text-xs font-condensed ${set.player1 > set.player2
                                                                            ? 'font-bold text-gray-900'
                                                                            : 'text-gray-500'
                                                                        }`}
                                                                >
                                                                    {set.player1}
                                                                </span>
                                                            ))}
                                                            {isLive && match.gameScore !== '-' && (
                                                                <span className="w-6 text-center text-xs font-bold text-red-600 font-condensed bg-red-50 rounded px-1">
                                                                    {match.gameScore.split(' - ')[0]}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Player 2 */}
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            {match.player2.isServing && isLive && (
                                                                <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" title="Serving"></span>
                                                            )}
                                                            {match.player2.logo ? (
                                                                <img
                                                                    src={match.player2.logo}
                                                                    alt=""
                                                                    className="w-5 h-5 rounded-full object-cover"
                                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                                />
                                                            ) : (
                                                                <div className="w-5 h-5 bg-gray-200 rounded-full flex-shrink-0"></div>
                                                            )}
                                                            <span className={`text-sm truncate font-condensed ${isFinished && match.winner === 'Second Player'
                                                                    ? 'font-bold text-gray-900'
                                                                    : 'text-gray-700'
                                                                }`}>
                                                                {match.player2.name}
                                                            </span>
                                                        </div>

                                                        {/* Player 2 Sets */}
                                                        <div className="flex items-center gap-1">
                                                            {match.scores?.map((set, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className={`w-5 text-center text-xs font-condensed ${set.player2 > set.player1
                                                                            ? 'font-bold text-gray-900'
                                                                            : 'text-gray-500'
                                                                        }`}
                                                                >
                                                                    {set.player2}
                                                                </span>
                                                            ))}
                                                            {isLive && match.gameScore !== '-' && (
                                                                <span className="w-6 text-center text-xs font-bold text-red-600 font-condensed bg-red-50 rounded px-1">
                                                                    {match.gameScore.split(' - ')[1]}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Favorite */}
                                                <div className="w-8 flex-shrink-0 flex justify-end pt-1">
                                                    <button
                                                        onClick={(e) => toggleFavorite(e, matchId)}
                                                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                    >
                                                        <Star className={`w-4 h-4 ${isFavorite
                                                                ? 'text-yellow-500 fill-yellow-500'
                                                                : 'text-gray-300 hover:text-gray-400'
                                                            }`} />
                                                    </button>
                                                </div>
                                            </div>
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
