import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, KeyRound, AlertCircle, Loader2 } from 'lucide-react';

const MFAVerify = () => {
    const [token, setToken] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { verifyMFA } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await verifyMFA(token);
            if (result.success) {
                navigate('/app/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid MFA code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Handle input to allow only numbers
    const handleTokenChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        setToken(value);
    };

    return (
        <div className="min-h-screen bg-cyber-dark grid-bg flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo and Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-cyan to-neon-green mb-4 animate-glow">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold gradient-text">Two-Factor Authentication</h1>
                    <p className="text-slate-400 mt-2">Enter the code from your authenticator app</p>
                </div>

                {/* MFA Card */}
                <div className="glass-card rounded-2xl p-8">
                    <div className="flex items-center gap-3 mb-6 p-4 bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg">
                        <KeyRound className="w-6 h-6 text-neon-cyan" />
                        <div>
                            <p className="text-sm font-medium text-white">Security Verification</p>
                            <p className="text-xs text-slate-400">Open Google Authenticator and enter the 6-digit code</p>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-3 text-center">
                                Authentication Code
                            </label>
                            <input
                                type="text"
                                value={token}
                                onChange={handleTokenChange}
                                className="w-full px-4 py-4 bg-cyber-medium border border-slate-600 rounded-lg text-white text-center text-3xl font-mono tracking-[0.5em] placeholder-slate-600 focus:border-neon-cyan transition-colors"
                                placeholder="000000"
                                maxLength={6}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || token.length !== 6}
                            className="w-full py-3 bg-gradient-to-r from-neon-cyan to-neon-green text-white font-semibold rounded-lg btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                'Verify & Sign In'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-slate-700">
                        <p className="text-xs text-slate-500 text-center">
                            Codes refresh every 30 seconds. Make sure your device time is synced.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MFAVerify;
