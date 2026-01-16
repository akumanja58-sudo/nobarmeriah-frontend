import { Suspense } from 'react';
import MatchDetailClient from './MatchDetailClient';

// Generate metadata untuk SEO
export async function generateMetadata({ params }) {
    const { slug } = await params;

    const parts = slug.split('-vs-');
    let homeTeam = 'Home Team';
    let awayTeam = 'Away Team';

    if (parts.length >= 2) {
        homeTeam = parts[0].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const awayParts = parts[1].split('-');
        awayParts.pop();
        awayTeam = awayParts.join(' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    return {
        title: `${homeTeam} vs ${awayTeam} - Live Score | NobarMeriah`,
        description: `Saksikan ${homeTeam} vs ${awayTeam} secara live! Prediksi skor dan streaming gratis di NobarMeriah.`,
    };
}

function MatchLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F7FEE7] to-[#D9F99D]">
            <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Loading match...</p>
            </div>
        </div>
    );
}

export default async function MatchPage({ params }) {
    const { slug } = await params;
    const parts = slug.split('-');
    const matchId = parts[parts.length - 1];

    return (
        <Suspense fallback={<MatchLoading />}>
            <MatchDetailClient matchSlug={slug} matchId={matchId} />
        </Suspense>
    );
}