import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import MatchList from '../components/MatchList.jsx';
// import Leaderboard from '../components/Leaderboard'; // Removed
import RewardHistoryModal from '../components/RewardHistoryModal';
import UserProfileModal from '../components/UserProfileModal';
import ChallengePage from '../pages/ChallengePage';
import LoginRequiredModal from '../components/LoginRequiredModal';
import { motion } from 'framer-motion';

function Home({ userFromApp }) {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [username, setUsername] = useState('');
    const [points, setPoints] = useState(0);
    const [lifetimePoints, setLifetimePoints] = useState(0);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [showHistory, setShowHistory] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [showChallenge, setShowChallenge] = useState(false);
    const [challengeClosing, setChallengeClosing] = useState(false);

    // Animated logout states
    const [logoutButtonState, setLogoutButtonState] = useState('default');
    const [showLogoutLoader, setShowLogoutLoader] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // ✅ CHALLENGE TIMER STATE
    const [challengeTimeLeft, setChallengeTimeLeft] = useState(5 * 3600 + 16 * 60); // 5h 16m in seconds

    // POP UP
    const [showAdPopup, setShowAdPopup] = useState(false);
    const [currentAdImage, setCurrentAdImage] = useState('');
    const [showLoginModal, setShowLoginModal] = useState(false);

    const ENABLE_POPUP_ADS = false;

    const adsData = {
        variant_a: [
            {
                id: 'welcome_a',
                src: 'https://cphosting.pw/images/2025/06/29/slotqris.jpg',    // ← Put your red theme image here
                alt: 'Welcome Bonus A',
                clickUrl: 'https://example.com/promo?v=a',
                variant: 'A'
            },
            {
                id: 'betting_a',
                src: 'https://cphosting.pw/images/2025/06/28/mahjong.jpg',
                alt: 'Sports Betting A',
                clickUrl: 'https://example.com/betting?v=a',
                variant: 'A'
            }
        ],
        variant_b: [
            {
                id: 'welcome_b',
                src: 'https://cphosting.pw/images/2025/06/23/UTK-POP-UP-SUPER-SCATTER.png',   // ← Put your blue theme image here
                alt: 'Welcome Bonus B',
                clickUrl: 'https://example.com/promo?v=b',
                variant: 'B'
            },
            {
                id: 'betting_b',
                src: 'https://cphosting.pw/images/2025/05/30/25.jpeg',
                alt: 'Sports Betting B',
                clickUrl: 'https://example.com/betting?v=b',
                variant: 'B'
            }
        ]
    };

    // ✅ TAMBAHKAN FUNGSI CLEAR SESSION - POSISI 1
    const clearUserSession = async (email) => {
        if (!email) return true; // Skip if no email

        try {
            console.log('🧹 Clearing session for:', email);

            const { error } = await supabase
                .from('active_sessions')
                .delete()
                .eq('account_email', email.toLowerCase());

            if (error) {
                console.error('❌ Error clearing session:', error);
                // Don't block logout even if session clear fails
                return true;
            }

            console.log('✅ Session cleared successfully');
            return true;
        } catch (err) {
            console.error('💥 Clear session error:', err);
            // Don't block logout even if there's an error
            return true;
        }
    };

    // ✅ A/B TESTING FUNCTIONS
    const selectAdVariant = () => {
        if (!ENABLE_POPUP_ADS) {
            console.log('🚫 selectAdVariant disabled by flag');
            return [];
        }

        const random = Math.random();
        const variant = random > 0.5 ? 'variant_a' : 'variant_b';
        console.log(`🎯 User assigned to variant: ${variant.toUpperCase()}`);
        return adsData[variant];
    };

    const trackAdVariant = (variant) => {
        console.log(`📊 Showing ad variant: ${variant}`);

        // Save to localStorage for analytics
        const abTestData = JSON.parse(localStorage.getItem('ab_test_data') || '{}');

        if (!abTestData[variant]) {
            abTestData[variant] = { impressions: 0, clicks: 0 };
        }

        abTestData[variant].impressions++;
        localStorage.setItem('ab_test_data', JSON.stringify(abTestData));

        // TODO: Send to your analytics service
        // analytics.track('ad_variant_shown', { variant, timestamp: Date.now() });
    };

    const handleCloseAd = () => {
        setShowAdPopup(false);

        // Optional: Set cookie to not show again today
        // localStorage.setItem('ad_closed_today', new Date().toDateString());
    };
    useEffect(() => {
        if (!ENABLE_POPUP_ADS) {
            console.log('🚫 Popup ads disabled');
            return;
        }

        console.log('🔄 Setting up ad popup timer...');

        return () => {
            console.log('🧹 Clearing ad timer');
            clearTimeout(showAdTimer);
        };
    }, []);

    const handleSidebarAdClick = (adType) => {
        console.log(`🎯 Sidebar ad clicked: ${adType}`);
        alert(`📺 ${adType} ad clicked!\n\nDi sini akan redirect ke advertiser.`);
    };

    // ✅ AD POPUP TRIGGER EFFECT
    useEffect(() => {
        const showAdTimer = setTimeout(() => {
            const selectedAds = selectAdVariant();
            if (selectedAds.length > 0) {
                const randomAd = selectedAds[Math.floor(Math.random() * selectedAds.length)];
                setCurrentAdImage(randomAd);
                setShowAdPopup(true);
                trackAdVariant(randomAd.variant);
            }
        }, 3000); // Show ad 3 seconds after page load

        return () => clearTimeout(showAdTimer);
    }, []);

    // ✅ CHALLENGE TIMER EFFECT
    useEffect(() => {
        const timer = setInterval(() => {
            setChallengeTimeLeft(prev => prev > 0 ? prev - 1 : 0);
        }, 60000); // ✅ Update every 1 MINUTE instead of 1 second

        return () => clearInterval(timer);
    }, []);

    // ✅ FORMAT TIMER FUNCTION
    const formatChallengeTime = () => {
        return "Season 1"; // Simple static text
    };

    // ✅ CHALLENGE BUTTON CLICK HANDLER
    const handleChallengeClick = () => {
        if (!user) {
            setShowLoginModal(true);
            return;
        }

        // Reset state untuk memastikan animasi fresh
        setChallengeClosing(false);
        setShowChallenge(true);
    };

    const handleCloseChallenge = () => {
        setChallengeClosing(true); // Mulai animasi keluar

        setTimeout(() => {
            setShowChallenge(false);
            setChallengeClosing(false); // Reset state
        }, 400); // 400ms = durasi animasi keluar
    };

    // ✅ AD CLICK HANDLERS
    const handleAdClick = (ad) => {
        console.log('🎯 Ad clicked:', ad.alt, 'Variant:', ad.variant);

        // Track click for the specific variant
        const abTestData = JSON.parse(localStorage.getItem('ab_test_data') || '{}');

        if (abTestData[ad.variant]) {
            abTestData[ad.variant].clicks++;
            localStorage.setItem('ab_test_data', JSON.stringify(abTestData));
        }

        // Calculate click-through rate
        const impressions = abTestData[ad.variant]?.impressions || 0;
        const clicks = abTestData[ad.variant]?.clicks || 0;
        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
        console.log(`📈 Variant ${ad.variant} CTR: ${ctr.toFixed(2)}%`);

        setShowAdPopup(false);

        if (ad.clickUrl) {
            window.open(ad.clickUrl, '_blank');
        }
    };

    useEffect(() => {
        console.log('Home useEffect triggered, userFromApp:', userFromApp?.email);

        const checkAuth = async () => {
            try {
                setIsLoadingAuth(true);

                // ✅ Quick check - if no userFromApp and no stored session, skip
                if (!userFromApp) {
                    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                    if (sessionError || !session?.user) {
                        console.log('No session found, showing guest view');
                        setUser(null);
                        setIsLoadingAuth(false);
                        return;
                    }

                    // Found session, use it
                    console.log('Found session:', session.user.email);
                    setUser(session.user);

                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('username, points, lifetime_points, is_admin, season_points, total_experience')
                        .eq('email', session.user.email)
                        .single();

                    if (profile?.username) setUsername(profile.username);
                    // Prioritas: season_points > points
                    if (profile?.season_points != null) setPoints(profile.season_points);
                    else if (profile?.points != null) setPoints(profile.points);
                    // Prioritas: total_experience > lifetime_points
                    if (profile?.total_experience != null) setLifetimePoints(profile.total_experience);
                    else if (profile?.lifetime_points != null) setLifetimePoints(profile.lifetime_points);
                    if (profile?.is_admin) setIsAdmin(true);

                } else {
                    // Use userFromApp
                    console.log('Using userFromApp:', userFromApp.email);
                    setUser(userFromApp);

                    const { data: profile, error } = await supabase
                        .from('profiles')
                        .select('username, points, lifetime_points, is_admin, season_points, total_experience')
                        .eq('email', userFromApp.email)
                        .single();

                    console.log('Profile data:', profile, error);

                    if (profile?.username) setUsername(profile.username);
                    // Prioritas: season_points > points
                    if (profile?.season_points != null) setPoints(profile.season_points);
                    else if (profile?.points != null) setPoints(profile.points);
                    // Prioritas: total_experience > lifetime_points
                    if (profile?.total_experience != null) setLifetimePoints(profile.total_experience);
                    else if (profile?.lifetime_points != null) setLifetimePoints(profile.lifetime_points);
                    if (profile?.is_admin) setIsAdmin(true);

                    if (userFromApp.email === 'maureengabriella25@gmail.com') {
                        setIsAdmin(true);
                    }
                }
            } catch (error) {
                console.error('Error in checkAuth:', error);
                setUser(null);
            } finally {
                console.log('Auth check completed');
                setIsLoadingAuth(false);
            }
        };

        checkAuth();
    }, [userFromApp?.email]);

    // ✅ EDIT useEffect AUTH LISTENER - POSISI 2  
    useEffect(() => {
        console.log('Setting up auth listener...');

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event, session?.user?.email);

            if (event === 'SIGNED_IN' && session?.user) {
                setUser(session.user);

                // Fetch profile data
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('username, points, lifetime_points, is_admin')
                    .eq('email', session.user.email)
                    .single();

                if (profile?.username) setUsername(profile.username);
                if (profile?.points != null) setPoints(profile.points);
                if (profile?.lifetime_points != null) setLifetimePoints(profile.lifetime_points);
                if (profile?.is_admin) setIsAdmin(true);

            } else if (event === 'SIGNED_OUT') {
                console.log('🧹 User signed out event received');

                // ✅ DON'T call clearUserSession here - already done in handleLogout
                // Just clear local state
                setUser(null);
                setUsername('');
                setPoints(0);
                setLifetimePoints(0);
                setIsAdmin(false);

                // ✅ IMPORTANT: Reset loading state
                setIsLoadingAuth(false);
                setShowLogoutLoader(false);
                setIsTransitioning(false);
                setLogoutButtonState('default');
            }
        });

        return () => {
            console.log('Cleaning up auth listener');
            subscription.unsubscribe();
        };
    }, []); // ✅ Tambahkan user.email sebagai dependency

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && user) {
                console.log('🔄 Tab visible again, keeping user state...');
                // Cuma log aja, state tetap dipertahankan
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [user]);

    const handleAuthRedirect = () => {
        navigate('/auth');
    };

    // ✅ EDIT FUNGSI handleLogout - POSISI 3
    const handleLogout = async () => {
        // Prevent double-click
        if (logoutButtonState !== 'default' && logoutButtonState !== 'hover') return;

        // Start animation sequence
        setLogoutButtonState('walking1');

        // Animation timing
        const animationSequence = async () => {
            await new Promise(r => setTimeout(r, 300)); // walking1
            setLogoutButtonState('walking2');

            await new Promise(r => setTimeout(r, 400)); // walking2
            setLogoutButtonState('falling1');

            await new Promise(r => setTimeout(r, 400)); // falling1
            setLogoutButtonState('falling2');

            await new Promise(r => setTimeout(r, 300)); // falling2
            setLogoutButtonState('falling3');

            await new Promise(r => setTimeout(r, 500)); // falling3
            setShowLogoutLoader(true);

            await new Promise(r => setTimeout(r, 2000)); // Show loader
            setIsTransitioning(true);

            await new Promise(r => setTimeout(r, 500)); // Transition effect

            // ✅ ACTUAL LOGOUT LOGIC
            try {
                console.log('🚀 Starting logout process...');

                // Save email before clearing
                const userEmail = user?.email;

                // 1. Clear session from database (non-blocking)
                if (userEmail) {
                    console.log('🗑️ Clearing session for:', userEmail);
                    await clearUserSession(userEmail);
                }

                // 2. Clear local state FIRST (prevents stuck loading)
                setUser(null);
                setUsername('');
                setPoints(0);
                setLifetimePoints(0);
                setIsAdmin(false);

                // 3. Sign out from Supabase Auth
                console.log('👋 Signing out from Supabase Auth...');
                const { error } = await supabase.auth.signOut();

                if (error) {
                    console.error('Signout error:', error);
                }

                // 4. Clear any local storage
                localStorage.removeItem('supabase.auth.token');
                sessionStorage.clear();

                // 5. Force redirect (use replace to prevent back button issues)
                console.log('🔄 Redirecting to home...');
                window.location.replace('/');

            } catch (error) {
                console.error('❌ Logout error:', error);

                // Force redirect even if error
                setShowLogoutLoader(false);
                setIsTransitioning(false);
                setLogoutButtonState('default');

                // Still try to redirect
                window.location.replace('/');
            }
        };

        // Run animation sequence
        animationSequence();
    };

    const handleLogoutHover = () => {
        if (logoutButtonState === 'default') {
            setLogoutButtonState('hover');
        }
    };

    const handleLogoutLeave = () => {
        if (logoutButtonState === 'hover') {
            setLogoutButtonState('default');
        }
    };

    // Sisanya tetap sama seperti kode asli...
    const getAnimationStyle = () => {
        const states = {
            'default': {
                '--figure-duration': '100',
                '--transform-figure': 'none',
                '--walking-duration': '100',
                '--transform-arm1': 'none',
                '--transform-wrist1': 'none',
                '--transform-arm2': 'none',
                '--transform-wrist2': 'none',
                '--transform-leg1': 'none',
                '--transform-calf1': 'none',
                '--transform-leg2': 'none',
                '--transform-calf2': 'none'
            },
            'hover': {
                '--figure-duration': '100',
                '--transform-figure': 'translateX(1.5px)',
                '--walking-duration': '100',
                '--transform-arm1': 'rotate(-5deg)',
                '--transform-wrist1': 'rotate(-15deg)',
                '--transform-arm2': 'rotate(5deg)',
                '--transform-wrist2': 'rotate(6deg)',
                '--transform-leg1': 'rotate(-10deg)',
                '--transform-calf1': 'rotate(5deg)',
                '--transform-leg2': 'rotate(20deg)',
                '--transform-calf2': 'rotate(-20deg)'
            },
            'walking1': {
                '--figure-duration': '300',
                '--transform-figure': 'translateX(11px)',
                '--walking-duration': '300',
                '--transform-arm1': 'translateX(-4px) translateY(-2px) rotate(120deg)',
                '--transform-wrist1': 'rotate(-5deg)',
                '--transform-arm2': 'translateX(4px) rotate(-110deg)',
                '--transform-wrist2': 'rotate(-5deg)',
                '--transform-leg1': 'translateX(-3px) rotate(80deg)',
                '--transform-calf1': 'rotate(-30deg)',
                '--transform-leg2': 'translateX(4px) rotate(-60deg)',
                '--transform-calf2': 'rotate(20deg)'
            },
            'walking2': {
                '--figure-duration': '400',
                '--transform-figure': 'translateX(17px)',
                '--walking-duration': '300',
                '--transform-arm1': 'rotate(60deg)',
                '--transform-wrist1': 'rotate(-15deg)',
                '--transform-arm2': 'rotate(-45deg)',
                '--transform-wrist2': 'rotate(6deg)',
                '--transform-leg1': 'rotate(-5deg)',
                '--transform-calf1': 'rotate(10deg)',
                '--transform-leg2': 'rotate(10deg)',
                '--transform-calf2': 'rotate(-20deg)'
            },
            'falling1': {
                '--figure-duration': '1600',
                '--walking-duration': '400',
                '--transform-arm1': 'rotate(-60deg)',
                '--transform-wrist1': 'none',
                '--transform-arm2': 'rotate(30deg)',
                '--transform-wrist2': 'rotate(120deg)',
                '--transform-leg1': 'rotate(-30deg)',
                '--transform-calf1': 'rotate(-20deg)',
                '--transform-leg2': 'rotate(20deg)'
            },
            'falling2': {
                '--walking-duration': '300',
                '--transform-arm1': 'rotate(-100deg)',
                '--transform-arm2': 'rotate(-60deg)',
                '--transform-wrist2': 'rotate(60deg)',
                '--transform-leg1': 'rotate(80deg)',
                '--transform-calf1': 'rotate(20deg)',
                '--transform-leg2': 'rotate(-60deg)'
            },
            'falling3': {
                '--walking-duration': '500',
                '--transform-arm1': 'rotate(-30deg)',
                '--transform-wrist1': 'rotate(40deg)',
                '--transform-arm2': 'rotate(50deg)',
                '--transform-wrist2': 'none',
                '--transform-leg1': 'rotate(-30deg)',
                '--transform-leg2': 'rotate(20deg)',
                '--transform-calf2': 'none'
            }
        };
        return states[logoutButtonState] || states['default'];
    };

    const getButtonClasses = () => {
        let classes = 'animated-logout-button';
        if (logoutButtonState === 'walking1' || logoutButtonState === 'walking2') {
            classes += ' clicked';
        }
        if (logoutButtonState === 'walking2' || logoutButtonState.includes('falling')) {
            classes += ' door-slammed';
        }
        if (logoutButtonState.includes('falling')) {
            classes += ' falling';
        }
        return classes;
    };

    if (isLoadingAuth) {
        console.log('Still loading auth...');
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F7FEE7] to-[#D9F99D]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-condensed">Loading...</p>
                </div>
            </div>
        );
    }

    console.log('Rendering Home with user:', user?.email);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F7FEE7] to-[#D9F99D] p-4">
            {/* ✅ SIDEBAR STYLES */}
            <style jsx>{`
                /* Original logout button styles + sidebar styles */
                @keyframes fadeInOut {
                    0% { opacity: 0; }
                    50% { opacity: 0.3; }
                    100% { opacity: 1; }
                }

                .animated-logout-button {
                    --figure-duration: 100ms;
                    --transform-figure: none;
                    --walking-duration: 100ms;
                    --transform-arm1: none;
                    --transform-wrist1: none;
                    --transform-arm2: none;
                    --transform-wrist2: none;
                    --transform-leg1: none;
                    --transform-calf1: none;
                    --transform-leg2: none;
                    --transform-calf2: none;

                    background: #ef4444;
                    border: 0;
                    color: #ffffff;
                    cursor: pointer;
                    display: block;
                    font-family: inherit;
                    font-size: 14px;
                    font-weight: 500;
                    height: 40px;
                    outline: none;
                    padding: 0 0 0 20px;
                    perspective: 100px;
                    position: relative;
                    text-align: left;
                    width: 120px;
                    border-radius: 12px;
                    transition: all 0.2s ease;
                    -webkit-tap-highlight-color: transparent;
                }

                .animated-logout-button::before {
                    background-color: #dc2626;
                    border-radius: 12px;
                    content: '';
                    display: block;
                    height: 100%;
                    left: 0;
                    position: absolute;
                    top: 0;
                    transform: none;
                    transition: transform 50ms ease;
                    width: 100%;
                    z-index: 2;
                }

                .animated-logout-button:hover .door {
                    transform: rotateY(20deg);
                }

                .animated-logout-button:active::before {
                    transform: scale(.96);
                }

                .animated-logout-button:active .door {
                    transform: rotateY(28deg);
                }

                .animated-logout-button.clicked::before {
                    transform: none;
                }

                .animated-logout-button.clicked .door {
                    transform: rotateY(35deg);
                }

                .animated-logout-button.door-slammed .door {
                    transform: none;
                    transition: transform 100ms ease-in 250ms;
                }

                .animated-logout-button.falling {
                    animation: shake 200ms linear;
                }

                .animated-logout-button.falling .bang {
                    animation: flash 300ms linear;
                }

                .animated-logout-button.falling .figure {
                    animation: spin 1000ms infinite linear;
                    bottom: -1080px;
                    opacity: 0;
                    right: 1px;
                    transition: transform calc(var(--figure-duration) * 1ms) linear,
                        bottom calc(var(--figure-duration) * 1ms) cubic-bezier(0.7, 0.1, 1, 1) 100ms,
                        opacity calc(var(--figure-duration) * 0.25ms) linear calc(var(--figure-duration) * 0.75ms);
                    z-index: 1;
                }

                .button-text {
                    color: #ffffff;
                    font-weight: 500;
                    position: relative;
                    z-index: 10;
                }

                .logout-svg {
                    display: block;
                    position: absolute;
                }

                .figure {
                    bottom: 5px;
                    fill: #ffffff;
                    right: 18px;
                    transform: var(--transform-figure);
                    transition: transform calc(var(--figure-duration) * 1ms) cubic-bezier(0.2, 0.1, 0.80, 0.9);
                    width: 24px;
                    z-index: 4;
                }

                .door, .doorway {
                    bottom: 4px;
                    fill: #ffffff;
                    right: 12px;
                    width: 26px;
                }

                .door {
                    transform: rotateY(20deg);
                    transform-origin: 100% 50%;
                    transform-style: preserve-3d;
                    transition: transform 200ms ease;
                    z-index: 5;
                }

                .door path {
                    fill: #ef4444;
                    stroke: #ef4444;
                    stroke-width: 4;
                }

                .doorway {
                    z-index: 3;
                }

                .bang {
                    opacity: 0;
                }

                .arm1, .wrist1, .arm2, .wrist2, .leg1, .calf1, .leg2, .calf2 {
                    transition: transform calc(var(--walking-duration) * 1ms) ease-in-out;
                }

                .arm1 {
                    transform: var(--transform-arm1);
                    transform-origin: 52% 45%;
                }

                .wrist1 {
                    transform: var(--transform-wrist1);
                    transform-origin: 59% 55%;
                }

                .arm2 {
                    transform: var(--transform-arm2);
                    transform-origin: 47% 43%;
                }

                .wrist2 {
                    transform: var(--transform-wrist2);
                    transform-origin: 35% 47%;
                }

                .leg1 {
                    transform: var(--transform-leg1);
                    transform-origin: 47% 64.5%;
                }

                .calf1 {
                    transform: var(--transform-calf1);
                    transform-origin: 55.5% 71.5%;
                }

                .leg2 {
                    transform: var(--transform-leg2);
                    transform-origin: 43% 63%;
                }

                .calf2 {
                    transform: var(--transform-calf2);
                    transform-origin: 41.5% 73%;
                }

                @keyframes spin {
                    from { transform: rotate(0deg) scale(0.94); }
                    to { transform: rotate(359deg) scale(0.94); }
                }

                @keyframes shake {
                    0% { transform: rotate(-1deg); }
                    50% { transform: rotate(2deg); }
                    100% { transform: rotate(-1deg); }
                }

                @keyframes flash {
                    0% { opacity: 0.4; }
                    100% { opacity: 0; }
                }

                /* ✅ SIDEBAR STYLES */
                .challenge-button {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 16px 20px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    text-decoration: none;
                    color: inherit;
                }

                .challenge-button:hover {
                    border-color: #cbd5e1;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                    transform: translateY(-1px);
                }

                .challenge-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .trophy-icon {
                    width: 40px;
                    height: 40px;
                    background: linear-gradient(135deg, #f59e0b, #d97706);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.25);
                }

                .challenge-info {
                    flex: 1;
                }

                .challenge-title {
                    color: #1e293b;
                    font-weight: 700;
                    font-size: 15px;
                    margin-bottom: 4px;
                    letter-spacing: 0.8px;
                    text-transform: uppercase;
                }

                .challenge-time {
                    color: #64748b;
                    font-size: 13px;
                    font-weight: 500;
                }

                .challenge-arrow {
                    color: #94a3b8;
                    font-size: 18px;
                    transition: all 0.2s ease;
                }

                .challenge-button:hover .challenge-arrow {
                    color: #64748b;
                    transform: translateX(2px);
                }

                /* Ad Slots Styling */
                .ad-slot {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
                    transition: all 0.2s ease;
                }

                .ad-slot:hover {
                    border-color: #cbd5e1;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                }

                .ad-label {
                    background: #f1f5f9;
                    color: #64748b;
                    font-size: 10px;
                    padding: 4px 12px;
                    text-transform: uppercase;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                    border-bottom: 1px solid #e2e8f0;
                }

                .ad-content {
                    padding: 16px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .ad-content:hover {
                    background: #f8fafc;
                }

                .ad-placeholder {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .ad-placeholder.compact {
                    gap: 8px;
                }

                .ad-icon {
                    font-size: 24px;
                    flex-shrink: 0;
                }

                .ad-icon.large {
                    font-size: 32px;
                }

                .ad-text {
                    flex: 1;
                    min-width: 0;
                }

                .ad-title {
                    color: #1e293b;
                    font-weight: 600;
                    font-size: 14px;
                    margin-bottom: 2px;
                }

                .ad-subtitle {
                    color: #64748b;
                    font-size: 12px;
                    line-height: 1.3;
                }

                .ad-cta {
                    background: #3b82f6;
                    color: white;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 600;
                    margin-top: 8px;
                    display: inline-block;
                    transition: all 0.2s ease;
                }

                .ad-cta:hover {
                    background: #2563eb;
                    transform: translateY(-1px);
                }

                /* Square Ad Special Layout */
                .square-ad .ad-content {
                    text-align: center;
                    padding: 20px 16px;
                }

                .square-ad .ad-placeholder {
                    flex-direction: column;
                    gap: 8px;
                }

                .square-ad .ad-title {
                    font-size: 15px;
                    margin-bottom: 4px;
                }

                .square-ad .ad-subtitle {
                    margin-bottom: 8px;
                }

                /* Compact Ad */
                .compact-ad .ad-content {
                    padding: 12px 16px;
                }

                .compact-ad .ad-title {
                    font-size: 13px;
                }

                .compact-ad .ad-subtitle {
                    font-size: 11px;
                }

                .mobile-challenge-section {
                    display: none;
                }

                /* Responsive Sidebar */
                @media (max-width: 1024px) {
                    .main-layout {
                        flex-direction: column;
                    }
                    
                    .right-sidebar {
                        width: 100% !important;
                        border-left: none;
                        border-top: 1px solid #e2e8f0;
                        display: flex;
                        flex-direction: row;
                        overflow-x: auto;
                        gap: 12px;
                        padding: 16px 20px;
                    }

                    .sidebar-item {
                        flex-shrink: 0;
                        min-width: 250px;
                    }
                }

                @media (max-width: 768px) {
                    .mobile-challenge-section {
                        display: block !important;
                    }
    
                    .right-sidebar {
                        display: none !important;
                    }

                    .challenge-button {
                        padding: 14px 16px;
                    }

                    .challenge-title {
                         font-size: 14px;
                    }

                    .challenge-time {
                        font-size: 12px;
                    }
                }

                /* ✅ SMOOTH MODAL ANIMATIONS */
                @keyframes fadeIn {
                    from { 
                        opacity: 0;
                        backdrop-filter: blur(0px);
                    }
                    to { 
                        opacity: 1;
                        backdrop-filter: blur(8px);
                    }
                }

                @keyframes scaleIn {
                    from { 
                        opacity: 0;
                        transform: scale(0.8) translateY(20px);
                    }
                    to { 
                        opacity: 1;
                        transform: scale(1) translateY(0px);
                    }
                }

                @keyframes slideDown {
                    from { 
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes fadeInUp {
                    from { 
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes bounceSlowly {
                    0%, 20%, 50%, 80%, 100% {
                        transform: translateY(0);
                    }
                    40% {
                        transform: translateY(-8px);
                    }
                    60% {
                        transform: translateY(-4px);
                    }
                }

                .animate-fade-in {
                    animation: fadeIn 0.3s ease-out forwards;
                }

                .animate-scale-in {
                    animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }

                .animate-slide-down {
                    animation: slideDown 0.5s ease-out forwards;
                }

                .animate-fade-in-up {
                    animation: fadeInUp 0.6s ease-out 0.2s forwards;
                    opacity: 0;
                }

                .animate-bounce-slow {
                    animation: bounceSlowly 2s infinite;
                }

                /* Custom Scrollbar */
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }

                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: linear-gradient(180deg, #ff6b6b, #ffa8a8);
                    border-radius: 10px;
                    transition: all 0.3s ease;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(180deg, #ff5252, #ff8a80);
                }

                /* Smooth backdrop blur */
                .animate-fade-in {
                    backdrop-filter: blur(8px);
                    transition: backdrop-filter 0.3s ease;
                }

                /* Modal entrance transitions */
                .animate-scale-in {
                    transform-origin: center center;
                }

                /* Hover effects untuk interactivity */
                .challenge-modal-content {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .challenge-modal-content:hover {
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                }

                /* ✅ EXIT ANIMATIONS */
                @keyframes fadeOut {
                    from { 
                        opacity: 1;
                        backdrop-filter: blur(8px);
                    }
                    to { 
                        opacity: 0;
                        backdrop-filter: blur(0px);
                    }
                }

                @keyframes scaleOut {
                    from { 
                        opacity: 1;
                        transform: scale(1) translateY(0px);
                    }
                    to { 
                        opacity: 0;
                        transform: scale(0.8) translateY(-20px);
                    }
                }

                @keyframes slideUp {
                    from { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                    to { 
                        opacity: 0;
                        transform: translateY(-30px);
                    }
                }

                @keyframes fadeOutDown {
                    from { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                    to { 
                        opacity: 0;
                        transform: translateY(20px);
                    }
                }

                @keyframes spinOut {
                    from { 
                        transform: rotate(0deg) scale(1);
                    }
                    to { 
                        transform: rotate(180deg) scale(0.5);
                    }
                }

                @keyframes pulseOnHover {
                    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                    70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }

                /* Exit Animation Classes */
                .animate-fade-out {
                    animation: fadeOut 0.3s ease-in forwards;
                }

                .animate-scale-out {
                    animation: scaleOut 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
                }

                .animate-slide-up {
                    animation: slideUp 0.3s ease-in forwards;
                }

                .animate-fade-out-down {
                    animation: fadeOutDown 0.5s ease-in forwards;
                }

                .animate-spin-out {
                    animation: spinOut 0.4s ease-in forwards;
                }

                .animate-pulse-on-hover:hover {
                    animation: pulseOnHover 1.5s infinite;
                }

                /* Enhanced Button Transitions */
                .animate-pulse-on-hover {
                    position: relative;
                    overflow: hidden;
                }

                .animate-pulse-on-hover::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
                    transform: scale(0);
                    transition: transform 0.3s ease;
                }

                .animate-pulse-on-hover:hover::before {
                    transform: scale(1);
                }

                /* Smooth Close Button Effects */
                .animate-pulse-on-hover:active {
                    transform: scale(0.9) rotate(90deg);
                    transition: all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
            `}</style>

            {/* Soccer Ball Logout Loading Overlay */}
            {showLogoutLoader && (
                <div className={`fixed inset-0 bg-black flex items-center justify-center z-50 transition-all duration-700 ${isTransitioning ? 'bg-opacity-100' : 'bg-opacity-70'}`}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 flex flex-col items-center shadow-2xl">
                        <div className="mb-4">
                            {/* Soccer Ball Animation */}
                            <div className="relative w-20 h-20">
                                <div className="absolute inset-0 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                <div className="absolute inset-2 border-2 border-red-400 border-b-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
                                <div className="absolute inset-4 border-2 border-blue-400 border-l-transparent rounded-full animate-spin" style={{ animationDuration: '1.2s' }}></div>
                                <div className="absolute inset-6 w-8 h-8 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                                    <span className="text-lg">⚽</span>
                                </div>
                            </div>
                        </div>
                        <h3 className={`text-lg font-semibold mb-2 transition-all duration-300 ${isTransitioning ? 'text-green-600' : 'text-gray-800 dark:text-white'}`}>
                            {isTransitioning ? 'Goodbye!' : 'Logging Out...'}
                        </h3>
                        <p className={`text-sm text-center transition-all duration-300 ${isTransitioning ? 'text-green-500' : 'text-gray-600'}`}>
                            {isTransitioning ? 'Sampai jumpa lagi! ⚽' : 'Terima kasih telah bermain!'}
                        </p>
                        <div className="mt-3 flex space-x-1">
                            <div className={`w-2 h-2 bg-green-500 rounded-full ${isTransitioning ? 'animate-ping' : 'animate-bounce'}`}></div>
                            <div className={`w-2 h-2 bg-green-500 rounded-full ${isTransitioning ? 'animate-ping' : 'animate-bounce'}`} style={{ animationDelay: '0.1s' }}></div>
                            <div className={`w-2 h-2 bg-green-500 rounded-full ${isTransitioning ? 'animate-ping' : 'animate-bounce'}`} style={{ animationDelay: '0.2s' }}></div>
                        </div>
                    </div>

                    {isTransitioning && (
                        <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 opacity-0 animate-pulse"
                            style={{
                                animation: 'fadeInOut 0.8s ease-in-out forwards'
                            }}>
                        </div>
                    )}
                </div>
            )}

            {/* ✅ MAIN LAYOUT WITH SIDEBAR */}
            <div className="max-w-7xl mx-auto">
                {/* ✅ REORGANIZED HEADER - Keep All Features */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white dark:bg-gray-800 dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden mb-6"
                >
                    {/* Top Section - Logo & User Info */}
                    <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 sm:p-6">
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">

                            {/* Logo Section */}
                            <div className="flex items-center gap-3">
                                <img
                                    src="/images/NobarMeriahLogoIcon.png"
                                    alt="NobarMeriah Logo"
                                    className="w-12 h-12 rounded-lg object-cover bg-white dark:bg-gray-800 p-1"
                                />
                                <div>
                                    <img
                                        src="/images/NobarMeriahLogoText.png"
                                        alt="NobarMeriah Logo"
                                        className="h-6 w-auto object-contain max-w-[250px] brightness-0 invert"
                                    />
                                    <p className="text-sm text-green-100 font-condensed">Live Football Scores and Streaming</p>
                                </div>
                            </div>

                            {/* User Section */}
                            <div className="flex-1 lg:max-w-md">
                                {user ? (
                                    <>
                                        {/* Mobile: User info centered */}
                                        <div className="text-center lg:text-right mb-4 lg:mb-0">
                                            <div className="flex items-center justify-center lg:justify-end gap-2 mb-1">
                                                <div className="w-8 h-8 bg-white dark:bg-gray-800/20 rounded-full flex items-center justify-center">
                                                    <span className="text-sm">👤</span>
                                                </div>
                                                <p className="font-semibold font-condensed">
                                                    Halo, {username || user.email}!
                                                </p>
                                            </div>
                                            <p className="text-green-100 text-sm font-condensed">
                                                {points} pts • Total: {lifetimePoints} pts
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center">
                                        <p className="text-green-100 mb-3 font-condensed">Belum login</p>
                                        <button
                                            onClick={handleAuthRedirect}
                                            className="bg-white dark:bg-gray-800 text-green-600 hover:bg-green-50 px-6 py-2 rounded-xl font-condensed transition-all duration-200 transform hover:scale-105 shadow-lg"
                                        >
                                            🔐 Masuk / Daftar
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section - Action Buttons */}
                    {user && (
                        <div className="bg-gray-50 dark:bg-gray-800 p-4">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

                                {/* Stats Cards */}
                                <div className="flex gap-3 order-2 sm:order-1">
                                    <div className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-3 py-2 rounded-lg font-condensed flex items-center gap-2">
                                        <span className="text-lg">🎯</span>
                                        <div>
                                            <div className="text-xs font-medium">Aktif</div>
                                            <div className="font-bold">{points} pts</div>
                                        </div>
                                    </div>

                                    <div className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-3 py-2 rounded-lg font-condensed flex items-center gap-2">
                                        <span className="text-lg">🏆</span>
                                        <div>
                                            <div className="text-xs font-medium">Total</div>
                                            <div className="font-bold">{lifetimePoints} pts</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 flex-wrap order-1 sm:order-2">
                                    {isAdmin && (
                                        <button
                                            onClick={() => navigate('/admin-panel')}
                                            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-condensed transition-all duration-200 transform hover:scale-105"
                                        >
                                            <span className="hidden sm:inline">⚙️ Admin</span>
                                            <span className="sm:hidden">⚙️</span>
                                        </button>
                                    )}

                                    <button
                                        onClick={() => setShowProfile(true)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-condensed transition-all duration-200 transform hover:scale-105"
                                    >
                                        <span className="hidden sm:inline">👤 Profil</span>
                                        <span className="sm:hidden">👤</span>
                                    </button>

                                    <button
                                        onClick={() => navigate('/reward-shop')}
                                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-lg text-sm font-condensed transition-all duration-200 transform hover:scale-105"
                                    >
                                        <span className="hidden sm:inline">🎁 Reward</span>
                                        <span className="sm:hidden">🎁</span>
                                    </button>

                                    <button
                                        onClick={() => setShowHistory(true)}
                                        className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white dark:text-gray-200 px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-condensed transition-all duration-200"
                                    >
                                        <span className="hidden sm:inline">📜 Riwayat</span>
                                        <span className="sm:hidden">📜</span>
                                    </button>

                                    {/* Logout Button - Keep Original Animation */}
                                    <button
                                        onClick={handleLogout}
                                        onMouseEnter={handleLogoutHover}
                                        onMouseLeave={handleLogoutLeave}
                                        className={`${getButtonClasses()} !w-20 !h-8 !text-xs sm:!w-28 sm:!h-10 sm:!text-sm`}
                                        style={getAnimationStyle()}
                                        disabled={logoutButtonState !== 'default' && logoutButtonState !== 'hover'}
                                    >
                                        <svg className="logout-svg doorway" viewBox="0 0 100 100">
                                            <path d="M93.4 86.3H58.6c-1.9 0-3.4-1.5-3.4-3.4V17.1c0-1.9 1.5-3.4 3.4-3.4h34.8c1.9 0 3.4 1.5 3.4 3.4v65.8c0 1.9-1.5 3.4-3.4 3.4z" />
                                            <path className="bang" d="M40.5 43.7L26.6 31.4l-2.5 6.7zM41.9 50.4l-19.5-4-1.4 6.3zM40 57.4l-17.7 3.9 3.9 5.7z" />
                                        </svg>

                                        <svg className="logout-svg figure" viewBox="0 0 100 100">
                                            <circle cx="52.1" cy="32.4" r="6.4" />
                                            <path d="M50.7 62.8c-1.2 2.5-3.6 5-7.2 4-3.2-.9-4.9-3.5-4-7.8.7-3.4 3.1-13.8 4.1-15.8 1.7-3.4 1.6-4.6 7-3.7 4.3.7 4.6 2.5 4.3 5.4-.4 3.7-2.8 15.1-4.2 17.9z" />
                                            <g className="arm1">
                                                <path d="M55.5 56.5l-6-9.5c-1-1.5-.6-3.5.9-4.4 1.5-1 3.7-1.1 4.6.4l6.1 10c1 1.5.3 3.5-1.1 4.4-1.5.9-3.5.5-4.5-.9z" />
                                                <path className="wrist1" d="M69.4 59.9L58.1 58c-1.7-.3-2.9-1.9-2.6-3.7.3-1.7 1.9-2.9 3.7-2.6l11.4 1.9c1.7.3 2.9 1.9 2.6 3.7-.4 1.7-2 2.9-3.8 2.6z" />
                                            </g>
                                            <g className="arm2">
                                                <path d="M34.2 43.6L45 40.3c1.7-.6 3.5.3 4 2 .6 1.7-.3 4-2 4.5l-10.8 2.8c-1.7.6-3.5-.3-4-2-.6-1.6.3-3.4 2-4z" />
                                                <path className="wrist2" d="M27.1 56.2L32 45.7c.7-1.6 2.6-2.3 4.2-1.6 1.6.7 2.3 2.6 1.6 4.2L33 58.8c-.7 1.6-2.6 2.3-4.2 1.6-1.7-.7-2.4-2.6-1.7-4.2z" />
                                            </g>
                                            <g className="leg1">
                                                <path d="M52.1 73.2s-7-5.7-7.9-6.5c-.9-.9-1.2-3.5-.1-4.9 1.1-1.4 3.8-1.9 5.2-.9l7.9 7c1.4 1.1 1.7 3.5.7 4.9-1.1 1.4-4.4 1.5-5.8.4z" />
                                                <path className="calf1" d="M52.6 84.4l-1-12.8c-.1-1.9 1.5-3.6 3.5-3.7 2-.1 3.7 1.4 3.8 3.4l1 12.8c.1 1.9-1.5 3.6-3.5 3.7-2 0-3.7-1.5-3.8-3.4z" />
                                            </g>
                                            <g className="leg2">
                                                <path d="M37.8 72.7s1.3-10.2 1.6-11.4 2.4-2.8 4.1-2.6c1.7.2 3.6 2.3 3.4 4l-1.8 11.1c-.2 1.7-1.7 3.3-3.4 3.1-1.8-.2-4.1-2.4-3.9-4.2z" />
                                                <path className="calf2" d="M29.5 82.3l9.6-10.9c1.3-1.4 3.6-1.5 5.1-.1 1.5 1.4.4 4.9-.9 6.3l-8.5 9.6c-1.3 1.4-3.6 1.5-5.1.1-1.4-1.3-1.5-3.5-.2-5z" />
                                            </g>
                                        </svg>

                                        <svg className="logout-svg door" viewBox="0 0 100 100">
                                            <path d="M93.4 86.3H58.6c-1.9 0-3.4-1.5-3.4-3.4V17.1c0-1.9 1.5-3.4 3.4-3.4h34.8c1.9 0 3.4 1.5 3.4 3.4v65.8c0 1.9-1.5 3.4-3.4 3.4z" />
                                            <circle cx="66" cy="50" r="3.7" />
                                        </svg>

                                        <span className="button-text">
                                            <span className="hidden sm:inline">Logout</span>
                                            <span className="sm:hidden">Out</span>
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Info Banner for Non-logged Users - Keep Original */}
                    {!user && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                            className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-400 p-4"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">ℹ️</span>
                                <div>
                                    <h3 className="font-condensed text-blue-800 dark:text-blue-200">Selamat Datang Di NobarMeriah</h3>
                                    <p className="text-sm text-blue-600 dark:text-blue-300 font-condensed">
                                        Kamu bisa lihat semua pertandingan dan streaming langsung.
                                        <span className="font-condensed"> Login untuk mulai tebak skor dan dapatkan poin!</span>
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </motion.div>

                {/* ✅ MAIN CONTENT WITH SIDEBAR LAYOUT */}
                <div className="main-layout flex gap-6">

                    {/* ✅ TAMBAHKAN MOBILE CHALLENGE DI SINI */}
                    {/* Mobile Challenge Button */}
                    <div className="mobile-challenge-section mb-4 md:hidden">
                        <div
                            className="challenge-button"
                            onClick={handleChallengeClick}
                        >
                            <div className="challenge-left">
                                <div className="trophy-icon">🏆</div>
                                <div className="challenge-info">
                                    <div className="challenge-title font-condensed">SEASON CHALLENGE</div>
                                    <div className="challenge-time font-condensed">Season 1</div>
                                </div>
                            </div>
                            <div className="challenge-arrow">›</div>
                        </div>
                    </div>
                    {/* Main Content - MatchList */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="flex-1 bg-white dark:bg-gray-800 dark:bg-gray-900 rounded-2xl shadow-xl p-6"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-2xl">📅</span>
                            <h2 className="text-2xl font-condensed text-gray-800 dark:text-white dark:text-white">
                                Jadwal Pertandingan
                            </h2>
                        </div>

                        <MatchList
                            user={user}
                            username={username}
                            onAuthRequired={handleAuthRedirect}
                        />
                    </motion.div>

                    {/* ✅ RIGHT SIDEBAR */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="right-sidebar w-80 flex flex-col gap-4"
                        style={{ width: '320px' }}
                    >
                        {/* Challenge Button */}
                        <div className="sidebar-item">
                            <div
                                className="challenge-button"
                                onClick={handleChallengeClick}
                            >
                                <div className="challenge-left">
                                    <div className="trophy-icon">🏆</div>
                                    <div className="challenge-info">
                                        <div className="challenge-info">
                                            <div className="challenge-title font-condensed">SEASON CHALLENGE</div>
                                            <div className="challenge-time font-condensed">{formatChallengeTime()}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="challenge-arrow">›</div>
                            </div>
                        </div>

                        {/* Ad Slot 1 - Banner Style */}
                        <div className="sidebar-item">
                            <div className="ad-slot banner-ad">
                                <div className="ad-label">Sponsored</div>
                                <div className="ad-content" onClick={() => handleSidebarAdClick('Streaming')}>
                                    <div className="ad-placeholder">
                                        <span className="ad-icon">📺</span>
                                        <div className="ad-text">
                                            <div className="ad-title font-condensed">Streaming Gratis</div>
                                            <div className="ad-subtitle font-condensed">Nonton pertandingan live HD</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Ad Slot 2 - Square Style */}
                        <div className="sidebar-item">
                            <div className="ad-slot square-ad">
                                <div className="ad-label">Advertisement</div>
                                <div className="ad-content square" onClick={() => handleSidebarAdClick('Sports Store')}>
                                    <div className="ad-placeholder">
                                        <span className="ad-icon large">⚽</span>
                                        <div className="ad-title">Sepatu Bola</div>
                                        <div className="ad-subtitle">Diskon 50% - Terbatas!</div>
                                        <div className="ad-cta">Shop Now</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Ad Slot 3 - Compact Style */}
                        <div className="sidebar-item">
                            <div className="ad-slot compact-ad">
                                <div className="ad-label">Ads</div>
                                <div className="ad-content" onClick={() => handleSidebarAdClick('Fantasy Football')}>
                                    <div className="ad-placeholder compact">
                                        <span className="ad-icon">🎮</span>
                                        <div className="ad-text">
                                            <div className="ad-title">Fantasy Football</div>
                                            <div className="ad-subtitle">Join tournament sekarang!</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Call to Action */}
                {!user && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="mt-6 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-xl p-8 text-center text-white"
                    >
                        <h3 className="text-2xl font-condensed mb-4">🎯 Siap Mulai Tebak Skor?</h3>
                        <p className="text-green-100 mb-6 max-w-2xl mx-auto">
                            Bergabunglah dengan ribuan pemain lain dan buktikan kemampuan prediksi sepak bola kamu!
                            Dapatkan poin dari setiap tebakan yang benar dan tukarkan dengan hadiah menarik.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
                            <button
                                onClick={handleAuthRedirect}
                                className="w-full sm:w-auto bg-white dark:bg-gray-800 text-green-600 hover:text-green-700 px-8 py-3 rounded-xl font-condensed transition-all duration-200 transform hover:scale-105 shadow-lg"
                            >
                                🚀 Mulai Sekarang
                            </button>

                            <div className="flex items-center gap-4 text-green-100 text-sm">
                                <span className="flex items-center gap-1">✅ Gratis</span>
                                <span className="flex items-center gap-1">⚡ Instan</span>
                                <span className="flex items-center gap-1">🎁 Reward</span>
                            </div>
                        </div>
                    </motion.div>
                )}

                {showAdPopup && currentAdImage && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                        <div className="relative max-w-md w-full">
                            {/* Close Button */}
                            <button
                                onClick={handleCloseAd}
                                className="absolute -top-3 -right-3 w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full z-10 flex items-center justify-center font-condensed text-lg shadow-lg transition-all hover:scale-110"
                                aria-label="Close Ad"
                            >
                                ✕
                            </button>

                            {/* Ad Image Container */}
                            <div
                                className="relative rounded-2xl overflow-hidden shadow-2xl cursor-pointer transform hover:scale-105 transition-all duration-300"
                                onClick={() => handleAdClick(currentAdImage)}
                            >
                                {/* Main Ad Image */}
                                <img
                                    src={currentAdImage.src}
                                    alt={currentAdImage.alt}
                                    className="w-full h-auto max-h-[80vh] object-contain bg-white dark:bg-gray-800"
                                    onError={(e) => {
                                        console.error('❌ Ad image failed to load:', currentAdImage.src);
                                        // Fallback or hide popup
                                        setShowAdPopup(false);
                                    }}
                                    loading="eager"
                                />

                                {/* Optional: Click indicator overlay */}
                                <div className="absolute inset-0 bg-transparent hover:bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-300">
                                    <div className="bg-white dark:bg-gray-800/90 backdrop-blur-sm px-4 py-2 rounded-full text-gray-800 dark:text-white font-semibold text-sm">
                                        👆 Klik untuk info lebih lanjut
                                    </div>
                                </div>
                            </div>

                            {/* Optional: Small info text below image */}
                            <div className="text-center mt-3">
                                <p className="text-white/80 text-xs">
                                    Sponsored • Klik gambar untuk detail
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Challenge Page Modal */}
                {showChallenge && (
                    <div className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 ${challengeClosing ? 'animate-fade-out' : 'animate-fade-in'}`}>
                        <div className={`relative w-full max-w-6xl max-h-[90vh] overflow-hidden ${challengeClosing ? 'animate-scale-out' : 'animate-scale-in'}`}>
                            <ChallengePage
                                onClose={handleCloseChallenge}
                                user={user}
                                username={username}
                                points={points}
                                lifetimePoints={lifetimePoints}
                            />
                        </div>
                    </div>
                )}

                {/* Modals */}
                <UserProfileModal
                    isOpen={showProfile}
                    onClose={() => setShowProfile(false)}
                    user={user}
                />

                <RewardHistoryModal
                    isOpen={showHistory}
                    onClose={() => setShowHistory(false)}
                    user={user}
                />

                <LoginRequiredModal
                    isOpen={showLoginModal}
                    onClose={() => setShowLoginModal(false)}
                    onLogin={() => {
                        setShowLoginModal(false);
                        navigate('/auth');
                    }}
                />
            </div>
        </div>
    );
}

export default Home;