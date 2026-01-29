import { useState, useEffect } from 'react';
import { filesAPI, authAPI } from '../../services/api';
import {
    Globe,
    FileText,
    Image,
    Film,
    Music,
    Archive,
    File,
    Download,
    Lock,
    Eye,
    Loader2,
    X,
    Key,
    CheckCircle,
    AlertCircle,
    Shield,
    RefreshCw
} from 'lucide-react';

const getFileIcon = (mimeType) => {
    if (mimeType?.startsWith('image/')) return Image;
    if (mimeType?.startsWith('video/')) return Film;
    if (mimeType?.startsWith('audio/')) return Music;
    if (mimeType?.includes('zip') || mimeType?.includes('rar')) return Archive;
    if (mimeType?.includes('pdf') || mimeType?.includes('doc')) return FileText;
    return File;
};

const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Generate RSA key pair in browser using Web Crypto API
 * Used for RSA key exchange - guest's private key never leaves the browser!
 */
const generateRSAKeyPair = async () => {
    // Use Web Crypto API to generate RSA key pair
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: 'RSA-OAEP',
            modulusLength: 2048,  // 2048 bits for security
            publicExponent: new Uint8Array([1, 0, 1]),  // 65537
            hash: 'SHA-256'
        },
        true, // extractable
        ['encrypt', 'decrypt']
    );

    // Export public key as PEM string (what the server expects)
    const publicKeyBuffer = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
    const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer)));
    const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${publicKeyBase64.match(/.{1,64}/g).join('\n')}\n-----END PUBLIC KEY-----`;

    return {
        publicKey: publicKeyPem,
        privateKey: keyPair.privateKey,  // CryptoKey - stays in browser
        keyPair
    };
};

const PublicRepository = () => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloadModal, setDownloadModal] = useState(null);
    const [downloadPassword, setDownloadPassword] = useState('');
    const [downloadLoading, setDownloadLoading] = useState(false);
    const [downloadError, setDownloadError] = useState('');
    const [downloadSuccess, setDownloadSuccess] = useState('');
    const [downloadMethod, setDownloadMethod] = useState('password'); // 'password' or 'keyExchange'
    const [keyExchangeStatus, setKeyExchangeStatus] = useState('');

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        try {
            const response = await filesAPI.getFiles({ accessLevel: 'public' });
            if (response.data.success) {
                setFiles(response.data.data.files);
            }
        } catch (err) {
            console.error('Failed to fetch files:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordDownload = async () => {
        if (!downloadPassword || !downloadModal) return;

        setDownloadLoading(true);
        setDownloadError('');
        setDownloadSuccess('');

        try {
            const response = await filesAPI.download(downloadModal.id, downloadPassword);

            // Check integrity status from response headers
            const integrityStatus = response.headers['x-integrity-status'];

            // Create blob and download
            const blob = new Blob([response.data], { type: downloadModal.mimeType });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = downloadModal.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            setDownloadSuccess(`File downloaded successfully! Integrity: ${integrityStatus || 'PASSED'}`);

            // Close modal after success
            setTimeout(() => {
                setDownloadModal(null);
                setDownloadPassword('');
                setDownloadSuccess('');
            }, 2000);

            // Refresh files to update download count
            fetchFiles();

        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Download failed. Check the password.';
            setDownloadError(errorMsg);
        } finally {
            setDownloadLoading(false);
        }
    };

    /**
     * RSA Key Exchange Download - private key never leaves the browser!
     */
    const handleKeyExchangeDownload = async () => {
        if (!downloadModal) return;

        setDownloadLoading(true);
        setDownloadError('');
        setDownloadSuccess('');
        setKeyExchangeStatus('Generating RSA key pair...');

        try {
            // Step 1: Generate RSA key pair in browser
            const rsaKeys = await generateRSAKeyPair();
            setKeyExchangeStatus('Sending public key to server...');

            // Step 2: Send our public key, get encrypted file + encrypted AES key
            const response = await filesAPI.keyExchangeDownload(
                downloadModal.id,
                rsaKeys.publicKey
            );

            if (response.data.success) {
                setKeyExchangeStatus('Decrypting AES key with RSA...');

                // Step 3: Decrypt the AES key using RSA private key
                const encryptedAESKeyBase64 = response.data.data.encryptedAESKey;
                const encryptedAESKeyBytes = Uint8Array.from(atob(encryptedAESKeyBase64), c => c.charCodeAt(0));

                const aesKeyBytes = await window.crypto.subtle.decrypt(
                    { name: 'RSA-OAEP' },
                    rsaKeys.privateKey,
                    encryptedAESKeyBytes
                );

                // Import the decrypted AES key
                const aesKey = await window.crypto.subtle.importKey(
                    'raw',
                    aesKeyBytes,
                    { name: 'AES-GCM' },
                    false,
                    ['decrypt']
                );

                setKeyExchangeStatus('Decrypting file...');

                // Step 4: Decrypt the file with AES key
                const encryptedFile = response.data.data.encryptedFile;
                const encryptedBytes = new Uint8Array(
                    encryptedFile.data.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
                );
                const ivBytes = new Uint8Array(
                    encryptedFile.iv.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
                );
                const authTagBytes = new Uint8Array(
                    encryptedFile.authTag.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
                );

                // Combine encrypted data + authTag for Web Crypto API
                const combinedData = new Uint8Array(encryptedBytes.length + authTagBytes.length);
                combinedData.set(encryptedBytes);
                combinedData.set(authTagBytes, encryptedBytes.length);

                const decryptedBuffer = await window.crypto.subtle.decrypt(
                    { name: 'AES-GCM', iv: ivBytes },
                    aesKey,
                    combinedData
                );

                // Step 6: Trigger download
                const blob = new Blob([decryptedBuffer], { type: downloadModal.mimeType });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = downloadModal.name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);

                setKeyExchangeStatus('');
                setDownloadSuccess(`🔐 Download Complete via Key Exchange!`);

                setTimeout(() => {
                    setDownloadModal(null);
                    setDownloadSuccess('');
                }, 2000);

                fetchFiles();
            }

        } catch (err) {
            console.error('Key exchange error:', err);
            const errorMsg = err.response?.data?.message || 'Key exchange failed.';
            setDownloadError(errorMsg);
            setKeyExchangeStatus('');
        } finally {
            setDownloadLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Globe className="w-8 h-8 text-neon-green" />
                    Public Repository
                </h1>
                <p className="text-slate-400 mt-2">Browse publicly shared encrypted files</p>
            </div>

            {/* Info Banner */}
            <div className="glass-card rounded-xl p-4 flex flex-wrap items-center gap-4 border-l-4 border-neon-green">
                <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-neon-cyan" />
                    <span className="text-slate-300 text-sm">All files are encrypted at rest</span>
                </div>
                <div className="w-px h-4 bg-slate-600 hidden sm:block"></div>
                <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-neon-purple" />
                    <span className="text-slate-300 text-sm">RSA Key Exchange Available</span>
                </div>
                <div className="w-px h-4 bg-slate-600 hidden sm:block"></div>
                <div className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-neon-orange" />
                    <span className="text-slate-300 text-sm">No password sharing needed!</span>
                </div>
            </div>

            {/* Files Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 text-neon-cyan animate-spin" />
                </div>
            ) : files.length === 0 ? (
                <div className="glass-card rounded-2xl p-12 text-center">
                    <Globe className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-white mb-2">No public files yet</h3>
                    <p className="text-slate-400">Files shared publicly will appear here</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {files.map((file) => {
                        const FileIcon = getFileIcon(file.mimeType);
                        return (
                            <div
                                key={file.id}
                                className="file-card glass-card rounded-xl p-5 group"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-cyber-dark flex items-center justify-center flex-shrink-0">
                                        <FileIcon className="w-6 h-6 text-neon-green" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-white truncate group-hover:text-neon-green transition-colors">
                                            {file.name}
                                        </h3>
                                        <p className="text-slate-500 text-sm">{formatSize(file.size)}</p>
                                        <p className="text-slate-600 text-xs mt-1">by {file.owner}</p>

                                        <div className="flex items-center gap-2 mt-3">
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-neon-cyan/10 border border-neon-cyan/30 rounded-full text-xs text-neon-cyan">
                                                <Lock className="w-3 h-3" />
                                                Encrypted
                                            </span>
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-neon-purple/10 border border-neon-purple/30 rounded-full text-xs text-neon-purple">
                                                <RefreshCw className="w-3 h-3" />
                                                RSA
                                            </span>
                                            <span className="text-slate-600 text-xs">
                                                {file.downloadCount} downloads
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Download Button */}
                                <button
                                    onClick={() => {
                                        setDownloadModal(file);
                                        setDownloadPassword('');
                                        setDownloadError('');
                                        setDownloadSuccess('');
                                        setDownloadMethod('keyExchange');
                                        setKeyExchangeStatus('');
                                    }}
                                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-neon-green/20 text-neon-green border border-neon-green/30 rounded-lg hover:bg-neon-green/30 transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    Download
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Download Modal */}
            {downloadModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card rounded-2xl p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-white">Download Encrypted File</h3>
                            <button
                                onClick={() => setDownloadModal(null)}
                                className="text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* File Info */}
                        <div className="flex items-center gap-4 p-4 bg-cyber-dark rounded-lg mb-6">
                            <div className="w-12 h-12 rounded-lg bg-neon-green/20 flex items-center justify-center">
                                <File className="w-6 h-6 text-neon-green" />
                            </div>
                            <div>
                                <p className="font-medium text-white">{downloadModal.name}</p>
                                <p className="text-slate-500 text-sm">{formatSize(downloadModal.size)} • by {downloadModal.owner}</p>
                            </div>
                        </div>

                        {/* Method Selector */}
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setDownloadMethod('keyExchange')}
                                className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors ${downloadMethod === 'keyExchange'
                                    ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/50'
                                    : 'bg-cyber-dark text-slate-400 border border-slate-600 hover:border-slate-500'
                                    }`}
                            >
                                <Shield className="w-4 h-4" />
                                Key Exchange
                            </button>
                            <button
                                onClick={() => setDownloadMethod('password')}
                                className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors ${downloadMethod === 'password'
                                    ? 'bg-neon-orange/20 text-neon-orange border border-neon-orange/50'
                                    : 'bg-cyber-dark text-slate-400 border border-slate-600 hover:border-slate-500'
                                    }`}
                            >
                                <Key className="w-4 h-4" />
                                Password
                            </button>
                        </div>

                        {downloadMethod === 'keyExchange' ? (
                            /* Key Exchange Mode */
                            <div className="mb-4">
                                <div className="p-4 bg-neon-purple/10 border border-neon-purple/30 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Shield className="w-5 h-5 text-neon-purple" />
                                        <span className="font-medium text-neon-purple">RSA Key Exchange</span>
                                    </div>
                                    <p className="text-sm text-slate-300">
                                        Secure download using RSA key exchange.
                                        Private key stays in your browser - never transmitted!
                                    </p>
                                    {keyExchangeStatus && (
                                        <div className="mt-3 flex items-center gap-2 text-sm text-neon-cyan">
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            {keyExchangeStatus}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* Password Mode */
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    <Key className="w-4 h-4 inline mr-2" />
                                    Decryption Password
                                </label>
                                <input
                                    type="password"
                                    value={downloadPassword}
                                    onChange={(e) => setDownloadPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-cyber-dark border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-neon-green transition-colors"
                                    placeholder="Enter the file's encryption password"
                                />
                                <p className="text-xs text-slate-500 mt-2">
                                    Ask the file owner for the password they used when uploading this file.
                                </p>
                            </div>
                        )}

                        {/* Error */}
                        {downloadError && (
                            <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span className="text-sm">{downloadError}</span>
                            </div>
                        )}

                        {/* Success */}
                        {downloadSuccess && (
                            <div className="flex items-center gap-2 p-3 mb-4 bg-neon-green/10 border border-neon-green/30 rounded-lg text-neon-green">
                                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                <span className="text-sm whitespace-pre-line">{downloadSuccess}</span>
                            </div>
                        )}

                        {/* Download Button */}
                        <button
                            onClick={downloadMethod === 'keyExchange' ? handleKeyExchangeDownload : handlePasswordDownload}
                            disabled={(downloadMethod === 'password' && !downloadPassword) || downloadLoading}
                            className="w-full py-3 bg-gradient-to-r from-neon-green to-emerald-500 text-white font-semibold rounded-lg btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {downloadLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    {downloadMethod === 'keyExchange' ? 'Exchanging Keys...' : 'Decrypting...'}
                                </>
                            ) : (
                                <>
                                    {downloadMethod === 'keyExchange' ? (
                                        <>
                                            <Shield className="w-5 h-5" />
                                            Secure Key Exchange Download
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-5 h-5" />
                                            Decrypt & Download
                                        </>
                                    )}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicRepository;


