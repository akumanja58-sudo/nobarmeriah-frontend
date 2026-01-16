'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';

function maskEmail(email) {
    const [name, domain] = email.split('@');
    const maskedName = name.length <= 2 ? name[0] + '*' : name.slice(0, 2) + '*'.repeat(name.length - 2);
    return `${maskedName}@${domain}`;
}

export default function ResetPassword() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Check if this is a password reset from email link
    const isFromEmail = searchParams.get('type') === 'recovery';

    // Animation states
    const [isEntering, setIsEntering] = useState(true);
    const [isExiting, setIsExiting] = useState(false);

    // Reset Password State
    const [resetData, setResetData] = useState({
        step: isFromEmail ? 4 : 1,
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

    // Animation on mount
    useEffect(() => {
        const timer = setTimeout(() => setIsEntering(false), 100);
        return () => clearTimeout(timer);
    }, []);

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

    // Find Account
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

    // Handle Email Verification
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
            setResetData(prev => ({
                ...prev,
                error: 'Verifikasi WhatsApp belum tersedia. Gunakan email untuk sementara.',
            }));
        }
    };

    // Handle New Password
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
            const { error } = await supabase.auth.updateUser({
                password: resetData.password
            });

            if (error) {
                setResetData(prev => ({
                    ...prev,
                    error: 'Gagal mengubah password: ' + error.message,
                    isLoading: false
                }));
                return;
            }

            setResetData(prev => ({
                ...prev,
                message: 'Password berhasil diubah! Mengalihkan ke halaman login...',
                isLoading: false
            }));

            // Sign out and redirect
            setTimeout(async () => {
                await supabase.auth.signOut();
                router.push('/auth');
            }, 2000);

        } catch (error) {
            setResetData(prev => ({
                ...prev,
                error: 'Terjadi kesalahan saat mengubah password',
                isLoading: false
            }));
        }
    };

    const handleBackToLogin = () => {
        setIsExiting(true);
        setTimeout(() => {
            router.push('/auth');
        }, 300);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-700 to-green-800 flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
            </div>

            <div className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 transform transition-all duration-500 ${isEntering ? 'opacity-0 scale-95' : 'opacity-100 scale-100'} ${isExiting ? 'opacity-0 scale-95' : ''}`}>
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl mb-4 shadow-lg">
                        <span className="text-3xl">🔑</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Reset Password</h2>
                    <p className="text-gray-500 text-sm">
                        {resetData.step === 1 && 'Masukkan username, email, atau nomor HP'}
                        {resetData.step === 2 && 'Pilih metode verifikasi'}
                        {resetData.step === 3 && 'Cek email kamu'}
                        {resetData.step === 4 && 'Buat password baru'}
                    </p>
                </div>

                {/* Step 1: Find Account */}
                {resetData.step === 1 && (
                    <form onSubmit={handleFindAccount} className="space-y-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Username / Email / No. HP"
                                value={resetData.identifier}
                                onChange={(e) => setResetData(prev => ({ ...prev, identifier: e.target.value }))}
                                className="w-full p-4 pl-12 bg-gray-100 rounded-lg border-none outline-none text-gray-800 font-medium focus:bg-gray-50 focus:ring-2 focus:ring-green-500 transition-all"
                                autoFocus
                            />
                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600">🔍</span>
                        </div>

                        {resetData.error && (
                            <div className="p-3 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm rounded">
                                {resetData.error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={resetData.isLoading}
                            className="w-full h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-semibold shadow-lg transition-all duration-200 disabled:opacity-50"
                        >
                            {resetData.isLoading ? (
                                <div className="flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Mencari...
                                </div>
                            ) : (
                                'Cari Akun'
                            )}
                        </button>
                    </form>
                )}

                {/* Step 2: Choose Verification Method */}
                {resetData.step === 2 && (
                    <div className="space-y-4">
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-800">
                                <strong>Akun ditemukan!</strong> Pilih metode untuk reset password.
                            </p>
                        </div>

                        <button
                            onClick={() => handleVerifyMethod('email')}
                            disabled={resetData.isLoading}
                            className="w-full p-4 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-4 transition-colors disabled:opacity-50"
                        >
                            <span className="text-2xl">📧</span>
                            <div className="text-left">
                                <p className="font-semibold text-gray-800">Kirim ke Email</p>
                                <p className="text-sm text-gray-500">{maskEmail(resetData.account?.email || '')}</p>
                            </div>
                        </button>

                        {resetData.error && (
                            <div className="p-3 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm rounded">
                                {resetData.error}
                            </div>
                        )}

                        <button
                            onClick={() => setResetData(prev => ({ ...prev, step: 1, account: null }))}
                            className="w-full text-sm text-gray-500 hover:text-gray-700"
                        >
                            ← Cari akun lain
                        </button>
                    </div>
                )}

                {/* Step 3: Email Sent */}
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

                {/* Step 4: New Password */}
                {resetData.step === 4 && (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <div className="relative">
                            <input
                                type={resetData.showPassword ? 'text' : 'password'}
                                placeholder="Password baru"
                                value={resetData.password}
                                onChange={(e) => setResetData(prev => ({ ...prev, password: e.target.value }))}
                                className="w-full p-4 pl-12 pr-12 bg-gray-100 rounded-lg border-none outline-none text-gray-800 font-medium focus:bg-gray-50 focus:ring-2 focus:ring-green-500 transition-all"
                                required
                                minLength={6}
                            />
                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600">🔑</span>
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
                                className="w-full p-4 pl-12 pr-12 bg-gray-100 rounded-lg border-none outline-none text-gray-800 font-medium focus:bg-gray-50 focus:ring-2 focus:ring-green-500 transition-all"
                                required
                            />
                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600">🔑</span>
                            <button
                                type="button"
                                onClick={() => setResetData(prev => ({ ...prev, showConfirm: !prev.showConfirm }))}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
                            >
                                {resetData.showConfirm ? '🙈' : '👁️'}
                            </button>
                        </div>

                        {/* Password Strength */}
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
                            className="w-full h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-semibold shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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

                {/* Back Button */}
                {resetData.step !== 3 && (
                    <div className="mt-8 text-center">
                        <button
                            onClick={handleBackToLogin}
                            disabled={isExiting}
                            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                        >
                            <span className="mr-2">←</span>
                            {isExiting ? 'Kembali ke Login...' : 'Kembali ke Login'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
