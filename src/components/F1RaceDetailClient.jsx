'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    ArrowLeft, Flag, MapPin, Calendar, Clock, 
    Trophy, Loader2, Share2, Star
} from 'lucide-react';

import SofaHeader from '@/components/SofaHeader';
import SofaFooter from '@/components/SofaFooter';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function F1RaceDetailClient({ raceId }) {
    const router = useRouter();
    
    // State
    const [race, setRace] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    // ============================================================
    // FETCH DATA
    // ============================================================
    
    const fetchRaceDetail = async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            const response = await fetch(`${API_BASE_URL}/api/formula1/race/${raceId}`);
            const data = await response.json();
            
            if (data.success && data.race) {
                setRace(data.race);
            } else {
                setError(data.error || 'Race not found');
            }
        } catch (err) {
            console.error('Error fetching race:', err);
            setError('Gagal memuat data race');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (raceId) {
            fetchRaceDetail();
        }
    }, [raceId]);

    // Countdown timer
    useEffect(() => {
        if (!race?.date) return;

        const raceDate = new Date(race.date);
        const now = new Date();
        
        if (raceDate <= now) return; // Race already passed

        const calculateCountdown = () => {
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
    }, [race?.date]);

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

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: race?.competition?.name || 'F1 Race',
                    url: window.location.href
                });
            } catch (err) {
                console.log('Share cancelled');
            }
        }
    };

    // ============================================================
    // RENDER
    // ============================================================

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100">
                <SofaHeader />
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-red-600" />
                    <span className="ml-3 text-gray-500 font-condensed">Memuat data race...</span>
                </div>
                <SofaFooter />
            </div>
        );
    }

    if (error || !race) {
        return (
            <div className="min-h-screen bg-gray-100">
                <SofaHeader />
                <div className="max-w-4xl mx-auto px-4 py-20">
                    <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                        <p className="text-red-500 font-condensed mb-4">{error || 'Race tidak ditemukan'}</p>
                        <button
                            onClick={() => router.back()}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-condensed"
                        >
                            Kembali
                        </button>
                    </div>
                </div>
                <SofaFooter />
            </div>
        );
    }

    const isUpcoming = race.status === 'upcoming' || new Date(race.date) > new Date();

    return (
        <div className="min-h-screen bg-gray-100">
            <SofaHeader />

            <main className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-8">
                        {/* Back Button */}
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 font-condensed"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Kembali
                        </button>

                        {/* Race Header Card */}
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-red-700 to-red-600 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Flag className="w-6 h-6 text-white" />
                                        <div>
                                            <p className="text-white font-bold text-xl font-condensed">
                                                {race.competition?.name || 'Grand Prix'}
                                            </p>
                                            <p className="text-red-200 text-sm font-condensed">
                                                Season {race.season || new Date().getFullYear()}
                                            </p>
                                        </div>
                                    </div>
                                    {isUpcoming && (
                                        <span className="bg-white text-red-600 text-xs font-bold px-3 py-1 rounded-full font-condensed">
                                            UPCOMING
                                        </span>
                                    )}
                                    {race.status === 'completed' && (
                                        <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full font-condensed">
                                            COMPLETED
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                {/* Circuit Image */}
                                {race.circuit?.image && (
                                    <div className="mb-6">
                                        <img 
                                            src={race.circuit.image} 
                                            alt={race.circuit.name}
                                            className="w-full h-48 object-contain bg-gray-50 rounded-lg"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    </div>
                                )}

                                {/* Race Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <MapPin className="w-5 h-5 text-red-500" />
                                        <div>
                                            <p className="text-xs text-gray-500 font-condensed">Circuit</p>
                                            <p className="font-semibold text-gray-800 font-condensed">
                                                {race.circuit?.name || '-'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <Calendar className="w-5 h-5 text-red-500" />
                                        <div>
                                            <p className="text-xs text-gray-500 font-condensed">Tanggal</p>
                                            <p className="font-semibold text-gray-800 font-condensed">
                                                {formatDate(race.date)}
                                            </p>
                                        </div>
                                    </div>
                                    {race.competition?.location && (
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                            <Flag className="w-5 h-5 text-red-500" />
                                            <div>
                                                <p className="text-xs text-gray-500 font-condensed">Lokasi</p>
                                                <p className="font-semibold text-gray-800 font-condensed">
                                                    {race.competition.location.city}, {race.competition.location.country}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {race.laps?.total && (
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                            <Trophy className="w-5 h-5 text-red-500" />
                                            <div>
                                                <p className="text-xs text-gray-500 font-condensed">Total Laps</p>
                                                <p className="font-semibold text-gray-800 font-condensed">
                                                    {race.laps.total} laps
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Countdown (for upcoming races) */}
                                {isUpcoming && (
                                    <div className="mb-6">
                                        <h3 className="font-bold text-gray-800 mb-3 font-condensed">Countdown to Race</h3>
                                        <div className="grid grid-cols-4 gap-3">
                                            <div className="bg-red-50 rounded-lg p-4 text-center">
                                                <p className="text-3xl font-bold text-red-600 font-condensed">{countdown.days}</p>
                                                <p className="text-xs text-gray-500 font-condensed">HARI</p>
                                            </div>
                                            <div className="bg-red-50 rounded-lg p-4 text-center">
                                                <p className="text-3xl font-bold text-red-600 font-condensed">{countdown.hours}</p>
                                                <p className="text-xs text-gray-500 font-condensed">JAM</p>
                                            </div>
                                            <div className="bg-red-50 rounded-lg p-4 text-center">
                                                <p className="text-3xl font-bold text-red-600 font-condensed">{countdown.minutes}</p>
                                                <p className="text-xs text-gray-500 font-condensed">MENIT</p>
                                            </div>
                                            <div className="bg-red-50 rounded-lg p-4 text-center">
                                                <p className="text-3xl font-bold text-red-600 font-condensed">{countdown.seconds}</p>
                                                <p className="text-xs text-gray-500 font-condensed">DETIK</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Fastest Lap (for completed races) */}
                                {race.fastestLap?.driver && (
                                    <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
                                        <h3 className="font-bold text-gray-800 mb-2 font-condensed flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-yellow-600" />
                                            Fastest Lap
                                        </h3>
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-gray-800 font-condensed">
                                                {race.fastestLap.driver.name}
                                            </span>
                                            <span className="font-bold text-yellow-600 font-condensed">
                                                {race.fastestLap.time}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex items-center justify-center gap-4 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={handleShare}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors font-condensed"
                                    >
                                        <Share2 className="w-4 h-4" />
                                        Bagikan
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4">
                        {/* Circuit Info */}
                        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
                            <h3 className="font-bold text-gray-800 mb-3 font-condensed flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-red-500" />
                                Circuit Info
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500 font-condensed">Nama</span>
                                    <span className="text-sm font-semibold text-gray-800 font-condensed">
                                        {race.circuit?.name || '-'}
                                    </span>
                                </div>
                                {race.distance && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500 font-condensed">Race Distance</span>
                                        <span className="text-sm font-semibold text-gray-800 font-condensed">
                                            {race.distance}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Ad Placeholder */}
                        <div className="bg-white rounded-xl shadow-sm p-4">
                            <div className="bg-gray-100 rounded-lg h-[250px] flex items-center justify-center">
                                <span className="text-gray-400 text-sm font-condensed">Iklan</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <SofaFooter />
        </div>
    );
}
