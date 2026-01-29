import BaseballMatchDetailClient from '@/components/BaseballMatchDetailClient';

export default function BaseballGamePage({ params }) {
    return <BaseballMatchDetailClient gameId={params.id} />;
}
