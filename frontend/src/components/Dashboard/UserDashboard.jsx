import { useAuth } from '../../context/AuthContext';
import {
    Shield,
    FolderLock,
    Globe,
    Lock,
    CheckCircle,
    Key,
    FileCheck,
    ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const UserDashboard = () => {
    const { user, isAdmin, isPremium } = useAuth();

    const securityFeatures = [
        {
            icon: Lock,
            title: 'AES-256-GCM Encryption',
            description: 'Military-grade file encryption',
            status: 'Active',
            color: 'neon-cyan'
        },
        {
            icon: Shield,
            title: 'Multi-Factor Auth',
            description: 'TOTP-based 2FA enabled',
            status: 'Verified',
            color: 'neon-green'
        },
        {
            icon: Key,
            title: 'PBKDF2 Key Derivation',
            description: '100,000 iterations',
            status: 'Active',
            color: 'neon-purple'
        },
        {
            icon: FileCheck,
            title: 'SHA-256 Integrity',
            description: 'Digital signatures for all files',
            status: 'Active',
            color: 'neon-orange'
        }
    ];

    const quickActions = [
        {
            to: '/app/vault',
            icon: FolderLock,
            title: 'Encrypted Vault',
            description: 'Access your secure files',
            color: 'from-neon-cyan to-blue-500',
            show: isPremium
        },
        {
            to: '/app/public',
            icon: Globe,
            title: 'Public Repository',
            description: 'Browse shared files',
            color: 'from-neon-green to-emerald-500',
            show: true
        }
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">
                    Welcome back, <span className="gradient-text">{user?.username}</span>
                </h1>
                <p className="text-slate-400 mt-2">Your secure file management dashboard</p>
            </div>

            {/* Security Status Banner */}
            <div className="glass-card rounded-2xl p-6 border-l-4 border-neon-green">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-neon-green/20 flex items-center justify-center security-badge">
                            <CheckCircle className="w-6 h-6 text-neon-green" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Security Status: Protected</h2>
                            <p className="text-slate-400 text-sm">All security features are active and verified</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="status-dot online"></span>
                        <span className="text-neon-green text-sm font-medium">All Systems Operational</span>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {quickActions.filter(a => a.show).map((action) => (
                    <Link
                        key={action.to}
                        to={action.to}
                        className="file-card glass-card rounded-2xl p-6 group cursor-pointer"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center`}>
                                    <action.icon className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white group-hover:text-neon-cyan transition-colors">
                                        {action.title}
                                    </h3>
                                    <p className="text-slate-400 text-sm">{action.description}</p>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-neon-cyan group-hover:translate-x-1 transition-all" />
                        </div>
                    </Link>
                ))}
            </div>

            {/* Security Features Grid */}
            <div>
                <h2 className="text-xl font-semibold text-white mb-4">Security Features</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {securityFeatures.map((feature, index) => (
                        <div
                            key={index}
                            className="glass-card rounded-xl p-5 hover:border-slate-600 transition-colors"
                        >
                            <div className={`w-10 h-10 rounded-lg bg-${feature.color}/20 flex items-center justify-center mb-4`}>
                                <feature.icon className={`w-5 h-5 text-${feature.color}`} />
                            </div>
                            <h3 className="font-medium text-white mb-1">{feature.title}</h3>
                            <p className="text-slate-500 text-sm mb-3">{feature.description}</p>
                            <div className="flex items-center gap-2">
                                <span className="status-dot online"></span>
                                <span className="text-neon-green text-xs">{feature.status}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Role Info */}
            <div className="glass-card rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Your Access Level</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`p-4 rounded-xl ${user?.role === 'guest' ? 'bg-slate-600/20 ring-2 ring-slate-400' : 'bg-cyber-dark'}`}>
                        <h4 className="font-medium text-white mb-2">Guest</h4>
                        <ul className="text-sm text-slate-400 space-y-1">
                            <li>• View public files</li>
                            <li>• Read-only access</li>
                        </ul>
                    </div>
                    <div className={`p-4 rounded-xl ${user?.role === 'premium' ? 'bg-neon-cyan/10 ring-2 ring-neon-cyan' : 'bg-cyber-dark'}`}>
                        <h4 className="font-medium text-white mb-2">Premium</h4>
                        <ul className="text-sm text-slate-400 space-y-1">
                            <li>• Encrypted vault access</li>
                            <li>• Upload & share files</li>
                            <li>• QR code sharing</li>
                        </ul>
                    </div>
                    <div className={`p-4 rounded-xl ${user?.role === 'admin' ? 'bg-neon-purple/10 ring-2 ring-neon-purple' : 'bg-cyber-dark'}`}>
                        <h4 className="font-medium text-white mb-2">Administrator</h4>
                        <ul className="text-sm text-slate-400 space-y-1">
                            <li>• Full system access</li>
                            <li>• View audit logs</li>
                            <li>• Manage users</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
