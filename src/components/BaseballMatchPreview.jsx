'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Trophy, Loader2, Circle, Award, BarChart3 } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function BaseballMatchPreview({ 
    games = [], 
    game, 
    user, 
    onGameClick 
}) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    
    // Animation states
    const [slideDirection, setSlideDirection] = useState('next');
    const [isAnimating, setIsAnimating] = useState(false);

    // Get featured games (MLB or live)
    const featuredGames = games.filter(g => {
        const leagueName = (g.league?.name || '').toLowerCase();
        return leagueName.includes('mlb') || 
               leagueName.includes('major league') ||
               leagueName.includes('npb') ||
               leagueName.includes('kbo') ||
               g.isLive;
    }).slice(0, 10);

    const currentGame = featuredGames[currentIndex] || game;

    // ============================================================
    // AUTO-PLAY & NAVIGATION WITH SMOOTH ANIMATION
    // ============================================================
    useEffect(() => {
        if (!isAutoPlaying || featuredGames.length <= 1) return;
        
        const interval = setInterval(() => {
            setSlideDirection('next');
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentIndex(prev => (prev + 1) % featuredGames.length);
                setTimeout(() => setIsAnimating(false), 50);
            }, 200);
        }, 5000);
        
        return () => clearInterval(interval);
    }, [isAutoPlaying, featuredGames.length]);

    const handlePrevGame = () => {
        if (isAnimating) return;
        setIsAutoPlaying(false);
        setSlideDirection('prev');
        setIsAnimating(true);
        
        setTimeout(() => {
            setCurrentIndex(prev => prev === 0 ? featuredGames.length - 1 : prev - 1);
            setTimeout(() => setIsAnimating(false), 50);
        }, 200);
    };

    const handleNextGame = () => {
        if (isAnimating) return;
        setIsAutoPlaying(false);
        setSlideDirection('next');
        setIsAnimating(true);
        
        setTimeout(() => {
            setCurrentIndex(prev => (prev + 1) % featuredGames.length);
            setTimeout(() => setIsAnimating(false), 50);
        }, 200);
    };

    const goToIndex = (index) => {
        if (isAnimating || index === currentIndex) return;
        setIsAutoPlaying(false);
        setSlideDirection(index > currentIndex ? 'next' : 'prev');
        setIsAnimating(true);
        
        setTimeout(() => {
            setCurrentIndex(index);
            setTimeout(() => setIsAnimating(false), 50);
        }, 200);
    };

    // Animation classes for smooth slide
    const getSlideAnimationClass = () => {
        if (!isAnimating) return 'translate-x-0 opacity-100';
        if (slideDirection === 'next') return '-translate-x-4 opacity-0';
        return 'translate-x-4 opacity-0';
    };

    // Format inning scores
    const formatInningScores = (innings) => {
        if (!innings) return [];
        
        const inningScores = [];
        for (let i = 1; i <= 9; i++) {
            const homeInn = innings.home?.[`inn${i}`];
            const awayInn = innings.away?.[`inn${i}`];
            if (homeInn !== null && homeInn !== undefined) {
                inningScores.push({ home: homeInn, away: awayInn, num: i });
            }
        }
        return inningScores;
    };

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <div className="baseball-match-preview space-y-4">
            {/* Featured Game Card */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Game Header */}
                <div className="bg-gradient-to-r from-red-600 to-red-500 px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                <Circle className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-white font-semibold text-sm font-condensed">
                                    {currentGame?.league?.name || 'Baseball Game'}
                                </p>
                                <p className="text-red-100 text-xs font-condensed">
                                    {currentGame?.country?.name || 'Baseball'}
                                </p>
                            </div>
                        </div>
                        {currentGame?.isLive && (
                            <span className="bg-white text-red-600 text-xs font-bold px-2 py-1 rounded animate-pulse font-condensed flex items-center gap-1">
                                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                {currentGame.currentInning ? `Inn ${currentGame.currentInning}` : 'LIVE'}
                            </span>
                        )}
                    </div>
                </div>

                {/* Game Content - Smooth Slide Animation */}
                <div className="overflow-hidden">
                    <div className={`transform transition-all duration-300 ease-out ${getSlideAnimationClass()}`}>
                        {currentGame ? (
                            <div className="p-4">
                                {/* Teams */}
                                <div className="flex items-center justify-between">
                                    {/* Home Team */}
                                    <div className="flex-1 text-center">
                                        {currentGame.homeTeam?.logo ? (
                                            <img 
                                                src={currentGame.homeTeam.logo} 
                                                alt="" 
                                                className="w-16 h-16 object-contain mx-auto mb-2"
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        ) : (
                                            <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-2">
                                                {currentGame.homeTeam?.name?.[0] || 'H'}
                                            </div>
                                        )}
                                        <p className={`font-semibold text-sm font-condensed ${
                                            currentGame.isFinished && currentGame.homeScore > currentGame.awayScore 
                                                ? 'text-red-600' 
                                                : 'text-gray-800'
                                        }`}>
                                            {currentGame.homeTeam?.name || 'Home'}
                                        </p>
                                    </div>

                                    {/* Score */}
                                    <div className="px-4 text-center">
                                        {(currentGame.isLive || currentGame.isFinished) ? (
                                            <>
                                                <div className="text-4xl font-bold text-gray-900 font-condensed">
                                                    {currentGame.homeScore} - {currentGame.awayScore}
                                                </div>
                                                <div className={`text-sm mt-1 ${currentGame.isLive ? 'text-red-600' : 'text-gray-500'}`}>
                                                    {currentGame.isLive && <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse"></span>}
                                                    <span className="font-condensed">{currentGame.statusLong || currentGame.status}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="text-2xl font-bold text-gray-400 font-condensed">VS</div>
                                                <div className="text-sm text-gray-500 font-condensed mt-1">
                                                    {currentGame.time?.substring(0, 5) || '-'}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Away Team */}
                                    <div className="flex-1 text-center">
                                        {currentGame.awayTeam?.logo ? (
                                            <img 
                                                src={currentGame.awayTeam.logo} 
                                                alt="" 
                                                className="w-16 h-16 object-contain mx-auto mb-2"
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        ) : (
                                            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-2">
                                                {currentGame.awayTeam?.name?.[0] || 'A'}
                                            </div>
                                        )}
                                        <p className={`font-semibold text-sm font-condensed ${
                                            currentGame.isFinished && currentGame.awayScore > currentGame.homeScore 
                                                ? 'text-red-600' 
                                                : 'text-gray-800'
                                        }`}>
                                            {currentGame.awayTeam?.name || 'Away'}
                                        </p>
                                    </div>
                                </div>

                                {/* Inning Scores */}
                                {(currentGame.isLive || currentGame.isFinished) && currentGame.innings && (
                                    <div className="flex justify-center gap-1 mt-4 pt-4 border-t border-gray-100 overflow-x-auto">
                                        {formatInningScores(currentGame.innings).map((inn) => (
                                            <div key={inn.num} className="text-center bg-gray-50 rounded px-2 py-1.5 min-w-[28px]">
                                                <div className="text-[10px] text-gray-400 font-condensed">{inn.num}</div>
                                                <div className="text-xs font-bold font-condensed">
                                                    <span className={inn.home > inn.away ? 'text-red-600' : 'text-gray-600'}>{inn.home ?? '-'}</span>
                                                </div>
                                                <div className="text-xs font-bold font-condensed">
                                                    <span className={inn.away > inn.home ? 'text-red-600' : 'text-gray-600'}>{inn.away ?? '-'}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {/* R H E */}
                                        <div className="text-center bg-red-50 rounded px-2 py-1.5 min-w-[28px]">
                                            <div className="text-[10px] text-red-500 font-condensed">R</div>
                                            <div className="text-xs font-bold text-red-600 font-condensed">{currentGame.homeScore}</div>
                                            <div className="text-xs font-bold text-red-600 font-condensed">{currentGame.awayScore}</div>
                                        </div>
                                    </div>
                                )}

                                {/* Game Info */}
                                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                                    <span className="font-condensed">{currentGame.league?.name}</span>
                                    <span className="font-condensed">{currentGame.date?.split('T')[0]}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Circle className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="text-gray-500 font-condensed">Tidak ada pertandingan</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                {featuredGames.length > 1 && (
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-100">
                        <button 
                            onClick={handlePrevGame}
                            disabled={isAnimating}
                            className="p-1 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-500" />
                        </button>
                        
                        <div className="flex items-center gap-1">
                            {featuredGames.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => goToIndex(idx)}
                                    className={`w-2 h-2 rounded-full transition-colors ${
                                        idx === currentIndex ? 'bg-red-500' : 'bg-gray-300'
                                    }`}
                                />
                            ))}
                        </div>
                        
                        <button 
                            onClick={handleNextGame}
                            disabled={isAnimating}
                            className="p-1 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                )}
            </div>

            {/* Popular Leagues */}
            <div className="bg-white rounded-xl shadow-sm p-4">
                <h3 className="font-bold text-gray-800 mb-3 font-condensed flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-red-500" />
                    Liga Populer
                </h3>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { name: 'MLB', icon: '🇺🇸', color: 'bg-red-50 text-red-600' },
                        { name: 'NPB', icon: '🇯🇵', color: 'bg-pink-50 text-pink-600' },
                        { name: 'KBO', icon: '🇰🇷', color: 'bg-blue-50 text-blue-600' },
                        { name: 'CPBL', icon: '🇹🇼', color: 'bg-green-50 text-green-600' },
                    ].map((league) => (
                        <div 
                            key={league.name}
                            className={`${league.color} rounded-lg p-3 text-center cursor-pointer hover:opacity-80 transition-opacity`}
                        >
                            <span className="text-lg mr-1">{league.icon}</span>
                            <span className="font-semibold text-sm font-condensed">{league.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Stats */}
            {games.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-4">
                    <h3 className="font-bold text-gray-800 mb-3 font-condensed flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-red-500" />
                        Statistik Hari Ini
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-red-50 rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-red-600 font-condensed">
                                {games.filter(g => g.isLive).length}
                            </p>
                            <p className="text-xs text-gray-500 font-condensed">Live</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-green-600 font-condensed">
                                {games.filter(g => g.isFinished).length}
                            </p>
                            <p className="text-xs text-gray-500 font-condensed">Selesai</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-blue-600 font-condensed">
                                {games.filter(g => !g.isLive && !g.isFinished).length}
                            </p>
                            <p className="text-xs text-gray-500 font-condensed">Akan Datang</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
