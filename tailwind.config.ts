import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: 'class',
    content: [
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                'nova': {
                    '50': '#f9f5ff',
                    '100': '#f4ebff',
                    '200': '#e9d5ff',
                    '300': '#d8a6ff',
                    '400': '#c26aff',
                    '500': '#a838ff',
                    '600': '#8c1dff',
                    '700': '#6e0fb9',
                    '800': '#5c0694',
                    '900': '#3f036b',
                    '950': '#2a0149',
                },
                'slate': {
                    '950': '#0f172a',
                    '900': '#0f172a',
                },
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
            },
            animation: {
                'shimmer': 'shimmer 2s infinite',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'fade-in': 'fadeIn 0.3s ease-in-out',
                'scale-in': 'scaleIn 0.3s ease-out',
                'slide-up': 'slideUp 0.3s ease-out',
            },
            keyframes: {
                shimmer: {
                    '0%': { backgroundPosition: '-1000px 0' },
                    '100%': { backgroundPosition: '1000px 0' },
                },
                fadeIn: {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },
                scaleIn: {
                    from: { transform: 'scale(0.9)', opacity: '0' },
                    to: { transform: 'scale(1)', opacity: '1' },
                },
                slideUp: {
                    from: { transform: 'translateY(10px)', opacity: '0' },
                    to: { transform: 'translateY(0)', opacity: '1' },
                },
            },
            spacing: {
                '128': '32rem',
                '144': '36rem',
            },
            fontSize: {
                'xs': ['12px', '16px'],
                'sm': ['14px', '20px'],
                'base': ['16px', '24px'],
                'lg': ['18px', '28px'],
                'xl': ['20px', '28px'],
                '2xl': ['24px', '32px'],
                '3xl': ['30px', '36px'],
                '4xl': ['36px', '40px'],
                '5xl': ['48px', '1'],
            },
            borderRadius: {
                'xl': '1rem',
                '2xl': '1.5rem',
            },
        },
    },
    plugins: [
        require("tailwindcss-animate"), // Kept from existing
        // require('@tailwindcss/aspect-ratio'), // Disabled due to install errors
        // require('@tailwindcss/line-clamp'), 
    ],
};
export default config;
