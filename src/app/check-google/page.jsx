'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';

export default function CheckGoogle() {
    const router = useRouter();

    useEffect(() => {
        const validateGoogleEmail = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;

            if (!user) {
                alert("Login gagal, tidak ada sesi aktif.");
                router.push('/');
                return;
            }

            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('username')
                .eq('email', user.email)
                .single();

            if (existingProfile) {
                // Email sudah pernah dipakai akun manual
                alert('Email sudah terdaftar via username. Silakan login manual.');
                await supabase.auth.signOut();
                router.push('/');
            } else {
                // Email belum pernah dipakai
                router.push('/');
            }
        };

        validateGoogleEmail();
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-condensed">Memverifikasi akun Google...</p>
            </div>
        </div>
    );
}
