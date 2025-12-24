import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { motion } from 'framer-motion';
import { jalankanPenilaian } from '../scripts/grading';
import adminService from '../services/adminService';
import dayjs from 'dayjs';

const AdminPanel = () => {
    // ============= CLEAN STATE MANAGEMENT =============

    // Admin Service Status
    const [adminServiceStatus, setAdminServiceStatus] = useState({
        isHealthy: false,
        lastCheck: null,
        apiUrl: '',
        serverUrl: ''
    });

    // Dashboard Data
    const [dashboardStats, setDashboardStats] = useState({
        totalMatches: 0,
        liveMatches: 0,
        scheduledMatches: 0,
        completedMatches: 0,
        totalGoals: 0,
        averageGoalsPerMatch: 0,
        topScorer: null,
        popularTeam: null,
        recentActivity: []
    });

    // ============= MONITORING STATE MANAGEMENT =============
    const [monitoringData, setMonitoringData] = useState({
        basic: {
            memory: { used_mb: 0, total_mb: 0, usage_percent: 0 },
            system: { uptime_formatted: '0d 0h 0m', platform: '' },
            connections: { websocket_clients: 0, live_matches: 0 },
            cache: { hit_rate: '0%', total_queries: 0 },
            api: { calls_used: 0, calls_remaining: 0, usage_percent: 0 }
        },
        health: {
            overall: { status: 'unknown', health_score: 0, healthy_services: 0, total_services: 0 },
            services: { core: {}, database: {}, external_api: {} },
            alerts: []
        },
        performance: {
            performance_summary: { overall_score: 0, status: 'unknown', recommendations: [] },
            response_time: { current_average_ms: 0, min_response_ms: 0, max_response_ms: 0 },
            cache_performance: { hit_rate_numeric: 0, cache_efficiency: 0, hit_rate: '0%' },
            memory_performance: { heap_used_mb: 0, heap_utilization: 0 }
        },
        isLoading: false,
        lastUpdated: null
    });

    // Match Management
    const [matchList, setMatchList] = useState([]);
    const [selectedMatchId, setSelectedMatchId] = useState('');
    const [finalScore, setFinalScore] = useState({ home: '', away: '' });
    const [isLoadingMatches, setIsLoadingMatches] = useState(false);

    // User & Reward Management (Keep existing functionality)
    const [users, setUsers] = useState([]);
    const [redemptions, setRedemptions] = useState([]);
    const [rewards, setRewards] = useState([]);
    const [filterStatus, setFilterStatus] = useState('all');

    // UI States
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [showBigMatchModal, setShowBigMatchModal] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');

    const [highlightsData, setHighlightsData] = useState({
        selectedMatchId: '',
        highlights: [],
        isLoading: false,
        showAddForm: false,
        formData: {
            video_url: '',
            video_type: 'youtube',
            title: '',
            description: ''
        }
    });

    // Big Match Manager
    const [bigMatchModalData, setBigMatchModalData] = useState({
        matches: [],
        filteredMatches: [],
        isLoading: false,
        searchTerm: '',
        selectedLeague: '',
        selectedStatus: '',
        totalMatches: 0,
        hotMatches: 0
    });

    const [schedulerData, setSchedulerData] = useState({
        status: null,
        logs: [],
        isLoading: false,
        lastUpdate: null
    });

    // ============= ADMIN SERVICE METHODS =============

    const checkAdminServiceHealth = async () => {
        try {
            // Check port 3000 instead of 5000
            const response = await fetch('http://localhost:3000/api/health');
            const isHealthy = response.ok;

            setAdminServiceStatus({
                isHealthy,
                lastCheck: new Date().toISOString(),
                apiUrl: 'http://localhost:3000',
                serverUrl: 'Port 3000'
            });

            return isHealthy;
        } catch (error) {
            console.error('Health check failed:', error);
            setAdminServiceStatus(prev => ({
                ...prev,
                isHealthy: false,
                lastCheck: new Date().toISOString()
            }));
            return false;
        }
    };

    const fetchDashboardStats = async () => {
        try {
            const token = localStorage.getItem('admin_token');

            if (!token) {
                console.warn('⚠️ No token for dashboard');
                return;
            }

            const response = await fetch('http://localhost:3000/api/admin/dashboard', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                setDashboardStats(result.data || result);
                console.log('✅ Dashboard stats loaded');
            } else {
                console.warn('⚠️ Dashboard failed:', response.status);
            }
        } catch (error) {
            console.error('❌ Dashboard error:', error.message);
        }
    };

    const fetchMatches = async () => {
        console.log('🔍 fetchMatches started');
        setIsLoadingMatches(true);

        try {
            const url = 'http://localhost:3000/api/admin/matches';
            console.log('📡 Fetching from:', url);

            const response = await fetch(url);
            console.log('📊 Response status:', response.status, response.ok);

            if (response.ok) {
                const result = await response.json();
                console.log('📦 Raw API response:', result);

                const matches = result.data?.matches || [];
                console.log('⚽ Extracted matches:', matches);
                console.log('🔢 Matches count:', matches.length);

                // Force update matchList
                setMatchList(matches);
                console.log('✅ setMatchList called with', matches.length, 'matches');

                // Verify state update
                setTimeout(() => {
                    console.log('🔍 Checking matchList after setState...');
                }, 100);

            } else {
                console.error('❌ Response not ok:', response.status);
            }
        } catch (error) {
            console.error('💥 Fetch error:', error);
        } finally {
            setIsLoadingMatches(false);
            console.log('🏁 fetchMatches completed');
        }
    };

    const refreshAllData = async () => {
        console.log('🔄 Refreshing all admin data...');
        await Promise.all([
            checkAdminServiceHealth(),
            fetchDashboardStats(),
            fetchMatches(),
            fetchUsers(),
            fetchRedemptions(),
            fetchSchedulerStatus(),
            fetchMonitoringData()
        ]);
    };

    // ============= USER & REWARD MANAGEMENT (Keep existing) =============

    const fetchUsers = async () => {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('username, email')
                .order('created_at', { ascending: false })
                .limit(10);
            setUsers(data || []);
        } catch (error) {
            console.error('❌ Error fetching users:', error);
            setUsers([]);
        }
    };

    const fetchRedemptions = async () => {
        try {
            const { data: redemptionData, error: redErr } = await supabase
                .from('redemptions')
                .select('*')
                .order('created_at', { ascending: false });

            if (redErr) {
                console.error('❌ Error fetching redemptions:', redErr);
                return;
            }

            const { data: rewardData, error: rewErr } = await supabase
                .from('rewards')
                .select('*');

            if (rewErr) {
                console.error('❌ Error fetching rewards:', rewErr);
                return;
            }

            setRedemptions(redemptionData || []);
            setRewards(rewardData || []);
        } catch (error) {
            console.error('❌ Error fetching redemption data:', error);
        }
    };

    const handleApprove = async (redemption) => {
        const reward = rewards.find(r => r.id === redemption.reward_id);
        const cost = reward?.cost || 0;

        console.log('Processing approval:', redemption.user_email, 'cost:', cost);

        try {
            const { error: updateRedemptionError } = await supabase
                .from('redemptions')
                .update({ status: 'approved' })
                .eq('id', redemption.id);

            if (updateRedemptionError) {
                console.error('Error updating redemption:', updateRedemptionError);
                alert('Gagal approve reward: ' + updateRedemptionError.message);
                return;
            }

            const { error: deductError } = await supabase.rpc('admin_deduct_points', {
                email_input: redemption.user_email,
                points_to_deduct: cost
            });

            if (deductError) {
                console.error('Error deducting points:', deductError);
                await supabase
                    .from('redemptions')
                    .update({ status: 'pending' })
                    .eq('id', redemption.id);
                alert('Gagal memotong poin: ' + deductError.message);
                return;
            }

            alert('✅ Reward berhasil di-approve dan poin terpotong!');
            fetchRedemptions();

        } catch (error) {
            console.error('Error during approval:', error);
            alert('Terjadi kesalahan: ' + error.message);
        }
    };

    const handleReject = async (redemption) => {
        console.log('Processing rejection:', redemption.user_email);

        try {
            const { error: updateRedemptionError } = await supabase
                .from('redemptions')
                .update({ status: 'rejected' })
                .eq('id', redemption.id);

            if (updateRedemptionError) {
                console.error('Error rejecting redemption:', updateRedemptionError);
                alert('Gagal reject reward: ' + updateRedemptionError.message);
                return;
            }

            alert('❌ Reward ditolak!');
            fetchRedemptions();

        } catch (error) {
            console.error('Error during rejection:', error);
            alert('Terjadi kesalahan: ' + error.message);
        }
    };

    // ============= MATCH MANAGEMENT =============

    const handleScoreSubmit = async () => {
        if (!selectedMatchId || finalScore.home === '' || finalScore.away === '') {
            return alert('Pilih match dan isi skor lengkap!');
        }

        const parsedHome = parseInt(finalScore.home);
        const parsedAway = parseInt(finalScore.away);

        if (isNaN(parsedHome) || isNaN(parsedAway)) {
            alert('Skor harus berupa angka!');
            return;
        }

        try {
            // Try admin service first
            await adminService.updateMatch(selectedMatchId, {
                home_score: parsedHome,
                away_score: parsedAway,
                status: 'finished'
            });

            alert('✅ Skor berhasil disimpan via Admin Service! Menjalankan penilaian...');
        } catch (adminError) {
            console.warn('⚠️ Admin service failed, trying Supabase fallback:', adminError);

            // Fallback to Supabase
            const { error } = await supabase
                .from('matches')
                .update({ home_score: parsedHome, away_score: parsedAway, status: 'finished' })
                .eq('id', selectedMatchId);

            if (error) {
                alert('❌ Gagal simpan skor: ' + error.message);
                return;
            }

            alert('✅ Skor berhasil disimpan via Supabase! Menjalankan penilaian...');
        }

        // Run grading system
        try {
            await jalankanPenilaian();
        } catch (gradingError) {
            console.error('❌ Grading system error:', gradingError);
            alert('⚠️ Skor tersimpan tapi grading gagal: ' + gradingError.message);
        }

        // Reset form and refresh
        setSelectedMatchId('');
        setFinalScore({ home: '', away: '' });
        fetchMatches();
    };

    // ============= BIG MATCH MANAGEMENT =============

    const fetchMatchesForBigMatchManager = async () => {
        try {
            setBigMatchModalData(prev => ({ ...prev, isLoading: true }));

            console.log('🔄 Fetching matches for Big Match Manager...');

            // Try admin service first
            let matches = [];
            try {
                const data = await adminService.getAllMatches();
                matches = data.matches || [];
            } catch (adminError) {
                console.warn('⚠️ Admin service failed, using Supabase fallback:', adminError);

                // Fallback to Supabase
                const { data, error } = await supabase
                    .from('matches')
                    .select('*')
                    .order('kickoff', { ascending: true });

                if (error) throw error;
                matches = data || [];
            }

            console.log(`📊 Found ${matches.length} matches`);

            const totalMatches = matches.length;
            const hotMatches = matches.filter(m => m.is_hot).length;

            setBigMatchModalData(prev => ({
                ...prev,
                matches,
                filteredMatches: matches,
                totalMatches,
                hotMatches,
                isLoading: false
            }));

        } catch (error) {
            console.error('❌ Failed to fetch matches:', error);
            alert('❌ Failed to fetch matches: ' + error.message);
            setBigMatchModalData(prev => ({ ...prev, isLoading: false }));
        }
    };

    const toggleBigMatchStatus = async (matchId, newHotStatus) => {
        try {
            console.log(`🔥 Toggling match ${matchId} to ${newHotStatus ? 'HOT' : 'NORMAL'}`);

            // Try admin service first
            try {
                await adminService.updateMatch(matchId, { is_hot: newHotStatus });
            } catch (adminError) {
                console.warn('⚠️ Admin service failed, using Supabase fallback:', adminError);

                // Fallback to Supabase
                const { error } = await supabase
                    .from('matches')
                    .update({ is_hot: newHotStatus })
                    .eq('id', matchId);

                if (error) throw error;
            }

            // Update local state
            setBigMatchModalData(prev => ({
                ...prev,
                matches: prev.matches.map(match =>
                    match.id === matchId ? { ...match, is_hot: newHotStatus } : match
                ),
                filteredMatches: prev.filteredMatches.map(match =>
                    match.id === matchId ? { ...match, is_hot: newHotStatus } : match
                ),
                hotMatches: newHotStatus ? prev.hotMatches + 1 : prev.hotMatches - 1
            }));

            console.log(`✅ Match ${matchId} updated successfully`);

        } catch (error) {
            console.error('❌ Failed to update match:', error);
            alert('❌ Failed to update match: ' + error.message);
        }
    };

    // ============= UTILITY FUNCTIONS =============

    const logout = () => {
        localStorage.removeItem('admin_username');
        window.location.href = '/admin-login';
    };

    const filteredRedemptions = redemptions.filter(r =>
        filterStatus === 'all' ? true : r.status === filterStatus
    );

    // ============= SCHEDULER SERVICE METHODS =============
    const fetchSchedulerStatus = async () => {
        try {
            const token = localStorage.getItem('admin_token');

            if (!token) {
                console.warn('⚠️ No token for scheduler');
                return;
            }

            const statusResponse = await fetch('http://localhost:3000/api/scheduler/status', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                setSchedulerData({
                    status: statusData.data || statusData,
                    logs: [], // Skip logs for now
                    isLoading: false,
                    lastUpdate: new Date().toISOString()
                });
                console.log('✅ Scheduler status loaded');
            } else {
                console.warn('⚠️ Scheduler failed:', statusResponse.status);
            }
        } catch (error) {
            console.error('❌ Scheduler error:', error.message);
            setSchedulerData(prev => ({ ...prev, isLoading: false }));
        }
    };

    // ============= MONITORING SERVICE METHODS =============
    const fetchMonitoringData = async () => {
        try {
            setMonitoringData(prev => ({ ...prev, isLoading: true }));

            const [basicRes, healthRes, performanceRes] = await Promise.all([
                fetch('http://localhost:3000/api/admin/monitoring', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
                }),
                fetch('http://localhost:3000/api/admin/system-health', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
                }),
                fetch('http://localhost:3000/api/admin/performance', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
                })
            ]);

            const [basicData, healthData, performanceData] = await Promise.all([
                basicRes.json(),
                healthRes.json(),
                performanceRes.json()
            ]);

            // Map the backend data structure to the frontend state structure
            const mappedBasicData = basicData.success ? {
                memory: {
                    used_mb: basicData.data.memory.heapUsed || 0,
                    total_mb: basicData.data.memory.heapTotal || 0,
                    usage_percent: basicData.data.memory.usage_percent || 0
                },
                system: {
                    uptime_formatted: basicData.data.system.uptime_formatted || '0d 0h 0m',
                    platform: basicData.data.system.platform || ''
                },
                connections: {
                    websocket_clients: basicData.data.connections.websocket_clients || 0,
                    live_matches: basicData.data.connections.live_matches || 0
                },
                cache: {
                    hit_rate: basicData.data.cache.hit_rate || '0%',
                    total_queries: basicData.data.cache.total_queries || 0
                },
                api: {
                    calls_used: basicData.data.api.calls_used || 0,
                    calls_remaining: basicData.data.api.calls_remaining || 0,
                    usage_percent: basicData.data.api.usage_percent || 0
                }
            } : {};

            const mappedPerformanceData = performanceData.success ? {
                performance_summary: {
                    overall_score: 0,
                    status: 'unknown',
                    recommendations: []
                },
                response_time: {
                    current_average_ms: 0,
                    min_response_ms: 0,
                    max_response_ms: 0
                },
                cache_performance: {
                    hit_rate_numeric: performanceData.data.cache_performance?.hit_rate_numeric || 0,
                    cache_efficiency: 0,
                    hit_rate: performanceData.data.cache_performance?.hit_rate || '0%'
                },
                memory_performance: {
                    heap_used_mb: performanceData.data.memory_performance?.heap_used_mb || 0,
                    heap_utilization: performanceData.data.memory_performance?.heap_utilization || 0
                }
            } : {};

            setMonitoringData({
                basic: mappedBasicData,
                health: healthData.success ? healthData.data : {},
                performance: mappedPerformanceData,
                isLoading: false,
                lastUpdated: new Date().toISOString()
            });

            console.log('📊 Monitoring data updated successfully');

        } catch (error) {
            console.error('❌ Error fetching monitoring data:', error);
            setMonitoringData(prev => ({
                ...prev,
                isLoading: false,
                lastUpdated: new Date().toISOString()
            }));
        }
    };

    const handleSchedulerAction = async (action) => {
        try {
            const response = await fetch(`http://localhost:3000/api/scheduler/${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const result = await response.json();

            if (response.ok) {
                alert(`✅ Scheduler ${action} successful!`);
                setTimeout(() => fetchSchedulerStatus(), 1000);
            } else {
                alert(`❌ Failed to ${action} scheduler: ${result.message || result.error}`);
            }
        } catch (error) {
            console.error(`❌ Error ${action} scheduler:`, error);
            alert(`❌ Error ${action} scheduler: ${error.message}`);
        }
    };

    const handleManualTask = async (taskName) => {
        try {
            const response = await fetch(`http://localhost:3000/api/scheduler/task/${taskName}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const result = await response.json();

            if (response.ok) {
                alert(`✅ Manual ${taskName} completed!`);
                setTimeout(() => fetchSchedulerStatus(), 2000);
            } else {
                alert(`❌ Failed to run ${taskName}: ${result.message || result.error}`);
            }
        } catch (error) {
            console.error(`❌ Error running ${taskName}:`, error);
            alert(`❌ Error running ${taskName}: ${error.message}`);
        }
    };

    // ============= HIGHLIGHTS MANAGEMENT =============
    const fetchHighlights = async (matchId) => {
        if (!matchId) return;

        try {
            setHighlightsData(prev => ({ ...prev, isLoading: true }));

            const response = await fetch(`http://localhost:3000/api/highlights/${matchId}/admin`);
            const data = await response.json();

            if (data.success) {
                setHighlightsData(prev => ({
                    ...prev,
                    highlights: data.data,
                    isLoading: false
                }));
            }
        } catch (error) {
            console.error('Error fetching highlights:', error);
            setHighlightsData(prev => ({ ...prev, isLoading: false }));
        }
    };

    const handleAddHighlight = async () => {
        const { selectedMatchId, formData } = highlightsData;

        if (!selectedMatchId || !formData.video_url || !formData.title) {
            alert('Please fill all required fields');
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/highlights/${selectedMatchId}/admin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                alert('Highlight added successfully!');
                setHighlightsData(prev => ({
                    ...prev,
                    showAddForm: false,
                    formData: {
                        video_url: '',
                        video_type: 'youtube',
                        title: '',
                        description: ''
                    }
                }));
                fetchHighlights(selectedMatchId);
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const handleDeleteHighlight = async (highlightId) => {
        if (!confirm('Delete this highlight?')) return;

        const { selectedMatchId } = highlightsData;

        try {
            const response = await fetch(`http://localhost:3000/api/highlights/${selectedMatchId}/admin/${highlightId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                alert('Highlight deleted!');
                fetchHighlights(selectedMatchId);
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    // ============= USE EFFECTS =============

    useEffect(() => {
        // Initial load
        refreshAllData();
        fetchSchedulerStatus();

        // Load matches specifically for highlights tab
        fetchMatches();

        // Auto refresh every 30 seconds
        const refreshInterval = setInterval(() => {
            checkAdminServiceHealth();
            fetchDashboardStats();
            fetchSchedulerStatus();
            fetchMonitoringData();
        }, 30000);

        return () => clearInterval(refreshInterval);
    }, []);

    // ============= RENDER =============

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex">
            {/* SIDEBAR */}
            <div className="w-80 bg-gradient-to-b from-slate-800 to-slate-900 shadow-2xl border-r border-slate-700 overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-slate-700">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <span className="text-white text-xl font-bold">⚡</span>
                        </div>
                        <div>
                            <h1 className="text-white text-lg font-bold">Clean Admin</h1>
                            <p className="text-slate-400 text-sm">V2.0 - No Errors</p>
                        </div>
                    </div>
                </div>

                {/* Service Status */}
                <div className="p-6 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-slate-800/60 backdrop-blur-sm border border-slate-600/30 rounded-2xl p-5 shadow-xl"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${adminServiceStatus.isHealthy ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                                <h3 className="text-white font-semibold">Admin Service</h3>
                            </div>
                            <button
                                onClick={checkAdminServiceHealth}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                🔄
                            </button>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Status:</span>
                                <span className={`font-semibold ${adminServiceStatus.isHealthy ? 'text-green-400' : 'text-red-400'}`}>
                                    {adminServiceStatus.isHealthy ? '🟢 Online' : '🔴 Offline'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Server:</span>
                                <span className="text-white font-semibold text-xs">Port 3000</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Last Check:</span>
                                <span className="text-blue-400 font-semibold text-xs">
                                    {adminServiceStatus.lastCheck ? dayjs(adminServiceStatus.lastCheck).format('HH:mm:ss') : 'Never'}
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Tab Navigation */}
                    <div className="space-y-2">
                        {[
                            { id: 'dashboard', name: 'Dashboard', icon: '📊' },
                            { id: 'monitoring', name: 'Monitoring', icon: '📈' },
                            { id: 'matches', name: 'Matches', icon: '⚽' },
                            { id: 'highlights', name: 'Highlights', icon: '🎬' },
                            { id: 'users', name: 'Users', icon: '👥' },
                            { id: 'rewards', name: 'Rewards', icon: '🎁' },
                            { id: 'scheduler', name: 'Scheduler', icon: '🕘' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full text-left p-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-3 ${activeTab === tab.id
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                    }`}
                            >
                                <span>{tab.icon}</span>
                                <span>{tab.name}</span>
                            </button>
                        ))}
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-3">
                        <button
                            onClick={refreshAllData}
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
                        >
                            <span>🔄</span>
                            <span>Refresh All Data</span>
                        </button>

                        <button
                            onClick={() => setShowBigMatchModal(true)}
                            className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
                        >
                            <span>🔥</span>
                            <span>Big Match Manager</span>
                        </button>

                        <button
                            onClick={logout}
                            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
                        >
                            <span>🚪</span>
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 p-8 overflow-auto bg-gradient-to-br from-slate-50 to-gray-100">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">
                        Clean Admin Panel
                        <span className="text-2xl ml-2">⚡</span>
                    </h1>
                    <p className="text-gray-600">Modern admin panel tanpa error - powered by AdminService</p>
                </motion.div>

                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-6 shadow-xl"
                        >
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                                    <span className="text-white text-xl">⚽</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">Total Matches</h3>
                                    <p className="text-gray-500 text-sm">All time</p>
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-blue-600">{dashboardStats.totalMatches}</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-6 shadow-xl"
                        >
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center">
                                    <span className="text-white text-xl">🔴</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">Live Matches</h3>
                                    <p className="text-gray-500 text-sm">Currently</p>
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-red-600">{dashboardStats.liveMatches}</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-6 shadow-xl"
                        >
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
                                    <span className="text-white text-xl">✅</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">Completed</h3>
                                    <p className="text-gray-500 text-sm">Finished</p>
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-green-600">{dashboardStats.completedMatches}</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-6 shadow-xl"
                        >
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center">
                                    <span className="text-white text-xl">⚡</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">Avg Goals</h3>
                                    <p className="text-gray-500 text-sm">Per match</p>
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-purple-600">{dashboardStats.averageGoalsPerMatch}</p>
                        </motion.div>
                    </div>
                )}

                {/* Matches Tab */}
                {activeTab === 'matches' && (
                    <div className="space-y-6">
                        {/* Manual Score Input */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-6 shadow-xl"
                        >
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center">
                                    <span className="text-white text-xl">🎯</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">Manual Score Input</h2>
                                    <p className="text-gray-500 text-sm">Input final scores and trigger grading</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <select
                                    value={selectedMatchId}
                                    onChange={(e) => setSelectedMatchId(e.target.value)}
                                    className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                                >
                                    <option value="">Pilih Match</option>
                                    {matchList.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.home_team} vs {m.away_team}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="number"
                                    placeholder="Home Score"
                                    value={finalScore.home}
                                    onChange={(e) => setFinalScore({ ...finalScore, home: e.target.value })}
                                    className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                                />
                                <input
                                    type="number"
                                    placeholder="Away Score"
                                    value={finalScore.away}
                                    onChange={(e) => setFinalScore({ ...finalScore, away: e.target.value })}
                                    className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                                />
                            </div>
                            <button
                                onClick={handleScoreSubmit}
                                className="w-full mt-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                            >
                                Submit Score & Run Grading
                            </button>
                        </motion.div>

                        {/* Recent Matches */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-6 shadow-xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                                        <span className="text-white text-xl">⚽</span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800">Recent Matches</h2>
                                        <p className="text-gray-500 text-sm">Latest matches from system</p>
                                    </div>
                                </div>
                                <button
                                    onClick={fetchMatches}
                                    disabled={isLoadingMatches}
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg text-sm"
                                >
                                    {isLoadingMatches ? '🔄 Loading...' : 'Refresh'}
                                </button>
                            </div>

                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {matchList.length === 0 ? (
                                    <div className="text-center py-8">
                                        <div className="text-4xl mb-2">⚽</div>
                                        <p className="text-gray-500">No matches found</p>
                                    </div>
                                ) : (
                                    matchList.map((match, i) => (
                                        <motion.div
                                            key={match.id}
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="bg-gray-50/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-4 hover:bg-gray-100/80 transition-all duration-200"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-semibold text-white ${match.status === 'live' ? 'bg-red-500' :
                                                            match.status === 'finished' ? 'bg-green-500' :
                                                                'bg-blue-500'
                                                            }`}>
                                                            {match.status?.toUpperCase() || 'UNKNOWN'}
                                                        </span>
                                                        {match.is_hot && (
                                                            <span className="inline-flex px-2 py-1 rounded-lg text-xs font-semibold text-white bg-orange-500">
                                                                🔥 HOT
                                                            </span>
                                                        )}
                                                        <p className="text-xs text-gray-500">{match.league}</p>
                                                    </div>
                                                    <p className="font-semibold text-gray-800 mb-1">
                                                        {match.home_team} vs {match.away_team}
                                                    </p>
                                                    {(match.home_score !== null && match.away_score !== null) && (
                                                        <p className="text-sm text-blue-600 font-bold mb-1">
                                                            Score: {match.home_score} - {match.away_score}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-gray-500">
                                                        {dayjs(match.kickoff).format('DD/MM/YYYY HH:mm')}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-6 shadow-xl"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
                                    <span className="text-white text-xl">👥</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">Active Users</h2>
                                    <p className="text-gray-500 text-sm">Recent user activity</p>
                                </div>
                            </div>
                            <button
                                onClick={fetchUsers}
                                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg text-sm"
                            >
                                Refresh
                            </button>
                        </div>

                        <div className="space-y-3 max-h-80 overflow-y-auto">
                            {users.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-2">👥</div>
                                    <p className="text-gray-500">No users found</p>
                                </div>
                            ) : (
                                users.map((user, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="bg-gray-50/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-4 hover:bg-gray-100/80 transition-colors"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                                                <span className="text-white font-bold text-sm">{user.username.charAt(0).toUpperCase()}</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-800">{user.username}</p>
                                                <p className="text-gray-500 text-sm">{user.email}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Rewards Tab */}
                {activeTab === 'rewards' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-6 shadow-xl"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
                                    <span className="text-white text-xl">🎁</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">Reward Management</h2>
                                    <p className="text-gray-500 text-sm">Process reward redemptions</p>
                                </div>
                            </div>
                        </div>

                        <div className="mb-4">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>

                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {filteredRedemptions.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-2">🎁</div>
                                    <p className="text-gray-500">No redemptions found</p>
                                </div>
                            ) : (
                                filteredRedemptions.map((redemption, index) => {
                                    const reward = rewards.find((r) => r.id === redemption.reward_id);
                                    const statusColors = {
                                        pending: 'bg-yellow-500',
                                        approved: 'bg-green-500',
                                        rejected: 'bg-red-500'
                                    };

                                    return (
                                        <motion.div
                                            key={redemption.id}
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="bg-gray-50/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-4 hover:bg-gray-100/80 transition-all duration-200"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                                                            <span className="text-white text-xs font-bold">{redemption.user_email.charAt(0).toUpperCase()}</span>
                                                        </div>
                                                        <p className="font-semibold text-gray-800">{redemption.user_email}</p>
                                                    </div>
                                                    <p className="text-gray-700 mb-1">
                                                        Reward: <span className="font-bold text-emerald-600">{reward?.name || 'Unknown Reward'}</span>
                                                    </p>
                                                    <div className="flex items-center space-x-2">
                                                        <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-semibold text-white ${statusColors[redemption.status] || 'bg-gray-500'}`}>
                                                            {redemption.status.toUpperCase()}
                                                        </span>
                                                        <p className="text-xs text-gray-500">{dayjs(redemption.created_at).format('DD/MM/YYYY, HH:mm')}</p>
                                                    </div>
                                                </div>

                                                {redemption.status === 'pending' && (
                                                    <div className="flex space-x-2 ml-4">
                                                        <button
                                                            onClick={() => handleApprove(redemption)}
                                                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 transform hover:scale-105 shadow-md"
                                                        >
                                                            ✅ Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(redemption)}
                                                            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 transform hover:scale-105 shadow-md"
                                                        >
                                                            ❌ Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                )}

                {/* ← TAMBAH SCHEDULER TAB INI SETELAH REWARDS TAB */}
                {activeTab === 'scheduler' && (
                    <div className="space-y-6">
                        {/* Scheduler Status Header */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-6 shadow-xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                                        <span className="text-white text-xl">🕐</span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800">Scheduler Monitor</h2>
                                        <p className="text-gray-500 text-sm">Automated fixture sync & cleanup system</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Last Update</p>
                                        <p className="font-medium text-xs">
                                            {schedulerData.lastUpdate ? dayjs(schedulerData.lastUpdate).format('HH:mm:ss') : '--:--:--'}
                                        </p>
                                    </div>
                                    <div className={`flex items-center space-x-2 px-3 py-2 rounded-full ${schedulerData.status?.isRunning
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                        }`}>
                                        <div className={`w-2 h-2 rounded-full ${schedulerData.status?.isRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                                            }`}></div>
                                        <span className="font-medium text-sm">
                                            {schedulerData.status?.isRunning ? 'RUNNING' : 'STOPPED'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Control Buttons */}
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() => handleSchedulerAction('start')}
                                    disabled={schedulerData.status?.isRunning || schedulerData.isLoading}
                                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    <span>▶️</span>
                                    <span>Start Scheduler</span>
                                </button>
                                <button
                                    onClick={() => handleSchedulerAction('stop')}
                                    disabled={!schedulerData.status?.isRunning || schedulerData.isLoading}
                                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    <span>⏹️</span>
                                    <span>Stop Scheduler</span>
                                </button>
                                <button
                                    onClick={() => handleSchedulerAction('restart')}
                                    disabled={schedulerData.isLoading}
                                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    <span>🔄</span>
                                    <span>Restart</span>
                                </button>
                                <button
                                    onClick={fetchSchedulerStatus}
                                    disabled={schedulerData.isLoading}
                                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    <span>📊</span>
                                    <span>{schedulerData.isLoading ? 'Loading...' : 'Refresh'}</span>
                                </button>
                            </div>
                        </motion.div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-6 shadow-xl"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Active Tasks</p>
                                        <p className="text-3xl font-bold text-blue-600">
                                            {schedulerData.status?.activeTasks || 0}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                                        <span className="text-blue-600 text-xl">⚙️</span>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-6 shadow-xl"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Current Time</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {schedulerData.status?.jakartaTime?.split(' ')[1] || '--:--:--'}
                                        </p>
                                        <p className="text-xs text-gray-500">Jakarta Time</p>
                                    </div>
                                    <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                                        <span className="text-purple-600 text-xl">🕐</span>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-6 shadow-xl"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Timezone</p>
                                        <p className="text-lg font-bold text-green-600">Jakarta</p>
                                        <p className="text-xs text-gray-500">Asia/Jakarta</p>
                                    </div>
                                    <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                                        <span className="text-green-600 text-xl">🌏</span>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-6 shadow-xl"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">System</p>
                                        <p className="text-lg font-bold text-orange-600">Healthy</p>
                                        <p className="text-xs text-gray-500">All systems operational</p>
                                    </div>
                                    <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                                        <span className="text-orange-600 text-xl">💖</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Scheduled Tasks */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-6 shadow-xl"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
                                            <span className="text-white text-xl">📅</span>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800">Scheduled Tasks</h3>
                                            <p className="text-gray-500 text-sm">Automated background processes</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {schedulerData.status?.tasks && Object.entries(schedulerData.status.tasks).map(([taskName, task]) => (
                                        <motion.div
                                            key={taskName}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="bg-gray-50/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-4 hover:bg-gray-100/80 transition-all duration-200"
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-semibold text-gray-800">{task.description}</h4>
                                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Active
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-3">Schedule: {task.schedule}</p>
                                            <div className="flex items-center justify-between">
                                                <div className="text-xs text-gray-500">
                                                    Next run: {task.nextRun}
                                                </div>
                                                <button
                                                    onClick={() => handleManualTask(taskName)}
                                                    className="px-3 py-1.5 text-xs bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-md"
                                                >
                                                    Run Now
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Activity Logs */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-6 shadow-xl"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
                                            <span className="text-white text-xl">📋</span>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800">Activity Logs</h3>
                                            <p className="text-gray-500 text-sm">Recent scheduler activities</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {schedulerData.logs.length === 0 ? (
                                        <div className="text-center py-8">
                                            <div className="text-4xl mb-2">📋</div>
                                            <p className="text-gray-500">No recent activity</p>
                                        </div>
                                    ) : (
                                        schedulerData.logs.map((log, index) => {
                                            const getLogIcon = (type) => {
                                                switch (type) {
                                                    case 'success': return '✅';
                                                    case 'error': return '❌';
                                                    case 'warning': return '⚠️';
                                                    default: return 'ℹ️';
                                                }
                                            };

                                            const getLogColor = (type) => {
                                                switch (type) {
                                                    case 'success': return 'text-green-600';
                                                    case 'error': return 'text-red-600';
                                                    case 'warning': return 'text-yellow-600';
                                                    default: return 'text-blue-600';
                                                }
                                            };

                                            return (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, x: 10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="bg-gray-50/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-4 hover:bg-gray-100/80 transition-colors"
                                                >
                                                    <div className="flex items-start space-x-3">
                                                        <span className="text-lg">{getLogIcon(log.type)}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm font-medium ${getLogColor(log.type)}`}>
                                                                {log.message}
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                {log.jakartaTime || dayjs(log.timestamp).format('DD/MM/YYYY HH:mm:ss')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )}

                {/* Highlights Tab */}
                {activeTab === 'highlights' && (
                    <div className="space-y-6">
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-6 shadow-xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
                                        <span className="text-white text-xl">🎬</span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800">Highlights Management</h2>
                                        <p className="text-gray-500 text-sm">Today's matches - {new Date().toLocaleDateString('id-ID')}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={async () => {
                                            try {
                                                const response = await fetch('http://localhost:3000/api/admin/matches/test', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' }
                                                });
                                                const result = await response.json();

                                                if (result.success) {
                                                    alert('Test match created for today!');
                                                    fetchMatches();
                                                } else {
                                                    alert('Error: ' + result.error);
                                                }
                                            } catch (error) {
                                                alert('Error: ' + error.message);
                                            }
                                        }}
                                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-colors text-sm"
                                    >
                                        + Add Test Match
                                    </button>
                                    <button
                                        onClick={() => setHighlightsData(prev => ({ ...prev, showAddForm: !prev.showAddForm }))}
                                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                                    >
                                        <span>➕</span>
                                        <span>Add Highlight</span>
                                    </button>
                                </div>
                            </div>

                            {/* Match Selection */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Match</label>

                                {/* DEBUG INFO */}
                                <div className="mb-2 text-sm text-gray-500">
                                    Debug: {matchList.length} matches found, loading: {isLoadingMatches ? 'yes' : 'no'}
                                </div>

                                <select
                                    value={highlightsData.selectedMatchId}
                                    onChange={(e) => {
                                        const matchId = e.target.value;
                                        setHighlightsData(prev => ({ ...prev, selectedMatchId: matchId }));
                                        if (matchId) fetchHighlights(matchId);
                                    }}
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                                >
                                    <option value="">Choose a match... ({matchList.length} available)</option>
                                    {matchList.map((match) => (
                                        <option key={match.id} value={match.id}>
                                            {match.day_info} - {match.home_team} vs {match.away_team} ({match.venue})
                                        </option>
                                    ))}
                                </select>

                                {/* MANUAL REFRESH BUTTON */}
                                <button
                                    onClick={() => {
                                        console.log('Manual fetch matches triggered');
                                        fetchMatches();
                                    }}
                                    className="mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm"
                                >
                                    Load Matches ({matchList.length})
                                </button>
                            </div>

                            {/* Add Form */}
                            {highlightsData.showAddForm && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="border border-gray-200 rounded-2xl p-6 mb-6 bg-gray-50"
                                >
                                    <h3 className="text-lg font-bold text-gray-800 mb-4">Add New Highlight</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Video URL *</label>
                                            <input
                                                type="url"
                                                value={highlightsData.formData.video_url}
                                                onChange={(e) => setHighlightsData(prev => ({
                                                    ...prev,
                                                    formData: { ...prev.formData, video_url: e.target.value }
                                                }))}
                                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                                                placeholder="https://youtube.com/watch?v=..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Video Type</label>
                                            <select
                                                value={highlightsData.formData.video_type}
                                                onChange={(e) => setHighlightsData(prev => ({
                                                    ...prev,
                                                    formData: { ...prev.formData, video_type: e.target.value }
                                                }))}
                                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                                            >
                                                <option value="youtube">YouTube</option>
                                                <option value="direct">Direct Link</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                        <input
                                            type="text"
                                            value={highlightsData.formData.title}
                                            onChange={(e) => setHighlightsData(prev => ({
                                                ...prev,
                                                formData: { ...prev.formData, title: e.target.value }
                                            }))}
                                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                                            placeholder="Match Highlights - Team A vs Team B"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea
                                            value={highlightsData.formData.description}
                                            onChange={(e) => setHighlightsData(prev => ({
                                                ...prev,
                                                formData: { ...prev.formData, description: e.target.value }
                                            }))}
                                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                                            rows="3"
                                            placeholder="Best moments from the match..."
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleAddHighlight}
                                            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                                        >
                                            Add Highlight
                                        </button>
                                        <button
                                            onClick={() => setHighlightsData(prev => ({ ...prev, showAddForm: false }))}
                                            className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-xl font-semibold transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>

                        {/* Highlights List */}
                        {highlightsData.selectedMatchId && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-6 shadow-xl"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-gray-800">Existing Highlights</h3>
                                    <button
                                        onClick={() => fetchHighlights(highlightsData.selectedMatchId)}
                                        disabled={highlightsData.isLoading}
                                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors text-sm"
                                    >
                                        {highlightsData.isLoading ? 'Loading...' : 'Refresh'}
                                    </button>
                                </div>

                                <div className="space-y-4 max-h-96 overflow-y-auto">
                                    {highlightsData.isLoading ? (
                                        <div className="text-center py-8">
                                            <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                            <p className="text-gray-600">Loading highlights...</p>
                                        </div>
                                    ) : highlightsData.highlights.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="text-6xl mb-4">🎬</div>
                                            <h4 className="text-xl font-bold text-gray-600 mb-2">No highlights yet</h4>
                                            <p className="text-gray-500">Add your first highlight for this match!</p>
                                        </div>
                                    ) : (
                                        highlightsData.highlights.map((highlight, index) => (
                                            <motion.div
                                                key={highlight.id}
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="border border-gray-200 rounded-2xl p-6 hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <span className="text-2xl">🎬</span>
                                                            <div>
                                                                <h4 className="font-bold text-gray-900">{highlight.title}</h4>
                                                                <p className="text-sm text-gray-600">{highlight.description}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                                                            <span>Type: {highlight.video_type}</span>
                                                            <span>Added: {dayjs(highlight.created_at).format('DD/MM/YYYY HH:mm')}</span>
                                                        </div>

                                                        <div className="bg-gray-100 rounded-lg p-3">
                                                            <a
                                                                href={highlight.video_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-600 hover:underline text-sm break-all"
                                                            >
                                                                {highlight.video_url}
                                                            </a>
                                                        </div>
                                                    </div>

                                                    <div className="ml-6 flex gap-2">
                                                        <button
                                                            onClick={() => window.open(highlight.video_url, '_blank')}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        >
                                                            👁️
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteHighlight(highlight.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}

                {/* Monitoring Tab */}
                {activeTab === 'monitoring' && (
                    <div className="space-y-6">
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-6 shadow-xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                                        <span className="text-white text-xl">🔍</span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800">System Monitoring</h2>
                                        <p className="text-gray-500 text-sm">Real-time backend performance & health</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Last Update</p>
                                        <p className="font-medium text-xs">
                                            {monitoringData.lastUpdated ? dayjs(monitoringData.lastUpdated).format('HH:mm:ss') : '--:--:--'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={fetchMonitoringData}
                                        disabled={monitoringData.isLoading}
                                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                    >
                                        <span>🔄</span>
                                        <span>{monitoringData.isLoading ? 'Loading...' : 'Refresh'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Overall Health Status */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className={`p-4 rounded-2xl text-center ${monitoringData.health.overall?.status === 'healthy' ? 'bg-green-100 text-green-800' :
                                    monitoringData.health.overall?.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                    <p className="text-2xl font-bold">{monitoringData.health.overall?.health_score || 0}%</p>
                                    <p className="text-sm font-semibold">System Health</p>
                                </div>
                                <div className={`p-4 rounded-2xl text-center ${monitoringData.performance.performance_summary?.overall_score >= 80 ? 'bg-green-100 text-green-800' :
                                    monitoringData.performance.performance_summary?.overall_score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                    <p className="text-2xl font-bold">{monitoringData.performance.performance_summary?.overall_score || 0}%</p>
                                    <p className="text-sm font-semibold">Performance</p>
                                </div>
                                <div className={`p-4 rounded-2xl text-center ${monitoringData.basic.memory?.usage_percent <= 80 ? 'bg-green-100 text-green-800' :
                                    monitoringData.basic.memory?.usage_percent <= 90 ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                    <p className="text-2xl font-bold">{monitoringData.basic.memory?.usage_percent || 0}%</p>
                                    <p className="text-sm font-semibold">Memory Usage</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Basic Metrics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-6 shadow-xl"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Memory Usage</p>
                                        <p className="text-3xl font-bold text-blue-600">
                                            {monitoringData.basic.memory?.used_mb || 0}MB
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            of {monitoringData.basic.memory?.total_mb || 0}MB
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                                        <span className="text-blue-600 text-xl">💾</span>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-6 shadow-xl"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">WebSocket Clients</p>
                                        <p className="text-3xl font-bold text-green-600">
                                            {monitoringData.basic.connections?.websocket_clients || 0}
                                        </p>
                                        <p className="text-xs text-gray-500">Connected</p>
                                    </div>
                                    <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                                        <span className="text-green-600 text-xl">📡</span>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-6 shadow-xl"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Cache Hit Rate</p>
                                        <p className="text-3xl font-bold text-purple-600">
                                            {monitoringData.basic.cache?.hit_rate || '0%'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {monitoringData.basic.cache?.total_queries || 0} queries
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                                        <span className="text-purple-600 text-xl">⚡</span>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-6 shadow-xl"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">System Uptime</p>
                                        <p className="text-lg font-bold text-orange-600">
                                            {monitoringData.basic.system?.uptime_formatted || '0d 0h 0m'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {monitoringData.basic.system?.platform || 'Unknown'}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                                        <span className="text-orange-600 text-xl">⏱️</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Services Status & Alerts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Services Status */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-6 shadow-xl"
                            >
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
                                        <span className="text-white text-xl">🏥</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800">Services Status</h3>
                                        <p className="text-gray-500 text-sm">Core system services health</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {monitoringData.health.services?.core && Object.entries(monitoringData.health.services.core).map(([serviceName, service]) => (
                                        <div key={serviceName} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-3 h-3 rounded-full ${service.status ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                <span className="font-medium text-gray-800 capitalize">{serviceName}</span>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${service.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {service.status ? 'Running' : 'Stopped'}
                                            </span>
                                        </div>
                                    ))}

                                    {/* Database & API Status */}
                                    {monitoringData.health.services?.database && (
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-3 h-3 rounded-full ${monitoringData.health.services.database.status ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                <span className="font-medium text-gray-800">Database</span>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${monitoringData.health.services.database.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {monitoringData.health.services.database.status ? 'Connected' : 'Disconnected'}
                                            </span>
                                        </div>
                                    )}

                                    {monitoringData.health.services?.external_api && (
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-3 h-3 rounded-full ${monitoringData.health.services.external_api.status ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                <span className="font-medium text-gray-800">API Football</span>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${monitoringData.health.services.external_api.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {monitoringData.health.services.external_api.status ? 'Connected' : 'Failed'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Alerts & Recommendations */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-6 shadow-xl"
                            >
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-600 rounded-2xl flex items-center justify-center">
                                        <span className="text-white text-xl">🚨</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800">Alerts & Recommendations</h3>
                                        <p className="text-gray-500 text-sm">System issues and optimization tips</p>
                                    </div>
                                </div>

                                <div className="space-y-3 max-h-64 overflow-y-auto">
                                    {/* Health Alerts */}
                                    {monitoringData.health.alerts?.length > 0 ? (
                                        monitoringData.health.alerts.map((alert, index) => (
                                            <div key={index} className="flex items-start space-x-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                                                <span className="text-red-500 text-lg">⚠️</span>
                                                <div>
                                                    <p className="text-red-700 font-medium">{alert}</p>
                                                    <p className="text-red-600 text-xs">Health Alert</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : null}

                                    {/* Performance Recommendations */}
                                    {monitoringData.performance.performance_summary?.recommendations?.length > 0 ? (
                                        monitoringData.performance.performance_summary.recommendations.map((rec, index) => (
                                            <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                                                <span className="text-yellow-500 text-lg">💡</span>
                                                <div>
                                                    <p className="text-yellow-700 font-medium">{rec}</p>
                                                    <p className="text-yellow-600 text-xs">Performance Tip</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : null}

                                    {/* No Issues */}
                                    {(!monitoringData.health.alerts?.length && !monitoringData.performance.performance_summary?.recommendations?.length) && (
                                        <div className="text-center py-8">
                                            <div className="text-4xl mb-2">✅</div>
                                            <p className="text-gray-500">No alerts or recommendations</p>
                                            <p className="text-green-600 text-sm font-medium">System running smoothly!</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )}

                {/* Big Match Modal */}
                {showBigMatchModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 max-w-6xl w-full mx-4 max-h-[85vh] overflow-hidden shadow-2xl border border-gray-200"
                        >
                            {/* Header */}
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center space-x-4">
                                    <div className="w-14 h-14 bg-gradient-to-r from-red-500 to-orange-600 rounded-2xl flex items-center justify-center">
                                        <span className="text-white text-2xl">🔥</span>
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold text-gray-800">Big Match Manager</h2>
                                        <p className="text-gray-500">Manage hot matches untuk multiplier points</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowBigMatchModal(false)}
                                    className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                                >
                                    <span className="text-gray-500 text-xl">×</span>
                                </button>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-4 text-center">
                                    <p className="text-2xl font-bold text-blue-600">{bigMatchModalData.totalMatches}</p>
                                    <p className="text-sm text-blue-500">Total Matches</p>
                                </div>
                                <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-2xl p-4 text-center">
                                    <p className="text-2xl font-bold text-red-600">{bigMatchModalData.hotMatches}</p>
                                    <p className="text-sm text-red-500">Hot Matches</p>
                                </div>
                                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-4 text-center">
                                    <p className="text-2xl font-bold text-green-600">{bigMatchModalData.totalMatches - bigMatchModalData.hotMatches}</p>
                                    <p className="text-sm text-green-500">Normal Matches</p>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex justify-between items-center mb-6">
                                <button
                                    onClick={fetchMatchesForBigMatchManager}
                                    disabled={bigMatchModalData.isLoading}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                                >
                                    {bigMatchModalData.isLoading ? '🔄 Loading...' : '🔄 Refresh Matches'}
                                </button>

                                <div className="text-sm text-gray-600">
                                    💡 Hot matches = 10x points untuk predictions
                                </div>
                            </div>

                            {/* Loading State */}
                            {bigMatchModalData.isLoading && (
                                <div className="text-center py-20">
                                    <div className="inline-flex items-center space-x-2 text-blue-600">
                                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-lg font-semibold">Loading matches...</span>
                                    </div>
                                </div>
                            )}

                            {/* Matches List */}
                            {!bigMatchModalData.isLoading && (
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {bigMatchModalData.matches.length === 0 ? (
                                        <div className="text-center py-20">
                                            <div className="text-6xl mb-4">⚽</div>
                                            <h3 className="text-xl font-bold text-gray-600 mb-2">No matches found</h3>
                                            <p className="text-gray-500">Try refreshing or check your data connection</p>
                                        </div>
                                    ) : (
                                        bigMatchModalData.matches.slice(0, 20).map((match, i) => (
                                            <motion.div
                                                key={match.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className={`relative rounded-2xl p-6 border-2 transition-all duration-300 hover:shadow-lg ${match.is_hot
                                                    ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200 shadow-red-100'
                                                    : 'bg-white border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                {/* Hot Badge */}
                                                {match.is_hot && (
                                                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                                                        🔥 HOT MATCH
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        {/* Match Info */}
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex items-center space-x-4">
                                                                <div className="text-center">
                                                                    <p className="font-bold text-gray-800 text-lg">{match.home_team}</p>
                                                                    <p className="text-xs text-gray-500">Home</p>
                                                                </div>
                                                                <div className="text-center px-4">
                                                                    <div className="text-2xl font-bold text-gray-600">
                                                                        {match.home_score ?? '-'} : {match.away_score ?? '-'}
                                                                    </div>
                                                                    <p className="text-xs text-gray-500">{match.status}</p>
                                                                </div>
                                                                <div className="text-center">
                                                                    <p className="font-bold text-gray-800 text-lg">{match.away_team}</p>
                                                                    <p className="text-xs text-gray-500">Away</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* League & Date */}
                                                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                                                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
                                                                🏆 {match.league}
                                                            </span>
                                                            <span>📅 {new Date(match.kickoff).toLocaleDateString()}</span>
                                                            <span>⏰ {new Date(match.kickoff).toLocaleTimeString()}</span>
                                                        </div>

                                                        {/* Points Info */}
                                                        <div className="flex items-center space-x-4">
                                                            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${match.is_hot ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                                                <span className="text-sm">🏆 Winner:</span>
                                                                <span className="font-bold">{match.is_hot ? '+15 pts' : '+10 pts'}</span>
                                                            </div>
                                                            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${match.is_hot ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                                                <span className="text-sm">⚽ Score:</span>
                                                                <span className="font-bold">{match.is_hot ? '+25 pts' : '+20 pts'}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Toggle Button */}
                                                    <div className="ml-6">
                                                        <button
                                                            onClick={() => toggleBigMatchStatus(match.id, !match.is_hot)}
                                                            className={`px-6 py-3 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg ${match.is_hot
                                                                ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-red-200'
                                                                : 'bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 text-gray-700 shadow-gray-200'
                                                                }`}
                                                        >
                                                            {match.is_hot ? (
                                                                <div className="flex items-center space-x-2">
                                                                    <span>🔥</span>
                                                                    <span>Hot Match</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center space-x-2">
                                                                    <span>⚪</span>
                                                                    <span>Make Hot</span>
                                                                </div>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* Footer */}
                            <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                                <button
                                    onClick={() => setShowBigMatchModal(false)}
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                                >
                                    Done ✅
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPanel;