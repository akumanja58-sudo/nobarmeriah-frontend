import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LoginRequiredModal = ({ isOpen, onClose, onLogin }) => {
    const [sparkles, setSparkles] = useState([]);

    // Generate sparkle positions
    useEffect(() => {
        const sparklePositions = [
            { top: '20%', left: '20%', delay: 0 },
            { top: '30%', right: '25%', delay: 0.3 },
            { bottom: '25%', left: '30%', delay: 0.6 },
            { bottom: '20%', right: '20%', delay: 0.9 },
            { top: '50%', left: '10%', delay: 1.2 },
            { top: '60%', right: '10%', delay: 1.5 },
        ];
        setSparkles(sparklePositions);
    }, []);

    const modalVariants = {
        hidden: {
            opacity: 0,
            scale: 0.9,
            y: -50,
        },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                type: "spring",
                damping: 25,
                stiffness: 300,
                duration: 0.5
            }
        },
        exit: {
            opacity: 0,
            scale: 0.8,
            y: 50,
            transition: {
                duration: 0.3
            }
        }
    };

    const sparkleVariants = {
        hidden: { opacity: 0, scale: 0 },
        visible: {
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
            transition: {
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };

    const featureCards = [
        { icon: '🏆', title: 'Weekly Challenges', bg: 'from-blue-50 to-blue-100', text: 'text-blue-800' },
        { icon: '📊', title: 'Personal Statistics', bg: 'from-green-50 to-green-100', text: 'text-green-800' },
        { icon: '🏅', title: 'Leaderboard', bg: 'from-purple-50 to-purple-100', text: 'text-purple-800' },
        { icon: '🎯', title: 'Achievement System', bg: 'from-orange-50 to-orange-100', text: 'text-orange-800' },
    ];

    const benefits = [
        { icon: '✅', text: '100% Gratis Untuk Digunakan', color: 'text-green-500' },
        { icon: '⚡', text: 'Akses Ke Semua Fitur Streaming ANTI LAG', color: 'text-green-500' },
        { icon: '🎁', text: 'Dapatkan Point Dari Tebak Skor Untuk Mendapatkan Hadiah', color: 'text-green-500' },
        { icon: '🏆', text: 'Competitif yang fair 100%', color: 'text-green-500' },
    ];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    variants={modalVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="relative max-w-md w-full"
                >
                    {/* Sparkle Effects */}
                    <div className="absolute inset-0 pointer-events-none">
                        {sparkles.map((sparkle, index) => (
                            <motion.div
                                key={index}
                                variants={sparkleVariants}
                                initial="hidden"
                                animate="visible"
                                className="absolute w-1.5 h-1.5 bg-yellow-400 rounded-full"
                                style={{
                                    top: sparkle.top,
                                    left: sparkle.left,
                                    right: sparkle.right,
                                    bottom: sparkle.bottom,
                                }}
                                transition={{ delay: sparkle.delay }}
                            />
                        ))}
                    </div>

                    {/* Main Modal */}
                    <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden">

                        {/* Header with Gradient */}
                        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white p-6 text-center relative overflow-hidden">
                            {/* Background decoration */}
                            <div className="absolute inset-0 opacity-20">
                                <div className="absolute top-0 left-0 w-20 h-20 bg-white rounded-full -translate-x-10 -translate-y-10"></div>
                                <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12"></div>
                            </div>

                            <div className="relative z-10">
                                {/* Lock Icon with Animation */}
                                <motion.div
                                    animate={{
                                        y: [0, -10, 0],
                                    }}
                                    transition={{
                                        duration: 3,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4"
                                >
                                    <motion.div
                                        initial={{ scale: 0, rotate: -10 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{
                                            type: "spring",
                                            damping: 10,
                                            stiffness: 100,
                                            delay: 0.3
                                        }}
                                        className="w-14 h-14 bg-yellow-400 rounded-full flex items-center justify-center text-2xl"
                                    >
                                        🔒
                                    </motion.div>
                                </motion.div>

                                <motion.h2
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-2xl font-bold mb-2"
                                >
                                    Login Diperlukan!
                                </motion.h2>
                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="text-blue-100 text-sm"
                                >
                                    Ikuti Challengenya dan Dapatkan Hadiah Menariknya
                                </motion.p>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">

                            {/* Features Preview */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="text-center mb-6"
                            >
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Apa yang akan kamu dapatkan jika sudah login?</h3>

                                <div className="grid grid-cols-2 gap-3">
                                    {featureCards.map((card, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.7 + index * 0.1 }}
                                            whileHover={{
                                                scale: 1.05,
                                                rotate: 2,
                                                transition: { duration: 0.2 }
                                            }}
                                            className={`bg-gradient-to-br ${card.bg} rounded-xl p-3 text-center cursor-pointer`}
                                        >
                                            <div className="text-2xl mb-2">{card.icon}</div>
                                            <p className={`text-xs font-medium ${card.text}`}>{card.title}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Special Offer Banner */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 1.1 }}
                                className="bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 rounded-2xl p-4 text-white text-center relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                                <div className="relative z-10">
                                    <motion.p
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="text-sm font-bold mb-1"
                                    >
                                        🎁 SPECIAL OFFER
                                    </motion.p>
                                    <p className="text-xs">
                                        Sign up now and get <span className="font-bold text-yellow-300">100 bonus points!</span>
                                    </p>
                                </div>
                            </motion.div>

                            {/* Action Buttons */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.2 }}
                                className="space-y-3"
                            >
                                <motion.button
                                    onClick={onLogin}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="relative w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg overflow-hidden group"
                                >
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20"
                                        animate={{ x: [-100, 300] }}
                                        transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
                                    />
                                    <span className="relative z-10">🚀 Login / Sign Up Now</span>
                                </motion.button>

                                <motion.button
                                    onClick={onClose}
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 py-3 px-6 rounded-xl font-medium transition-all backdrop-blur-sm border border-gray-200"
                                >
                                    Maybe Later
                                </motion.button>
                            </motion.div>

                            {/* Benefits List */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.3 }}
                                className="bg-gray-50 rounded-xl p-4"
                            >
                                <p className="text-center text-xs text-gray-600 mb-3 font-medium">Why join NobarMeriah?</p>

                                <div className="space-y-2">
                                    {benefits.map((benefit, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 1.4 + index * 0.1 }}
                                            className="flex items-center gap-2 text-xs text-gray-700"
                                        >
                                            <span className={benefit.color}>{benefit.icon}</span>
                                            <span>{benefit.text}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default LoginRequiredModal;