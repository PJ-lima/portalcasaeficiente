import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
      },
      screens: {
        "2xl": "1200px",
      },
    },
    extend: {
      colors: {
        // Verde-pinhal: profundidade e confiança sem o azul institucional genérico
        primary: {
          DEFAULT: "#0E5A46",
          foreground: "#FFFFFF",
          50: "#F0F7F4",
          100: "#DCEDE5",
          200: "#B9DCCC",
          300: "#8CC4AB",
          400: "#57A585",
          500: "#2E8265",
          600: "#1B6B52",
          700: "#0E5A46",
          800: "#0A4234",
          900: "#083629",
        },
        // Verde-folha: classe A, estados positivos
        success: {
          DEFAULT: "#2E9E5B",
          foreground: "#FFFFFF",
          50: "#F0FAF3",
          100: "#DCF4E4",
          200: "#BBE8CA",
          300: "#8AD5A5",
          400: "#54BB7B",
          500: "#2E9E5B",
          600: "#218149",
          700: "#1C673C",
          800: "#195232",
          900: "#15442B",
        },
        // Âmbar-sol: destaque usado com contenção
        sun: {
          DEFAULT: "#F2B22E",
          foreground: "#4A3306",
          100: "#FCF0D3",
          200: "#F9DFA3",
          300: "#F6CC67",
          400: "#F2B22E",
          500: "#DE9A12",
          600: "#B87C0C",
        },
        // Escala real do certificado energético (A+ → F)
        cert: {
          aplus: "#00913D",
          a: "#51AE32",
          b: "#C8D204",
          c: "#FFEC00",
          d: "#FBBA00",
          e: "#EB690B",
          f: "#E2001A",
        },
        background: "#F7F7F2",
        foreground: "#1A2620",
        ink: "#1A2620",
        muted: {
          DEFAULT: "#EDEEE6",
          foreground: "#5D6B62",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#1A2620",
        },
        border: "#E1E4DA",
        input: "#D4D8CC",
        ring: "#0E5A46",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.25rem",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(26 38 32 / 0.05), 0 1px 6px -1px rgb(26 38 32 / 0.06)",
        "card-hover": "0 2px 4px 0 rgb(26 38 32 / 0.06), 0 8px 20px -6px rgb(26 38 32 / 0.14)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
