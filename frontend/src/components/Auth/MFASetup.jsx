import { Shield } from 'lucide-react';

const MFASetup = () => {
    return (
        <div className="min-h-screen bg-cyber-dark grid-bg flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="glass-card rounded-2xl p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neon-green/20 mb-4">
                        <Shield className="w-8 h-8 text-neon-green" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">MFA Setup</h2>
                    <p className="text-slate-400">
                        MFA is set up during registration. Please log in to continue.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MFASetup;
