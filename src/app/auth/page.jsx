'use client';

import dynamic from 'next/dynamic';

// Disable SSR for Auth component
const Auth = dynamic(() => import('@/components/Auth'), { ssr: false });

export default function AuthPage() {
    return <Auth />;
}
