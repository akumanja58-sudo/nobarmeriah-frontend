// Penilaian berdasarkan poin
export const getRankBadge = (points) => {
    if (points >= 100) return { label: 'Gold 🟡', color: 'bg-yellow-300 text-yellow-800' };
    if (points >= 50) return { label: 'Silver ⚪', color: 'bg-gray-300 text-gray-800' };
    if (points >= 20) return { label: 'Bronze 🟤', color: 'bg-amber-800 text-amber-100' };
    return { label: 'Rookie 🔰', color: 'bg-green-100 text-green-800' };
};

// Hitung streak prediksi benar beruntun
export const getUserStreak = async (email) => {
    const { data, error } = await supabase
        .from('predictions')
        .select('points')
        .eq('email', email)
        .order('submitted_at', { ascending: false })
        .limit(10);

    if (error || !data) return 0;

    let streak = 0;
    for (const row of data) {
        if (row.points > 0) streak++;
        else break;
    }
    return streak;
};
