'use client';

import { useParams } from 'next/navigation';
import BaseballMatchDetailClient from '@/components/BaseballMatchDetailClient';

export default function BaseballGamePage() {
    const params = useParams();
    const gameId = params.id;

    return <BaseballMatchDetailClient gameId={gameId} />;
}
