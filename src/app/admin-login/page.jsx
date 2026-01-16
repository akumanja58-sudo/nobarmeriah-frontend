'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';
import { Eye, EyeOff, Shield, Loader2 } from 'lucide-react';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Email dan password harus diisi!');
            return;
        }

        setLoading(true);

        try {
            console.log("🔐 Attempting admin login...");

            // 1. Login ke Supabase
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password
            });

            if (authError) {
                console.error("❌ Auth error:", authError);
                setError(`Login gagal: ${authError.message}`);
                return;
            }

            if (!data?.user) {
                setError('Login gagal: User tidak ditemukan');
                return;
            }

            console.log("✅ Supabase login success:", data.user.email);

            // 2. Check apakah user adalah admin
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('is_admin, username')
                .eq('user_id', data.user.id)
                .single();

            if (profileError) {
                console.error("❌ Profile error:", profileError);
                setError('Gagal mengambil data profile');
                return;
            }

            if (!profile?.is_admin) {
                setError('Akses ditolak: Kamu bukan admin!');
                // Logout user yang bukan admin
                await supabase.auth.signOut();
                return;
            }

            console.log("✅ Admin verified:", profile.username);

            // 3. Simpan info admin ke localStorage
            localStorage.setItem('admin_email', data.user.email);
            localStorage.setItem('admin_username', profile.username || 'Admin');
            localStorage.setItem('admin_user_id', data.user.id);
            localStorage.setItem('admin_logged_in', 'true');

            console.log("🎉 Admin login success! Redirecting...");

            // 4. Redirect ke admin panel
            router.push('/admin-panel');

        } catch (err) {
            console.error('❌ Login error:', err);
            setError('Terjadi kesalahan: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
            </div>

            <div className="relative bg-white/10 backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl mb-4 shadow-lg">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Admin Login</h2>
                    <p className="text-gray-400 text-sm">Masuk ke dashboard admin</p>
                </div>

                {/* Error message */}
                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl mb-6 text-sm">
                        ⚠️ {error}
                    </div>
                )}

                {/* Login form */}
                <form onSubmit={handleLogin} className="space-y-5">
                    {/* Email input */}
                    <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">
                            Email Admin
                        </label>
                        <input
                            type="email"
                            placeholder="admin@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            disabled={loading}
                        />
                    </div>

                    {/* Password input */}
                    <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPass ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all pr-12"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(!showPass)}
                                className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                            >
                                {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Submit button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 shadow-lg"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Memproses...</span>
                            </>
                        ) : (
                            <>
                                <Shield className="w-5 h-5" />
                                <span>Login Admin</span>
                            </>
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="mt-6 text-center">
                    <a
                        href="/"
                        className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                        ← Kembali ke Home
                    </a>
                </div>
            </div>
        </div>
    );
}
