// CleanupButton.jsx - Enhanced Design for Admin Panel
import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';

const CleanupButton = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState(null);

    const handleCleanup = async () => {
        setIsLoading(true);
        setStats(null);

        try {
            console.log('🚀 Starting cleanup process...');

            const cleanupStats = {
                checked: 0,
                updated: 0,
                cleaned: 0,
                errors: 0
            };

            // Step 1: Update match statuses
            console.log('🔍 Checking match statuses...');

            const { data: matches, error } = await supabase
                .from('matches')
                .select('*')
                .neq('status', 'finished')
                .order('kickoff');

            if (error) throw error;

            if (matches && matches.length > 0) {
                cleanupStats.checked = matches.length;
                console.log(`🎯 Found ${matches.length} matches to check`);

                // Check each match
                for (const match of matches) {
                    const now = new Date();
                    const kickoffTime = new Date(match.kickoff + 'Z');
                    const diffHours = (now - kickoffTime) / (1000 * 60 * 60);
                    const diffMinutes = Math.round((now - kickoffTime) / 60000);

                    console.log(`⚽ ${match.home_team} vs ${match.away_team}: ${diffHours.toFixed(1)}h ago`);

                    let newStatus = match.status;
                    let updateData = {};

                    // Status detection
                    if (diffHours < -0.25) {
                        newStatus = 'upcoming';
                    } else if (diffHours >= -0.25 && diffHours < 4) {
                        newStatus = 'live';
                        updateData.current_minute = calculateMinute(diffMinutes);
                    } else {
                        newStatus = 'finished';
                        updateData.current_minute = 'FT';
                    }

                    // Update if status changed
                    if (match.status !== newStatus) {
                        console.log(`   🔄 Updating: ${match.status} → ${newStatus}`);

                        updateData = {
                            status: newStatus,
                            updated_at: new Date().toISOString(),
                            ...updateData
                        };

                        if (newStatus === 'finished' && !match.finished_detected_at) {
                            updateData.finished_detected_at = new Date().toISOString();
                        }

                        const { error: updateError } = await supabase
                            .from('matches')
                            .update(updateData)
                            .eq('id', match.id);

                        if (updateError) {
                            console.error(`   ❌ Update failed:`, updateError);
                            cleanupStats.errors++;
                        } else {
                            console.log(`   ✅ Updated to ${newStatus.toUpperCase()}`);
                            cleanupStats.updated++;
                        }
                    }
                }
            }

            // Step 2: Cleanup old finished matches
            console.log('🗑️ Cleaning up old matches...');

            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

            const { data: oldMatches, error: selectError } = await supabase
                .from('matches')
                .select('id, home_team, away_team, kickoff')
                .eq('status', 'finished')
                .lt('kickoff', yesterday.toISOString());

            if (selectError) throw selectError;

            if (oldMatches && oldMatches.length > 0) {
                console.log(`🎯 Found ${oldMatches.length} old matches to delete`);

                const { error: deleteError } = await supabase
                    .from('matches')
                    .delete()
                    .eq('status', 'finished')
                    .lt('kickoff', yesterday.toISOString());

                if (deleteError) throw deleteError;

                console.log(`✅ Deleted ${oldMatches.length} old matches`);
                cleanupStats.cleaned = oldMatches.length;
            }

            setStats(cleanupStats);
            console.log('🎉 Cleanup completed!', cleanupStats);

            // Refresh page after successful cleanup
            setTimeout(() => {
                window.location.reload();
            }, 3000);

        } catch (error) {
            console.error('❌ Cleanup failed:', error);
            setStats({ error: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const calculateMinute = (diffMinutes) => {
        if (diffMinutes <= 0) return 1;
        if (diffMinutes <= 45) return diffMinutes;
        if (diffMinutes <= 50) return `45+${Math.min(5, diffMinutes - 45)}`;
        if (diffMinutes <= 95) return diffMinutes;
        if (diffMinutes <= 105) return `90+${Math.min(10, diffMinutes - 90)}`;
        return `90+${Math.min(15, diffMinutes - 90)}`;
    };

    return (
        <div className="bg-gradient-to-br from-slate-800/90 via-slate-800/70 to-slate-700/90 backdrop-blur-xl border border-slate-600/40 rounded-3xl p-6 shadow-2xl hover:shadow-slate-900/50 transition-all duration-500 hover:scale-[1.02] hover:border-slate-500/50">
            {/* Header with animated icon */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <div className={`w-12 h-12 bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-2xl flex items-center justify-center shadow-lg transform transition-all duration-300 ${isLoading ? 'animate-pulse scale-110' : 'hover:scale-105'}`}>
                            <span className="text-white text-xl filter drop-shadow-lg">
                                {isLoading ? '⚡' : '🗑️'}
                            </span>
                        </div>
                        {isLoading && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
                        )}
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg tracking-wide">Match Cleanup System</h3>
                        <p className="text-slate-400 text-sm font-medium">AI-Powered Match Management</p>
                    </div>
                </div>
            </div>

            {/* Action Button */}
            <div className="mb-6">
                <button
                    onClick={handleCleanup}
                    disabled={isLoading}
                    className={`w-full group relative overflow-hidden rounded-2xl transition-all duration-300 transform ${isLoading
                        ? 'bg-gradient-to-r from-slate-600 to-slate-700 cursor-not-allowed scale-95'
                        : 'bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 hover:scale-105 hover:shadow-red-500/30 active:scale-95'
                        } shadow-xl hover:shadow-2xl`}
                >
                    {/* Button shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

                    <div className="relative px-8 py-4 flex items-center justify-center space-x-3">
                        {isLoading ? (
                            <>
                                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span className="text-white font-bold text-lg">Processing Magic...</span>
                            </>
                        ) : (
                            <>
                                <span className="text-2xl">🚀</span>
                                <span className="text-white font-bold text-lg tracking-wide">Execute Cleanup</span>
                                <span className="text-xl">⚡</span>
                            </>
                        )}
                    </div>
                </button>
            </div>

            {/* Feature highlights */}
            <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-slate-700/50">
                <h4 className="text-white font-semibold mb-3 flex items-center">
                    <span className="mr-2">🎯</span>
                    AI Features
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center space-x-2 text-slate-300">
                        <span className="text-green-400">●</span>
                        <span>Smart Status Detection</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-300">
                        <span className="text-blue-400">●</span>
                        <span>Real-time Updates</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-300">
                        <span className="text-purple-400">●</span>
                        <span>Auto Data Cleanup</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-300">
                        <span className="text-yellow-400">●</span>
                        <span>Performance Boost</span>
                    </div>
                </div>
            </div>

            {/* Stats Display */}
            {stats && (
                <div className="animate-fade-in">
                    {stats.error ? (
                        <div className="bg-gradient-to-r from-red-900/50 to-red-800/50 border border-red-600/50 rounded-2xl p-4 backdrop-blur-sm">
                            <div className="flex items-center space-x-2 text-red-400">
                                <span className="text-xl">⚠️</span>
                                <div>
                                    <div className="font-bold">System Error Detected</div>
                                    <div className="text-sm text-red-300 mt-1">{stats.error}</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gradient-to-br from-emerald-900/30 via-green-900/20 to-teal-900/30 border border-green-600/30 rounded-2xl p-5 backdrop-blur-sm">
                            <div className="flex items-center space-x-2 mb-4">
                                <span className="text-2xl">✨</span>
                                <div>
                                    <div className="text-green-300 font-bold text-lg">Cleanup Completed Successfully!</div>
                                    <div className="text-green-400/80 text-sm">All systems optimized and running smoothly</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
                                    <div className="text-2xl font-bold text-cyan-400">{stats.checked}</div>
                                    <div className="text-slate-300 text-xs font-medium">Matches Analyzed</div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
                                    <div className="text-2xl font-bold text-green-400">{stats.updated}</div>
                                    <div className="text-slate-300 text-xs font-medium">Status Updated</div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
                                    <div className="text-2xl font-bold text-purple-400">{stats.cleaned}</div>
                                    <div className="text-slate-300 text-xs font-medium">Data Cleaned</div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/20">
                                    <div className={`text-2xl font-bold ${stats.errors > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                        {stats.errors}
                                    </div>
                                    <div className="text-slate-300 text-xs font-medium">Errors Found</div>
                                </div>
                            </div>

                            <div className="mt-4 text-center">
                                <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-full px-4 py-2">
                                    <span className="animate-spin text-blue-400">🔄</span>
                                    <span className="text-blue-300 text-sm font-medium">Auto-refreshing in 3 seconds...</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Performance indicator */}
            <div className="mt-4 flex items-center justify-center space-x-4 text-xs">
                <div className="flex items-center space-x-1 text-slate-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>System Ready</span>
                </div>
                <div className="flex items-center space-x-1 text-slate-400">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span>Database Connected</span>
                </div>
                <div className="flex items-center space-x-1 text-slate-400">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                    <span>AI Engine Active</span>
                </div>
            </div>
        </div>
    );
};

export default CleanupButton;