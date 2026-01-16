'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';

const Auth = () => {
    const router = useRouter();
    const [activeForm, setActiveForm] = useState('login'); // 'login', 'register'
    const [mounted, setMounted] = useState(false);

    // Set mounted state after component mounts (client-side only)
    useEffect(() => {
        setMounted(true);
    }, []);

    const getDeviceInfo = () => {
        if (typeof window === 'undefined') return 'Unknown';

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

            const { data: existingSession, error, count } = await supabase
                .from('active_sessions')
                .select('*', { count: 'exact' })
                .eq('account_email', email.toLowerCase())
                .order('login_time', { ascending: false });

            if (error) {
                console.error('❌ Database error:', error);
                return false;
            }

            if (!existingSession || existingSession.length === 0) {
                console.log('✅ No active session found for this email - ALLOW LOGIN');
                return false;
            }

            const session = existingSession[0];
            const loginTime = new Date(session.login_time);
            const now = new Date();
            const sessionDuration = 24 * 60 * 60 * 1000; // 24 jam
            const isExpired = (now - loginTime) > sessionDuration;

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

            await supabase
                .from('active_sessions')
                .delete()
                .eq('account_email', email.toLowerCase());

            const newSession = {
                account_email: email.toLowerCase(),
                current_user_id: userId,
                device_info: getDeviceInfo(),
                ip_address: 'unknown',
                login_time: new Date().toISOString(),
                last_activity: new Date().toISOString()
            };

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

    // Loading states
    const [isLoadingLogin, setIsLoadingLogin] = useState(false);
    const [isLoadingRegister, setIsLoadingRegister] = useState(false);
    const [isLoadingReset, setIsLoadingReset] = useState(false);

    // Popup success state
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);

    // Flag to prevent auto redirect during registration
    const [isRegistering, setIsRegistering] = useState(false);

    // Google Login Function - FIXED for SSR
    const handleGoogleLogin = async () => {
        if (typeof window === 'undefined') return;

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/check-google`,
            },
        });
        if (error) console.error('Google login error:', error.message);
        else if (data?.url) window.location.href = data.url;
    };

    // Back to Home function
    const handleBackToHome = () => {
        router.push('/');
    };

    // Login Handler
    const handleLogin = async (e) => {
        e.preventDefault();
        console.log('🚀 SIMPLE: Login started');

        setIsLoadingLogin(true);
        setLoginData(prev => ({ ...prev, errorMsg: '' }));

        try {
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

            const sessionExists = await checkSession(email);

            if (sessionExists) {
                setLoginData(prev => ({
                    ...prev,
                    errorMsg: '❌ Akun sudah login di device lain!'
                }));
                setIsLoadingLogin(false);
                return;
            }

            const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
                email: email,
                password: loginData.password,
            });

            if (loginError || !authData?.user) {
                setLoginData(prev => ({ ...prev, errorMsg: 'Password salah atau login gagal' }));
                setIsLoadingLogin(false);
                return;
            }

            await createUserSession(email, authData.user.id);
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

        setTimeout(async () => {
            if (registerData.password !== registerData.confirmPassword) {
                setRegisterData(prev => ({ ...prev, errorMsg: 'Password harus sama' }));
                setIsLoadingRegister(false);
                setIsRegistering(false);
                return;
            }

            try {
                // CHECK EMAIL
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

                // CHECK USERNAME
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

                // CHECK PHONE
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

                // SIGNUP
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email: registerData.email,
                    password: registerData.password,
                    options: {
                        emailRedirectTo: undefined,
                    }
                });

                if (signUpError) {
                    if (signUpError.message.includes('already registered')) {
                        setRegisterData(prev => ({ ...prev, errorMsg: 'Email sudah terdaftar di sistem' }));
                    } else {
                        setRegisterData(prev => ({ ...prev, errorMsg: 'Registrasi gagal: ' + signUpError.message }));
                    }
                    setIsLoadingRegister(false);
                    setIsRegistering(false);
                    return;
                }

                const userId = signUpData?.user?.id;

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
                    setRegisterData(prev => ({
                        ...prev,
                        errorMsg: 'Gagal simpan profil: ' + insertError.message
                    }));
                    setIsLoadingRegister(false);
                    setIsRegistering(false);
                    return;
                }

                await supabase.auth.signOut();

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
                setShowSuccessPopup(true);

            } catch (error) {
                setRegisterData(prev => ({ ...prev, errorMsg: 'Terjadi kesalahan: ' + error.message }));
                setIsLoadingRegister(false);
                setIsRegistering(false);
            }

        }, 3000);
    };

    const handleSuccessPopupClose = () => {
        setShowSuccessPopup(false);
        setTimeout(() => {
            setActiveForm('login');
        }, 300);
    };

    const handleForgotPassword = () => {
        setIsLoadingReset(true);
        setTimeout(() => {
            setIsLoadingReset(false);
            router.push('/reset-password');
        }, 2000);
    };

    // Auth State Check
    useEffect(() => {
        if (typeof window === 'undefined') return;

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                router.push('/');
            }
        });

        const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session && !isRegistering) {
                router.push('/');
            }
        });

        return () => listener?.subscription?.unsubscribe();
    }, [isRegistering, router]);

    // Don't render until mounted (prevents hydration mismatch)
    if (!mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F7FEE7] to-[#D9F99D]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F7FEE7] to-[#D9F99D] p-4 max-sm:p-0">

            {/* Back to Home Button */}
            <button
                onClick={handleBackToHome}
                className="fixed top-4 left-4 z-50 bg-white hover:bg-gray-50 text-gray-800 px-4 py-2 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
            >
                ← Kembali ke Home
            </button>

            {/* Success Popup */}
            {showSuccessPopup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-all duration-300">
                    <div className="bg-white rounded-2xl p-8 flex flex-col items-center shadow-2xl max-w-sm mx-4 transform animate-bounce">
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
                            <svg
                                className="w-8 h-8 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="3"
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                        <h3 className="text-xl font-condensed text-gray-800 mb-2 text-center">
                            🎉 Selamat!
                        </h3>
                        <p className="text-gray-600 text-center mb-6">
                            Akun sudah terdaftar.<br />
                            Silahkan login untuk melanjutkan.
                        </p>
                        <button
                            onClick={handleSuccessPopupClose}
                            className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white font-condensed py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
                        >
                            Login Sekarang
                        </button>
                    </div>
                </div>
            )}

            {/* Loading Overlay */}
            {(isLoadingReset || isLoadingLogin || isLoadingRegister) && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-all duration-300">
                    <div className="bg-white rounded-2xl p-8 flex flex-col items-center shadow-2xl">
                        <div className="mb-4">
                            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
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

            <div className={`relative w-full max-w-4xl h-[600px] max-sm:h-[calc(100vh-2rem)] bg-white rounded-3xl max-sm:rounded-none shadow-2xl overflow-hidden ${activeForm === 'register' ? 'active' : ''}`}>

                {/* Login Form */}
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

                {/* Register Form */}
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

                {/* Toggle Box */}
                <div className={`absolute inset-0 w-full h-full transition-all duration-500 opacity-100`}>
                    <div className={`absolute bg-[#16A34A] z-20 transition-all duration-[1800ms] ease-in-out 
                        w-[300%] h-full rounded-[150px] max-sm:w-full max-sm:h-[300%] max-sm:rounded-[20vw]
                        ${activeForm === 'register'
                            ? 'left-1/2 max-sm:left-0 max-sm:top-[70%]'
                            : 'left-[-250%] max-sm:left-0 max-sm:top-[-270%]'
                        }`}></div>
                </div>

                {/* Toggle Panel Left */}
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

                {/* Toggle Panel Right */}
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
