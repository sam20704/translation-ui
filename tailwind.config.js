/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'deepl-blue': '#0F2027',
        'error-red': '#EF4444',
        'warning-yellow': '#F59E0B',
        'success-green': '#10B981',
      },
    },
  },
  plugins: [],
}

