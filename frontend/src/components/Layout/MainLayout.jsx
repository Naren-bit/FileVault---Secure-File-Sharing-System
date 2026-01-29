import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Shield,
    LayoutDashboard,
    FolderLock,
    Globe,
    Activity,
    Users,
    FileText,
    LogOut,
    ChevronRight,
    ShieldCheck,
    Home
} from 'lucide-react';

const Sidebar = () => {
    const { user, logout, isAdmin, isPremium } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const handleGoHome = async () => {
        await logout();
        navigate('/');
    };

    const navItems = [
        {
            to: '/app/dashboard',
            icon: LayoutDashboard,
            label: 'Dashboard',
            show: true
        },
        {
            to: '/app/vault',
            icon: FolderLock,
            label: 'Encrypted Vault',
            show: isPremium,
            badge: 'AES-256'
        },
        {
            to: '/app/public',
            icon: Globe,
            label: 'Public Repository',
            show: true
        },
        {
            to: '/app/admin',
            icon: Activity,
            label: 'System Stats',
            show: isAdmin
        },
        {
            to: '/app/admin/logs',
            icon: FileText,
            label: 'Audit Logs',
            show: isAdmin
        },
        {
            to: '/app/admin/users',
            icon: Users,
            label: 'User Management',
            show: isAdmin
        }
    ];

    const getRoleBadge = () => {
        const badges = {
            admin: { bg: 'bg-neon-purple/20', text: 'text-neon-purple', label: 'Admin' },
            premium: { bg: 'bg-neon-cyan/20', text: 'text-neon-cyan', label: 'Premium' },
            guest: { bg: 'bg-slate-600/20', text: 'text-slate-400', label: 'Guest' }
        };
        return badges[user?.role] || badges.guest;
    };

    const roleBadge = getRoleBadge();

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-cyber-medium border-r border-slate-700/50 flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-green flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg text-white">FileVault</h1>
                        <p className="text-xs text-slate-500">File Security System</p>
                    </div>
                </div>
            </div>

            {/* User Info */}
            <div className="p-4 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-cyan/30 to-neon-green/30 flex items-center justify-center">
                        <span className="text-white font-semibold">
                            {user?.username?.charAt(0).toUpperCase() || 'U'}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{user?.username}</p>
                        <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${roleBadge.bg} ${roleBadge.text}`}>
                            {roleBadge.label}
                        </span>
                    </div>
                </div>

                {/* MFA Status */}
                <div className="mt-3 flex items-center gap-2 px-2 py-1.5 bg-neon-green/10 border border-neon-green/30 rounded-lg">
                    <ShieldCheck className="w-4 h-4 text-neon-green" />
                    <span className="text-xs text-neon-green">MFA Active</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.filter(item => item.show).map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${isActive
                                ? 'bg-gradient-to-r from-neon-cyan/20 to-neon-green/10 text-neon-cyan border-l-2 border-neon-cyan'
                                : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                            <span className="px-2 py-0.5 text-xs bg-neon-cyan/20 text-neon-cyan rounded-full">
                                {item.badge}
                            </span>
                        )}
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </NavLink>
                ))}
            </nav>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-700/50 space-y-2">
                <button
                    onClick={handleGoHome}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-neon-cyan/10 hover:text-neon-cyan transition-all"
                >
                    <Home className="w-5 h-5" />
                    <span>Back to Home</span>
                </button>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

const MainLayout = () => {
    return (
        <div className="min-h-screen bg-cyber-dark grid-bg">
            <Sidebar />
            <main className="ml-64 p-8">
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;
