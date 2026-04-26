/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366f1',  // indigo
        secondary: '#8b5cf6', // violet
        success: '#10b981',   // emerald
        warning: '#f59e0b',   // amber
        danger: '#ef4444',    // red
      }
    },
  },
  plugins: [],
}