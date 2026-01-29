import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import {
    FileText,
    Search,
    Filter,
    RefreshCw,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Shield,
    User,
    Loader2,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

const getStatusColor = (status) => {
    switch (status) {
        case 'SUCCESS':
            return 'text-neon-green bg-neon-green/10 border-neon-green/30';
        case 'FAILED':
            return 'text-neon-red bg-neon-red/10 border-neon-red/30';
        case 'DENIED':
            return 'text-neon-orange bg-neon-orange/10 border-neon-orange/30';
        default:
            return 'text-slate-400 bg-slate-600/10 border-slate-600/30';
    }
};

const getStatusIcon = (status) => {
    switch (status) {
        case 'SUCCESS':
            return CheckCircle;
        case 'FAILED':
            return XCircle;
        case 'DENIED':
            return AlertTriangle;
        default:
            return Shield;
    }
};

const getActionColor = (action) => {
    if (action.includes('LOGIN') || action.includes('MFA')) return 'text-neon-cyan';
    if (action.includes('FILE')) return 'text-neon-green';
    if (action.includes('ACCESS') || action.includes('DENIED')) return 'text-neon-orange';
    if (action.includes('INTEGRITY')) return 'text-neon-purple';
    return 'text-slate-300';
};

const AuditLog = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        pages: 1
    });
    const [filters, setFilters] = useState({
        action: '',
        status: '',
        actor: ''
    });
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchLogs();
    }, [pagination.page, filters]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                ...Object.fromEntries(
                    Object.entries(filters).filter(([_, v]) => v !== '')
                )
            };
            const response = await adminAPI.getLogs(params);
            if (response.data.success) {
                setLogs(response.data.data.logs);
                setPagination(prev => ({
                    ...prev,
                    ...response.data.data.pagination
                }));
            }
        } catch (err) {
            console.error('Failed to fetch logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const actionTypes = [
        'LOGIN_SUCCESS',
        'LOGIN_FAILED',
        'MFA_VERIFIED',
        'MFA_FAILED',
        'FILE_UPLOAD',
        'FILE_DOWNLOAD',
        'ACCESS_DENIED',
        'INTEGRITY_CHECK_PASSED',
        'INTEGRITY_CHECK_FAILED'
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <FileText className="w-8 h-8 text-neon-cyan" />
                        Audit Logs
                    </h1>
                    <p className="text-slate-400 mt-2">Security event monitoring and forensics</p>
                </div>
                <button
                    onClick={fetchLogs}
                    className="p-3 rounded-lg glass-card hover:bg-slate-700 transition-colors"
                    title="Refresh"
                >
                    <RefreshCw className={`w-5 h-5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Filters */}
            <div className="glass-card rounded-xl p-4">
                <div className="flex items-center gap-4 flex-wrap">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${showFilters ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>

                    {showFilters && (
                        <>
                            <select
                                value={filters.action}
                                onChange={(e) => handleFilterChange('action', e.target.value)}
                                className="px-3 py-2 bg-cyber-dark border border-slate-600 rounded-lg text-white text-sm focus:border-neon-cyan"
                            >
                                <option value="">All Actions</option>
                                {actionTypes.map(action => (
                                    <option key={action} value={action}>
                                        {action.replace(/_/g, ' ')}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="px-3 py-2 bg-cyber-dark border border-slate-600 rounded-lg text-white text-sm focus:border-neon-cyan"
                            >
                                <option value="">All Status</option>
                                <option value="SUCCESS">Success</option>
                                <option value="FAILED">Failed</option>
                                <option value="DENIED">Denied</option>
                            </select>

                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    value={filters.actor}
                                    onChange={(e) => handleFilterChange('actor', e.target.value)}
                                    placeholder="Search by user..."
                                    className="pl-9 pr-4 py-2 bg-cyber-dark border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:border-neon-cyan"
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Logs Table */}
            <div className="glass-card rounded-xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 text-neon-cyan animate-spin" />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-12 text-center">
                        <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400">No logs found matching your criteria</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-cyber-dark border-b border-slate-700">
                                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Timestamp</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">User</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Action</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Status</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">IP Address</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase">Target</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {logs.map((log) => {
                                    const StatusIcon = getStatusIcon(log.status);
                                    return (
                                        <tr key={log.id} className="hover:bg-cyber-dark/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="text-sm text-white font-mono">
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                                                        <User className="w-4 h-4 text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-white">{log.actor}</p>
                                                        <p className="text-xs text-slate-500">{log.actorRole}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-sm font-medium ${getActionColor(log.action)}`}>
                                                    {log.action.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(log.status)}`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm text-slate-400 font-mono">{log.ipAddress}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm text-slate-400 truncate max-w-[150px] block">
                                                    {log.target || '-'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="px-4 py-3 border-t border-slate-700 flex items-center justify-between">
                        <p className="text-sm text-slate-400">
                            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                            {pagination.total} entries
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                disabled={pagination.page === 1}
                                className="p-2 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-5 h-5 text-slate-400" />
                            </button>
                            <span className="text-white">
                                Page {pagination.page} of {pagination.pages}
                            </span>
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                disabled={pagination.page === pagination.pages}
                                className="p-2 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditLog;
