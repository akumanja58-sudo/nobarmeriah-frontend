'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateLevel, getLevelTier, getXPProgress, getPointsToNextLevel } from '@/utils/levelSystem';
import { getActiveEffect } from '@/utils/avatarEffects';
import { supabase } from '@/utils/supabaseClient';

// Portal Component untuk render di luar component tree
const Portal = ({ children }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted) return null;
    return createPortal(children, document.body);
};

const ProfileSidebar = ({ profile, onEditProfile, isMobile = false }) => {
    const router = useRouter();
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const moreMenuRef = useRef(null);

    if (!profile) return null;

    // Gunakan total_experience atau season_points (bukan points yang 0)
    const userXP = profile.total_experience || profile.season_points || profile.points || 0;

    const currentLevel = calculateLevel(userXP);
    const levelTier = getLevelTier(currentLevel);
    const xpProgress = getXPProgress(userXP);
    const pointsToNext = getPointsToNextLevel(userXP);
    const activeEffect = getActiveEffect(profile.selected_effect, currentLevel, profile.streak || 0, profile.total_wins || 0);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
                setShowMoreMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Format join date
    const formatJoinDate = (dateString) => {
        if (!dateString) return 'Baru bergabung';
        const date = new Date(dateString);
        return `Bergabung ${date.toLocaleDateString('id-ID', { day: 'numeric', month: 'numeric', year: 'numeric' })}`;
    };

    const getUserInitials = () => {
        if (profile?.first_name && profile?.last_name) {
            return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
        } else if (profile?.username) {
            return profile.username.slice(0, 2).toUpperCase();
        }
        return 'U';
    };

    // Show toast notification
    const showToastNotification = (message) => {
        setToastMessage(message);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    // Handle share - copy link to clipboard
    const handleShare = async () => {
        const profileUrl = `${window.location.origin}/user/profile/${profile.user_id || profile.id}`;

        try {
            await navigator.clipboard.writeText(profileUrl);
            showToastNotification('Disalin ke papan klip');
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = profileUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showToastNotification('Disalin ke papan klip');
        }
    };

    // Handle logout
    const handleLogout = async () => {
        setShowMoreMenu(false);

        try {
            // Clear session from active_sessions table
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.email) {
                await supabase
                    .from('active_sessions')
                    .delete()
                    .eq('account_email', session.user.email.toLowerCase());
            }

            // Sign out from Supabase
            await supabase.auth.signOut();

            // Clear local storage
            localStorage.removeItem('supabase.auth.token');
            localStorage.removeItem('sb-localhost-auth-token');

            // Force redirect
            window.location.replace('/');
        } catch (error) {
            console.error('Logout error:', error);
            window.location.replace('/');
        }
    };

    // Handle delete account
    const handleDeleteAccount = async () => {
        setIsDeleting(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                // Call backend API to delete account (termasuk dari auth.users)
                const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

                const response = await fetch(`${API_BASE_URL}/api/account/delete`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId: session.user.id,
                        email: session.user.email
                    })
                });

                const result = await response.json();

                if (!result.success) {
                    throw new Error(result.error || 'Gagal menghapus akun');
                }

                // Sign out locally
                await supabase.auth.signOut();

                // Clear local storage
                localStorage.clear();

                // Redirect to home
                showToastNotification('Akun berhasil dihapus');
                setTimeout(() => {
                    window.location.replace('/');
                }, 1500);
            }
        } catch (error) {
            console.error('Delete account error:', error);
            showToastNotification('Gagal menghapus akun');
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    return (
        <>
            {/* Toast Notification - Rendered via Portal */}
            <Portal>
                <AnimatePresence>
                    {showToast && (
                        <motion.div
                            className="fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-3 bg-green-600 text-white rounded-full shadow-lg flex items-center gap-2"
                            style={{ zIndex: 99999 }}
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium font-condensed">{toastMessage}</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Portal>

            {/* Delete Confirmation Modal - Rendered via Portal */}
            <Portal>
                <AnimatePresence>
                    {showDeleteConfirm && (
                        <motion.div
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                            style={{ zIndex: 99998 }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowDeleteConfirm(false)}
                        >
                            <motion.div
                                className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-xl"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="text-center mb-4">
                                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white font-condensed mb-2">
                                        Hapus Akun?
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-condensed">
                                        Semua data kamu akan dihapus permanen dan tidak bisa dikembalikan. Yakin mau lanjut?
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium font-condensed hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                        disabled={isDeleting}
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleDeleteAccount}
                                        className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium font-condensed hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Menghapus...
                                            </>
                                        ) : (
                                            'Ya, Hapus'
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Portal>

            {/* Main Content */}
            <div className={`space-y-4 ${isMobile ? '' : 'sticky top-24'}`}>
                {/* Main Profile Card */}
                <motion.div
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    {/* Header with gradient */}
                    <div className="relative h-20 bg-gradient-to-r from-green-500 to-green-600">
                        <div className="absolute top-2 right-2 text-xs text-white/80 font-condensed">
                            {formatJoinDate(profile.created_at)}
                        </div>
                    </div>

                    {/* Avatar Section */}
                    <div className="relative px-4 pb-4">
                        {/* Avatar */}
                        <div className="relative -mt-12 mb-3">
                            <motion.div
                                className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 overflow-hidden mx-auto lg:mx-0"
                                style={activeEffect?.css || {}}
                                whileHover={{ scale: 1.05 }}
                            >
                                {profile.avatar_url ? (
                                    <img
                                        src={profile.avatar_url}
                                        alt={profile.username}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-2xl font-bold">
                                        {getUserInitials()}
                                    </div>
                                )}
                            </motion.div>

                            {/* Level Badge */}
                            <motion.div
                                className="absolute -bottom-1 left-1/2 lg:left-16 transform -translate-x-1/2 lg:translate-x-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg"
                                style={{ backgroundColor: levelTier.color }}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.3, type: 'spring' }}
                            >
                                {currentLevel}
                            </motion.div>
                        </div>

                        {/* Username & Actions */}
                        <div className="flex items-start justify-between">
                            <div className="text-center lg:text-left flex-1">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white font-condensed">
                                    {profile.first_name && profile.last_name
                                        ? `${profile.first_name} ${profile.last_name}`
                                        : profile.username
                                    }
                                </h2>
                                {profile.first_name && profile.last_name && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-condensed">
                                        @{profile.username}
                                    </p>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                                {/* Edit Button */}
                                <motion.button
                                    onClick={onEditProfile}
                                    className="px-3 py-1.5 text-sm font-medium text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-full hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors font-condensed"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Edit
                                </motion.button>

                                {/* Share Button */}
                                <motion.button
                                    onClick={handleShare}
                                    className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    title="Bagikan profil"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                </motion.button>

                                {/* More Menu (3 dots) */}
                                <div className="relative" ref={moreMenuRef}>
                                    <motion.button
                                        onClick={() => setShowMoreMenu(!showMoreMenu)}
                                        className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                        </svg>
                                    </motion.button>

                                    {/* Dropdown Menu */}
                                    <AnimatePresence>
                                        {showMoreMenu && (
                                            <motion.div
                                                className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
                                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                transition={{ duration: 0.15 }}
                                            >
                                                {/* Keluar */}
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                                >
                                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                    </svg>
                                                    <span className="font-medium font-condensed">Keluar</span>
                                                </button>

                                                {/* Divider */}
                                                <div className="border-t border-gray-100 dark:border-gray-700"></div>

                                                {/* Hapus Akun */}
                                                <button
                                                    onClick={() => {
                                                        setShowMoreMenu(false);
                                                        setShowDeleteConfirm(true);
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    <span className="font-medium font-condensed">Hapus akun</span>
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>

                        {/* Level Progress */}
                        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-condensed">
                                    Level {currentLevel}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-condensed">
                                    {userXP} XP
                                </span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: levelTier.color }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${xpProgress}%` }}
                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-condensed">
                                {pointsToNext} XP lagi ke level {currentLevel + 1}
                            </p>
                        </div>

                        {/* Points Display */}
                        <div className="mt-3 grid grid-cols-2 gap-2">
                            <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-lg text-center">
                                <div className="flex items-center justify-center gap-1.5 mb-1">
                                    <span className="text-lg">💰</span>
                                    <span className="text-lg font-bold text-green-600 dark:text-green-400 font-condensed">
                                        {(profile.season_points || profile.points || 0).toLocaleString('id-ID')}
                                    </span>
                                </div>
                                <p className="text-xs text-green-700 dark:text-green-300 font-condensed">
                                    Season Points
                                </p>
                            </div>
                            <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg text-center">
                                <div className="flex items-center justify-center gap-1.5 mb-1">
                                    <span className="text-lg">⭐</span>
                                    <span className="text-lg font-bold text-purple-600 dark:text-purple-400 font-condensed">
                                        {(profile.total_experience || profile.lifetime_points || 0).toLocaleString('id-ID')}
                                    </span>
                                </div>
                                <p className="text-xs text-purple-700 dark:text-purple-300 font-condensed">
                                    Total XP
                                </p>
                            </div>
                        </div>

                        {/* Rank Badge */}
                        <div className="mt-4 flex items-center justify-center lg:justify-start gap-2">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 rounded-full text-sm font-semibold font-condensed">
                                <span>🏆</span>
                                <span>Peringkat #{profile.rank}</span>
                            </div>
                            {profile.percentile > 50 && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-condensed">
                                    Top {100 - profile.percentile}%
                                </span>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Favorit Section - Desktop Only */}
                {!isMobile && (
                    <motion.div
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                    >
                        <h3 className="px-4 py-3 font-semibold text-gray-800 dark:text-white font-condensed border-b border-gray-100 dark:border-gray-700">
                            Favorit
                        </h3>

                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {/* Turnamen */}
                            <div className="px-4 py-3">
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 font-condensed mb-2">
                                    Turnamen
                                </h4>
                                <p className="text-xs text-gray-400 dark:text-gray-500 font-condensed">
                                    Pengguna ini belum menambahkan kompetisi favorit
                                </p>
                            </div>

                            {/* Tim */}
                            <div className="px-4 py-3">
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 font-condensed mb-2">
                                    Tim
                                </h4>
                                <p className="text-xs text-gray-400 dark:text-gray-500 font-condensed">
                                    Pengguna ini belum menambahkan tim favorit
                                </p>
                            </div>

                            {/* Atlet */}
                            <div className="px-4 py-3">
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 font-condensed mb-2">
                                    Atlet
                                </h4>
                                <p className="text-xs text-gray-400 dark:text-gray-500 font-condensed">
                                    Pengguna ini belum menambahkan atlet favorit
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Share Card */}
                {!isMobile && (
                    <motion.div
                        className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex-1">
                                <h3 className="font-semibold font-condensed mb-1">
                                    Ajak teman-temanmu
                                </h3>
                                <p className="text-sm text-green-100 font-condensed mb-3">
                                    Bagikan NobarMeriah dengan pecinta olahraga di sekitar kamu ✨
                                </p>
                                <button
                                    onClick={handleShare}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-white text-green-600 rounded-full text-sm font-medium font-condensed hover:bg-green-50 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                    Bagikan tautan
                                </button>
                            </div>
                            <div className="text-4xl">📢</div>
                        </div>
                    </motion.div>
                )}

                {/* Support Section - Desktop Only */}
                {!isMobile && (
                    <motion.div
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                    >
                        <h3 className="px-4 py-3 font-semibold text-gray-800 dark:text-white font-condensed border-b border-gray-100 dark:border-gray-700">
                            Dukungan
                        </h3>

                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-400">❓</span>
                                    <span className="text-sm text-gray-700 dark:text-gray-200 font-condensed">FAQ NobarMeriah</span>
                                </div>
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                            <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-400">💬</span>
                                    <span className="text-sm text-gray-700 dark:text-gray-200 font-condensed">Kasih umpan balik</span>
                                </div>
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </>
    );
};

export default ProfileSidebar;
