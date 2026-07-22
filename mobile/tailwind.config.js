/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#C8A348',
          light: '#E5C365',
          dark: '#A6822D',
          50: '#FDFBEE',
          100: '#FBF5D5',
          200: '#F5EAAC',
          300: '#EFDF83',
          400: '#E7D15A',
          500: '#C8A348',
          600: '#A6822D',
          700: '#7C601E',
          800: '#523E11',
          900: '#2A1F06',
        },
        charcoal: {
          DEFAULT: '#121214',
          light: '#1E1E22',
          card: '#16161A',
          border: '#24242A',
          soft: '#2D2D2D',
        },
        darkbg: '#09090B',
        surface: '#121214',
        semantic: {
          success: '#16A34A',
          warning: '#F59E0B',
          error: '#DC2626',
          info: '#2563EB',
        },
      },
      borderRadius: {
        'card': '24px',
        'button': '14px',
        'input': '14px',
        'modal': '32px',
      },
    },
  },
  plugins: [],
}
