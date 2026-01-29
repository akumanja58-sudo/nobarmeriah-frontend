'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Flag, Calendar, MapPin, Clock, CheckCircle, Circle } from 'lucide-react';

// ============================================================
// F1 RACE LIST COMPONENT
// ============================================================

export default function F1RaceList({ 
    races = [], 
    onRaceClick 
}) {
    const router = useRouter();
    const [showPastRaces, setShowPastRaces] = useState(false);

    // Separate past and upcoming races
    const now = new Date();
    const upcomingRaces = races.filter(race => {
        const raceDate = new Date(race.date);
        return raceDate >= now || race.status === 'upcoming';
    });
    const pastRaces = races.filter(race => {
        const raceDate = new Date(race.date);
        return raceDate < now && race.status !== 'upcoming';
    }).reverse(); // Most recent first

    // Handle race click
    const handleRaceClick = (race) => {
        if (onRaceClick) {
            onRaceClick(race);
        } else {
            router.push(`/formula1/race/${race.id}`);
        }
    };

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', { 
            day: 'numeric', 
            month: 'short',
            year: 'numeric'
        });
    };

    // Get days until race
    const getDaysUntil = (dateStr) => {
        if (!dateStr) return null;
        const raceDate = new Date(dateStr);
        const now = new Date();
        const diffTime = raceDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // ============================================================
    // RENDER
    // ============================================================

    if (races.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Flag className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-condensed">Tidak ada jadwal race</p>
            </div>
        );
    }

    return (
        <div className="f1-race-list space-y-4">
            {/* Upcoming Races */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-red-700 to-red-600 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-white" />
                        <h3 className="text-white font-bold font-condensed">Race Mendatang</h3>
                        <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full ml-auto">
                            {upcomingRaces.length} race
                        </span>
                    </div>
                </div>

                <div className="divide-y divide-gray-100">
                    {upcomingRaces.length === 0 ? (
                        <div className="p-6 text-center">
                            <p className="text-gray-500 font-condensed">Musim telah selesai</p>
                        </div>
                    ) : (
                        upcomingRaces.map((race, index) => {
                            const daysUntil = getDaysUntil(race.date);
                            const isNextRace = index === 0;

                            return (
                                <div 
                                    key={race.id}
                                    onClick={() => handleRaceClick(race)}
                                    className={`flex items-center gap-4 px-4 py-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                                        isNextRace ? 'bg-red-50' : ''
                                    }`}
                                >
                                    {/* Round Number */}
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                                        isNextRace 
                                            ? 'bg-red-600 text-white' 
                                            : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        {index + 1}
                                    </div>

                                    {/* Race Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-gray-800 font-condensed truncate">
                                                {race.competition?.name || 'Grand Prix'}
                                            </p>
                                            {isNextRace && (
                                                <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                                                    NEXT
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                                <MapPin className="w-3 h-3" />
                                                {race.circuit?.name || race.competition?.location?.city || '-'}
                                            </span>
                                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(race.date)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Days Until */}
                                    {daysUntil !== null && daysUntil > 0 && (
                                        <div className="text-right">
                                            <p className={`text-lg font-bold font-condensed ${
                                                isNextRace ? 'text-red-600' : 'text-gray-600'
                                            }`}>
                                                {daysUntil}
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-condensed">hari lagi</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Past Races (Collapsible) */}
            {pastRaces.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <button
                        onClick={() => setShowPastRaces(!showPastRaces)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="font-semibold text-gray-700 font-condensed">Race Selesai</span>
                            <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                                {pastRaces.length}
                            </span>
                        </div>
                        {showPastRaces ? (
                            <ChevronUp className="w-5 h-5 text-gray-500" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                        )}
                    </button>

                    {showPastRaces && (
                        <div className="divide-y divide-gray-100">
                            {pastRaces.map((race, index) => (
                                <div 
                                    key={race.id}
                                    onClick={() => handleRaceClick(race)}
                                    className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    {/* Checkmark */}
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                    </div>

                                    {/* Race Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-700 font-condensed truncate">
                                            {race.competition?.name || 'Grand Prix'}
                                        </p>
                                        <p className="text-xs text-gray-400 font-condensed">
                                            {formatDate(race.date)} • {race.circuit?.name || '-'}
                                        </p>
                                    </div>

                                    {/* Winner info if available */}
                                    {race.fastestLap?.driver?.name && (
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500 font-condensed">Fastest Lap</p>
                                            <p className="text-xs font-medium text-gray-700 font-condensed">
                                                {race.fastestLap.driver.name}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
