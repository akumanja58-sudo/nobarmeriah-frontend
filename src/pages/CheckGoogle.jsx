import { useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useNavigate } from 'react-router-dom';

const CheckGoogle = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const validateGoogleEmail = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;

            if (!user) {
                alert("Login gagal, tidak ada sesi aktif.");
                navigate('/');
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
                navigate('/');
            } else {
                // Email belum pernah dipakai
                navigate('/dashboard');
            }
        };

        validateGoogleEmail();
    }, []);

    return null;
};

export default CheckGoogle;
