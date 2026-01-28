'use client';

import { useParams } from 'next/navigation';
import TennisMatchDetailClient from '@/components/TennisMatchDetailClient';

export default function TennisMatchPage() {
    const params = useParams();
    const matchId = params.id;

    return <TennisMatchDetailClient matchId={matchId} />;
}
