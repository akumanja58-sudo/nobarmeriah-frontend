'use client';

import { useParams } from 'next/navigation';
import VolleyballMatchDetailClient from '@/components/VolleyballMatchDetailClient';

export default function VolleyballGamePage() {
    const params = useParams();
    const gameId = params.id;

    return <VolleyballMatchDetailClient gameId={gameId} />;
}
