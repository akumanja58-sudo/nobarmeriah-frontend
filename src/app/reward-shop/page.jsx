'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import RewardShop from '@/components/RewardShop';

export default function RewardShopPage() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser(session.user);
            }
        };
        getUser();
    }, []);

    return <RewardShop user={user} />;
}