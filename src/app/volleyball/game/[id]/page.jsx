import VolleyballMatchDetailClient from '@/components/VolleyballMatchDetailClient';

export default function VolleyballGamePage({ params }) {
    return <VolleyballMatchDetailClient gameId={params.id} />;
}
