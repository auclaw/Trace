/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // merize 品牌色 - 活力橙 + 森林绿（符合小红书设计趋势）
        primary: '#f97316',
        success: '#10b981',
        brandBg: '#f0fdf4',
      },
      borderRadius: {
        // 更大圆角符合小红书设计风格
        'xl': '1rem',
        '2xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
