import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import {
    Users,
    Shield,
    Lock,
    Unlock,
    Search,
    RefreshCw,
    ChevronDown,
    Loader2,
    CheckCircle,
    XCircle,
    Crown,
    User,
    Eye
} from 'lucide-react';

const getRoleBadge = (role) => {
    const styles = {
        admin: 'bg-neon-purple/20 text-neon-purple border-neon-purple/30',
        premium: 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30',
        guest: 'bg-slate-600/20 text-slate-400 border-slate-600/30'
    };
    const icons = {
        admin: Crown,
        premium: Shield,
        guest: Eye
    };
    return { style: styles[role] || styles.guest, Icon: icons[role] || User };
};

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [editingUser, setEditingUser] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, [roleFilter]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = roleFilter ? { role: roleFilter } : {};
            const response = await adminAPI.getUsers(params);
            if (response.data.success) {
                setUsers(response.data.data.users);
            }
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            const response = await adminAPI.updateUserRole(userId, newRole);
            if (response.data.success) {
                setUsers(prev => prev.map(u =>
                    u.id === userId ? { ...u, role: newRole } : u
                ));
                setEditingUser(null);
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update role');
        }
    };

    const handleUnlock = async (userId) => {
        try {
            const response = await adminAPI.unlockUser(userId);
            if (response.data.success) {
                setUsers(prev => prev.map(u =>
                    u.id === userId ? { ...u, isLocked: false, loginAttempts: 0 } : u
                ));
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to unlock user');
        }
    };

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Users className="w-8 h-8 text-neon-cyan" />
                        User Management
                    </h1>
                    <p className="text-slate-400 mt-2">Manage user accounts and permissions</p>
                </div>
                <button
                    onClick={fetchUsers}
                    className="p-3 rounded-lg glass-card hover:bg-slate-700 transition-colors"
                    title="Refresh"
                >
                    <RefreshCw className={`w-5 h-5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Filters */}
            <div className="glass-card rounded-xl p-4 flex items-center gap-4 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search users..."
                        className="w-full pl-11 pr-4 py-2 bg-cyber-dark border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-neon-cyan"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-4 py-2 bg-cyber-dark border border-slate-600 rounded-lg text-white focus:border-neon-cyan"
                >
                    <option value="">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="premium">Premium</option>
                    <option value="guest">Guest</option>
                </select>
            </div>

            {/* Users Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 text-neon-cyan animate-spin" />
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="glass-card rounded-2xl p-12 text-center">
                    <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No users found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredUsers.map((user) => {
                        const { style, Icon } = getRoleBadge(user.role);
                        return (
                            <div key={user.id} className="glass-card rounded-xl p-5">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-cyan/30 to-neon-green/30 flex items-center justify-center">
                                            <span className="text-white font-semibold text-lg">
                                                {user.username.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-white">{user.username}</h3>
                                            <p className="text-sm text-slate-400">{user.email}</p>
                                        </div>
                                    </div>
                                    {user.isLocked && (
                                        <button
                                            onClick={() => handleUnlock(user.id)}
                                            className="p-2 rounded-lg bg-neon-red/10 text-neon-red hover:bg-neon-red/20 transition-colors"
                                            title="Unlock Account"
                                        >
                                            <Lock className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Role Selector */}
                                <div className="mb-4">
                                    <p className="text-xs text-slate-500 mb-2">Role</p>
                                    {editingUser === user.id ? (
                                        <div className="flex gap-2">
                                            {['admin', 'premium', 'guest'].map((role) => (
                                                <button
                                                    key={role}
                                                    onClick={() => handleRoleChange(user.id, role)}
                                                    className={`px-3 py-1 rounded-lg text-sm capitalize transition-colors ${user.role === role
                                                            ? 'bg-neon-cyan text-white'
                                                            : 'bg-cyber-dark text-slate-400 hover:text-white'
                                                        }`}
                                                >
                                                    {role}
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => setEditingUser(null)}
                                                className="text-slate-500 hover:text-white"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setEditingUser(user.id)}
                                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border ${style}`}
                                        >
                                            <Icon className="w-3 h-3" />
                                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                            <ChevronDown className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>

                                {/* Status Indicators */}
                                <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        {user.mfaVerified ? (
                                            <CheckCircle className="w-4 h-4 text-neon-green" />
                                        ) : (
                                            <XCircle className="w-4 h-4 text-neon-orange" />
                                        )}
                                        <span className="text-slate-400">MFA</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {user.isLocked ? (
                                            <Lock className="w-4 h-4 text-neon-red" />
                                        ) : (
                                            <Unlock className="w-4 h-4 text-neon-green" />
                                        )}
                                        <span className="text-slate-400">
                                            {user.isLocked ? 'Locked' : 'Active'}
                                        </span>
                                    </div>
                                </div>

                                {/* Meta */}
                                <div className="mt-4 pt-4 border-t border-slate-700">
                                    <div className="flex justify-between text-xs text-slate-500">
                                        <span>Last login</span>
                                        <span>
                                            {user.lastLogin
                                                ? new Date(user.lastLogin).toLocaleDateString()
                                                : 'Never'}
                                        </span>
                                    </div>
                                    {user.loginAttempts > 0 && (
                                        <div className="flex justify-between text-xs text-neon-orange mt-1">
                                            <span>Failed attempts</span>
                                            <span>{user.loginAttempts}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default UserManagement;
