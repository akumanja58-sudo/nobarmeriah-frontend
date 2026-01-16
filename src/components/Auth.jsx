import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../utils/supabaseClient';

const Auth = () => {
    const router = useRouter();
    const [activeForm, setActiveForm] = useState('login'); // 'login', 'register'

    const getDeviceInfo = () => {
        const ua = navigator.userAgent;
        let browser = "Unknown";
        let os = "Unknown";

        if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
        else if (ua.includes("Firefox")) browser = "Firefox";
        else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
        else if (ua.includes("Edg")) browser = "Edge";

        if (ua.includes("Windows")) os = "Windows";
        else if (ua.includes("Mac")) os = "MacOS";
        else if (ua.includes("Linux")) os = "Linux";
        else if (ua.includes("Android")) os = "Android";
        else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

        return `${browser} on ${os}`;
    };

    const checkSession = async (email) => {
        try {
            console.log('🔍 DETAILED: Checking active session for:', email);
            console.log('🔍 Email lowercase:', email.toLowerCase());

            // Query dengan debugging lebih detail
            const { data: existingSession, error, count } = await supabase
                .from('active_sessions')
                .select('*', { count: 'exact' })
                .eq('account_email', email.toLowerCase())
                .order('login_time', { ascending: false });

            console.log('📊 Query result:', {
                data: existingSession,
                error: error,
                count: count,
                totalRecords: existingSession?.length || 0
            });

            if (error) {
                console.error('❌ Database error:', error);
                return false; // Kalau error, allow login
            }

            // Debug: Tampilkan semua records di table
            const { data: allSessions } = await supabase
                .from('active_sessions')
                .select('*');
            console.log('🗂️ ALL sessions in table:', allSessions);

            if (!existingSession || existingSession.length === 0) {
                console.log('✅ No active session found for this email - ALLOW LOGIN');
                return false;
            }

            // Ada session ditemukan
            const session = existingSession[0];
            console.log('🚨 ACTIVE SESSION FOUND:', {
                email: session.account_email,
                userId: session.current_user_id,
                device: session.device_info,
                loginTime: session.login_time,
                lastActivity: session.last_activity
            });

            // Optional: Check if session expired (24 hours)
            const loginTime = new Date(session.login_time);
            const now = new Date();
            const sessionDuration = 24 * 60 * 60 * 1000; // 24 jam
            const isExpired = (now - loginTime) > sessionDuration;

            console.log('⏰ Session time check:', {
                loginTime: loginTime.toISOString(),
                now: now.toISOString(),
                ageInHours: Math.round((now - loginTime) / (1000 * 60 * 60)),
                isExpired: isExpired
            });

            if (isExpired) {
                console.log('⏰ Session expired, cleaning up and ALLOW LOGIN');
                await supabase
                    .from('active_sessions')
                    .delete()
                    .eq('id', session.id);
                return false;
            }

            console.log('🚫 ACTIVE SESSION EXISTS - BLOCK LOGIN!');
            return true;

        } catch (err) {
            console.error('💥 checkSession unexpected error:', err);
            return false;
        }
    };

    const createUserSession = async (email, userId) => {
        try {
            console.log('💾 Creating session for:', email, 'userId:', userId);

            // 1. HAPUS semua session lama untuk email ini
            console.log('🗑️ Deleting old sessions for:', email);
            const { error: deleteError, count: deletedCount } = await supabase
                .from('active_sessions')
                .delete({ count: 'exact' })
                .eq('account_email', email.toLowerCase());

            console.log('🗑️ Deleted sessions:', { error: deleteError, count: deletedCount });

            // 2. Buat session baru
            console.log('➕ Creating new session...');
            const newSession = {
                account_email: email.toLowerCase(),
                current_user_id: userId,
                device_info: getDeviceInfo(),
                ip_address: 'unknown',
                login_time: new Date().toISOString(),
                last_activity: new Date().toISOString()
            };

            console.log('📝 New session data:', newSession);

            const { data: insertedData, error: insertError } = await supabase
                .from('active_sessions')
                .insert(newSession)
                .select();

            if (insertError) {
                console.error('❌ Session creation error:', insertError);
                return false;
            }

            console.log('✅ New session created successfully:', insertedData);
            return true;

        } catch (err) {
            console.error('💥 Session creation unexpected error:', err);
            return false;
        }
    };

    const clearUserSession = async (email) => {
        try {
            console.log('🧹 Clearing session for:', email);

            const { error } = await supabase
                .from('active_sessions')
                .delete()
                .eq('account_email', email.toLowerCase());

            if (error) {
                console.error('❌ Error clearing session:', error);
                return false;
            }

            console.log('✅ Session cleared successfully');
            return true;
        } catch (err) {
            console.error('💥 Clear session error:', err);
            return false;
        }
    };

    // Login State
    const [loginData, setLoginData] = useState({
        username: '',
        password: '',
        showPassword: false,
        errorMsg: ''
    });

    // Register State
    const [registerData, setRegisterData] = useState({
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        phone: '',
        showPassword: false,
        showConfirm: false,
        errorMsg: '',
        successMsg: ''
    });

    // Loading states for login, register, and reset
    const [isLoadingLogin, setIsLoadingLogin] = useState(false);
    const [isLoadingRegister, setIsLoadingRegister] = useState(false);
    const [isLoadingReset, setIsLoadingReset] = useState(false);

    // Popup success state
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);

    // Flag to prevent auto redirect during registration
    const [isRegistering, setIsRegistering] = useState(false);

    // Google Login Function
    const handleGoogleLogin = async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/check-google`,
            },
        });
        if (error) console.error('Google login error:', error.message);
        else window.location.href = data?.url;
    };

    // Back to Home function
    const handleBackToHome = () => {
        router.push('/');
    };

    // UPDATE handleLogin dengan Single Session Protection
    const handleLogin = async (e) => {
        e.preventDefault();
        console.log('🚀 SIMPLE: Login started');

        setIsLoadingLogin(true);
        setLoginData(prev => ({ ...prev, errorMsg: '' }));

        try {
            // 1. Get email from username
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('email')
                .eq('username', loginData.username)
                .single();

            if (profileError || !profile?.email) {
                setLoginData(prev => ({ ...prev, errorMsg: 'Username tidak ditemukan' }));
                setIsLoadingLogin(false);
                return;
            }

            const email = profile.email;
            console.log('Found email:', email);

            // 2. Check session (simple - always return false for now)
            const sessionExists = await checkSession(email);
            console.log('checkSession result:', sessionExists);

            if (sessionExists) {
                setLoginData(prev => ({
                    ...prev,
                    errorMsg: '❌ Akun sudah login di device lain!'
                }));
                setIsLoadingLogin(false);
                return;
            }

            // 3. Auth login
            const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
                email: email,
                password: loginData.password,
            });

            if (loginError || !authData?.user) {
                setLoginData(prev => ({ ...prev, errorMsg: 'Password salah atau login gagal' }));
                setIsLoadingLogin(false);
                return;
            }

            // 4. Create session
            await createUserSession(email, authData.user.id);

            // 5. Redirect to home (bukan dashboard)
            router.push('/');

        } catch (error) {
            console.error('Login error:', error);
            setLoginData(prev => ({
                ...prev,
                errorMsg: 'Terjadi kesalahan: ' + error.message
            }));
            setIsLoadingLogin(false);
        }
    };

    // Register Logic
    const handleRegister = async (e) => {
        e.preventDefault();
        console.log('🚀 handleRegister called!', registerData);
        setIsLoadingRegister(true);
        setIsRegistering(true);
        setRegisterData(prev => ({ ...prev, errorMsg: '', successMsg: '' }));

        // Soccer ball loading for 3 seconds
        setTimeout(async () => {
            if (registerData.password !== registerData.confirmPassword) {
                console.log('❌ Password mismatch');
                setRegisterData(prev => ({ ...prev, errorMsg: 'Password harus sama' }));
                setIsLoadingRegister(false);
                setIsRegistering(false);
                return;
            }

            console.log('✅ Password match, checking email, username & phone...');

            try {
                // ✅ CHECK EMAIL DULU
                const { data: existingEmails } = await supabase
                    .from('profiles')
                    .select('email')
                    .eq('email', registerData.email.toLowerCase());

                if (existingEmails && existingEmails.length > 0) {
                    setRegisterData(prev => ({ ...prev, errorMsg: 'Email sudah terdaftar' }));
                    setIsLoadingRegister(false);
                    setIsRegistering(false);
                    return;
                }

                // ✅ CHECK USERNAME
                const { data: existingUsers } = await supabase
                    .from('profiles')
                    .select('username')
                    .eq('username', registerData.username);

                if (existingUsers && existingUsers.length > 0) {
                    setRegisterData(prev => ({ ...prev, errorMsg: 'Username sudah digunakan' }));
                    setIsLoadingRegister(false);
                    setIsRegistering(false);
                    return;
                }

                // ✅ CHECK PHONE
                const { data: existingPhones } = await supabase
                    .from('profiles')
                    .select('phone')
                    .eq('phone', registerData.phone);

                if (existingPhones && existingPhones.length > 0) {
                    setRegisterData(prev => ({ ...prev, errorMsg: 'Nomor HP sudah terdaftar' }));
                    setIsLoadingRegister(false);
                    setIsRegistering(false);
                    return;
                }

                console.log('✅ All checks passed, signing up...');

                // ✅ SIGNUP ke Supabase Auth
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email: registerData.email,
                    password: registerData.password,
                    options: {
                        emailRedirectTo: undefined, // Disable email redirect
                    }
                });

                if (signUpError) {
                    console.error("❌ Signup gagal:", signUpError.message);

                    // Handle specific error: email already registered in Auth
                    if (signUpError.message.includes('already registered')) {
                        setRegisterData(prev => ({ ...prev, errorMsg: 'Email sudah terdaftar di sistem' }));
                    } else {
                        setRegisterData(prev => ({ ...prev, errorMsg: 'Registrasi gagal: ' + signUpError.message }));
                    }
                    setIsLoadingRegister(false);
                    setIsRegistering(false);
                    return;
                }

                console.log('✅ Signup success:', signUpData);

                // ✅ LANGSUNG INSERT ke profiles (tanpa getUser/getSession)
                // Ambil user_id dari response signup
                const userId = signUpData?.user?.id;

                console.log('✅ Inserting profile with user_id:', userId);

                const { error: insertError } = await supabase.from('profiles').insert({
                    user_id: userId,
                    email: registerData.email.toLowerCase(),
                    username: registerData.username,
                    first_name: registerData.firstName || null,
                    last_name: registerData.lastName || null,
                    phone: registerData.phone,
                    points: 0,
                    lifetime_points: 0,
                    is_admin: false
                });

                if (insertError) {
                    console.error("❌ Error insert profile:", insertError.message);
                    setRegisterData(prev => ({
                        ...prev,
                        errorMsg: 'Gagal simpan profil: ' + insertError.message
                    }));
                    setIsLoadingRegister(false);
                    setIsRegistering(false);
                    return;
                }

                console.log("✅ Profile inserted successfully!");

                // Sign out user after registration
                await supabase.auth.signOut();

                // Reset form data
                setRegisterData({
                    email: '',
                    username: '',
                    password: '',
                    confirmPassword: '',
                    firstName: '',
                    lastName: '',
                    phone: '',
                    showPassword: false,
                    showConfirm: false,
                    errorMsg: '',
                    successMsg: ''
                });

                setIsLoadingRegister(false);
                setIsRegistering(false);

                // Show success popup
                setShowSuccessPopup(true);

            } catch (error) {
                console.log('❌ Error:', error);
                setRegisterData(prev => ({ ...prev, errorMsg: 'Terjadi kesalahan: ' + error.message }));
                setIsLoadingRegister(false);
                setIsRegistering(false);
            }

        }, 3000);
    };

    // Handle success popup close and redirect to login with smooth animation
    const handleSuccessPopupClose = () => {
        setShowSuccessPopup(false);

        // Add smooth transition delay before switching to login form
        setTimeout(() => {
            setActiveForm('login');
        }, 300); // Small delay for smooth transition
    };

    // Function to handle smooth navigation to reset password page
    const handleForgotPassword = () => {
        setIsLoadingReset(true);

        // Soccer ball loading for 5 seconds with smooth transition
        setTimeout(() => {
            setIsLoadingReset(false);
            router.push('/reset-password');
        }, 5000);
    };

    // Auth State Check - Redirect jika sudah login
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session && window.location.pathname !== '/recovery') {
                router.push('/'); // Redirect ke home, bukan dashboard
            }
        });

        const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session && window.location.pathname !== '/recovery' && !isRegistering) {
                const { user } = session;
                await supabase.from('profiles').upsert({
                    user_id: user.id,
                    email: user.email,
                });
                router.push('/'); // Redirect ke home, bukan dashboard
            }
        });

        return () => listener?.subscription?.unsubscribe();
    }, [location, isRegistering]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F7FEE7] to-[#D9F99D] p-4 max-sm:p-0">

            {/* Back to Home Button */}
            <button
                onClick={handleBackToHome}
                className="fixed top-4 left-4 z-50 bg-white hover:bg-gray-50 text-gray-800 px-4 py-2 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
            >
                ← Kembali ke Home
            </button>

            {/* Success Popup - Bounce once + animated checkmark */}
            {showSuccessPopup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-all duration-300">
                    <div className="bg-white rounded-2xl p-8 flex flex-col items-center shadow-2xl max-w-sm mx-4 transform"
                        style={{
                            animation: 'bounceOnce 0.6s ease-out'
                        }}>
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 relative overflow-hidden">
                            <svg
                                className="w-8 h-8 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                style={{
                                    animation: 'checkmarkDraw 0.8s ease-out 0.3s both'
                                }}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="3"
                                    d="M5 13l4 4L19 7"
                                    style={{
                                        strokeDasharray: '20',
                                        strokeDashoffset: '20',
                                        animation: 'drawPath 0.8s ease-out 0.3s forwards'
                                    }}
                                />
                            </svg>
                            {/* Ripple effect */}
                            <div className="absolute inset-0 bg-green-400 rounded-full"
                                style={{
                                    animation: 'ripple 0.6s ease-out 0.2s'
                                }}>
                            </div>
                        </div>
                        <h3 className="text-xl font-condensed text-gray-800 mb-2 text-center"
                            style={{
                                animation: 'fadeInUp 0.5s ease-out 0.4s both'
                            }}>
                            🎉 Selamat!
                        </h3>
                        <p className="text-gray-600 text-center mb-6"
                            style={{
                                animation: 'fadeInUp 0.5s ease-out 0.5s both'
                            }}>
                            Akun sudah terdaftar.<br />
                            Silahkan login untuk melanjutkan.
                        </p>
                        <button
                            onClick={handleSuccessPopupClose}
                            className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white font-condensed py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
                            style={{
                                animation: 'fadeInUp 0.5s ease-out 0.6s both'
                            }}
                        >
                            Login Sekarang
                        </button>
                    </div>
                </div>
            )}

            {/* Custom CSS untuk animasi smooth */}
            <style jsx>{`
                @keyframes bounceOnce {
                    0% {
                        transform: scale(0.3) translateY(-100px);
                        opacity: 0;
                    }
                    50% {
                        transform: scale(1.05) translateY(0);
                    }
                    70% {
                        transform: scale(0.95);
                    }
                    100% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }

                @keyframes drawPath {
                    to {
                        stroke-dashoffset: 0;
                    }
                }

                @keyframes checkmarkDraw {
                    0% {
                        transform: scale(0);
                    }
                    100% {
                        transform: scale(1);
                    }
                }

                @keyframes ripple {
                    0% {
                        transform: scale(0.8);
                        opacity: 0.8;
                    }
                    100% {
                        transform: scale(1.2);
                        opacity: 0;
                    }
                }

                @keyframes fadeInUp {
                    0% {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>

            {/* Soccer Ball Loading Overlay */}
            {(isLoadingReset || isLoadingLogin || isLoadingRegister) && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-all duration-300">
                    <div className="bg-white rounded-2xl p-8 flex flex-col items-center shadow-2xl">
                        <div className="mb-4">
                            <svg className="w-20 h-20" viewBox="0 0 56 56" role="img" aria-label="Soccer ball loading">
                                <defs>
                                    <path id="hex" d="M 0 -9.196 L 8 -4.577 L 8 4.661 L 0 9.28 L -8 4.661 L -8 -4.577 Z" />
                                    <g id="hex-chunk" fill="none" stroke="#374151" strokeWidth="0.5">
                                        <use href="#hex" fill="#374151" />
                                        <use href="#hex" transform="translate(16,0)" />
                                        <use href="#hex" transform="rotate(60) translate(16,0)" />
                                    </g>
                                    <g id="hex-pattern" transform="scale(0.333)">
                                        <use href="#hex-chunk" />
                                        <use href="#hex-chunk" transform="rotate(30) translate(0,48) rotate(-30)" />
                                        <use href="#hex-chunk" transform="rotate(-180) translate(0,27.7) rotate(180)" />
                                        <use href="#hex-chunk" transform="rotate(-120) translate(0,27.7) rotate(120)" />
                                        <use href="#hex-chunk" transform="rotate(-60) translate(0,27.7) rotate(60)" />
                                        <use href="#hex-chunk" transform="translate(0,27.7)" />
                                        <use href="#hex-chunk" transform="rotate(60) translate(0,27.7) rotate(-60)" />
                                        <use href="#hex-chunk" transform="rotate(120) translate(0,27.7) rotate(-120)" />
                                    </g>
                                    <g id="ball-texture" transform="translate(0,-3.5)">
                                        <use href="#hex-pattern" transform="translate(-48,0)" />
                                        <use href="#hex-pattern" transform="translate(-32,0)" />
                                        <use href="#hex-pattern" transform="translate(-16,0)" />
                                        <use href="#hex-pattern" transform="translate(0,0)" />
                                        <use href="#hex-pattern" transform="translate(16,0)" />
                                    </g>
                                    <clipPath id="ball-clip">
                                        <circle r="8" />
                                    </clipPath>
                                </defs>

                                <g transform="translate(28,28)">
                                    {/* Dots */}
                                    <g fill="#dc2626">
                                        {[32, 87, 103, 138, 228, 243, 328].map((angle, i) => (
                                            <circle
                                                key={`red-${i}`}
                                                r="1.25"
                                                transform={`rotate(${angle}) translate(-18.25,0)`}
                                                className="animate-pulse"
                                                style={{
                                                    animationDelay: `${i * 0.2}s`,
                                                    animationDuration: '2s'
                                                }}
                                            />
                                        ))}
                                    </g>
                                    <g fill="#ffffff">
                                        {[41, 77, 92, 146, 175, 293, 314, 340].map((angle, i) => (
                                            <circle
                                                key={`white-${i}`}
                                                r="1.25"
                                                transform={`rotate(${angle}) translate(-15.75,0)`}
                                                className="animate-pulse"
                                                style={{
                                                    animationDelay: `${i * 0.15}s`,
                                                    animationDuration: '2.5s'
                                                }}
                                            />
                                        ))}
                                    </g>
                                    <g fill="#2563eb">
                                        {[20, 55, 77, 106, 128, 174, 279].map((angle, i) => (
                                            <circle
                                                key={`blue-${i}`}
                                                r="1.25"
                                                transform={`rotate(${angle}) translate(-13.25,0)`}
                                                className="animate-pulse"
                                                style={{
                                                    animationDelay: `${i * 0.25}s`,
                                                    animationDuration: '3s'
                                                }}
                                            />
                                        ))}
                                    </g>

                                    {/* Rotating Rings */}
                                    <g fill="none" strokeLinecap="round" strokeWidth="2.5" transform="rotate(-90)">
                                        <circle
                                            r="18.25"
                                            stroke="#dc2626"
                                            strokeDasharray="57.35 57.35"
                                            className="animate-spin"
                                            style={{ animationDuration: '3s' }}
                                        />
                                        <circle
                                            r="15.75"
                                            stroke="#ffffff"
                                            strokeDasharray="53.4 53.4"
                                            className="animate-spin"
                                            style={{ animationDuration: '2.5s', animationDirection: 'reverse' }}
                                        />
                                        <circle
                                            r="13.25"
                                            stroke="#2563eb"
                                            strokeDasharray="49.5 49.5"
                                            className="animate-spin"
                                            style={{ animationDuration: '2s' }}
                                        />
                                    </g>

                                    {/* Main Ball */}
                                    <g transform="translate(0,-15.75)" className="animate-spin" style={{ animationDuration: '4s' }}>
                                        <circle fill="#f3f4f6" r="8" cx="0.5" cy="0.5" opacity="0.3" />
                                        <circle fill="#ffffff" r="8" />
                                        <g clipPath="url(#ball-clip)">
                                            <use href="#ball-texture" className="animate-pulse" />
                                        </g>
                                    </g>
                                </g>
                            </svg>
                        </div>
                        <h3 className="text-lg font-condensed text-gray-800 mb-2">
                            {isLoadingLogin && "Sedang Login"}
                            {isLoadingRegister && "Membuat Akun"}
                            {isLoadingReset && "Memuat Reset Password"}
                        </h3>
                        <p className="text-sm text-gray-600 text-center">
                            {isLoadingLogin && "Memverifikasi kredensial Anda..."}
                            {isLoadingRegister && "Menyiapkan akun baru Anda..."}
                            {isLoadingReset && "Memverifikasi sistem keamanan..."}
                        </p>
                        <div className="mt-3 flex space-x-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                    </div>
                </div>
            )}

            <div className={`relative w-full max-w-4xl h-[600px] max-sm:h-[calc(100vh-2rem)] bg-white rounded-3xl max-sm:rounded-none shadow-2xl overflow-hidden ${activeForm === 'register' ? 'active' : ''
                }`}>

                {/* Login Form - Desktop: Right Side, Mobile: Bottom */}
                <div className={`absolute right-0 w-1/2 h-full max-sm:w-full max-sm:h-[70%] max-sm:bottom-0 bg-white flex items-center justify-center p-8 max-sm:p-4 z-10 transition-all duration-[600ms] ease-in-out ${activeForm === 'register'
                    ? 'right-1/2 delay-[1200ms] max-sm:right-0 max-sm:bottom-[30%]'
                    : 'right-0 delay-0 max-sm:bottom-0'
                    }`}>
                    <div className="w-full max-w-sm">
                        <h1 className="text-3xl font-condensed text-gray-800 mb-6 text-center">Login</h1>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Username"
                                    value={loginData.username}
                                    onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                                    className="w-full p-3 pl-5 pr-12 bg-gray-100 rounded-lg border-none outline-none text-gray-800 font-condensed"
                                    required
                                />
                                <i className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-600">👤</i>
                            </div>

                            <div className="relative">
                                <input
                                    type={loginData.showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    value={loginData.password}
                                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                                    className="w-full p-3 pl-5 pr-12 bg-gray-100 rounded-lg border-none outline-none text-gray-800 font-condensed"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setLoginData(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                                    className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-600"
                                >
                                    {loginData.showPassword ? "🙈" : "👁️"}
                                </button>
                            </div>

                            <div className="text-right -mt-2 mb-4">
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    disabled={isLoadingReset}
                                    className="text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoadingReset ? 'Memuat...' : 'Lupa Password?'}
                                </button>
                            </div>

                            {loginData.errorMsg && <p className="text-red-500 text-sm text-center">{loginData.errorMsg}</p>}

                            <button
                                type="submit"
                                className="w-full h-12 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-lg font-condensed shadow-lg transition-all"
                            >
                                Login
                            </button>

                            <p className="text-center text-sm text-gray-600 my-4">or login with Gmail</p>

                            <div className="flex justify-center">
                                <button
                                    type="button"
                                    onClick={handleGoogleLogin}
                                    className="flex items-center justify-center space-x-3 w-full bg-white border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 py-3 px-4 font-condensed"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    <span>Continue with Gmail</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Register Form - Desktop: Right Side, Mobile: Bottom */}
                <div className={`absolute right-0 w-1/2 h-full max-sm:w-full max-sm:h-[70%] max-sm:bottom-0 bg-white flex items-center justify-center p-6 max-sm:p-4 z-10 transition-all duration-[600ms] ease-in-out ${activeForm === 'register'
                    ? 'right-1/2 visible delay-[1200ms] max-sm:right-0 max-sm:bottom-[30%]'
                    : 'right-0 invisible delay-0 max-sm:bottom-0'
                    }`}>
                    <div className="w-full max-w-sm">
                        <h1 className="text-2xl font-condensed text-gray-800 mb-4 text-center">📋 Daftar Akun</h1>
                        <form onSubmit={handleRegister} className="space-y-3">
                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                value={registerData.email}
                                onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                                className="w-full p-2 bg-gray-100 rounded-lg border-none outline-none text-gray-800"
                                required
                            />

                            <input
                                type="text"
                                name="username"
                                placeholder="Username"
                                value={registerData.username}
                                onChange={(e) => setRegisterData(prev => ({ ...prev, username: e.target.value }))}
                                className="w-full p-2 bg-gray-100 rounded-lg border-none outline-none text-gray-800"
                                required
                            />

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    name="firstName"
                                    placeholder="Nama Depan"
                                    value={registerData.firstName}
                                    onChange={(e) => setRegisterData(prev => ({ ...prev, firstName: e.target.value }))}
                                    className="w-full p-2 bg-gray-100 rounded-lg border-none outline-none text-gray-800"
                                />
                                <input
                                    type="text"
                                    name="lastName"
                                    placeholder="Nama Belakang"
                                    value={registerData.lastName}
                                    onChange={(e) => setRegisterData(prev => ({ ...prev, lastName: e.target.value }))}
                                    className="w-full p-2 bg-gray-100 rounded-lg border-none outline-none text-gray-800"
                                />
                            </div>

                            <input
                                type="text"
                                name="phone"
                                placeholder="Nomor HP / WhatsApp"
                                value={registerData.phone}
                                onChange={(e) => setRegisterData(prev => ({ ...prev, phone: e.target.value }))}
                                className="w-full p-2 bg-gray-100 rounded-lg border-none outline-none text-gray-800"
                                required
                            />

                            <div className="relative">
                                <input
                                    type={registerData.showPassword ? 'text' : 'password'}
                                    name="password"
                                    placeholder="Password"
                                    value={registerData.password}
                                    onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                                    className="w-full p-2 pr-10 bg-gray-100 rounded-lg border-none outline-none text-gray-800"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setRegisterData(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                                    className="absolute right-2 top-2 text-sm"
                                >
                                    {registerData.showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>

                            <div className="relative">
                                <input
                                    type={registerData.showConfirm ? 'text' : 'password'}
                                    name="confirmPassword"
                                    placeholder="Ulangi Password"
                                    value={registerData.confirmPassword}
                                    onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                    className="w-full p-2 pr-10 bg-gray-100 rounded-lg border-none outline-none text-gray-800"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setRegisterData(prev => ({ ...prev, showConfirm: !prev.showConfirm }))}
                                    className="absolute right-2 top-2 text-sm"
                                >
                                    {registerData.showConfirm ? '🙈' : '👁️'}
                                </button>
                            </div>

                            {registerData.password !== registerData.confirmPassword && registerData.confirmPassword && (
                                <p className="text-red-500 text-xs">Password tidak sesuai</p>
                            )}
                            {registerData.errorMsg && <p className="text-red-500 text-xs">{registerData.errorMsg}</p>}

                            <button
                                type="submit"
                                className="w-full h-10 bg-[#16A34A] hover:bg-[#15803D] text-white font-condensed rounded-lg transition-all"
                            >
                                Daftar Akun
                            </button>
                        </form>
                    </div>
                </div>

                {/* Toggle Box - Desktop: Horizontal, Mobile: Vertical */}
                <div className={`absolute inset-0 w-full h-full transition-all duration-500 opacity-100`}>
                    <div className={`absolute bg-[#16A34A] z-20 transition-all duration-[1800ms] ease-in-out 
                        w-[300%] h-full rounded-[150px] max-sm:w-full max-sm:h-[300%] max-sm:rounded-[20vw]
                        ${activeForm === 'register'
                            ? 'left-1/2 max-sm:left-0 max-sm:top-[70%]'
                            : 'left-[-250%] max-sm:left-0 max-sm:top-[-270%]'
                        }`}></div>
                </div>

                {/* Toggle Panel Left - Desktop: Left Side, Mobile: Top */}
                <div className={`absolute left-0 w-1/2 h-full max-sm:w-full max-sm:h-[30%] max-sm:top-0 text-white flex flex-col justify-center items-center z-30 transition-all duration-[600ms] ease-in-out ${activeForm === 'register'
                    ? 'left-[-50%] delay-[600ms] max-sm:left-0 max-sm:top-[-30%]'
                    : 'left-0 delay-[1200ms] max-sm:top-0'
                    }`}>
                    <h1 className="text-4xl max-sm:text-3xl font-condensed mb-4 text-center px-4">Hello, Welcome To NobarMeriah!</h1>
                    <p className="mb-6 text-center px-8">Belum Punya Akun?</p>
                    <button
                        onClick={() => setActiveForm('register')}
                        className="w-40 h-12 bg-transparent border-2 border-white text-white rounded-lg font-condensed hover:bg-white hover:text-[#16A34A] transition-all"
                    >
                        Register
                    </button>
                </div>

                {/* Toggle Panel Right - Desktop: Right Side, Mobile: Bottom */}
                <div className={`absolute right-0 w-1/2 h-full max-sm:w-full max-sm:h-[30%] max-sm:bottom-0 text-white flex flex-col justify-center items-center z-30 transition-all duration-[600ms] ease-in-out ${activeForm === 'register'
                    ? 'right-0 delay-[1200ms] max-sm:bottom-0'
                    : 'right-[-50%] delay-[600ms] max-sm:right-0 max-sm:bottom-[-30%]'
                    }`}>
                    <h1 className="text-4xl max-sm:text-3xl font-condensed mb-4">Welcome Back!</h1>
                    <p className="mb-6 text-center px-8">Already have an account?</p>
                    <button
                        onClick={() => setActiveForm('login')}
                        className="w-40 h-12 bg-transparent border-2 border-white text-white rounded-lg font-condensed hover:bg-white hover:text-[#16A34A] transition-all"
                    >
                        Login
                    </button>
                </div>

            </div>
        </div>
    );
};

export default Auth;