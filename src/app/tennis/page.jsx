'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';

// Components
import SofaHeader from '@/components/SofaHeader';
import TennisMatchList from '@/components/TennisMatchList';
import TennisMatchPreview from '@/components/TennisMatchPreview';
import SofaFooter from '@/components/SofaFooter';
import UserProfileModal from '@/components/UserProfileModal';
import LoginRequiredModal from '@/components/LoginRequiredModal';
import OrbitLoader from '@/components/OrbitLoader';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function TennisPage() {
    const router = useRouter();

    // Auth State
    const [user, setUser] = useState(null);
    const [username, setUsername] = useState('');
    const [points, setPoints] = useState(0);
    const [lifetimePoints, setLifetimePoints] = useState(0);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);

    // Match State
    const [matches, setMatches] = useState([]);
    const [grouped, setGrouped] = useState([]);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [isLoadingMatches, setIsLoadingMatches] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [stats, setStats] = useState({ live: 0, finished: 0, scheduled: 0 });

    // Filter State
    const [activeFilter, setActiveFilter] = useState('Semua');

    // Modal State
    const [showProfile, setShowProfile] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);

    // ============================================================
    // FILTER LOGIC
    // ============================================================
    const filteredMatches = useMemo(() => {
        switch (activeFilter) {
            case 'Live':
                return matches.filter(m => m.isLive);
            case 'Selesai':
                return matches.filter(m => m.isFinished);
            case 'Semua':
            default:
                return matches;
        }
    }, [matches, activeFilter]);

    const filteredGrouped = useMemo(() => {
        if (activeFilter === 'Semua') return grouped;

        return grouped.map(group => ({
            ...group,
            matches: group.matches.filter(m => {
                if (activeFilter === 'Live') return m.isLive;
                if (activeFilter === 'Selesai') return m.isFinished;
                return true;
            })
        })).filter(group => group.matches.length > 0);
    }, [grouped, activeFilter]);

    // ============================================================
    // AUTH CHECK
    // ============================================================
    useEffect(() => {
        const checkAuth = async () => {
            try {
                setIsLoadingAuth(true);
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError || !session?.user) {
                    setUser(null);
                    setIsLoadingAuth(false);
                    return;
                }

                setUser(session.user);

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('username, points, lifetime_points, season_points, total_experience')
                    .eq('email', session.user.email)
                    .single();

                if (profile?.username) setUsername(profile.username);
                if (profile?.season_points != null) setPoints(profile.season_points);
                else if (profile?.points != null) setPoints(profile.points);
                if (profile?.total_experience != null) setLifetimePoints(profile.total_experience);
                else if (profile?.lifetime_points != null) setLifetimePoints(profile.lifetime_points);

            } catch (error) {
                console.error('Error in checkAuth:', error);
                setUser(null);
            } finally {
                setIsLoadingAuth(false);
            }
        };

        checkAuth();
    }, []);

    // ============================================================
    // AUTH LISTENER
    // ============================================================
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                setUser(session.user);

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('username, points, lifetime_points')
                    .eq('email', session.user.email)
                    .single();

                if (profile?.username) setUsername(profile.username);
                if (profile?.points != null) setPoints(profile.points);
                if (profile?.lifetime_points != null) setLifetimePoints(profile.lifetime_points);

            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setUsername('');
                setPoints(0);
                setLifetimePoints(0);
                setIsLoadingAuth(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // ============================================================
    // FETCH TENNIS MATCHES
    // ============================================================
    const fetchMatches = useCallback(async (isBackground = false) => {
        try {
            if (!isBackground) {
                setIsLoadingMatches(true);
            }

            const response = await fetch(`${API_BASE_URL}/api/tennis`);

            if (!response.ok) {
                throw new Error('Failed to fetch tennis matches');
            }

            const data = await response.json();

            if (data.success) {
                setMatches(data.matches || []);
                setGrouped(data.grouped || []);
                setStats(data.stats || { live: 0, finished: 0, scheduled: 0 });
                setLastUpdated(new Date());

                // Select first live match or first match
                if (!isBackground && data.matches?.length > 0) {
                    const liveMatch = data.matches.find(m => m.isLive);
                    setSelectedMatch(liveMatch || data.matches[0]);
                }
            }

        } catch (error) {
            console.error('❌ Error fetching tennis matches:', error);
        } finally {
            if (!isBackground) {
                setIsLoadingMatches(false);
            }
        }
    }, []);

    useEffect(() => {
        fetchMatches(false);
    }, [fetchMatches]);

    // Auto refresh every 60 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchMatches(true);
        }, 60000);

        return () => clearInterval(interval);
    }, [fetchMatches]);

    // ============================================================
    // HANDLERS
    // ============================================================
    const handleAuthRedirect = () => {
        router.push('/auth');
    };

    const handleMatchClick = (match) => {
        setSelectedMatch(match);
    };

    // ============================================================
    // RENDER
    // ============================================================
    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <SofaHeader
                user={user}
                username={username}
                onAuthRedirect={handleAuthRedirect}
                onShowProfile={() => setShowProfile(true)}
                liveCount={stats.live}
                finishedCount={stats.finished}
                upcomingCount={stats.scheduled}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
            />

            {/* Main Content */}
            <main className="pb-20 lg:pb-8">
                <div className="max-w-7xl mx-auto">
                    {/* Desktop Layout */}
                    <div className="hidden lg:block px-4 py-4">
                        <div className="grid grid-cols-12 gap-4">
                            {/* Left Column - Match List */}
                            <div className="col-span-5">
                                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                    {/* Tennis Header */}
                                    <div className="bg-gradient-to-r from-green-600 to-green-500 px-4 py-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl">🎾</span>
                                                <div>
                                                    <h1 className="text-white font-bold text-lg font-condensed">Tennis</h1>
                                                    <p className="text-green-100 text-xs font-condensed">
                                                        ATP • WTA • ITF
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-white font-bold text-lg font-condensed">{matches.length}</p>
                                                <p className="text-green-100 text-xs font-condensed">Pertandingan</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Match List */}
                                    <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
                                        {isLoadingMatches ? (
                                            <div className="flex items-center justify-center py-12">
                                                <OrbitLoader />
                                            </div>
                                        ) : (
                                            <TennisMatchList
                                                matches={filteredMatches}
                                                grouped={filteredGrouped}
                                                onMatchClick={handleMatchClick}
                                                selectedMatch={selectedMatch}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Center Column - Match Preview */}
                            <div className="col-span-4">
                                <TennisMatchPreview
                                    matches={filteredMatches}
                                    match={selectedMatch}
                                    user={user}
                                    onMatchClick={handleMatchClick}
                                />
                            </div>

                            {/* Right Column - Ads */}
                            <div className="col-span-3 space-y-4">
                                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                    <div className="bg-gray-100 px-3 py-1 text-xs text-gray-500 font-condensed">Iklan</div>
                                    <div className="aspect-[300/250] bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
                                        <div className="text-center text-white p-4">
                                            <p className="text-4xl mb-2">🎾</p>
                                            <p className="text-xl font-bold font-condensed mb-1">Tennis Live</p>
                                            <p className="text-sm font-condensed">Nonton ATP & WTA Gratis!</p>
                                            <button className="mt-3 px-4 py-2 bg-white text-green-600 rounded-lg text-sm font-bold font-condensed hover:bg-green-50 transition-colors">
                                                STREAMING
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                    <div className="bg-gray-100 px-3 py-1 text-xs text-gray-500 font-condensed">Iklan</div>
                                    <div className="aspect-[300/250] bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                                        <div className="text-center text-white p-4">
                                            <p className="text-4xl mb-2">🏆</p>
                                            <p className="text-xl font-bold font-condensed mb-1">Grand Slam</p>
                                            <p className="text-sm font-condensed">Jangan lewatkan!</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Layout */}
                    <div className="lg:hidden">
                        {/* Match List */}
                        <div className="p-3">
                            {isLoadingMatches ? (
                                <div className="flex items-center justify-center py-12">
                                    <OrbitLoader />
                                </div>
                            ) : (
                                <TennisMatchList
                                    matches={filteredMatches}
                                    grouped={filteredGrouped}
                                    onMatchClick={handleMatchClick}
                                    selectedMatch={selectedMatch}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <SofaFooter />

            {/* Modals */}
            <UserProfileModal
                isOpen={showProfile}
                onClose={() => setShowProfile(false)}
                user={user}
            />

            <LoginRequiredModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                onLogin={() => {
                    setShowLoginModal(false);
                    router.push('/auth');
                }}
            />
        </div>
    );
}
