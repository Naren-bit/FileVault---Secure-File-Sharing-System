/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Cybersec Ops Center Theme
                'cyber': {
                    'dark': '#0f172a',      // slate-900
                    'darker': '#020617',    // slate-950
                    'medium': '#1e293b',    // slate-800
                    'light': '#334155',     // slate-700
                },
                'neon': {
                    'cyan': '#06b6d4',      // cyan-500
                    'cyan-bright': '#22d3ee', // cyan-400
                    'green': '#22c55e',     // green-500
                    'green-bright': '#4ade80', // green-400
                    'red': '#ef4444',       // red-500
                    'orange': '#f97316',    // orange-500
                    'purple': '#a855f7',    // purple-500
                }
            },
            boxShadow: {
                'neon-cyan': '0 0 20px rgba(6, 182, 212, 0.5)',
                'neon-green': '0 0 20px rgba(34, 197, 94, 0.5)',
                'neon-red': '0 0 20px rgba(239, 68, 68, 0.5)',
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
            },
            keyframes: {
                glow: {
                    '0%': { boxShadow: '0 0 5px rgba(6, 182, 212, 0.5)' },
                    '100%': { boxShadow: '0 0 20px rgba(6, 182, 212, 0.8)' },
                }
            },
            backgroundImage: {
                'grid-pattern': "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(51 65 85 / 0.3)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e\")",
            }
        },
    },
    plugins: [],
}
