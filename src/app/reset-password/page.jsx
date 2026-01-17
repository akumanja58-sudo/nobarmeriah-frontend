'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';

function maskEmail(email) {
    const [name, domain] = email.split('@');
    const maskedName = name.length <= 2 ? name[0] + '*' : name.slice(0, 2) + '*'.repeat(name.length - 2);
    return maskedName + '@' + domain;
}

// Loading component
function LoadingSpinner() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F7FEE7] to-[#D9F99D]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
    );
}

// Main Reset Password Component
function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const isFromEmail = searchParams.get('type') === 'recovery';
    
    const [isEntering, setIsEntering] = useState(true);
    const [isExiting, setIsExiting] = useState(false);
    
    const [resetData, setResetData] = useState({
        step: isFromEmail ? 4 : 1,
        identifier: '',
        account: null,
        verifyMethod: '',
        password: '',
        confirmPassword: '',
        showPassword: false,
        showConfirm: false,
        errorMsg: '',
        successMsg: '',
        isLoading: false
    });

    useEffect(() => {
        setTimeout(() => setIsEntering(false), 100);
    }, []);

    const handleBackToHome = () => {
        router.push('/');
    };

    const handleBackToLogin = () => {
        setIsExiting(true);
        setTimeout(() => {
            router.push('/auth');
        }, 300);
    };

    // Step 1: Find account
    const handleFindAccount = async (e) => {
        e.preventDefault();
        setResetData(prev => ({ ...prev, isLoading: true, errorMsg: '' }));

        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .or('username.eq.' + resetData.identifier + ',email.eq.' + resetData.identifier + ',phone.eq.' + resetData.identifier)
                .single();

            if (error || !profile) {
                setResetData(prev => ({ ...prev, errorMsg: 'Akun tidak ditemukan', isLoading: false }));
                return;
            }

            setResetData(prev => ({
                ...prev,
                account: profile,
                step: 2,
                isLoading: false
            }));
        } catch (err) {
            setResetData(prev => ({ ...prev, errorMsg: 'Terjadi kesalahan', isLoading: false }));
        }
    };

    // Step 2: Choose verification method
    const handleChooseMethod = (method) => {
        setResetData(prev => ({ ...prev, verifyMethod: method }));
    };

    // Step 2: Send verification
    const handleSendVerification = async () => {
        setResetData(prev => ({ ...prev, isLoading: true, errorMsg: '' }));

        if (resetData.verifyMethod === 'email') {
            try {
                const redirectUrl = typeof window !== 'undefined' 
                    ? window.location.origin + '/reset-password?type=recovery'
                    : '/reset-password?type=recovery';
                    
                const { error } = await supabase.auth.resetPasswordForEmail(resetData.account.email, {
                    redirectTo: redirectUrl
                });

                if (error) {
                    setResetData(prev => ({ ...prev, errorMsg: 'Gagal mengirim email: ' + error.message, isLoading: false }));
                    return;
                }

                setResetData(prev => ({ ...prev, step: 3, isLoading: false }));
            } catch (err) {
                setResetData(prev => ({ ...prev, errorMsg: 'Terjadi kesalahan', isLoading: false }));
            }
        } else {
            setResetData(prev => ({ ...prev, errorMsg: 'WhatsApp verification belum tersedia', isLoading: false }));
        }
    };

    // Step 4: Set new password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        
        if (resetData.password !== resetData.confirmPassword) {
            setResetData(prev => ({ ...prev, errorMsg: 'Password tidak sama' }));
            return;
        }

        if (resetData.password.length < 6) {
            setResetData(prev => ({ ...prev, errorMsg: 'Password minimal 6 karakter' }));
            return;
        }

        setResetData(prev => ({ ...prev, isLoading: true, errorMsg: '' }));

        try {
            const { error } = await supabase.auth.updateUser({
                password: resetData.password
            });

            if (error) {
                setResetData(prev => ({ ...prev, errorMsg: 'Gagal reset password: ' + error.message, isLoading: false }));
                return;
            }

            setResetData(prev => ({ ...prev, successMsg: 'Password berhasil diubah!', isLoading: false }));
            
            setTimeout(() => {
                router.push('/auth');
            }, 2000);
        } catch (err) {
            setResetData(prev => ({ ...prev, errorMsg: 'Terjadi kesalahan', isLoading: false }));
        }
    };

    // Password strength indicator
    const getPasswordStrength = (password) => {
        if (!password) return { level: 0, text: '', color: '' };
        if (password.length < 6) return { level: 1, text: 'Lemah', color: 'bg-red-500' };
        if (password.length < 8) return { level: 2, text: 'Sedang', color: 'bg-yellow-500' };
        if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
            return { level: 3, text: 'Kuat', color: 'bg-green-500' };
        }
        return { level: 2, text: 'Sedang', color: 'bg-yellow-500' };
    };

    const strength = getPasswordStrength(resetData.password);

    return (
        <div className={'min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F7FEE7] to-[#D9F99D] p-4 transition-all duration-300 ' + (isEntering ? 'opacity-0 scale-95' : 'opacity-100 scale-100') + (isExiting ? ' opacity-0 scale-95' : '')}>
            
            {/* Back Button */}
            <button
                onClick={handleBackToHome}
                className="fixed top-4 left-4 z-50 bg-white hover:bg-gray-50 text-gray-800 px-4 py-2 rounded-xl shadow-lg transition-all"
            >
                ? Kembali
            </button>

            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
                
                {/* Step 1: Find Account */}
                {resetData.step === 1 && (
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">?? Lupa Password</h1>
                        <p className="text-gray-500 text-center mb-6">Masukkan username, email, atau nomor HP</p>
                        
                        <form onSubmit={handleFindAccount} className="space-y-4">
                            <input
                                type="text"
                                placeholder="Username / Email / No. HP"
                                value={resetData.identifier}
                                onChange={(e) => setResetData(prev => ({ ...prev, identifier: e.target.value }))}
                                className="w-full p-3 bg-gray-100 rounded-lg outline-none"
                                required
                            />
                            
                            {resetData.errorMsg && <p className="text-red-500 text-sm text-center">{resetData.errorMsg}</p>}
                            
                            <button
                                type="submit"
                                disabled={resetData.isLoading}
                                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
                            >
                                {resetData.isLoading ? 'Mencari...' : 'Cari Akun'}
                            </button>
                        </form>
                        
                        <button onClick={handleBackToLogin} className="w-full mt-4 text-gray-500 hover:text-gray-700">
                            Kembali ke Login
                        </button>
                    </div>
                )}

                {/* Step 2: Choose Verification */}
                {resetData.step === 2 && (
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">?? Verifikasi</h1>
                        <p className="text-gray-500 text-center mb-6">Pilih metode verifikasi</p>
                        
                        <div className="space-y-3 mb-6">
                            <button
                                onClick={() => handleChooseMethod('email')}
                                className={'w-full p-4 rounded-lg border-2 text-left transition-all ' + (resetData.verifyMethod === 'email' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300')}
                            >
                                <div className="font-medium">?? Email</div>
                                <div className="text-sm text-gray-500">{maskEmail(resetData.account?.email || '')}</div>
                            </button>
                            
                            <button
                                onClick={() => handleChooseMethod('whatsapp')}
                                className={'w-full p-4 rounded-lg border-2 text-left transition-all ' + (resetData.verifyMethod === 'whatsapp' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300')}
                            >
                                <div className="font-medium">?? WhatsApp</div>
                                <div className="text-sm text-gray-500">{resetData.account?.phone || 'Tidak tersedia'}</div>
                            </button>
                        </div>
                        
                        {resetData.errorMsg && <p className="text-red-500 text-sm text-center mb-4">{resetData.errorMsg}</p>}
                        
                        <button
                            onClick={handleSendVerification}
                            disabled={!resetData.verifyMethod || resetData.isLoading}
                            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
                        >
                            {resetData.isLoading ? 'Mengirim...' : 'Kirim Verifikasi'}
                        </button>
                        
                        <button onClick={() => setResetData(prev => ({ ...prev, step: 1 }))} className="w-full mt-4 text-gray-500 hover:text-gray-700">
                            ? Kembali
                        </button>
                    </div>
                )}

                {/* Step 3: Email Sent */}
                {resetData.step === 3 && (
                    <div className="text-center">
                        <div className="text-6xl mb-4">??</div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">Email Terkirim!</h1>
                        <p className="text-gray-500 mb-6">
                            Cek inbox email kamu di<br/>
                            <strong>{maskEmail(resetData.account?.email || '')}</strong>
                        </p>
                        <button onClick={handleBackToLogin} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium">
                            Kembali ke Login
                        </button>
                    </div>
                )}

                {/* Step 4: New Password */}
                {resetData.step === 4 && (
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">?? Password Baru</h1>
                        <p className="text-gray-500 text-center mb-6">Masukkan password baru kamu</p>
                        
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="relative">
                                <input
                                    type={resetData.showPassword ? 'text' : 'password'}
                                    placeholder="Password Baru"
                                    value={resetData.password}
                                    onChange={(e) => setResetData(prev => ({ ...prev, password: e.target.value }))}
                                    className="w-full p-3 pr-12 bg-gray-100 rounded-lg outline-none"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setResetData(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                                    className="absolute right-3 top-3 text-gray-500"
                                >
                                    {resetData.showPassword ? '??' : '???'}
                                </button>
                            </div>
                            
                            {/* Password Strength */}
                            {resetData.password && (
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div className={'h-full transition-all ' + strength.color} style={{ width: (strength.level * 33) + '%' }}></div>
                                    </div>
                                    <span className="text-sm text-gray-500">{strength.text}</span>
                                </div>
                            )}
                            
                            <div className="relative">
                                <input
                                    type={resetData.showConfirm ? 'text' : 'password'}
                                    placeholder="Konfirmasi Password"
                                    value={resetData.confirmPassword}
                                    onChange={(e) => setResetData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                    className="w-full p-3 pr-12 bg-gray-100 rounded-lg outline-none"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setResetData(prev => ({ ...prev, showConfirm: !prev.showConfirm }))}
                                    className="absolute right-3 top-3 text-gray-500"
                                >
                                    {resetData.showConfirm ? '??' : '???'}
                                </button>
                            </div>
                            
                            {resetData.errorMsg && <p className="text-red-500 text-sm text-center">{resetData.errorMsg}</p>}
                            {resetData.successMsg && <p className="text-green-500 text-sm text-center">{resetData.successMsg}</p>}
                            
                            <button
                                type="submit"
                                disabled={resetData.isLoading}
                                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
                            >
                                {resetData.isLoading ? 'Menyimpan...' : 'Simpan Password'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

// Main export with Suspense wrapper
export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <ResetPasswordContent />
        </Suspense>
    );
}
