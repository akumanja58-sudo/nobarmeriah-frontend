'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Trophy, Flag, Users, Clock, MapPin, Calendar } from 'lucide-react';

// ============================================================
// F1 PREVIEW COMPONENT
// ============================================================

export default function F1Preview({ 
    nextRace,
    driverStandings = [],
    teamStandings = [],
    onRaceClick
}) {
    const [activeTab, setActiveTab] = useState('drivers');
    const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    // Countdown timer for next race
    useEffect(() => {
        if (!nextRace?.date) return;

        const calculateCountdown = () => {
            const raceDate = new Date(nextRace.date);
            const now = new Date();
            const diff = raceDate - now;

            if (diff <= 0) {
                setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setCountdown({ days, hours, minutes, seconds });
        };

        calculateCountdown();
        const interval = setInterval(calculateCountdown, 1000);

        return () => clearInterval(interval);
    }, [nextRace?.date]);

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', { 
            weekday: 'long',
            day: 'numeric', 
            month: 'long',
            year: 'numeric'
        });
    };

    // Get team color (simplified)
    const getTeamColor = (teamName) => {
        const name = (teamName || '').toLowerCase();
        if (name.includes('red bull')) return 'bg-blue-900';
        if (name.includes('ferrari')) return 'bg-red-600';
        if (name.includes('mercedes')) return 'bg-teal-500';
        if (name.includes('mclaren')) return 'bg-orange-500';
        if (name.includes('aston martin')) return 'bg-green-700';
        if (name.includes('alpine')) return 'bg-pink-500';
        if (name.includes('williams')) return 'bg-blue-500';
        if (name.includes('haas')) return 'bg-gray-700';
        if (name.includes('alfa') || name.includes('sauber')) return 'bg-red-800';
        if (name.includes('alphatauri') || name.includes('rb')) return 'bg-blue-700';
        return 'bg-gray-500';
    };

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <div className="f1-preview space-y-4">
            {/* Next Race Card */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-700 to-red-600 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <Flag className="w-5 h-5 text-white" />
                        <span className="text-white font-bold font-condensed">Race Berikutnya</span>
                    </div>
                </div>

                {nextRace ? (
                    <div className="p-4">
                        {/* Race Name & Circuit */}
                        <div className="text-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800 font-condensed">
                                {nextRace.competition?.name || 'Grand Prix'}
                            </h3>
                            <div className="flex items-center justify-center gap-2 mt-1">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-500 font-condensed">
                                    {nextRace.circuit?.name || nextRace.competition?.location?.city || '-'}
                                </span>
                            </div>
                            <div className="flex items-center justify-center gap-2 mt-1">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-500 font-condensed">
                                    {formatDate(nextRace.date)}
                                </span>
                            </div>
                        </div>

                        {/* Circuit Image */}
                        {nextRace.circuit?.image && (
                            <div className="mb-4">
                                <img 
                                    src={nextRace.circuit.image} 
                                    alt={nextRace.circuit.name}
                                    className="w-full h-32 object-contain bg-gray-50 rounded-lg"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            </div>
                        )}

                        {/* Countdown */}
                        <div className="grid grid-cols-4 gap-2 mb-4">
                            <div className="bg-red-50 rounded-lg p-3 text-center">
                                <p className="text-2xl font-bold text-red-600 font-condensed">{countdown.days}</p>
                                <p className="text-[10px] text-gray-500 font-condensed">HARI</p>
                            </div>
                            <div className="bg-red-50 rounded-lg p-3 text-center">
                                <p className="text-2xl font-bold text-red-600 font-condensed">{countdown.hours}</p>
                                <p className="text-[10px] text-gray-500 font-condensed">JAM</p>
                            </div>
                            <div className="bg-red-50 rounded-lg p-3 text-center">
                                <p className="text-2xl font-bold text-red-600 font-condensed">{countdown.minutes}</p>
                                <p className="text-[10px] text-gray-500 font-condensed">MENIT</p>
                            </div>
                            <div className="bg-red-50 rounded-lg p-3 text-center">
                                <p className="text-2xl font-bold text-red-600 font-condensed">{countdown.seconds}</p>
                                <p className="text-[10px] text-gray-500 font-condensed">DETIK</p>
                            </div>
                        </div>

                        {/* View Detail Button */}
                        <button 
                            onClick={() => onRaceClick?.(nextRace)}
                            className="w-full py-2 bg-red-600 text-white rounded-lg font-semibold font-condensed hover:bg-red-700 transition-colors"
                        >
                            Lihat Detail Race
                        </button>
                    </div>
                ) : (
                    <div className="p-8 text-center">
                        <Flag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-condensed">Tidak ada race mendatang</p>
                    </div>
                )}
            </div>

            {/* Standings Card */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Tabs */}
                <div className="grid grid-cols-2 border-b border-gray-100">
                    <button
                        onClick={() => setActiveTab('drivers')}
                        className={`flex items-center justify-center gap-2 py-3 transition-colors font-condensed ${
                            activeTab === 'drivers'
                                ? 'bg-white border-b-2 border-red-600 text-red-600'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        <span className="font-semibold text-sm">Drivers</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('constructors')}
                        className={`flex items-center justify-center gap-2 py-3 transition-colors font-condensed ${
                            activeTab === 'constructors'
                                ? 'bg-white border-b-2 border-red-600 text-red-600'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <Trophy className="w-4 h-4" />
                        <span className="font-semibold text-sm">Constructors</span>
                    </button>
                </div>

                {/* Standings List */}
                <div className="p-4">
                    {activeTab === 'drivers' ? (
                        <div className="space-y-2">
                            {driverStandings.length > 0 ? (
                                driverStandings.slice(0, 10).map((standing) => (
                                    <div 
                                        key={standing.driver?.id || standing.position}
                                        className="flex items-center gap-3 py-2 hover:bg-gray-50 rounded-lg px-2 transition-colors"
                                    >
                                        <span className={`w-6 text-center font-bold font-condensed ${
                                            standing.position <= 3 ? 'text-red-600' : 'text-gray-400'
                                        }`}>
                                            {standing.position}
                                        </span>
                                        
                                        {/* Driver Image or Team Color */}
                                        {standing.driver?.image ? (
                                            <img 
                                                src={standing.driver.image} 
                                                alt={standing.driver.name}
                                                className="w-8 h-8 rounded-full object-cover"
                                                onError={(e) => { 
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <div className={`w-8 h-8 rounded-full ${getTeamColor(standing.team?.name)} flex items-center justify-center text-white text-xs font-bold`}>
                                                {standing.driver?.abbr || standing.driver?.name?.[0] || '?'}
                                            </div>
                                        )}
                                        
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-800 font-condensed truncate">
                                                {standing.driver?.name || '-'}
                                            </p>
                                            <p className="text-xs text-gray-400 font-condensed truncate">
                                                {standing.team?.name || '-'}
                                            </p>
                                        </div>
                                        
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-gray-800 font-condensed">
                                                {standing.points} <span className="text-xs text-gray-400">pts</span>
                                            </p>
                                            {standing.wins > 0 && (
                                                <p className="text-xs text-yellow-600 font-condensed">
                                                    {standing.wins} wins
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-sm text-gray-500 font-condensed">Belum ada data standings</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {teamStandings.length > 0 ? (
                                teamStandings.map((standing) => (
                                    <div 
                                        key={standing.team?.id || standing.position}
                                        className="flex items-center gap-3 py-2 hover:bg-gray-50 rounded-lg px-2 transition-colors"
                                    >
                                        <span className={`w-6 text-center font-bold font-condensed ${
                                            standing.position <= 3 ? 'text-red-600' : 'text-gray-400'
                                        }`}>
                                            {standing.position}
                                        </span>
                                        
                                        {/* Team Logo */}
                                        {standing.team?.logo ? (
                                            <img 
                                                src={standing.team.logo} 
                                                alt={standing.team.name}
                                                className="w-8 h-8 object-contain"
                                                onError={(e) => { 
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <div className={`w-8 h-8 rounded ${getTeamColor(standing.team?.name)} flex items-center justify-center text-white text-xs font-bold`}>
                                                {standing.team?.name?.[0] || '?'}
                                            </div>
                                        )}
                                        
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-800 font-condensed truncate">
                                                {standing.team?.name || '-'}
                                            </p>
                                        </div>
                                        
                                        <p className="text-sm font-bold text-gray-800 font-condensed">
                                            {standing.points} <span className="text-xs text-gray-400">pts</span>
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-sm text-gray-500 font-condensed">Belum ada data standings</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* View More */}
                <div className="px-4 pb-4">
                    <button className="w-full text-center text-red-600 text-sm font-condensed hover:underline">
                        Lihat standings lengkap →
                    </button>
                </div>
            </div>
        </div>
    );
}
