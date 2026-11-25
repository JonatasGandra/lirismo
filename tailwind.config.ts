import type { Config } from "tailwindcss";

// Todos os valores visuais vêm de CSS variables definidas em app/theme.css.
// Para mudar o visual, edite app/theme.css — não este arquivo.
const config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "var(--color-bg)",
        surface: "var(--color-surface)",
        ink: "var(--color-text)",
        muted: "var(--color-muted)",
        line: "var(--color-line)",
        leaf: "var(--color-leaf)",
        danger: "var(--color-danger)",
        accent: {
          DEFAULT: "var(--color-accent)",
          soft: "var(--color-accent-soft)",
          wash: "var(--color-accent-wash)",
          contrast: "var(--color-accent-contrast)",
        },
      },
      fontFamily: {
        poem: "var(--font-poem)",
        title: "var(--font-title)",
        script: "var(--font-script)",
        display: "var(--font-display)",
        ui: "var(--font-ui)",
      },
      fontSize: {
        "display-hero": "var(--size-display-hero)",
        "script-section": "var(--size-script-section)",
        "title-xl": "var(--size-title-xl)",
        "title-lg": "var(--size-title-lg)",
        "title-md": "var(--size-title-md)",
        lede: "var(--size-lede)",
      },
      maxWidth: {
        content: "var(--content-width)",
        wide: "var(--wide-width)",
      },
      borderRadius: {
        theme: "var(--radius)",
        "theme-lg": "var(--radius-lg)",
      },
      boxShadow: {
        theme: "var(--shadow)",
        "theme-lg": "var(--shadow-lg)",
      },
      transitionTimingFunction: {
        petal: "var(--ease-petal)",
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;
