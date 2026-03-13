'use client';

import { useParams } from 'next/navigation';
import MMAFightDetailClient from '@/components/MMAFightDetailClient';

export default function MMAFightPage() {
    const params = useParams();
    const fightId = params.id;

    return <MMAFightDetailClient fightId={fightId} />;
}
