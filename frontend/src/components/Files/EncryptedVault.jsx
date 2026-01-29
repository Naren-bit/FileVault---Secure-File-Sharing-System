import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { filesAPI } from '../../services/api';
import {
    FolderLock,
    Upload,
    Download,
    Share2,
    Trash2,
    Lock,
    CheckCircle,
    XCircle,
    FileText,
    Image,
    Film,
    Music,
    Archive,
    File,
    X,
    Loader2,
    QrCode,
    Eye
} from 'lucide-react';

// Get icon based on mime type
const getFileIcon = (mimeType) => {
    if (mimeType?.startsWith('image/')) return Image;
    if (mimeType?.startsWith('video/')) return Film;
    if (mimeType?.startsWith('audio/')) return Music;
    if (mimeType?.includes('zip') || mimeType?.includes('rar')) return Archive;
    if (mimeType?.includes('pdf') || mimeType?.includes('doc')) return FileText;
    return File;
};

// Format file size
const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// Upload Modal Component
const UploadModal = ({ isOpen, onClose, onUpload }) => {
    const [file, setFile] = useState(null);
    const [password, setPassword] = useState('');
    const [accessLevel, setAccessLevel] = useState('vault');
    const [description, setDescription] = useState('');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !password) return;

        setUploading(true);
        setError('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('accessLevel', accessLevel);
        formData.append('description', description);
        formData.append('password', password);

        try {
            await onUpload(formData, password);
            onClose();
            setFile(null);
            setPassword('');
            setDescription('');
        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="glass-card rounded-2xl p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Upload & Encrypt File</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* File Input */}
                    <div
                        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${file ? 'border-neon-cyan bg-neon-cyan/5' : 'border-slate-600 hover:border-slate-500'
                            }`}
                    >
                        <input
                            type="file"
                            onChange={(e) => setFile(e.target.files[0])}
                            className="hidden"
                            id="file-input"
                        />
                        <label htmlFor="file-input" className="cursor-pointer">
                            {file ? (
                                <div className="flex items-center justify-center gap-3">
                                    <FileText className="w-8 h-8 text-neon-cyan" />
                                    <div className="text-left">
                                        <p className="text-white font-medium">{file.name}</p>
                                        <p className="text-slate-400 text-sm">{formatSize(file.size)}</p>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <Upload className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                                    <p className="text-slate-400">Click to select a file</p>
                                    <p className="text-slate-500 text-sm mt-1">Max 50MB</p>
                                </div>
                            )}
                        </label>
                    </div>

                    {/* Encryption Password */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Encryption Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-cyber-dark border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-neon-cyan"
                                placeholder="Enter encryption password"
                                required
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            This password will be used to derive your encryption key
                        </p>
                    </div>

                    {/* Access Level */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Access Level
                        </label>
                        <select
                            value={accessLevel}
                            onChange={(e) => setAccessLevel(e.target.value)}
                            className="w-full px-4 py-3 bg-cyber-dark border border-slate-600 rounded-lg text-white focus:border-neon-cyan"
                        >
                            <option value="vault">Private Vault</option>
                            <option value="public">Public Repository</option>
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Description (Optional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-3 bg-cyber-dark border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-neon-cyan resize-none"
                            rows={2}
                            placeholder="Brief description of the file"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Security Info */}
                    <div className="flex items-center gap-2 p-3 bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg">
                        <Lock className="w-4 h-4 text-neon-cyan" />
                        <span className="text-xs text-slate-300">
                            File will be encrypted with AES-256-GCM before storage
                        </span>
                    </div>

                    <button
                        type="submit"
                        disabled={!file || !password || uploading}
                        className="w-full py-3 bg-gradient-to-r from-neon-cyan to-neon-green text-white font-semibold rounded-lg btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Encrypting & Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="w-5 h-5" />
                                Encrypt & Upload
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

// QR Share Modal
const QRShareModal = ({ isOpen, onClose, shareData }) => {
    if (!isOpen || !shareData) return null;

    // Download QR code as image
    const handleDownloadQR = () => {
        const link = document.createElement('a');
        link.href = shareData.qrCode;
        link.download = `filevault-share-qr-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Copy URL to clipboard
    const handleCopyURL = async () => {
        try {
            await navigator.clipboard.writeText(shareData.shareUrl);
            alert('Share URL copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="glass-card rounded-2xl p-6 w-full max-w-sm">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Share via QR Code</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="qr-container flex flex-col items-center mb-6">
                    <img
                        src={shareData.qrCode}
                        alt="Share QR Code"
                        className="w-56 h-56 rounded-lg"
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={handleDownloadQR}
                        className="flex-1 py-2 px-4 bg-gradient-to-r from-neon-cyan to-neon-green text-white font-medium rounded-lg btn-primary flex items-center justify-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Download QR
                    </button>
                    <button
                        onClick={handleCopyURL}
                        className="flex-1 py-2 px-4 bg-cyber-dark border border-slate-600 text-white font-medium rounded-lg hover:border-neon-cyan transition-colors flex items-center justify-center gap-2"
                    >
                        <Share2 className="w-4 h-4" />
                        Copy URL
                    </button>
                </div>

                <div className="bg-cyber-dark rounded-lg p-4 mb-4">
                    <p className="text-xs text-slate-400 mb-2">Share URL:</p>
                    <p className="font-mono text-sm text-neon-cyan break-all">{shareData.shareUrl}</p>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span>Expires:</span>
                    <span className="text-white">{new Date(shareData.expiresAt).toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
};

// Password Modal for Download
const PasswordModal = ({ isOpen, onClose, onSubmit, loading }) => {
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(password);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="glass-card rounded-2xl p-6 w-full max-w-sm">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Enter Decryption Password</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-cyber-dark border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-neon-cyan"
                            placeholder="Enter decryption password"
                            required
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !password}
                        className="w-full py-3 bg-gradient-to-r from-neon-cyan to-neon-green text-white font-semibold rounded-lg btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
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
            </div>
        </div>
    );
};

// File Card Component
const FileCard = ({ file, onDownload, onShare, onDelete }) => {
    const FileIcon = getFileIcon(file.mimeType);

    return (
        <div className="file-card glass-card rounded-xl p-4 group">
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyber-dark flex items-center justify-center flex-shrink-0">
                    <FileIcon className="w-6 h-6 text-neon-cyan" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate group-hover:text-neon-cyan transition-colors">
                        {file.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-slate-500 text-sm">{formatSize(file.size)}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-500 text-sm">
                            {new Date(file.createdAt).toLocaleDateString()}
                        </span>
                    </div>

                    {/* Security Badges */}
                    <div className="flex flex-wrap gap-2 mt-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-neon-cyan/10 border border-neon-cyan/30 rounded-full text-xs text-neon-cyan">
                            <Lock className="w-3 h-3" />
                            AES-256-GCM
                        </span>
                        {file.accessLevel === 'vault' && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-neon-purple/10 border border-neon-purple/30 rounded-full text-xs text-neon-purple">
                                <FolderLock className="w-3 h-3" />
                                Private
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onDownload(file)}
                        className="p-2 rounded-lg hover:bg-neon-cyan/20 text-slate-400 hover:text-neon-cyan transition-colors"
                        title="Download"
                    >
                        <Download className="w-5 h-5" />
                    </button>
                    {file.isOwner && (
                        <>
                            <button
                                onClick={() => onShare(file)}
                                className="p-2 rounded-lg hover:bg-neon-green/20 text-slate-400 hover:text-neon-green transition-colors"
                                title="Share via QR"
                            >
                                <QrCode className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => onDelete(file)}
                                className="p-2 rounded-lg hover:bg-neon-red/20 text-slate-400 hover:text-neon-red transition-colors"
                                title="Delete"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// Main Encrypted Vault Component
const EncryptedVault = () => {
    const { user } = useAuth();
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [shareData, setShareData] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const [integrityStatus, setIntegrityStatus] = useState(null);

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        try {
            const response = await filesAPI.getFiles({ accessLevel: 'vault' });
            if (response.data.success) {
                setFiles(response.data.data.files);
            }
        } catch (err) {
            console.error('Failed to fetch files:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (formData, password) => {
        const response = await filesAPI.upload(formData, password);
        if (response.data.success) {
            fetchFiles();
        }
    };

    const handleDownload = (file) => {
        setSelectedFile(file);
        setPasswordModalOpen(true);
    };

    const handleDownloadSubmit = async (password) => {
        if (!selectedFile) return;

        setDownloading(true);

        try {
            const response = await filesAPI.download(selectedFile.id, password);

            // Check integrity status from header
            const integrityHeader = response.headers['x-integrity-status'];
            setIntegrityStatus({
                passed: integrityHeader === 'PASSED',
                filename: selectedFile.name
            });

            // Create download link
            const blob = new Blob([response.data], { type: selectedFile.mimeType });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = selectedFile.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            setPasswordModalOpen(false);
            setSelectedFile(null);

            // Show integrity status for 5 seconds
            setTimeout(() => setIntegrityStatus(null), 5000);
        } catch (err) {
            alert(err.response?.data?.message || 'Download failed');
        } finally {
            setDownloading(false);
        }
    };

    const handleShare = async (file) => {
        try {
            const response = await filesAPI.share(file.id, 60);
            if (response.data.success) {
                setShareData(response.data.data);
                setQrModalOpen(true);
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to generate share link');
        }
    };

    const handleDelete = async (file) => {
        if (!confirm(`Are you sure you want to delete "${file.name}"?`)) return;

        try {
            const response = await filesAPI.delete(file.id);
            if (response.data.success) {
                fetchFiles();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Delete failed');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <FolderLock className="w-8 h-8 text-neon-cyan" />
                        Encrypted Vault
                    </h1>
                    <p className="text-slate-400 mt-2">Your private encrypted file storage</p>
                </div>
                <button
                    onClick={() => setUploadModalOpen(true)}
                    className="px-5 py-3 bg-gradient-to-r from-neon-cyan to-neon-green text-white font-semibold rounded-lg btn-primary flex items-center gap-2"
                >
                    <Upload className="w-5 h-5" />
                    Upload File
                </button>
            </div>

            {/* Integrity Status Toast */}
            {integrityStatus && (
                <div className={`flex items-center gap-3 p-4 rounded-xl ${integrityStatus.passed
                    ? 'bg-neon-green/10 border border-neon-green/30'
                    : 'bg-neon-red/10 border border-neon-red/30'
                    }`}>
                    {integrityStatus.passed ? (
                        <CheckCircle className="w-6 h-6 text-neon-green" />
                    ) : (
                        <XCircle className="w-6 h-6 text-neon-red" />
                    )}
                    <div>
                        <p className={`font-medium ${integrityStatus.passed ? 'text-neon-green' : 'text-neon-red'}`}>
                            Integrity Check: {integrityStatus.passed ? 'PASSED' : 'FAILED'}
                        </p>
                        <p className="text-slate-400 text-sm">
                            {integrityStatus.passed
                                ? 'File integrity verified - content matches original'
                                : 'Warning: File may have been tampered with'}
                        </p>
                    </div>
                </div>
            )}

            {/* Security Info */}
            <div className="glass-card rounded-xl p-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-neon-cyan" />
                    <span className="text-slate-300 text-sm">AES-256-GCM Encrypted</span>
                </div>
                <div className="w-px h-4 bg-slate-600"></div>
                <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-neon-green" />
                    <span className="text-slate-300 text-sm">SHA-256 Integrity Verified</span>
                </div>
                <div className="w-px h-4 bg-slate-600"></div>
                <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-neon-purple" />
                    <span className="text-slate-300 text-sm">QR Code Sharing</span>
                </div>
            </div>

            {/* Files Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 text-neon-cyan animate-spin" />
                </div>
            ) : files.length === 0 ? (
                <div className="glass-card rounded-2xl p-12 text-center">
                    <FolderLock className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-white mb-2">Your vault is empty</h3>
                    <p className="text-slate-400 mb-6">Upload your first encrypted file to get started</p>
                    <button
                        onClick={() => setUploadModalOpen(true)}
                        className="px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-green text-white font-semibold rounded-lg btn-primary inline-flex items-center gap-2"
                    >
                        <Upload className="w-5 h-5" />
                        Upload File
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {files.map((file) => (
                        <FileCard
                            key={file.id}
                            file={file}
                            onDownload={handleDownload}
                            onShare={handleShare}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}

            {/* Modals */}
            <UploadModal
                isOpen={uploadModalOpen}
                onClose={() => setUploadModalOpen(false)}
                onUpload={handleUpload}
            />
            <PasswordModal
                isOpen={passwordModalOpen}
                onClose={() => {
                    setPasswordModalOpen(false);
                    setSelectedFile(null);
                }}
                onSubmit={handleDownloadSubmit}
                loading={downloading}
            />
            <QRShareModal
                isOpen={qrModalOpen}
                onClose={() => {
                    setQrModalOpen(false);
                    setShareData(null);
                }}
                shareData={shareData}
            />
        </div>
    );
};

export default EncryptedVault;
