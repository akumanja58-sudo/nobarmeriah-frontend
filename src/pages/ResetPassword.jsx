// src/pages/ResetPassword.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

function maskEmail(email) {
    const [name, domain] = email.split('@');
    const maskedName = name.length <= 2 ? name[0] + '*' : name.slice(0, 2) + '*'.repeat(name.length - 2);
    return `${maskedName}@${domain}`;
}

function maskPhone(phone) {
    return phone.slice(0, 3) + '*'.repeat(phone.length - 6) + phone.slice(-3);
}

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Check if this is a password reset from email link
    const isFromEmail = searchParams.get('type') === 'recovery';

    // Animation states
    const [isEntering, setIsEntering] = useState(true);
    const [isExiting, setIsExiting] = useState(false);

    // Reset Password State - Enhanced
    const [resetData, setResetData] = useState({
        step: isFromEmail ? 4 : 1, // 1: find account, 2: verify method, 3: email sent, 4: new password
        identifier: '',
        account: null,
        verifyMethod: '',
        password: '',
        confirm: '',
        showPassword: false,
        showConfirm: false,
        message: '',
        error: '',
        isLoading: false,
        emailSent: false
    });

    // Check session on mount if coming from email link
    useEffect(() => {
        if (isFromEmail) {
            checkSession();
        }
    }, [isFromEmail]);

    const checkSession = async () => {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
            setResetData(prev => ({
                ...prev,
                error: 'Link tidak valid atau sudah expired. Silakan coba lagi.',
                step: 1
            }));
        }
    };

    // Reset Password Logic - Enhanced
    const handleFindAccount = async (e) => {
        e.preventDefault();
        setResetData(prev => ({ ...prev, error: '', isLoading: true }));

        if (!resetData.identifier) {
            setResetData(prev => ({ ...prev, error: 'Masukkan username/email/nomor HP', isLoading: false }));
            return;
        }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .or(`email.eq.${resetData.identifier},username.eq.${resetData.identifier},phone.eq.${resetData.identifier}`)
                .single();

            if (error || !data) {
                setResetData(prev => ({ ...prev, error: 'Akun tidak ditemukan', isLoading: false }));
                return;
            }

            setResetData(prev => ({ ...prev, account: data, step: 2, error: '', isLoading: false }));
        } catch (error) {
            setResetData(prev => ({ ...prev, error: 'Terjadi kesalahan saat mencari akun', isLoading: false }));
        }
    };

    // Handle Email Verification - NEW FUNCTION
    const handleEmailVerification = async () => {
        setResetData(prev => ({ ...prev, isLoading: true, error: '' }));

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(
                resetData.account.email,
                {
                    redirectTo: `${window.location.origin}/reset-password?type=recovery`
                }
            );

            if (error) {
                setResetData(prev => ({
                    ...prev,
                    error: 'Gagal mengirim email: ' + error.message,
                    isLoading: false
                }));
                return;
            }

            setResetData(prev => ({
                ...prev,
                step: 3,
                emailSent: true,
                isLoading: false,
                message: `Email reset password telah dikirim ke ${maskEmail(resetData.account.email)}`
            }));

        } catch (error) {
            setResetData(prev => ({
                ...prev,
                error: 'Terjadi kesalahan saat mengirim email',
                isLoading: false
            }));
        }
    };

    const handleVerifyMethod = (method) => {
        if (method === 'email') {
            handleEmailVerification();
        } else {
            // For WhatsApp verification (implement later)
            setResetData(prev => ({
                ...prev,
                error: 'Verifikasi WhatsApp belum tersedia. Gunakan email untuk sementara.',
            }));
        }
    };

    // Handle New Password - UPDATED TO USE SUPABASE AUTH
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setResetData(prev => ({ ...prev, error: '', message: '', isLoading: true }));

        if (resetData.password !== resetData.confirm) {
            setResetData(prev => ({ ...prev, error: 'Password harus sama', isLoading: false }));
            return;
        }

        if (resetData.password.length < 6) {
            setResetData(prev => ({ ...prev, error: 'Password minimal 6 karakter', isLoading: false }));
            return;
        }

        try {
            // Use Supabase Auth to update password
            const { error } = await supabase.auth.updateUser({
                password: resetData.password
            });

            if (error) {
                setResetData(prev => ({
                    ...prev,
                    error: 'Gagal update password: ' + error.message,
                    isLoading: false
                }));
                return;
            }

            setResetData(prev => ({
                ...prev,
                message: 'Password berhasil direset! Silakan login dengan password baru.',
                isLoading: false
            }));

            // Sign out user after password reset
            await supabase.auth.signOut();

            setTimeout(() => {
                setIsExiting(true);
                setTimeout(() => {
                    navigate('/');
                }, 1000);
            }, 2000);

        } catch (error) {
            setResetData(prev => ({
                ...prev,
                error: 'Terjadi kesalahan sistem',
                isLoading: false
            }));
        }
    };

    const handleBackToLogin = () => {
        setIsExiting(true);
        setTimeout(() => {
            navigate('/');
        }, 1000);
    };

    // Smooth entrance animation
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsEntering(false);
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F7FEE7] to-[#D9F99D] p-4 max-sm:p-0">
            <div className={`relative w-full max-w-md bg-white rounded-3xl max-sm:rounded-none shadow-2xl overflow-hidden transform transition-all duration-1000 ease-in-out ${isEntering
                ? 'opacity-0 scale-95 translate-y-10'
                : isExiting
                    ? 'opacity-0 scale-95 -translate-y-10'
                    : 'opacity-100 scale-100 translate-y-0'
                }`}>

                <div className="bg-white flex items-center justify-center p-8 max-sm:p-4">
                    <div className={`w-full max-w-md transform transition-all duration-700 ease-out ${isEntering ? 'opacity-0 translate-y-5' : 'opacity-100 translate-y-0'
                        }`}>
                        <div className={`text-center mb-8 transition-all duration-1000 ease-out ${isEntering ? 'opacity-0 translate-y-3' : 'opacity-100 translate-y-0'
                            }`} style={{ transitionDelay: isEntering ? '0ms' : '200ms' }}>
                            <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-full mb-4 transform transition-all duration-500 hover:scale-110 ${isEntering ? 'scale-0 rotate-180' : 'scale-100 rotate-0'
                                }`} style={{ transitionDelay: isEntering ? '0ms' : '400ms' }}>
                                <span className="text-2xl animate-bounce">🔐</span>
                            </div>
                            <h1 className={`text-3xl font-bold text-gray-800 mb-2 transform transition-all duration-700 ${isEntering ? 'opacity-0 translate-y-3' : 'opacity-100 translate-y-0'
                                }`} style={{ transitionDelay: isEntering ? '0ms' : '600ms' }}>Reset Password</h1>
                            <p className={`text-gray-600 transform transition-all duration-700 ${isEntering ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
                                }`} style={{ transitionDelay: isEntering ? '0ms' : '800ms' }}>
                                {resetData.step === 1 && "Masukkan informasi akun Anda"}
                                {resetData.step === 2 && "Pilih metode verifikasi"}
                                {resetData.step === 3 && "Cek email Anda"}
                                {resetData.step === 4 && "Buat password baru"}
                            </p>
                        </div>

                        {/* Step 1: Find Account */}
                        {resetData.step === 1 && (
                            <form onSubmit={handleFindAccount} className={`space-y-4 transform transition-all duration-700 ease-out ${isEntering ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
                                }`} style={{ transitionDelay: isEntering ? '0ms' : '1000ms' }}>
                                <div className="relative transform transition-all duration-300 hover:scale-105">
                                    <input
                                        type="text"
                                        placeholder="Username, Email, atau No. WhatsApp"
                                        value={resetData.identifier}
                                        onChange={(e) => setResetData(prev => ({ ...prev, identifier: e.target.value }))}
                                        className="w-full p-4 pl-12 bg-gray-100 rounded-lg border-none outline-none text-gray-800 font-medium focus:bg-gray-50 focus:ring-2 focus:ring-green-300 transition-all duration-300"
                                        required
                                    />
                                    <i className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 transition-all duration-300">🔍</i>
                                </div>

                                {resetData.error && (
                                    <div className="p-3 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm rounded transform transition-all duration-300 animate-shake">
                                        {resetData.error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={resetData.isLoading}
                                    className="w-full h-12 bg-gradient-to-r from-[#16A34A] to-[#15803D] hover:from-[#15803D] hover:to-[#166534] text-white rounded-lg font-semibold shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                                >
                                    {resetData.isLoading ? (
                                        <div className="flex items-center justify-center">
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                            Mencari Akun...
                                        </div>
                                    ) : (
                                        'Cari Akun'
                                    )}
                                </button>
                            </form>
                        )}

                        {/* Step 2: Choose Verification Method */}
                        {resetData.step === 2 && resetData.account && (
                            <div className="space-y-4 transform transition-all duration-500 delay-200">
                                <div className="p-4 bg-green-50 border-l-4 border-green-400 text-green-700 rounded transform transition-all duration-300 animate-slide-in">
                                    Halo <strong>{resetData.account.first_name}</strong>, pilih metode verifikasi:
                                </div>

                                <div className="space-y-3">
                                    {resetData.account.email && (
                                        <button
                                            onClick={() => handleVerifyMethod('email')}
                                            disabled={resetData.isLoading}
                                            className="w-full p-4 border-2 border-gray-200 rounded-lg flex items-center justify-between hover:border-green-400 hover:bg-green-50 transition-all duration-300 group transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <div className="flex items-center">
                                                <span className="text-2xl mr-3 group-hover:animate-bounce">📧</span>
                                                <span className="font-medium">
                                                    {resetData.isLoading ? 'Mengirim Email...' : 'Verifikasi via Email'}
                                                </span>
                                            </div>
                                            <span className="text-sm text-gray-500 group-hover:text-green-600">
                                                {maskEmail(resetData.account.email)}
                                            </span>
                                        </button>
                                    )}

                                    {resetData.account.phone && (
                                        <button
                                            onClick={() => handleVerifyMethod('whatsapp')}
                                            className="w-full p-4 border-2 border-gray-200 rounded-lg flex items-center justify-between hover:border-green-400 hover:bg-green-50 transition-all duration-300 group transform hover:scale-105 active:scale-95"
                                        >
                                            <div className="flex items-center">
                                                <span className="text-2xl mr-3 group-hover:animate-bounce">📱</span>
                                                <span className="font-medium">Verifikasi via WhatsApp</span>
                                            </div>
                                            <span className="text-sm text-gray-500 group-hover:text-green-600">
                                                {maskPhone(resetData.account.phone)}
                                            </span>
                                        </button>
                                    )}
                                </div>

                                {resetData.error && (
                                    <div className="p-3 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm rounded">
                                        {resetData.error}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 3: Email Sent Confirmation */}
                        {resetData.step === 3 && (
                            <div className="space-y-4 text-center">
                                <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                                    <span className="text-4xl animate-bounce">📧</span>
                                </div>

                                <div className="p-4 bg-green-50 border-l-4 border-green-400 text-green-700 rounded">
                                    <h3 className="font-semibold mb-2">Email Terkirim!</h3>
                                    <p className="text-sm">{resetData.message}</p>
                                </div>

                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                                    <p className="mb-2"><strong>Langkah selanjutnya:</strong></p>
                                    <ol className="list-decimal list-inside space-y-1 text-left">
                                        <li>Buka email Anda</li>
                                        <li>Cari email dari sistem kami</li>
                                        <li>Klik link "Reset Password"</li>
                                        <li>Buat password baru</li>
                                    </ol>
                                </div>

                                <button
                                    onClick={() => setResetData(prev => ({ ...prev, step: 1, account: null, identifier: '' }))}
                                    className="text-sm text-gray-600 hover:text-gray-800 underline"
                                >
                                    Kirim ulang atau coba akun lain
                                </button>
                            </div>
                        )}

                        {/* Step 4: New Password (from email link) */}
                        {resetData.step === 4 && (
                            <form onSubmit={handleResetPassword} className="space-y-4">
                                <div className="relative">
                                    <input
                                        type={resetData.showPassword ? 'text' : 'password'}
                                        placeholder="Password baru"
                                        value={resetData.password}
                                        onChange={(e) => setResetData(prev => ({ ...prev, password: e.target.value }))}
                                        className="w-full p-4 pl-12 pr-12 bg-gray-100 rounded-lg border-none outline-none text-gray-800 font-medium focus:bg-gray-50 transition-colors"
                                        required
                                        minLength={6}
                                    />
                                    <i className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600">🔑</i>
                                    <button
                                        type="button"
                                        onClick={() => setResetData(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
                                    >
                                        {resetData.showPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>

                                <div className="relative">
                                    <input
                                        type={resetData.showConfirm ? 'text' : 'password'}
                                        placeholder="Ulangi password"
                                        value={resetData.confirm}
                                        onChange={(e) => setResetData(prev => ({ ...prev, confirm: e.target.value }))}
                                        className="w-full p-4 pl-12 pr-12 bg-gray-100 rounded-lg border-none outline-none text-gray-800 font-medium focus:bg-gray-50 transition-colors"
                                        required
                                    />
                                    <i className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600">🔑</i>
                                    <button
                                        type="button"
                                        onClick={() => setResetData(prev => ({ ...prev, showConfirm: !prev.showConfirm }))}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
                                    >
                                        {resetData.showConfirm ? '🙈' : '👁️'}
                                    </button>
                                </div>

                                {/* Password Strength Indicator */}
                                {resetData.password && (
                                    <div className="space-y-2">
                                        <div className="flex space-x-1">
                                            {[...Array(4)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`h-1 flex-1 rounded ${resetData.password.length > i * 2 + 2
                                                        ? resetData.password.length >= 8
                                                            ? 'bg-green-500'
                                                            : resetData.password.length >= 6
                                                                ? 'bg-yellow-500'
                                                                : 'bg-red-500'
                                                        : 'bg-gray-300'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-600">
                                            {resetData.password.length < 6 && 'Password terlalu pendek (minimal 6 karakter)'}
                                            {resetData.password.length >= 6 && resetData.password.length < 8 && 'Password lumayan'}
                                            {resetData.password.length >= 8 && 'Password kuat'}
                                        </p>
                                    </div>
                                )}

                                {resetData.password && resetData.confirm && resetData.password !== resetData.confirm && (
                                    <div className="p-3 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm rounded">
                                        Password tidak cocok
                                    </div>
                                )}

                                {resetData.error && (
                                    <div className="p-3 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm rounded">
                                        {resetData.error}
                                    </div>
                                )}

                                {resetData.message && (
                                    <div className="p-3 bg-green-50 border-l-4 border-green-400 text-green-700 text-sm rounded">
                                        {resetData.message}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={resetData.isLoading || resetData.password !== resetData.confirm || resetData.password.length < 6}
                                    className="w-full h-12 bg-gradient-to-r from-[#16A34A] to-[#15803D] hover:from-[#15803D] hover:to-[#166534] text-white rounded-lg font-semibold shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {resetData.isLoading ? (
                                        <div className="flex items-center justify-center">
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                            Menyimpan...
                                        </div>
                                    ) : (
                                        'Simpan Password Baru'
                                    )}
                                </button>
                            </form>
                        )}

                        {/* Back Button - Hide on step 3 (email sent) */}
                        {resetData.step !== 3 && (
                            <div className={`mt-8 text-center transform transition-all duration-700 ease-out ${isEntering ? 'opacity-0 translate-y-3' : 'opacity-100 translate-y-0'
                                }`} style={{ transitionDelay: isEntering ? '0ms' : '1400ms' }}>
                                <button
                                    onClick={handleBackToLogin}
                                    disabled={isExiting}
                                    className={`inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-all duration-300 transform hover:scale-110 hover:-translate-x-1 disabled:opacity-50 disabled:cursor-not-allowed ${isExiting ? 'animate-pulse' : ''
                                        }`}
                                >
                                    <span className="mr-2 transition-transform duration-300 group-hover:-translate-x-1">←</span>
                                    {isExiting ? 'Kembali ke Login...' : 'Kembali ke Login'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}