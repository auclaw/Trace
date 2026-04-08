/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Merize Zapier-inspired Warm Orange Design System
        // Vibrant warm approach based on Zapier design philosophy
        aether: {
          // Base backgrounds - warm cream (not pure white)
          100: '#fffefb',      // Light: Base canvas (warm cream paper-like)
          200: '#fffefb',      // Light: Surface elevation 1
          300: '#eceae3',      // Light: Surface elevation 2 (light sand)
          dark: {
            100: '#1a1614',    // Dark: Base canvas (warm dark near-black)
            200: '#25201e',    // Dark: Surface elevation 1
            300: '#3a3630',    // Dark: Surface elevation 2
          },
          // Text colors - warm undertones
          text: {
            primary: '#201515',      // Warm near-black with reddish undertone
            secondary: '#36342e',    // Warm dark gray-brown
            muted: '#939084',        // Mid-range warm gray
            dark: {
              primary: '#f8f5f0',    // Warm off-white for dark mode
              secondary: '#d1cdc4',  // Warm light gray
              muted: '#a19d94',      // Warm muted gray
            },
          },
          // Brand accent - Zapier Orange (vivid warm accent)
          accent: '#ff4f00',         // Primary orange accent
          accentSoft: 'rgba(255, 79, 0, 0.15)',  // Soft orange background
          accentDark: '#ff6b2a',     // Lighter orange for dark mode
          accentSoftDark: 'rgba(255, 107, 42, 0.15)',
          // Semantic colors - kept but harmonized with warm palette
          success: '#2e7d32',        // Muted green that works with orange
          successDark: '#4caf50',
          warning: '#ff4f00',        // Use accent orange as warning
          warningDark: '#ff6b2a',
          // Category semantic colors
          category: {
            focus: '#34c759',      // Green for deep work
            meeting: '#5aa9e6',    // Soft Blue for meetings
            break: '#ff9500',      // Orange for breaks
            other: '#86868b',      // Gray for other
          },
        },
        // Keep original primary for compatibility, will migrate
        // Use CSS variables for dynamic theme color switching
        primary: 'var(--color-accent)',
        accent: 'var(--color-accent)',
        accentSoft: 'var(--color-accent-soft)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        serif: ['Source Serif 4', 'Source Han Serif SC', 'Georgia', 'serif'],
      },
      borderRadius: {
        // "Aether Prodigy" - Extra large rounded corners like modern SaaS design
        container: '24px',
        card: '20px',
        modal: '28px',
        button: '12px',
      },
      boxShadow: {
        // Extremely subtle, soft shadows like Prodigy design - very light elevation
        // Based on dribbble shot: Prodify AI Dashboard App UI-Design
        'subtle': '0 2px 16px rgba(0, 0, 0, 0.04)',
        'elevated': '0 4px 24px rgba(0, 0, 0, 0.06)',
        'container': '0 4px 28px rgba(0, 0, 0, 0.05)',
        'focus-ring': '0 0 0 3px rgba(90, 169, 230, 0.15)',
        'subtle-dark': '0 2px 16px rgba(0, 0, 0, 0.35)',
        'elevated-dark': '0 4px 24px rgba(0, 0, 0, 0.45)',
        'container-dark': '0 4px 28px rgba(0, 0, 0, 0.4)',
      },
      spacing: {
        // 8px grid system consistent spacing
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '6': '24px',
        '8': '32px',
        '12': '48px',
        '16': '64px',
      },
      animation: {
        'breath': 'breath 4s ease-in-out infinite',
      },
      keyframes: {
        breath: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },
      },
    },
  },
  darkMode: 'class',
  plugins: [],
}
