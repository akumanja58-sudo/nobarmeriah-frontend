import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom';
import { supabase } from './utils/supabaseClient';
import './styles/animations.css';

// Page Components
import Home from './pages/Home';
import Auth from './pages/Auth';
import ResetPassword from './pages/ResetPassword';
import CheckGoogle from './pages/CheckGoogle';
import AdminLogin from './pages/AdminLogin';
import AdminPanel from './pages/AdminPanel';

// Components
import RewardShop from './components/RewardShop';
import MatchList from './components/MatchList';
import TestMatches from './components/TestMatches';
import MatchDetailPage from './components/MatchDetailPage'; // ✅ IMPORT BARU

// ============= MATCH DETAIL WRAPPER =============
// Wrapper component untuk handle routing dan pass props ke MatchDetailPage
const MatchDetailWrapper = ({ user }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { matchSlug } = useParams();

    // Ambil match data dari location state (dari MatchList pas klik)
    const matchFromState = location.state?.match;

    // Kalau gak ada match data di state, extract match ID dari slug
    const getMatchIdFromSlug = (slug) => {
        if (!slug) return null;
        // Format slug: "home-team-vs-away-team-123456" atau langsung ID
        const parts = slug.split('-');
        const lastPart = parts[parts.length - 1];
        return !isNaN(lastPart) ? parseInt(lastPart) : null;
    };

    const matchId = matchFromState?.id || getMatchIdFromSlug(matchSlug);

    // Kalau gak ada match data sama sekali, bisa fetch dari backend atau redirect
    const match = matchFromState || { id: matchId };

    const handleGoBack = () => {
        navigate(-1); // Go back to previous page
    };

    const handleAuthRequired = () => {
        navigate('/auth', { state: { from: location.pathname } });
    };

    return (
        <MatchDetailPage
            user={user}
            username={user?.email?.split('@')[0]}
            match={match}
            goBack={handleGoBack}
            onAuthRequired={handleAuthRequired}
        />
    );
};

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // ============= AUTH STATE MANAGEMENT =============
    useEffect(() => {
        const getSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('Session error:', error);
                    setUser(null);
                } else if (session?.user) {
                    console.log('✅ Session found:', session.user.email);
                    setUser(session.user);
                } else {
                    console.log('ℹ️ No active session');
                    setUser(null);
                }
            } catch (error) {
                console.error('Error getting session:', error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('🔄 Auth state changed:', event, session?.user?.email);

                if (event === 'SIGNED_IN' && session?.user) {
                    setUser(session.user);
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                } else if (event === 'TOKEN_REFRESHED' && session?.user) {
                    setUser(session.user);
                }

                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    // ============= LOADING STATE =============
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-300 font-medium">Loading Clean App...</p>
                </div>
            </div>
        );
    }

    // ============= ROUTES =============
    return (
        <Router>
            <Routes>
                {/* ============= CORE ROUTES ============= */}
                <Route path="/" element={<Home userFromApp={user} />} />
                <Route path="/dashboard" element={<Home userFromApp={user} />} />

                {/* ============= AUTH ROUTES ============= */}
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/check-google" element={<CheckGoogle />} />

                {/* ============= ADMIN ROUTES ============= */}
                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="/admin-panel" element={<AdminPanel />} />

                {/* ============= USER FEATURES ============= */}
                <Route path="/reward-shop" element={<RewardShop user={user} />} />

                {/* ============= MATCH ROUTES ============= */}
                {/* Match List */}
                <Route path="/matches" element={<MatchList user={user} />} />
                <Route path="/test" element={<TestMatches />} />

                {/* ✅ Match Detail dengan MatchDetailPage BARU */}
                <Route path="/id/match/:matchSlug" element={<MatchDetailWrapper user={user} />} />

                {/* Backward compatibility */}
                <Route path="/match/:matchSlug" element={<MatchDetailWrapper user={user} />} />

                {/* ============= 404 FALLBACK ============= */}
                <Route path="*" element={
                    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
                        <div className="text-center">
                            <div className="text-6xl mb-4">🔍</div>
                            <h2 className="text-2xl font-bold text-white mb-2">Page Not Found</h2>
                            <p className="text-gray-400 mb-4">The page you're looking for doesn't exist.</p>
                            <a
                                href="/"
                                className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                            >
                                Go Home
                            </a>
                        </div>
                    </div>
                } />
            </Routes>
        </Router>
    );
}

export default App;
