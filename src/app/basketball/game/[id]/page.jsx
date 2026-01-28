'use client';

import { useParams } from 'next/navigation';
import BasketballMatchDetailClient from '@/components/BasketballMatchDetailClient';

export default function BasketballGamePage() {
    const params = useParams();
    const gameId = params.id;

    return <BasketballMatchDetailClient gameId={gameId} />;
}
