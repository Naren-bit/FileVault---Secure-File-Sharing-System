import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { filesAPI } from '../../services/api';
import {
    FileText,
    Lock,
    Download,
    Clock,
    User,
    AlertCircle,
    Loader2,
    Shield,
    CheckCircle,
    ArrowLeft
} from 'lucide-react';

// Format file size
const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const SharePage = () => {
    const { token } = useParams();
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [password, setPassword] = useState('');
    const [downloading, setDownloading] = useState(false);
    const [downloadSuccess, setDownloadSuccess] = useState(false);

    useEffect(() => {
        fetchSharedFile();
    }, [token]);

    const fetchSharedFile = async () => {
        try {
            const response = await filesAPI.getSharedFile(token);
            if (response.data.success) {
                setFile(response.data.data.file);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Share link expired or invalid');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (e) => {
        e.preventDefault();
        if (!password) return;

        setDownloading(true);
        setError('');

        try {
            const response = await filesAPI.download(file.id, password);

            // Create download link
            const blob = new Blob([response.data], { type: file.mimeType });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = file.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            setDownloadSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Download failed. Check your password.');
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-cyber-dark grid-bg flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-neon-cyan animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-cyber-dark grid-bg flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-cyan to-neon-green mb-4 animate-glow">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold gradient-text">FileVault</h1>
                    <p className="text-slate-400 mt-2">Secure File Sharing</p>
                </div>

                <div className="glass-card rounded-2xl p-6">
                    {error && !file ? (
                        /* Error State */
                        <div className="text-center py-8">
                            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                            <h2 className="text-xl font-bold text-white mb-2">Link Expired or Invalid</h2>
                            <p className="text-slate-400 mb-6">{error}</p>
                            <Link
                                to="/"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-green text-white font-semibold rounded-lg btn-primary"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Go to Home
                            </Link>
                        </div>
                    ) : downloadSuccess ? (
                        /* Success State */
                        <div className="text-center py-8">
                            <CheckCircle className="w-16 h-16 text-neon-green mx-auto mb-4" />
                            <h2 className="text-xl font-bold text-white mb-2">Download Complete!</h2>
                            <p className="text-slate-400 mb-6">File has been decrypted and downloaded successfully.</p>
                            <Link
                                to="/"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-green text-white font-semibold rounded-lg btn-primary"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Go to Home
                            </Link>
                        </div>
                    ) : (
                        /* File Info & Download Form */
                        <>
                            {/* File Info */}
                            <div className="flex items-center gap-4 mb-6 p-4 bg-cyber-dark rounded-xl">
                                <div className="w-14 h-14 rounded-xl bg-neon-cyan/20 flex items-center justify-center">
                                    <FileText className="w-7 h-7 text-neon-cyan" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-white truncate">{file.name}</h3>
                                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                                        <span>{formatSize(file.size)}</span>
                                        <span className="text-slate-600">•</span>
                                        <span className="flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            {file.owner}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Expiry Warning */}
                            <div className="flex items-center gap-2 mb-6 p-3 bg-neon-orange/10 border border-neon-orange/30 rounded-lg">
                                <Clock className="w-5 h-5 text-neon-orange flex-shrink-0" />
                                <div className="text-sm">
                                    <span className="text-slate-300">Expires: </span>
                                    <span className="text-white">{new Date(file.expiresAt).toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="flex items-center gap-2 mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <span className="text-sm">{error}</span>
                                </div>
                            )}

                            {/* Download Form */}
                            <form onSubmit={handleDownload} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Decryption Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3 bg-cyber-dark border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-neon-cyan transition-colors"
                                            placeholder="Enter file password"
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">
                                        Ask the file owner for the decryption password
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={downloading || !password}
                                    className="w-full py-3 bg-gradient-to-r from-neon-cyan to-neon-green text-white font-semibold rounded-lg btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {downloading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Decrypting...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-5 h-5" />
                                            Decrypt & Download
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Security Info */}
                            <div className="mt-6 pt-6 border-t border-slate-700">
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Lock className="w-4 h-4" />
                                    <span>End-to-end encrypted with AES-256-GCM</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SharePage;
