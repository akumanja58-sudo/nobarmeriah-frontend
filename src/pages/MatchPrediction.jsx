import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Home, Clock } from 'lucide-react';
import PredictionForm from '../components/PredictionForm';
import { supabase } from '../utils/supabaseClient';

const MatchPrediction = () => {
    const { matchSlug } = useParams();
    console.log('Raw matchSlug from URL:', matchSlug);
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    // Check both URL params and location state
    const isWatchMode = searchParams.get('mode') === 'watch' || location.state?.mode === 'watch';

    console.log('🔧 DEBUG MatchPrediction mode detection:', {
        urlParam: searchParams.get('mode'),
        locationState: location.state?.mode,
        finalIsWatchMode: isWatchMode
    });

    const [match, setMatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);

    // ============= CLEAN UTILITY FUNCTIONS =============

    // Simple time formatter (replaces broken predictionUtils)
    const formatKickoffTime = (kickoffTime) => {
        if (!kickoffTime) return 'TBD';

        try {
            const date = new Date(kickoffTime);
            return date.toLocaleString('id-ID', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Error formatting time:', error);
            return 'Invalid time';
        }
    };

    // Simple match finder (replaces broken routingUtils)
    const findMatchBySlug = async (slug, matches) => {
        console.log('Trying to find match for slug:', slug);
        if (!slug || !matches) return null;

        // Try different matching strategies
        for (const match of matches) {
            // Strategy 1: Direct ID match
            if (match.id?.toString() === slug) {
                return match;
            }

            // Strategy 2: Match number
            if (match.match_number?.toString() === slug) {
                return match;
            }

            // Strategy 3: Slug-like matching
            const homeSlug = match.home_team?.toLowerCase().replace(/\s+/g, '-');
            const awaySlug = match.away_team?.toLowerCase().replace(/\s+/g, '-');
            const matchSlug = `${homeSlug}-vs-${awaySlug}`;

            if (matchSlug === slug) {
                return match;
            }

            // Strategy 4: Partial matching
            if (slug.includes(homeSlug) && slug.includes(awaySlug)) {
                return match;
            }
        }

        // Strategy 5: Fallback - return first match if slug looks like a number
        if (/^\d+$/.test(slug)) {
            const numericSlug = parseInt(slug);
            return matches.find(m => m.id === numericSlug || m.match_number === numericSlug);
        }

        return null;
    };

    // Get user session
    useEffect(() => {
        const getUser = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setUser(session?.user || null);
            } catch (error) {
                console.error('Error getting user session:', error);
                setUser(null);
            }
        };
        getUser();
    }, []);

    useEffect(() => {
        const loadMatch = async () => {
            try {
                setLoading(true);

                // ✅ PRIORITAS 1: Cek state data dari navigation dulu
                console.log('🔍 Checking location state:', location.state);
                if (location.state?.match) {
                    console.log('✅ Using match data from navigation state');
                    setMatch(location.state.match);
                    setLoading(false);
                    return;
                }

                // ✅ PRIORITAS 2: Cek localStorage cache
                console.log('🔍 Checking localStorage cache...');
                const cachedMatches = localStorage.getItem('cached_matches');
                if (cachedMatches) {
                    try {
                        const matches = JSON.parse(cachedMatches);
                        const foundMatch = await findMatchBySlug(matchSlug, matches);

                        if (foundMatch) {
                            console.log('✅ Found match in localStorage cache');
                            setMatch(foundMatch);
                            setLoading(false);
                            return;
                        }
                    } catch (e) {
                        console.error('Error parsing cached matches:', e);
                    }
                }

                // ✅ PRIORITAS 3: Fetch from database (fallback)
                console.log('🔍 Fetching from database as fallback...');
                const { data: matches, error } = await supabase
                    .from('fixtures')
                    .select('*')
                    .order('match_date', { ascending: true });

                if (error) {
                    console.error('Supabase error:', error);
                    throw error;
                }

                console.log('📊 Loaded matches from database:', matches?.length || 0);

                // Find match by slug
                const foundMatch = await findMatchBySlug(matchSlug, matches || []);

                if (!foundMatch) {
                    console.warn('⚠️ Match not found for slug:', matchSlug);
                    setError(`Match not found for slug: ${matchSlug}`);
                    return;
                }

                console.log('✅ Found match in database:', foundMatch.home_team, 'vs', foundMatch.away_team);
                setMatch(foundMatch);

            } catch (err) {
                console.error('❌ Error loading match:', err);
                setError('Failed to load match data');
            } finally {
                setLoading(false);
            }
        };

        if (matchSlug) {
            loadMatch();
        }
    }, [matchSlug, location.state]);

    const handleGoBack = () => {
        navigate(-1);
    };

    const handleGoHome = () => {
        navigate('/');
    };

    const handleAuthRequired = () => {
        navigate('/auth');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#F7FEE7] to-[#D9F99D] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading match data...</p>
                </div>
            </div>
        );
    }

    if (error || !match) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#F7FEE7] to-[#D9F99D] flex items-center justify-center">
                <div className="text-center max-w-lg mx-auto p-6">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Match Not Found</h2>
                    <p className="text-gray-600 mb-6">{error || 'The requested match could not be found.'}</p>

                    {/* Enhanced Debug info */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
                        <h3 className="font-bold text-yellow-800 mb-2">🔍 Debug Info:</h3>
                        <div className="text-sm text-yellow-700 space-y-1">
                            <p><strong>Requested slug:</strong> <code>{matchSlug}</code></p>
                            <p><strong>State data:</strong> {location.state?.match ? 'Available' : 'Missing'}</p>
                            <p><strong>Navigation source:</strong> {location.state?.timestamp ? 'MatchList' : 'Direct URL'}</p>
                            <p><strong>Error:</strong> {error}</p>

                            {location.state?.match && (
                                <div className="mt-2 p-2 bg-green-100 rounded">
                                    <p><strong>✅ Match found:</strong> {location.state.match.home_team} vs {location.state.match.away_team}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={handleGoBack}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Go Back
                        </button>
                        <button
                            onClick={handleGoHome}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                            <Home className="w-4 h-4" />
                            Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F7FEE7] to-[#D9F99D] relative">
            {/* Clean Mobile-First Breadcrumb */}
            <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        {/* Breadcrumb Navigation */}
                        <div className="flex items-center space-x-2 text-sm">
                            <button
                                onClick={handleGoHome}
                                className="text-green-600 hover:text-green-800 transition-colors font-medium"
                            >
                                Home
                            </button>
                            <span className="text-gray-400">/</span>
                            <button
                                onClick={handleGoBack}
                                className="text-green-600 hover:text-green-800 transition-colors"
                            >
                                Matches
                            </button>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-800 font-medium truncate max-w-[200px] sm:max-w-none">
                                {match.home_team} vs {match.away_team}
                            </span>
                        </div>

                        {/* Right Side - Time & Back */}
                        <div className="flex items-center gap-3">
                            {/* Time Info - Hidden on mobile */}
                            <div className="hidden sm:flex items-center gap-2 text-gray-600 text-sm">
                                <Clock className="w-4 h-4" />
                                <span>
                                    {formatKickoffTime(match.kickoff || match.kick_off)}
                                </span>
                            </div>

                            {/* Back Button */}
                            <button
                                onClick={handleGoBack}
                                className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-gray-800 hover:bg-white/60 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span className="hidden sm:inline">Back</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="relative">
                {console.log('🔧 DEBUG MatchPrediction passing props:', {
                    isWatchMode,
                    locationState: location.state,
                    mode: location.state?.mode,
                    urlParam: searchParams.get('mode')
                })}

                {/* PredictionForm - Full width, mobile optimized */}
                <div className="w-full p-4">
                    <PredictionForm
                        user={user}
                        username={user?.user_metadata?.username || user?.email?.split('@')[0] || 'Guest'}
                        match={match}
                        goBack={handleGoBack}
                        onAuthRequired={handleAuthRequired}
                        isWatchMode={isWatchMode}
                    />
                </div>
            </div>
        </div>
    );
};

export default MatchPrediction;