'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/utils/supabaseClient';

// Portal Component
const Portal = ({ children }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted) return null;
    return createPortal(children, document.body);
};

// Badge options
const BADGE_OPTIONS = [
    { id: 'none', name: 'Tanpa lencana', icon: '○', description: 'Tidak menampilkan lencana' },
    { id: 'top_predictor', name: 'Prediktor teratas', icon: '🎯', description: 'Top 10% prediktor' },
    { id: 'editor', name: 'Editor', icon: '✏️', description: 'Kontributor konten' },
    { id: 'contributor', name: 'Kontributor', icon: '⚡', description: 'Anggota aktif komunitas' },
    { id: 'moderator', name: 'Moderator', icon: '🛡️', description: 'Moderator komunitas' },
];

const EditProfileModal = ({ isOpen, onClose, profile, onProfileUpdated }) => {
    const [displayName, setDisplayName] = useState('');
    const [selectedBadge, setSelectedBadge] = useState('none');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');
    const [isClosing, setIsClosing] = useState(false);
    const fileInputRef = useRef(null);

    // Handle smooth close
    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose();
        }, 300);
    };

    // Initialize form with profile data
    useEffect(() => {
        if (profile) {
            // Set display name dari first_name + last_name atau username
            const name = profile.first_name && profile.last_name
                ? `${profile.first_name} ${profile.last_name}`
                : profile.username || '';
            setDisplayName(name);
            setSelectedBadge(profile.badge || 'none');
            setAvatarUrl(profile.avatar_url || '');
            setAvatarPreview(profile.avatar_url || '');
        }
    }, [profile, isOpen]);

    // Get user initials
    const getUserInitials = () => {
        if (displayName) {
            const parts = displayName.trim().split(' ');
            if (parts.length >= 2) {
                return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
            }
            return displayName.slice(0, 2).toUpperCase();
        }
        return 'U';
    };

    // Show toast notification
    const showToastNotification = (message, type = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    // Handle avatar file selection
    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                showToastNotification('File harus berupa gambar', 'error');
                return;
            }

            // Validate file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                showToastNotification('Ukuran file maksimal 2MB', 'error');
                return;
            }

            setAvatarFile(file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Upload avatar to Supabase Storage
    const uploadAvatar = async () => {
        if (!avatarFile || !profile?.user_id) return avatarUrl;

        try {
            const fileExt = avatarFile.name.split('.').pop();
            const fileName = `${profile.user_id}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            // Upload file
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, avatarFile, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                throw uploadError;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error) {
            console.error('Error uploading avatar:', error);
            showToastNotification('Gagal upload foto', 'error');
            return avatarUrl;
        }
    };

    // Handle save
    const handleSave = async () => {
        if (!profile?.email) return;

        setIsLoading(true);

        try {
            // Upload avatar if changed
            let newAvatarUrl = avatarUrl;
            if (avatarFile) {
                newAvatarUrl = await uploadAvatar();
            }

            // Parse display name into first_name and last_name
            const nameParts = displayName.trim().split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            // Update profile in Supabase
            const { error } = await supabase
                .from('profiles')
                .update({
                    first_name: firstName,
                    last_name: lastName,
                    badge: selectedBadge,
                    avatar_url: newAvatarUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('email', profile.email);

            if (error) {
                throw error;
            }

            showToastNotification('Profil berhasil disimpan');

            // Callback to parent
            if (onProfileUpdated) {
                onProfileUpdated({
                    ...profile,
                    first_name: firstName,
                    last_name: lastName,
                    badge: selectedBadge,
                    avatar_url: newAvatarUrl
                });
            }

            // Close modal after delay
            setTimeout(() => {
                handleClose();
            }, 1000);

        } catch (error) {
            console.error('Error saving profile:', error);
            showToastNotification('Gagal menyimpan profil', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Format account creation info
    const getAccountInfo = () => {
        if (!profile?.created_at) return '';
        const date = new Date(profile.created_at);
        const provider = profile.auth_provider === 'google' ? 'Google' : 'Email';
        return `Akun dibuat dengan ${provider} pada ${date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    };

    if (!isOpen) return null;

    return (
        <Portal>
            {/* Toast Notification */}
            <AnimatePresence>
                {showToast && (
                    <motion.div
                        className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-3 rounded-full shadow-lg flex items-center gap-2 ${toastType === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                            }`}
                        style={{ zIndex: 100001 }}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <span className="font-medium font-condensed">{toastMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal Backdrop */}
            <motion.div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 lg:p-0"
                style={{ zIndex: 100000 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: isClosing ? 0 : 1 }}
                transition={{ duration: 0.3 }}
                onClick={handleClose}
            >
                {/* Modal Content - Desktop */}
                <motion.div
                    className="hidden lg:block bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden"
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{
                        scale: isClosing ? 0.9 : 1,
                        opacity: isClosing ? 0 : 1,
                        y: isClosing ? 20 : 0
                    }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white font-condensed">
                            Edit Profil
                        </h2>
                        <button
                            onClick={handleClose}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center">
                            <div
                                className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-green-100 dark:border-green-900 cursor-pointer group"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {avatarPreview ? (
                                    <img
                                        src={avatarPreview}
                                        alt="Avatar"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-2xl font-bold">
                                        {getUserInitials()}
                                    </div>
                                )}

                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                className="hidden"
                            />

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="mt-3 text-sm text-green-600 dark:text-green-400 font-medium font-condensed hover:underline"
                            >
                                Ubah foto profil
                            </button>
                        </div>

                        {/* Display Name Input */}
                        <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 font-condensed mb-2">
                                Nama panggilan (dilihat orang lain)
                            </label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Masukkan nama kamu"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-800 dark:text-white font-condensed focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                maxLength={50}
                            />
                        </div>

                        {/* Account Info */}
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="font-condensed">{getAccountInfo()}</span>
                        </div>

                        {/* Badge Section */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-white font-condensed mb-2">
                                Lencana
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-condensed mb-4">
                                Tunjukkan gayamu dan tambah lencana di profilmu!
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                                {BADGE_OPTIONS.map((badge) => (
                                    <button
                                        key={badge.id}
                                        onClick={() => setSelectedBadge(badge.id)}
                                        className={`relative p-4 rounded-xl border-2 transition-all ${selectedBadge === badge.id
                                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                            }`}
                                    >
                                        {/* Checkmark */}
                                        {selectedBadge === badge.id && (
                                            <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}

                                        <div className="text-2xl mb-2">{badge.icon}</div>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200 font-condensed">
                                            {badge.name}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <button
                            onClick={handleClose}
                            className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-xl font-medium font-condensed hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                            disabled={isLoading}
                        >
                            BATAL
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl font-medium font-condensed hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    MENYIMPAN...
                                </>
                            ) : (
                                'SIMPAN'
                            )}
                        </button>
                    </div>
                </motion.div>

                {/* Modal Content - Mobile (Bottom Sheet) */}
                <motion.div
                    className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-3xl shadow-xl max-h-[90vh] overflow-hidden"
                    initial={{ y: '100%' }}
                    animate={{ y: isClosing ? '100%' : 0 }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Handle bar */}
                    <div className="flex justify-center py-3">
                        <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                    </div>

                    {/* Close button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Content */}
                    <div className="px-6 pb-6 space-y-6 max-h-[75vh] overflow-y-auto">
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center">
                            <div
                                className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-green-100 dark:border-green-900 cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {avatarPreview ? (
                                    <img
                                        src={avatarPreview}
                                        alt="Avatar"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-2xl font-bold">
                                        {getUserInitials()}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="mt-3 text-sm text-green-600 dark:text-green-400 font-medium font-condensed hover:underline"
                            >
                                Ubah foto profil
                            </button>
                        </div>

                        {/* Display Name Input */}
                        <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 font-condensed mb-2">
                                Nama panggilan (dilihat orang lain)
                            </label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Masukkan nama kamu"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-800 dark:text-white font-condensed focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                maxLength={50}
                            />
                        </div>

                        {/* Account Info */}
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="font-condensed">{getAccountInfo()}</span>
                        </div>

                        {/* Badge Section */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-white font-condensed mb-2">
                                Lencana
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-condensed mb-4">
                                Tunjukkan gayamu dan tambah lencana di profilmu!
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                                {BADGE_OPTIONS.map((badge) => (
                                    <button
                                        key={badge.id}
                                        onClick={() => setSelectedBadge(badge.id)}
                                        className={`relative p-4 rounded-xl border-2 transition-all ${selectedBadge === badge.id
                                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                            }`}
                                    >
                                        {/* Checkmark */}
                                        {selectedBadge === badge.id && (
                                            <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}

                                        <div className="text-2xl mb-2">{badge.icon}</div>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200 font-condensed">
                                            {badge.name}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 safe-area-bottom">
                        <button
                            onClick={handleClose}
                            className="flex-1 px-4 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-xl font-semibold font-condensed hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                            disabled={isLoading}
                        >
                            BATAL
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-semibold font-condensed hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    MENYIMPAN...
                                </>
                            ) : (
                                'SIMPAN'
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>

            <style jsx>{`
                .safe-area-bottom {
                    padding-bottom: env(safe-area-inset-bottom, 0);
                }
            `}</style>
        </Portal>
    );
};

export default EditProfileModal;
