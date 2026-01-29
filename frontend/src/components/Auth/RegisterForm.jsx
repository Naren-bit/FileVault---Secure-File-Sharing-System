import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Mail, Lock, User, AlertCircle, Loader2, CheckCircle } from 'lucide-react';

const RegisterForm = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'guest'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [mfaData, setMfaData] = useState(null);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);

        try {
            const result = await register({
                username: formData.username,
                email: formData.email,
                password: formData.password,
                role: formData.role
            });

            if (result.success && result.data.mfa) {
                setMfaData(result.data);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // MFA Setup Screen
    if (mfaData) {
        return (
            <div className="min-h-screen bg-cyber-dark grid-bg flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="glass-card rounded-2xl p-8">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neon-green/20 mb-4">
                                <CheckCircle className="w-8 h-8 text-neon-green" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Account Created!</h2>
                            <p className="text-slate-400 mt-2">Now set up your MFA for enhanced security</p>
                        </div>

                        <div className="qr-container flex flex-col items-center mb-6">
                            <p className="text-sm text-slate-300 mb-3">Scan with Google Authenticator</p>
                            <img
                                src={mfaData.mfa.qrCode}
                                alt="MFA QR Code"
                                className="w-48 h-48 rounded-lg"
                            />
                        </div>

                        <div className="bg-cyber-medium rounded-lg p-4 mb-6">
                            <p className="text-xs text-slate-400 mb-2">Or enter this secret manually:</p>
                            <p className="font-mono text-sm text-neon-cyan break-all">{mfaData.mfa.secret}</p>
                        </div>

                        <button
                            onClick={() => navigate('/login')}
                            className="w-full py-3 bg-gradient-to-r from-neon-cyan to-neon-green text-white font-semibold rounded-lg btn-primary"
                        >
                            Continue to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-cyber-dark grid-bg flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo and Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-cyan to-neon-green mb-4">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold gradient-text">FileVault</h1>
                    <p className="text-slate-400 mt-2">Create your secure account</p>
                </div>

                {/* Register Card */}
                <div className="glass-card rounded-2xl p-8">
                    <h2 className="text-xl font-semibold text-white mb-6">Create Account</h2>

                    {error && (
                        <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Username
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="w-full pl-11 pr-4 py-3 bg-cyber-medium border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-neon-cyan transition-colors"
                                    placeholder="johndoe"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full pl-11 pr-4 py-3 bg-cyber-medium border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-neon-cyan transition-colors"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full pl-11 pr-4 py-3 bg-cyber-medium border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-neon-cyan transition-colors"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full pl-11 pr-4 py-3 bg-cyber-medium border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-neon-cyan transition-colors"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Account Type
                            </label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-cyber-medium border border-slate-600 rounded-lg text-white focus:border-neon-cyan transition-colors"
                            >
                                <option value="guest">Guest (Read-only)</option>
                                <option value="premium">Premium User</option>
                                <option value="admin">Administrator</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-neon-cyan to-neon-green text-white font-semibold rounded-lg btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Creating Account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-slate-400">
                            Already have an account?{' '}
                            <Link to="/login" className="text-neon-cyan hover:text-neon-cyan-bright transition-colors">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterForm;
