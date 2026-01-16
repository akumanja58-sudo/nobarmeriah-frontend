import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useRouter } from 'next/navigation';
import React from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

const RewardShop = ({ user }) => {
    const router = useRouter();
    const [rewards, setRewards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [points, setPoints] = useState(0);
    const [success, setSuccess] = useState('');
    const [loadingId, setLoadingId] = useState(null);
    const [userRedemptions, setUserRedemptions] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const navigate = useRouter();

    useEffect(() => {
        if (user?.email) {
            fetchRewards();
            fetchUserPoints();
            fetchUserRedemptions();
            console.log("User ke-load brek:", user);
        }
    }, [user]);

    useEffect(() => {
        if (!user?.email) return;

        const channel = supabase
            .channel('reward-updates')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'redemptions',
                filter: `user_email=eq.${user.email}`,
            }, async (payload) => {
                if (payload.new.status === 'approved') {
                    setModalMessage('🎉 Selamat! Reward kamu telah disetujui admin dan poin telah terpotong!');
                    setShowModal(true);
                    confetti({
                        particleCount: 150,
                        spread: 70,
                        origin: { y: 0.6 },
                    });
                } else if (payload.new.status === 'rejected') {
                    setModalMessage('😔 Maaf, permintaan reward kamu ditolak. Poin sudah dikembalikan.');
                    setShowModal(true);
                }
                fetchUserPoints();
                fetchUserRedemptions();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const fetchRewards = async () => {
        console.log('Fetching rewards...');
        setLoading(true);
        const { data, error } = await supabase.from('rewards').select('*');
        console.log('Rewards data:', data); // Tambahin ini
        console.log('Rewards error:', error); // Tambahin ini
        if (error) console.error('Gagal ambil rewards:', error);
        else setRewards(data);
        setLoading(false);
    };

    const fetchUserPoints = async () => {
        if (!user?.email) return;

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('points, season_points, total_experience')
            .eq('email', user.email)
            .single();

        if (error) {
            console.error("Gagal ambil profil:", error);
            return;
        }

        // Prioritas: season_points > total_experience > points
        const totalPoints = Number(profile?.season_points) || Number(profile?.total_experience) || Number(profile?.points) || 0;
        setPoints(totalPoints);
    };

    const fetchUserRedemptions = async () => {
        if (!user?.email) return;

        const { data, error } = await supabase
            .from('redemptions')
            .select('reward_id, status')
            .eq('user_email', user.email);

        if (!error) {
            setUserRedemptions(data);
        }
    };

    const redeemReward = async (reward) => {
        const alreadyRequested = userRedemptions.find(
            (r) => r.reward_id === reward.id && r.status === 'pending'
        );

        if (alreadyRequested) {
            alert("Kamu sudah menukar hadiah ini sebelumnya, silakan tunggu persetujuan admin.");
            return;
        }

        if (points < reward.points_required) {
            alert('Poin kamu belum cukup 🥲');
            return;
        }

        setLoadingId(reward.id);

        const { error: insertError } = await supabase.from('redemptions').insert([
            {
                user_email: user.email,
                reward_id: reward.id,
                status: 'pending',
            },
        ]);

        if (insertError) {
            alert('Gagal menukar hadiah');
            console.error(insertError);
        } else {
            setSuccess(`Berhasil mengajukan penukaran: ${reward.name}. Menunggu persetujuan admin...`);
            confetti({
                particleCount: 50,
                spread: 45,
                origin: { y: 0.6 },
            });

            await fetchUserRedemptions();
        }

        setLoadingId(null);
    };

    // Get unique categories from rewards
    const categories = ['all', ...new Set(rewards.map(r => r.category).filter(Boolean))];

    // Filter rewards by category
    const filteredRewards = selectedCategory === 'all'
        ? rewards
        : rewards.filter(r => r.category === selectedCategory);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F7FEE7] to-[#D9F99D] p-4">
            <div className="max-w-6xl mx-auto w-full bg-white dark:bg-gray-900 shadow-xl rounded-2xl p-4 sm:p-6 space-y-6">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                >
                    <button
                        onClick={() => {
                            window.location.href = '/';
                        }}
                        className="mb-4 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors font-condensed"
                    >
                        ← Kembali ke Dashboard
                    </button>

                    <div className="flex flex-wrap justify-between items-center gap-y-4 mb-6">
                        <h2 className="font-condensed text-3xl text-gray-800 dark:text-white">🎁 Reward Shop</h2>

                        {/* Points Display */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-green-100 dark:bg-green-800 text-gray-800 dark:text-white px-4 py-2 rounded-lg shadow-sm"
                        >
                            <div className="flex items-center space-x-2">
                                <span className="text-lg">💎</span>
                                <div>
                                    <span className="font-condensed text-sm">Total Poin: </span>
                                    <span className="font-condensed text-lg font-bold">{points.toLocaleString()} pts</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    <p className="text-gray-600 dark:text-gray-300 font-condensed">Tukar poin kamu dengan hadiah menarik!</p>
                </motion.div>

                {/* Success Message */}
                <AnimatePresence>
                    {success && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mb-4 bg-green-100 dark:bg-green-800 text-gray-800 dark:text-white p-4 rounded-xl shadow-sm border border-green-200 dark:border-green-600"
                        >
                            <div className="flex items-center space-x-2">
                                <span className="text-lg">✨</span>
                                <span className="font-condensed text-sm">{success}</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Category Filter */}
                {categories.length > 1 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mb-6"
                    >
                        <div className="flex flex-wrap gap-2">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`px-4 py-2 rounded-lg font-condensed text-sm transition-all duration-200 ${selectedCategory === category
                                        ? 'bg-green-500 text-white shadow-md'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    {category === 'all' ? 'Semua Kategori' : category}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="text-center">
                            <div className="w-12 h-12 border-4 border-green-200 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600 dark:text-gray-300 font-condensed">Memuat rewards...</p>
                        </div>
                    </div>
                ) : (
                    /* Rewards Grid */
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                    >
                        {filteredRewards.map((reward, index) => {
                            const alreadyPending = userRedemptions.some(
                                (r) => r.reward_id === reward.id && r.status === 'pending'
                            );
                            const canAfford = points >= (reward.points_required || 0);

                            return (
                                <motion.div
                                    key={reward.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700"
                                >
                                    {/* Reward Image */}
                                    <div className="relative h-40 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                        {reward.image_url ? (
                                            <img
                                                src={reward.image_url}
                                                alt={reward.name}
                                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="text-4xl opacity-50">🎁</span>
                                            </div>
                                        )}

                                        {/* Cost Badge */}
                                        <div className="absolute top-2 right-2 bg-yellow-400 text-black px-2 py-1 rounded-lg font-condensed text-xs font-bold shadow">
                                            {(reward.points_required || 0).toLocaleString()} pts
                                        </div>

                                        {/* Status Badge */}
                                        {alreadyPending && (
                                            <div className="absolute top-2 left-2 bg-orange-400 text-white px-2 py-1 rounded-lg font-condensed text-xs font-semibold shadow">
                                                PENDING
                                            </div>
                                        )}
                                    </div>

                                    {/* Reward Info */}
                                    <div className="p-4">
                                        <h3 className="font-condensed text-lg font-semibold text-gray-800 dark:text-white mb-2">
                                            {reward.name}
                                        </h3>

                                        {reward.description && (
                                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 font-condensed line-clamp-2">
                                                {reward.description}
                                            </p>
                                        )}

                                        {/* Action Button */}
                                        <button
                                            onClick={() => redeemReward(reward)}
                                            disabled={loadingId === reward.id || !canAfford || alreadyPending}
                                            className={`w-full py-2 px-4 rounded-lg font-condensed text-sm font-medium transition-all duration-200 ${!canAfford || alreadyPending
                                                ? 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                                : loadingId === reward.id
                                                    ? 'bg-green-400 text-white cursor-wait'
                                                    : 'bg-green-500 hover:bg-green-600 text-white shadow hover:shadow-md'
                                                }`}
                                        >
                                            {alreadyPending
                                                ? '⏳ Menunggu Admin'
                                                : loadingId === reward.id
                                                    ? '⌛ Memproses...'
                                                    : !canAfford
                                                        ? '💸 Poin Tidak Cukup'
                                                        : '🎯 Tukar Sekarang'
                                            }
                                        </button>

                                        {/* Additional Info */}
                                        {alreadyPending && (
                                            <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 text-center font-condensed">
                                                ⚡ Permintaan sedang ditinjau admin
                                            </p>
                                        )}
                                        {!canAfford && !alreadyPending && (
                                            <p className="text-xs text-red-500 dark:text-red-400 mt-2 text-center font-condensed">
                                                Butuh {((reward.points_required || 0) - points).toLocaleString()} poin lagi
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}

                {/* Empty State */}
                {!loading && filteredRewards.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20"
                    >
                        <div className="text-6xl mb-4">🎁</div>
                        <h3 className="text-xl font-condensed font-bold text-gray-800 dark:text-white mb-2">Belum Ada Reward</h3>
                        <p className="text-gray-600 dark:text-gray-300 font-condensed">
                            {selectedCategory === 'all'
                                ? 'Reward akan segera hadir!'
                                : `Belum ada reward di kategori "${selectedCategory}"`
                            }
                        </p>
                    </motion.div>
                )}
            </div>

            {/* Success/Status Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl text-center max-w-md w-full p-6"
                        >
                            <div className="text-4xl mb-4">
                                {modalMessage.includes('🎉') ? '🎉' : '😔'}
                            </div>
                            <h2 className="text-xl font-condensed font-bold text-gray-800 dark:text-white mb-3">Status Update</h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed font-condensed">{modalMessage}</p>
                            <button
                                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-condensed font-medium transition-all duration-200 shadow"
                                onClick={() => setShowModal(false)}
                            >
                                OK, Mengerti!
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RewardShop;