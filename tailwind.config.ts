import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      typography: {
        DEFAULT: {
          css: {
            color: "var(--foreground)",
            maxWidth: "none",
            h1: {
              color: "var(--foreground)",
              fontSize: "1.5rem",
              fontWeight: "600",
              marginTop: "1rem",
              marginBottom: "0.5rem",
            },
            h2: {
              color: "var(--foreground)",
              fontSize: "1.25rem",
              fontWeight: "600",
              marginTop: "1rem",
              marginBottom: "0.5rem",
            },
            h3: {
              color: "var(--foreground)",
              fontSize: "1.125rem",
              fontWeight: "600",
              marginTop: "1rem",
              marginBottom: "0.5rem",
            },
            h4: {
              color: "var(--foreground)",
              fontSize: "1rem",
              fontWeight: "600",
              marginTop: "1rem",
              marginBottom: "0.5rem",
            },
            p: {
              marginTop: "0.5rem",
              marginBottom: "0.5rem",
            },
            ul: {
              marginTop: "0.5rem",
              marginBottom: "0.5rem",
            },
            li: {
              marginTop: "0.25rem",
              marginBottom: "0.25rem",
            },
            a: {
              color: "var(--primary)",
              "&:hover": {
                color: "var(--primary-foreground)",
              },
            },
            "code::before": {
              content: '""',
            },
            "code::after": {
              content: '""',
            },
          },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
}

export default config
