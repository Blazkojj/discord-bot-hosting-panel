/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#05080f",
        panel: "#0c1421",
        line: "#1f2f44",
        neon: "#64f6d3",
        cyber: "#52a7ff",
        alert: "#ff6b6b"
      },
      fontFamily: {
        sans: ["Outfit", "Segoe UI", "sans-serif"],
        mono: ["IBM Plex Mono", "Consolas", "monospace"]
      },
      boxShadow: {
        neon: "0 0 0 1px rgba(100, 246, 211, 0.15), 0 24px 60px rgba(8, 18, 35, 0.65)"
      },
      backgroundImage: {
        glow:
          "radial-gradient(circle at top right, rgba(82, 167, 255, 0.18), transparent 38%), radial-gradient(circle at top left, rgba(100, 246, 211, 0.12), transparent 28%)"
      }
    }
  },
  plugins: []
};
