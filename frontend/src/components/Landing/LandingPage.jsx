import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    Shield,
    Lock,
    Key,
    FileCheck,
    QrCode,
    Users,
    ArrowRight,
    Sparkles,
    CheckCircle,
    Zap,
    Eye,
    EyeOff,
    Server,
    Fingerprint,
    Code,
    Database,
    Globe,
    Cloud,
    Award,
    ShieldCheck,
    FileText,
    Hash
} from 'lucide-react';

// Animated floating particles with multiple colors
const FloatingParticles = () => {
    const colors = ['neon-cyan', 'neon-green', 'neon-purple', 'neon-orange'];
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(30)].map((_, i) => (
                <div
                    key={i}
                    className={`absolute rounded-full animate-float opacity-40`}
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        width: `${2 + Math.random() * 4}px`,
                        height: `${2 + Math.random() * 4}px`,
                        background: i % 4 === 0 ? '#06b6d4' : i % 4 === 1 ? '#22c55e' : i % 4 === 2 ? '#a855f7' : '#f97316',
                        animationDelay: `${Math.random() * 5}s`,
                        animationDuration: `${3 + Math.random() * 4}s`
                    }}
                />
            ))}
        </div>
    );
};

// Animated matrix rain effect
const MatrixRain = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
            {[...Array(15)].map((_, i) => (
                <div
                    key={i}
                    className="absolute text-neon-green font-mono text-xs animate-matrix-rain"
                    style={{
                        left: `${i * 7}%`,
                        animationDelay: `${Math.random() * 3}s`,
                        animationDuration: `${3 + Math.random() * 2}s`
                    }}
                >
                    {[...Array(20)].map((_, j) => (
                        <div key={j} className="opacity-50">
                            {String.fromCharCode(33 + Math.floor(Math.random() * 94))}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

// Animated security shield with pulse effect
const AnimatedShield = () => {
    return (
        <div className="relative w-40 h-40 mx-auto mb-8">
            {/* Outer glow rings */}
            <div className="absolute inset-0 rounded-full bg-neon-cyan/20 animate-ping-slow" />
            <div className="absolute inset-2 rounded-full bg-neon-green/10 animate-ping-slower" />
            <div className="absolute inset-4 rounded-full bg-neon-purple/10 animate-ping" style={{ animationDuration: '3s' }} />

            {/* Main shield */}
            <div className="absolute inset-6 rounded-2xl bg-gradient-to-br from-neon-cyan via-neon-green to-neon-purple flex items-center justify-center animate-glow shadow-2xl shadow-neon-cyan/30">
                <Shield className="w-14 h-14 text-white drop-shadow-lg" />
            </div>

            {/* Orbiting elements */}
            <div className="absolute inset-0 animate-spin-slow">
                <Lock className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-6 h-6 text-neon-cyan drop-shadow-lg" />
            </div>
            <div className="absolute inset-0 animate-spin-slower">
                <Key className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 w-6 h-6 text-neon-green drop-shadow-lg" />
            </div>
            <div className="absolute inset-0 animate-spin-slow" style={{ animationDirection: 'reverse' }}>
                <FileCheck className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 w-5 h-5 text-neon-purple" />
            </div>
        </div>
    );
};

// Typing animation component
const TypeWriter = ({ text, delay = 100 }) => {
    const [displayText, setDisplayText] = useState('');
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (index < text.length) {
            const timer = setTimeout(() => {
                setDisplayText(prev => prev + text[index]);
                setIndex(index + 1);
            }, delay);
            return () => clearTimeout(timer);
        }
    }, [index, text, delay]);

    return (
        <span className="text-neon-cyan">
            {displayText}
            <span className="animate-blink">|</span>
        </span>
    );
};

// Feature card with hover animation
const FeatureCard = ({ icon: Icon, title, description, color, delay }) => {
    return (
        <div
            className="feature-card glass-card rounded-2xl p-6 transform hover:scale-105 hover:-translate-y-2 transition-all duration-500 group cursor-pointer border border-transparent hover:border-neon-cyan/30"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br from-${color}/30 to-${color}/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                <Icon className={`w-7 h-7 text-${color}`} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-neon-cyan transition-colors">
                {title}
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
        </div>
    );
};

// Animated encryption visualization
const EncryptionVisual = () => {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setStep((prev) => (prev + 1) % 4);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const steps = [
        { label: 'Original File', icon: FileCheck, color: 'text-white' },
        { label: 'Key Derivation', icon: Key, color: 'text-neon-orange' },
        { label: 'AES-256-GCM', icon: Lock, color: 'text-neon-cyan' },
        { label: 'Encrypted & Signed', icon: Shield, color: 'text-neon-green' }
    ];

    return (
        <div className="flex items-center justify-center gap-4 py-8 overflow-hidden flex-wrap">
            {steps.map((s, i) => (
                <div key={i} className="flex items-center">
                    <div className={`flex flex-col items-center transition-all duration-500 ${step >= i ? 'opacity-100 scale-100' : 'opacity-30 scale-90'}`}>
                        <div className={`w-20 h-20 rounded-xl ${step >= i ? 'bg-cyber-medium' : 'bg-cyber-dark'} flex items-center justify-center mb-2 ${step === i ? 'ring-2 ring-neon-cyan animate-pulse shadow-lg shadow-neon-cyan/30' : ''}`}>
                            <s.icon className={`w-10 h-10 ${step >= i ? s.color : 'text-slate-600'}`} />
                        </div>
                        <span className={`text-xs ${step >= i ? 'text-slate-300' : 'text-slate-600'}`}>{s.label}</span>
                    </div>
                    {i < steps.length - 1 && (
                        <ArrowRight className={`w-6 h-6 mx-2 transition-all duration-500 ${step > i ? 'text-neon-cyan translate-x-1' : 'text-slate-700'}`} />
                    )}
                </div>
            ))}
        </div>
    );
};

// Stats counter animation
const StatCounter = ({ value, label, suffix = '', icon: Icon }) => {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.1 }
        );

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        const duration = 2000;
        const steps = 60;
        const increment = value / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
                setCount(value);
                clearInterval(timer);
            } else {
                setCount(Math.floor(current));
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [value, isVisible]);

    return (
        <div ref={ref} className="text-center group">
            {Icon && (
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-cyber-medium flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-neon-cyan" />
                </div>
            )}
            <p className="text-4xl font-bold gradient-text">{count}{suffix}</p>
            <p className="text-slate-400 text-sm mt-1">{label}</p>
        </div>
    );
};

// Testimonial card
const TestimonialCard = ({ quote, author, role, delay }) => {
    return (
        <div
            className="glass-card rounded-2xl p-6 transform hover:scale-105 transition-all duration-300"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex items-start gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                    <Sparkles key={i} className="w-4 h-4 text-neon-orange" />
                ))}
            </div>
            <p className="text-slate-300 mb-4 italic">"{quote}"</p>
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-cyan to-neon-green flex items-center justify-center">
                    <span className="text-white font-bold">{author[0]}</span>
                </div>
                <div>
                    <p className="text-white font-medium">{author}</p>
                    <p className="text-slate-500 text-sm">{role}</p>
                </div>
            </div>
        </div>
    );
};

