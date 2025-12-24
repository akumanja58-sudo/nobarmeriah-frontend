import { supabase } from '../utils/supabaseClient';

export const jalankanPenilaian = async () => {
    console.log("🔑 Mulai login admin...");

    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'maureengabriella25@gmail.com',
        password: 'meriahku15M!'
    });

    if (loginError) {
        alert("Login admin gagal!");
        console.error(loginError);
        return;
    }

    const token = loginData.session.access_token;
    const refreshToken = loginData.session.refresh_token;

    console.log('🎯 Injecting access_token:', token);

    const { error: setSessionError } = await supabase.auth.setSession({
        access_token: token,
        refresh_token: refreshToken,
    });

    if (setSessionError) {
        alert('❌ Gagal set session admin!');
        console.error('Session error:', setSessionError);
        return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    console.log('🔐 Current session:', sessionData.session?.user?.email);

    const { data: matches, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .not('home_score', 'is', null)
        .not('away_score', 'is', null);

    if (matchError) {
        alert("Gagal ambil skor asli");
        console.error(matchError);
        return;
    }

    for (const match of matches) {
        console.log(`⚽ Match ${match.id}: Real Score = ${match.home_score}-${match.away_score}`);

        const { data: predictions, error: predErr } = await supabase
            .from('predictions')
            .select('*')
            .eq('match_id', match.id);

        if (predErr) {
            console.error("❌ Gagal ambil prediksi:", predErr);
            continue;
        }

        for (const pred of predictions) {
            if (!pred.predicted) continue;

            const [ph, pa] = pred.predicted.split('-').map(Number);

            // 🎯 SISTEM POINT BARU YANG ENHANCED
            const points = calculatePoints(match.home_score, match.away_score, ph, pa);

            console.log(`🧪 ${pred.username} (${pred.email}) menebak ${ph}-${pa}, poin: ${points.total} (${points.reason})`);

            // Update prediction dengan breakdown poin
            const { error: updateError } = await supabase
                .from('predictions')
                .update({
                    points_earned: points.total,
                    points_breakdown: points.reason // Tambah kolom ini kalau belum ada
                })
                .eq('id', pred.id);

            if (updateError) {
                console.error("❌ Gagal update poin prediction:", updateError);
                continue;
            }

            // Update profile user
            if (points.total > 0) {
                await updateUserProfile(pred.email, points.total);
            }
        }
    }

    alert('🎉 Penilaian selesai dijalankan dengan sistem point baru! 💯');
};

// 🎯 FUNGSI HITUNG POIN YANG BARU
const calculatePoints = (realHome, realAway, predHome, predAway) => {
    const realDiff = realHome - realAway;
    const predDiff = predHome - predAway;

    // ✅ CEK SKOR PERSIS (5 POIN)
    if (predHome === realHome && predAway === realAway) {
        return {
            total: 5,
            reason: "🎯 Skor persis! Perfect prediction!"
        };
    }

    // ✅ CEK ARAH MENANG BENAR (3 POIN)
    if (
        (realDiff === 0 && predDiff === 0) ||     // Sama-sama seri
        (realDiff > 0 && predDiff > 0) ||         // Sama-sama home menang  
        (realDiff < 0 && predDiff < 0)            // Sama-sama away menang
    ) {
        return {
            total: 3,
            reason: "⚽ Arah menang benar! Good prediction!"
        };
    }

    // ✅ CEK HAMPIR BENAR - SELISIH GOL SAMA (1 POIN)
    if (Math.abs(realDiff - predDiff) === 1) {
        return {
            total: 1,
            reason: "📈 Hampir benar! Close prediction!"
        };
    }

    // ❌ SALAH TOTAL (0 POIN)
    return {
        total: 0,
        reason: "❌ Tebakan salah total"
    };
};

// 🔄 FUNGSI UPDATE PROFILE USER
const updateUserProfile = async (email, points) => {
    try {
        const { data: profile, error: getError } = await supabase
            .from('profiles')
            .select('points, lifetime_points, total_wins, streak')
            .eq('email', email)
            .single();

        if (getError) {
            console.error("❌ Gagal ambil profile:", getError);
            return;
        }

        const currentPoints = profile?.points || 0;
        const currentLifetime = profile?.lifetime_points || 0;
        const currentWins = profile?.total_wins || 0;
        const currentStreak = profile?.streak || 0;

        // Update profile dengan poin baru
        const { error: profileUpdateError } = await supabase
            .from('profiles')
            .update({
                points: currentPoints + points,
                lifetime_points: currentLifetime + points,
                total_wins: currentWins + 1, // Increment total wins
                streak: currentStreak + 1    // Increment streak (bisa dikembangkan lebih lanjut)
            })
            .eq('email', email);

        if (profileUpdateError) {
            console.error("❌ Gagal update ke profiles:", profileUpdateError);
        } else {
            console.log(`✅ Update profiles sukses: ${email} (+${points} pts)`);
        }
    } catch (error) {
        console.error("❌ Error update profile:", error);
    }
};

// 📊 FUNGSI TAMBAHAN: CEK STATISTIK PENILAIAN
export const getGradingStats = async (matchId) => {
    try {
        const { data: predictions } = await supabase
            .from('predictions')
            .select('points_earned, points_breakdown')
            .eq('match_id', matchId)
            .not('points_earned', 'is', null);

        if (!predictions || predictions.length === 0) {
            return { message: "Belum ada penilaian untuk match ini" };
        }

        const stats = {
            totalPredictors: predictions.length,
            perfectPredictions: predictions.filter(p => p.points_earned === 5).length,
            goodPredictions: predictions.filter(p => p.points_earned === 3).length,
            closePredictions: predictions.filter(p => p.points_earned === 1).length,
            wrongPredictions: predictions.filter(p => p.points_earned === 0).length,
            averagePoints: predictions.reduce((sum, p) => sum + p.points_earned, 0) / predictions.length
        };

        return stats;
    } catch (error) {
        console.error("Error getting grading stats:", error);
        return null;
    }
};