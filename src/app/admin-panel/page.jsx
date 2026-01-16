'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';
import {
    LayoutDashboard,
    Users,
    Trophy,
    Gift,
    Settings,
    LogOut,
    Shield,
    Target,
    Search,
    RefreshCw,
    CheckCircle,
    XCircle,
    Flame,
    Loader2,
    Home,
    Activity
} from 'lucide-react';

// Stat Card Component
const StatCard = ({ icon: Icon, label, value }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                <Icon className="w-5 h-5 text-gray-500" />
            </div>
            <div>
                <p className="text-2xl font-semibold text-gray-900">{value.toLocaleString()}</p>
                <p className="text-sm text-gray-500">{label}</p>
            </div>
        </div>
    </div>
);

export default function AdminPanel() {
    const router = useRouter();

    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [adminInfo, setAdminInfo] = useState({ email: '', username: '' });

    // Active Tab
    const [activeTab, setActiveTab] = useState('dashboard');

    // Dashboard Stats
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalMatches: 0,
        totalPredictions: 0,
        totalRedemptions: 0,
        liveMatches: 0,
        pendingRedemptions: 0
    });

    // Data States
    const [users, setUsers] = useState([]);
    const [matches, setMatches] = useState([]);
    const [redemptions, setRedemptions] = useState([]);

    // UI States
    const [searchTerm, setSearchTerm] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // ============= AUTH CHECK =============
    useEffect(() => {
        checkAdminAuth();
    }, []);

    const checkAdminAuth = async () => {
        try {
            const adminLoggedIn = localStorage.getItem('admin_logged_in');

            if (!adminLoggedIn || adminLoggedIn !== 'true') {
                router.push('/admin-login');
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                localStorage.removeItem('admin_logged_in');
                router.push('/admin-login');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('is_admin, username')
                .eq('user_id', session.user.id)
                .single();

            if (!profile?.is_admin) {
                localStorage.removeItem('admin_logged_in');
                router.push('/admin-login');
                return;
            }

            setAdminInfo({
                email: session.user.email,
                username: profile.username || 'Admin'
            });
            setIsAuthenticated(true);
            await loadDashboardData();

        } catch (error) {
            console.error('Auth check error:', error);
            router.push('/admin-login');
        } finally {
            setIsLoading(false);
        }
    };

    // ============= DATA LOADING =============
    const loadDashboardData = async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([
                loadStats(),
                loadUsers(),
                loadMatches(),
                loadRedemptions()
            ]);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const loadStats = async () => {
        try {
            const { count: userCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            const { count: matchCount } = await supabase
                .from('matches')
                .select('*', { count: 'exact', head: true });

            const { count: liveCount } = await supabase
                .from('matches')
                .select('*', { count: 'exact', head: true })
                .eq('is_live', true);

            const { count: predictionCount } = await supabase
                .from('predictions')
                .select('*', { count: 'exact', head: true });

            const { count: redemptionCount } = await supabase
                .from('redemptions')
                .select('*', { count: 'exact', head: true });

            const { count: pendingCount } = await supabase
                .from('redemptions')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');

            setStats({
                totalUsers: userCount || 0,
                totalMatches: matchCount || 0,
                totalPredictions: predictionCount || 0,
                totalRedemptions: redemptionCount || 0,
                liveMatches: liveCount || 0,
                pendingRedemptions: pendingCount || 0
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const loadUsers = async () => {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);
            if (data) setUsers(data);
        } catch (error) {
            console.error('Error loading users:', error);
        }
    };

    const loadMatches = async () => {
        try {
            const { data } = await supabase
                .from('matches')
                .select('*')
                .order('date', { ascending: false })
                .limit(50);
            if (data) setMatches(data);
        } catch (error) {
            console.error('Error loading matches:', error);
        }
    };

    const loadRedemptions = async () => {
        try {
            const { data } = await supabase
                .from('redemptions')
                .select('*, profiles(username)')
                .order('created_at', { ascending: false })
                .limit(50);
            if (data) setRedemptions(data);
        } catch (error) {
            console.error('Error loading redemptions:', error);
        }
    };

    // ============= ACTIONS =============
    const handleLogout = async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('admin_logged_in');
        localStorage.removeItem('admin_email');
        localStorage.removeItem('admin_username');
        localStorage.removeItem('admin_user_id');
        router.push('/admin-login');
    };

    const toggleUserAdmin = async (userId, currentStatus) => {
        try {
            await supabase
                .from('profiles')
                .update({ is_admin: !currentStatus })
                .eq('id', userId);
            await loadUsers();
        } catch (error) {
            console.error('Error toggling admin:', error);
        }
    };

    const toggleHotMatch = async (matchId, currentStatus) => {
        try {
            await supabase
                .from('matches')
                .update({ is_hot: !currentStatus })
                .eq('id', matchId);
            await loadMatches();
        } catch (error) {
            console.error('Error toggling hot match:', error);
        }
    };

    const updateRedemptionStatus = async (redemptionId, newStatus) => {
        try {
            await supabase
                .from('redemptions')
                .update({ status: newStatus })
                .eq('id', redemptionId);
            await loadRedemptions();
            await loadStats();
        } catch (error) {
            console.error('Error updating redemption:', error);
        }
    };

    // ============= MENU ITEMS =============
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'matches', label: 'Matches', icon: Trophy },
        { id: 'redemptions', label: 'Redemptions', icon: Gift },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    // ============= LOADING STATE =============
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    // ============= RENDER =============
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                            <Shield className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold text-gray-900">Admin Panel</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{adminInfo.username}</p>
                            <p className="text-xs text-gray-500">{adminInfo.email}</p>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => router.push('/')}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <Home className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex gap-8">
                    {/* Sidebar */}
                    <aside className="w-56 flex-shrink-0">
                        <nav className="space-y-1">
                            {menuItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === item.id
                                        ? 'bg-green-50 text-green-600'
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                </button>
                            ))}
                        </nav>

                        {/* Quick Info */}
                        <div className="mt-8 p-4 bg-white rounded-xl border border-gray-200">
                            <div className="flex items-center gap-2 mb-4">
                                <Activity className="w-4 h-4 text-gray-400" />
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</span>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Live</span>
                                    <span className="text-sm font-semibold text-green-600">{stats.liveMatches}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Pending</span>
                                    <span className="text-sm font-semibold text-amber-500">{stats.pendingRedemptions}</span>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 min-w-0">
                        {/* Dashboard */}
                        {activeTab === 'dashboard' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
                                    <button
                                        onClick={loadDashboardData}
                                        disabled={isRefreshing}
                                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                        Refresh
                                    </button>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <StatCard icon={Users} label="Users" value={stats.totalUsers} />
                                    <StatCard icon={Trophy} label="Matches" value={stats.totalMatches} />
                                    <StatCard icon={Target} label="Predictions" value={stats.totalPredictions} />
                                    <StatCard icon={Gift} label="Redemptions" value={stats.totalRedemptions} />
                                </div>

                                {/* Recent Matches */}
                                <div className="bg-white rounded-xl border border-gray-200">
                                    <div className="px-5 py-4 border-b border-gray-100">
                                        <h2 className="text-sm font-semibold text-gray-900">Recent Matches</h2>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {matches.slice(0, 5).map((match) => (
                                            <div key={match.id} className="px-5 py-3 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    {match.is_live && (
                                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                                    )}
                                                    <span className="text-sm text-gray-900">
                                                        {match.home_team_name} vs {match.away_team_name}
                                                    </span>
                                                    {match.is_hot && (
                                                        <Flame className="w-4 h-4 text-orange-500" />
                                                    )}
                                                </div>
                                                <span className="text-sm text-gray-500 tabular-nums">
                                                    {match.home_score ?? '-'} : {match.away_score ?? '-'}
                                                </span>
                                            </div>
                                        ))}
                                        {matches.length === 0 && (
                                            <div className="px-5 py-8 text-center text-sm text-gray-500">
                                                No matches found
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Users */}
                        {activeTab === 'users' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h1 className="text-xl font-semibold text-gray-900">Users</h1>
                                    <div className="relative">
                                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-9 pr-4 py-2 w-64 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Points</th>
                                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                                                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {users
                                                .filter(u => u.username?.toLowerCase().includes(searchTerm.toLowerCase()))
                                                .map((user) => (
                                                    <tr key={user.id} className="hover:bg-gray-50">
                                                        <td className="px-5 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                                                    <span className="text-sm font-medium text-gray-600">
                                                                        {user.username?.charAt(0).toUpperCase()}
                                                                    </span>
                                                                </div>
                                                                <span className="text-sm font-medium text-gray-900">{user.username}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <span className="text-sm text-gray-600">{user.points || 0}</span>
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            {user.is_admin ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium">
                                                                    <CheckCircle className="w-3 h-3" />
                                                                    Admin
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-gray-500">User</span>
                                                            )}
                                                        </td>
                                                        <td className="px-5 py-3 text-right">
                                                            <button
                                                                onClick={() => toggleUserAdmin(user.id, user.is_admin)}
                                                                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${user.is_admin
                                                                    ? 'text-red-600 hover:bg-red-50'
                                                                    : 'text-green-600 hover:bg-green-50'
                                                                    }`}
                                                            >
                                                                {user.is_admin ? 'Remove' : 'Make Admin'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Matches */}
                        {activeTab === 'matches' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h1 className="text-xl font-semibold text-gray-900">Matches</h1>
                                    <button
                                        onClick={loadMatches}
                                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Refresh
                                    </button>
                                </div>

                                <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                                    {matches.map((match) => (
                                        <div key={match.id} className="px-5 py-4 flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {match.is_live && (
                                                        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                                                            LIVE
                                                        </span>
                                                    )}
                                                    {match.is_hot && (
                                                        <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded flex items-center gap-1">
                                                            <Flame className="w-3 h-3" />
                                                            HOT
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {match.home_team_name} vs {match.away_team_name}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {match.league_name}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-lg font-semibold text-gray-900 tabular-nums">
                                                    {match.home_score ?? '-'} : {match.away_score ?? '-'}
                                                </span>
                                                <button
                                                    onClick={() => toggleHotMatch(match.id, match.is_hot)}
                                                    className={`p-2 rounded-lg transition-colors ${match.is_hot
                                                        ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                                                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
                                                        }`}
                                                >
                                                    <Flame className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {matches.length === 0 && (
                                        <div className="px-5 py-12 text-center text-sm text-gray-500">
                                            No matches found
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Redemptions */}
                        {activeTab === 'redemptions' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h1 className="text-xl font-semibold text-gray-900">Redemptions</h1>
                                    <button
                                        onClick={loadRedemptions}
                                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Refresh
                                    </button>
                                </div>

                                <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                                    {redemptions.map((redemption) => (
                                        <div key={redemption.id} className="px-5 py-4 flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {redemption.reward_name || 'Reward'}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {redemption.profiles?.username || 'Unknown'} - {new Date(redemption.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${redemption.status === 'pending'
                                                    ? 'bg-amber-50 text-amber-700'
                                                    : redemption.status === 'approved'
                                                        ? 'bg-green-50 text-green-700'
                                                        : 'bg-red-50 text-red-700'
                                                    }`}>
                                                    {redemption.status}
                                                </span>
                                                {redemption.status === 'pending' && (
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => updateRedemptionStatus(redemption.id, 'approved')}
                                                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => updateRedemptionStatus(redemption.id, 'rejected')}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {redemptions.length === 0 && (
                                        <div className="px-5 py-12 text-center text-sm text-gray-500">
                                            No redemption requests
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Settings */}
                        {activeTab === 'settings' && (
                            <div className="space-y-6">
                                <h1 className="text-xl font-semibold text-gray-900">Settings</h1>

                                <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                                    <div className="px-5 py-4">
                                        <h3 className="text-sm font-medium text-gray-900 mb-3">Account</h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-500">Email</span>
                                                <span className="text-gray-900">{adminInfo.email}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-500">Username</span>
                                                <span className="text-gray-900">{adminInfo.username}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-5 py-4">
                                        <h3 className="text-sm font-medium text-gray-900 mb-3">Actions</h3>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={loadDashboardData}
                                                className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                                            >
                                                Refresh Data
                                            </button>
                                            <button
                                                onClick={handleLogout}
                                                className="px-4 py-2 bg-white text-red-600 text-sm font-medium rounded-lg border border-gray-200 hover:bg-red-50 hover:border-red-200 transition-colors"
                                            >
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