// Security comparison table
const SecurityComparison = () => {
    const features = [
        { name: 'End-to-End Encryption', us: true, others: false },
        { name: 'Zero-Knowledge Architecture', us: true, others: false },
        { name: 'Multi-Factor Authentication', us: true, others: true },
        { name: 'File Integrity Verification', us: true, others: false },
        { name: 'QR Code Sharing', us: true, others: false },
        { name: 'Audit Logging', us: true, others: true },
    ];

    return (
        <div className="glass-card rounded-2xl p-6 overflow-hidden">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-4 text-slate-400">Feature</th>
                        <th className="text-center py-3 px-4 text-neon-cyan">FileVault</th>
                        <th className="text-center py-3 px-4 text-slate-500">Others</th>
                    </tr>
                </thead>
                <tbody>
                    {features.map((feature, i) => (
                        <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 px-4 text-slate-300">{feature.name}</td>
                            <td className="text-center py-3 px-4">
                                <CheckCircle className="w-5 h-5 text-neon-green inline" />
                            </td>
                            <td className="text-center py-3 px-4">
                                {feature.others ? (
                                    <CheckCircle className="w-5 h-5 text-slate-500 inline" />
                                ) : (
                                    <span className="text-slate-600">—</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// Tech stack badge
const TechBadge = ({ icon: Icon, name, description }) => {
    return (
        <div className="flex items-center gap-3 glass-card rounded-xl p-4 hover:bg-slate-800/50 transition-colors group">
            <div className="w-12 h-12 rounded-lg bg-cyber-medium flex items-center justify-center group-hover:bg-neon-cyan/20 transition-colors">
                <Icon className="w-6 h-6 text-neon-cyan" />
            </div>
            <div>
                <p className="text-white font-medium">{name}</p>
                <p className="text-slate-500 text-xs">{description}</p>
            </div>
        </div>
    );
};

const LandingPage = () => {
    const features = [
        {
            icon: Lock,
            title: 'AES-256-GCM Encryption',
            description: 'Military-grade encryption used by governments worldwide. Your files are encrypted before they ever leave your device.',
            color: 'neon-cyan'
        },
        {
            icon: Fingerprint,
            title: 'Multi-Factor Authentication',
            description: 'TOTP-based 2FA with Google Authenticator. Even if your password is compromised, your account stays secure.',
            color: 'neon-green'
        },
        {
            icon: Key,
            title: 'PBKDF2 Key Derivation',
            description: '100,000 iterations of key stretching. Makes brute-force attacks computationally infeasible.',
            color: 'neon-orange'
        },
        {
            icon: FileCheck,
            title: 'SHA-256 Integrity',
            description: 'Digital signatures verify every file. Know instantly if a single byte has been tampered with.',
            color: 'neon-purple'
        },
        {
            icon: QrCode,
            title: 'QR Code Sharing',
            description: 'Share files securely via QR codes. Time-limited links ensure your data stays in your control.',
            color: 'neon-cyan'
        },
        {
            icon: Server,
            title: 'Zero-Knowledge Storage',
            description: 'We never see your encryption keys. Only you can decrypt your files - not even administrators.',
            color: 'neon-green'
        }
    ];

    return (
        <div className="min-h-screen bg-cyber-dark overflow-hidden">
            {/* Animated Background */}
            <div className="fixed inset-0 grid-bg opacity-50" />
            <FloatingParticles />
            <MatrixRain />

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-slate-700/50">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Shield className="w-8 h-8 text-neon-cyan" />
                        <span className="font-bold text-xl text-white">FileVault</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/login" className="text-slate-300 hover:text-white transition-colors">
                            Sign In
                        </Link>
                        <Link
                            to="/register"
                            className="px-4 py-2 bg-gradient-to-r from-neon-cyan to-neon-green text-white font-semibold rounded-lg btn-primary text-sm"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center px-4 pt-24 pb-20">
                <div className="max-w-6xl mx-auto text-center">
                    {/* Animated Shield */}
                    <AnimatedShield />

                    {/* Main Title */}
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in-up">
                        <span className="text-white">File</span>
                        <span className="gradient-text">Vault</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto mb-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                        Enterprise-grade file encryption for the security-conscious.
                    </p>

                    <p className="text-lg text-slate-500 max-w-xl mx-auto mb-8 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                        <TypeWriter text="Your files, your keys, your control." delay={80} />
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                        <Link
                            to="/register"
                            className="group px-8 py-4 bg-gradient-to-r from-neon-cyan to-neon-green text-white font-semibold rounded-xl btn-primary flex items-center justify-center gap-2 shadow-lg shadow-neon-cyan/30 hover:shadow-neon-cyan/50 transition-shadow"
                        >
                            Get Started Free
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            to="/login"
                            className="px-8 py-4 glass-card text-white font-semibold rounded-xl hover:bg-slate-700/50 transition-colors flex items-center justify-center gap-2 border border-slate-600 hover:border-neon-cyan/50"
                        >
                            <Lock className="w-5 h-5" />
                            Sign In
                        </Link>
                    </div>

                    {/* Security Badges */}
                    <div className="flex flex-wrap justify-center gap-3 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                        {[
                            { icon: ShieldCheck, label: 'AES-256 Encrypted' },
                            { icon: Fingerprint, label: 'MFA Protected' },
                            { icon: EyeOff, label: 'Zero-Knowledge' },
                            { icon: Award, label: 'NIST Compliant' }
                        ].map((badge, i) => (
                            <span key={i} className="inline-flex items-center gap-2 px-4 py-2 bg-cyber-medium/50 rounded-full text-sm text-slate-300 border border-slate-700 hover:border-neon-cyan/30 transition-colors cursor-default">
                                <badge.icon className="w-4 h-4 text-neon-green" />
                                {badge.label}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                    <div className="w-6 h-10 rounded-full border-2 border-slate-600 flex justify-center pt-2">
                        <div className="w-1 h-3 bg-neon-cyan rounded-full animate-scroll-dot" />
                    </div>
                </div>
            </section>

            {/* Encryption Flow Visual */}
            <section className="relative py-20 px-4">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-4">
                        How We <span className="gradient-text">Protect</span> Your Files
                    </h2>
                    <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
                        Watch as your files are transformed into unbreakable ciphertext using industry-leading encryption standards.
                    </p>
                    <EncryptionVisual />
                </div>
            </section>

            {/* Features Grid */}
            <section className="relative py-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-4">
                        Security <span className="gradient-text">Features</span>
                    </h2>
                    <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
                        Built with the same cryptographic standards used by intelligence agencies and financial institutions.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, i) => (
                            <FeatureCard key={i} {...feature} delay={i * 100} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="relative py-20 px-4 bg-cyber-medium/30">
                <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <StatCounter value={256} label="Bit Encryption" suffix="-bit" icon={Lock} />
                        <StatCounter value={100000} label="PBKDF2 Iterations" suffix="+" icon={Key} />
                        <StatCounter value={12} label="Bcrypt Rounds" suffix="x" icon={Hash} />
                        <StatCounter value={99.9} label="Uptime" suffix="%" icon={Zap} />
                    </div>
                </div>
            </section>

            {/* Security Comparison */}
            <section className="relative py-20 px-4">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-4">
                        Why Choose <span className="gradient-text">FileVault</span>?
                    </h2>
                    <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
                        See how we compare to traditional file sharing solutions.
                    </p>
                    <SecurityComparison />
                </div>
            </section>

            {/* Tech Stack */}
            <section className="relative py-20 px-4 bg-cyber-medium/20">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-4">
                        Built With <span className="gradient-text">Modern Tech</span>
                    </h2>
                    <p className="text-slate-400 text-center mb-12">
                        Secure, scalable, and performant architecture
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TechBadge icon={Code} name="React + Vite" description="Modern frontend framework" />
                        <TechBadge icon={Server} name="Node.js + Express" description="Robust backend API" />
                        <TechBadge icon={Database} name="MongoDB" description="Flexible document database" />
                        <TechBadge icon={Lock} name="AES-256-GCM" description="Military-grade encryption" />
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="relative py-20 px-4">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12">
                        Get Started in <span className="gradient-text">3 Steps</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { step: '01', title: 'Create Account', desc: 'Register with email and set up MFA with Google Authenticator', icon: Users },
                            { step: '02', title: 'Upload Files', desc: 'Your files are encrypted with AES-256-GCM before storage', icon: Lock },
                            { step: '03', title: 'Share Securely', desc: 'Generate QR codes or links with automatic expiration', icon: QrCode }
                        ].map((item, i) => (
                            <div key={i} className="relative glass-card rounded-2xl p-6 text-center group hover:border-neon-cyan/50 transition-colors">
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-neon-cyan to-neon-green rounded-full text-xs font-bold text-white">
                                    {item.step}
                                </div>
                                <div className="w-16 h-16 rounded-full bg-cyber-dark flex items-center justify-center mx-auto mt-4 mb-4 group-hover:bg-neon-cyan/20 transition-colors">
                                    <item.icon className="w-8 h-8 text-neon-cyan" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                                <p className="text-slate-400 text-sm">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="relative py-20 px-4">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="glass-card rounded-3xl p-12 border border-slate-700 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 to-neon-green/5" />
                        <div className="relative">
                            <Sparkles className="w-12 h-12 text-neon-cyan mx-auto mb-6" />
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                Ready to Secure Your Files?
                            </h2>
                            <p className="text-slate-400 mb-8">
                                Join thousands of security-conscious users who trust FileVault with their most sensitive data.
                            </p>
                            <Link
                                to="/register"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-neon-cyan to-neon-green text-white font-semibold rounded-xl btn-primary shadow-lg shadow-neon-cyan/30 hover:shadow-neon-cyan/50 transition-shadow"
                            >
                                Create Free Account
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative py-12 px-4 border-t border-slate-800">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-2">
                            <Shield className="w-8 h-8 text-neon-cyan" />
                            <span className="font-bold text-xl text-white">FileVault</span>
                        </div>
                        <p className="text-slate-500 text-sm text-center">
                            Built with ❤️ for Fundamentals of Cybersecurity Lab
                        </p>
                        <div className="flex items-center gap-6 text-slate-500 text-sm">
                            <span className="hover:text-neon-cyan transition-colors cursor-pointer">AES-256-GCM</span>
                            <span>•</span>
                            <span className="hover:text-neon-cyan transition-colors cursor-pointer">NIST Compliant</span>
                            <span>•</span>
                            <span className="hover:text-neon-cyan transition-colors cursor-pointer">Zero-Knowledge</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
