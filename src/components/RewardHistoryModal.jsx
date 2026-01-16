import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';

const RewardHistoryModal = ({ isOpen, onClose, user }) => {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        if (isOpen && user?.email) fetchHistory();
    }, [isOpen, user]);

    const fetchHistory = async () => {
        const { data, error } = await supabase
            .from('redemptions')
            .select('*, rewards(name, cost)')
            .eq('user_email', user.email)
            .order('created_at', { ascending: false });

        if (!error) setHistory(data);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 bg-black bg-opacity-40 flex justify-center items-center px-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-xl max-w-md w-full relative"
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        transition={{ duration: 0.3, type: 'spring' }}
                    >
                        <button
                            className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
                            onClick={onClose}
                        >
                            ✖
                        </button>
                        <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">
                            🔁 Riwayat Penukaran Hadiah
                        </h2>

                        {history.length === 0 ? (
                            <p className="text-sm text-gray-500">Belum ada penukaran hadiah.</p>
                        ) : (
                            <ul className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                {history.map((item) => (
                                    <li key={item.id} className="border border-gray-200 dark:border-gray-700 p-3 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold text-gray-800 dark:text-white">
                                                    🎁 {item.rewards?.name || 'Hadiah'}
                                                </p>
                                                <p className="text-sm text-gray-500">🔢 {item.rewards?.cost || 0} pts</p>
                                                <p className="text-xs text-gray-400">
                                                    🕐 {new Date(item.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                            <span
                                                className={`text-xs font-semibold px-2 py-1 rounded-full ${item.status === 'approved'
                                                    ? 'bg-green-100 text-green-700'
                                                    : item.status === 'pending'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-red-100 text-red-700'
                                                    }`}
                                            >
                                                {item.status}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default RewardHistoryModal;