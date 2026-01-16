'use client';

import dynamic from 'next/dynamic';

// Force dynamic rendering - skip prerender
export const dynamic = 'force-dynamic';

// Disable SSR for Auth component
const Auth = dynamic(() => import('@/components/Auth'), { 
    ssr: false,
    loading: () => (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F7FEE7] to-[#D9F99D]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
    )
});

export default function AuthPage() {
    return <Auth />;
}
