import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { Eye, EyeOff } from 'lucide-react';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async () => {
        if (!email || !password) return alert('Lengkapi semua kolom!');
        setLoading(true);

        try {
            console.log("🔐 Testing login with:", { email, password: "***" });

            // 1. Login ke Supabase dengan debug
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(), // Remove whitespace
                password: password
            });

            console.log("📊 Supabase response:", { data, error });

            if (error) {
                console.error("❌ Supabase error details:", error);
                alert(`Supabase login failed: ${error.message}`);
                return;
            }

            if (!data?.user) {
                console.error("❌ No user data from Supabase");
                alert('Login gagal: No user data returned');
                return;
            }

            console.log("✅ Supabase login success, user:", data.user.email);

            // 2. Check admin profile (existing)
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('is_admin, username')
                .eq('user_id', data.user.id)
                .single();

            console.log("🧠 Cek admin profile:", profile);

            if (profileError || !profile?.is_admin) {
                alert('Akses ditolak: kamu bukan admin!');
                return;
            }

            console.log("✅ Supabase login berhasil, getting backend JWT token...");

            // 🆕 3. GET JWT TOKEN dari backend untuk API calls
            try {
                // 🔧 FIX: Hardcode URL dulu
                const backendApiUrl = 'http://localhost:5000'; // Hardcode
                console.log('🔗 Using backend URL:', backendApiUrl);

                const backendLoginResponse = await fetch(`${backendApiUrl}/api/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        username: 'Maureennn666', // Hardcode
                        password: 'meriahku15M!' // Hardcode  
                    })
                });

                console.log('📡 Backend response status:', backendLoginResponse.status);

                if (!backendLoginResponse.ok) {
                    throw new Error(`Backend login failed: ${backendLoginResponse.status}`);
                }

                const backendResult = await backendLoginResponse.json();
                console.log("🎯 Backend login result:", backendResult);

                if (backendResult.success && backendResult.token) {
                    // 💾 SAVE ALL CREDENTIALS
                    localStorage.setItem('admin_email', email);
                    localStorage.setItem('admin_token', backendResult.token); // 🆕 JWT TOKEN
                    localStorage.setItem('admin_username', profile.username || 'Maureennn666');
                    localStorage.setItem('supabase_user_id', data.user.id);

                    console.log('🎉 Dual authentication success!');
                    console.log('✅ Supabase Auth: ✓');
                    console.log('✅ Backend JWT: ✓');

                    alert('🎉 Login berhasil! Admin Panel siap dengan monitoring.');
                    navigate('/admin-panel');
                } else {
                    throw new Error('Backend login response invalid');
                }
            } catch (backendError) {
                console.error('❌ Backend login failed:', backendError);

                // Fallback - proceed with Supabase only
                console.warn('⚠️ Proceeding with Supabase-only login (monitoring features disabled)');
                localStorage.setItem('admin_email', email);
                localStorage.setItem('admin_username', profile.username || 'admin');

                alert('⚠️ Login berhasil, tapi beberapa fitur monitoring mungkin tidak tersedia.');
                navigate('/admin-panel');
            }

        } catch (err) {
            console.error('❌ DUAL LOGIN ERROR:', err);
            alert('Terjadi kesalahan saat login: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900 p-4">
            <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-sm space-y-6">
                <h2 className="text-2xl font-bold text-center text-gray-800">Login Admin</h2>

                <input
                    type="email"
                    placeholder="Email Admin"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                />

                <div className="relative">
                    <input
                        type={showPass ? 'text' : 'password'}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2 border rounded-lg pr-10"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute top-1/2 right-2 transform -translate-y-1/2 text-gray-500"
                    >
                        {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>

                <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white w-full py-2 rounded-xl font-semibold"
                >
                    {loading ? 'Memproses...' : 'Login'}
                </button>
            </div>
        </div>
    );
};

export default AdminLogin;