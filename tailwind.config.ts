import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "var(--color-ink)",
        paper: "var(--color-paper)",
        section: "var(--color-section)",
        line: "var(--color-line)",
        action: "var(--color-action)",
        "action-contrast": "var(--color-action-contrast)",
        "action-hover": "var(--color-action-hover)",
        focus: "var(--color-focus)",
        surface: "var(--color-surface)",
        "surface-soft": "var(--color-surface-soft)",
        muted: "var(--color-muted)",
        "accent-soft": "var(--color-accent-soft)",
        "info-bg": "var(--color-info-bg)",
        "info-border": "var(--color-info-border)",
        "info-text": "var(--color-info-text)",
        "warning-bg": "var(--color-warning-bg)",
        "warning-border": "var(--color-warning-border)",
        "warning-text": "var(--color-warning-text)",
        "success-bg": "var(--color-success-bg)",
        "success-border": "var(--color-success-border)",
        "success-text": "var(--color-success-text)",
        "danger-bg": "var(--color-danger-bg)",
        "danger-border": "var(--color-danger-border)",
        "danger-text": "var(--color-danger-text)",
      },
      fontFamily: {
        sans: ["Arial", "Helvetica", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
