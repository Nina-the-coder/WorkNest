/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        card: "var(--color-card-bg)",
        sidebar: "var(--color-sidebar-bg)",
        textPrimary: "var(--color-text)",
        textSecondary: "var(--color-secondary-text)",
        cta: "var(--color-cta)",
        green: "var(--color-green)",
        orange: "var(--color-orange)",
        red: "var(--color-red)",
      },
      fontFamily: {
        sans: "var(--font-sans)",
        heading: "var(--font-heading)",
      },
      borderRadius: {
        xl: "var(--radius-xl)", // 5px
        "2xl": "var(--radius-2xl)", // 10px
      },
    },
  },
  plugins: [],
};
