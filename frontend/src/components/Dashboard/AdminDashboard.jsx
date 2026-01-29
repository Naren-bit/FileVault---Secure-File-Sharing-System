import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import {
    Users,
    FileText,
    HardDrive,
    Download,
    Shield,
    AlertTriangle,
    Activity,
    TrendingUp,
    Lock,
    CheckCircle,
    XCircle,
    Loader2
} from 'lucide-react';

const StatCard = ({ icon: Icon, title, value, subtitle, color, trend }) => (
    <div className="glass-card rounded-xl p-5">
        <div className="flex items-start justify-between">
            <div className={`w-12 h-12 rounded-xl bg-${color}/20 flex items-center justify-center`}>
                <Icon className={`w-6 h-6 text-${color}`} />
            </div>
            {trend && (
                <div className={`flex items-center gap-1 text-xs ${trend > 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                    <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
                    {Math.abs(trend)}%
                </div>
            )}
        </div>
        <div className="mt-4">
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-slate-400 text-sm">{title}</p>
            {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
        </div>
    </div>
);

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await adminAPI.getStats();
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load statistics');
        } finally {
            setLoading(false);
        }
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-neon-cyan animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="glass-card rounded-xl p-6 text-center">
                <AlertTriangle className="w-12 h-12 text-neon-red mx-auto mb-4" />
                <p className="text-slate-400">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-slate-400 mt-2">System overview and security monitoring</p>
            </div>

            {/* Security Score */}
            <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-2xl ${stats?.security?.securityScore >= 80
                                ? 'bg-neon-green/20'
                                : stats?.security?.securityScore >= 50
                                    ? 'bg-neon-orange/20'
                                    : 'bg-neon-red/20'
                            } flex items-center justify-center`}>
                            <Shield className={`w-8 h-8 ${stats?.security?.securityScore >= 80
                                    ? 'text-neon-green'
                                    : stats?.security?.securityScore >= 50
                                        ? 'text-neon-orange'
                                        : 'text-neon-red'
                                }`} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Security Score: {stats?.security?.securityScore || 0}/100</h2>
                            <p className="text-slate-400">Based on failed logins and access violations</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-slate-400 text-sm">Last 24 hours</p>
                        <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-neon-green" />
                                <span className="text-white">{stats?.security?.loginAttempts24h - stats?.security?.failedLogins24h || 0} Success</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <XCircle className="w-4 h-4 text-neon-red" />
                                <span className="text-white">{stats?.security?.failedLogins24h || 0} Failed</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={Users}
                    title="Total Users"
                    value={stats?.users?.total || 0}
                    subtitle={`${stats?.users?.byRole?.admin || 0} admins, ${stats?.users?.byRole?.premium || 0} premium`}
                    color="neon-cyan"
                />
                <StatCard
                    icon={FileText}
                    title="Encrypted Files"
                    value={stats?.files?.total || 0}
                    subtitle={`${stats?.files?.byAccess?.vault || 0} vault, ${stats?.files?.byAccess?.public || 0} public`}
                    color="neon-green"
                />
                <StatCard
                    icon={HardDrive}
                    title="Storage Used"
                    value={formatBytes(stats?.files?.totalSize || 0)}
                    subtitle="AES-256-GCM encrypted"
                    color="neon-purple"
                />
                <StatCard
                    icon={Download}
                    title="Total Downloads"
                    value={stats?.files?.totalDownloads || 0}
                    subtitle="With integrity verification"
                    color="neon-orange"
                />
            </div>

            {/* MFA Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-neon-cyan" />
                        MFA Status
                    </h3>
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-400">MFA Verified</span>
                                <span className="text-white">{stats?.users?.mfaEnabled || 0} users</span>
                            </div>
                            <div className="h-2 bg-cyber-dark rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-neon-cyan to-neon-green rounded-full"
                                    style={{
                                        width: `${stats?.users?.total ? (stats.users.mfaEnabled / stats.users.total) * 100 : 0}%`
                                    }}
                                ></div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                        <span className="status-dot online"></span>
                        <span className="text-neon-green text-sm">MFA enforced for all users</span>
                    </div>
                </div>

                <div className="glass-card rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-neon-orange" />
                        Security Alerts (24h)
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-400">Failed Logins</span>
                            <span className={`font-medium ${stats?.security?.failedLogins24h > 10 ? 'text-neon-red' : 'text-white'
                                }`}>
                                {stats?.security?.failedLogins24h || 0}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-400">Access Denied</span>
                            <span className={`font-medium ${stats?.security?.accessDenied24h > 5 ? 'text-neon-red' : 'text-white'
                                }`}>
                                {stats?.security?.accessDenied24h || 0}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="glass-card rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-neon-cyan" />
                    Activity Summary (24h)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {(stats?.activity || []).slice(0, 6).map((item, index) => (
                        <div key={index} className="bg-cyber-dark rounded-lg p-3 text-center">
                            <p className="text-xl font-bold text-white">{item.count}</p>
                            <p className="text-xs text-slate-400 truncate">{item._id?.replace(/_/g, ' ')}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
