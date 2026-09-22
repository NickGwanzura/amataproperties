/**
 * Brand design tokens for Amata Properties.
 *
 * Colour palette, typography, border radii, and spacing decisions live here
 * so that Tailwind config, CSS variables, and component-level overrides all
 * reference the same values.
 */

export const branding = {
  /** Primary Amata red */
  primary: {
    DEFAULT: "#DB1F26",
    light: "#DB1F26",
    dark: "#DB1F26",
    foreground: "#FFFFFF",
  },

  /** Accent red */
  accent: {
    DEFAULT: "#DB1F26",
    light: "#DB1F26",
    dark: "#A9161C",
    foreground: "#FFFFFF",
  },

  /** Background surfaces */
  background: {
    page: "#FFFFFF",
    card: "#FFFFFF",
    muted: "#FFFFFF",
    warmSand: "#F8E5E7",
    stone: "#E5DFE0",
  },

  /** Text */
  text: {
    primary: "#000000",
    secondary: "#3A2024",
    muted: "#727272",
    inverse: "#FFFFFF",
  },

  /** Borders */
  border: {
    light: "#E0DCD0",
    DEFAULT: "#D0CCC0",
    dark: "#A09C90",
  },

  /** Semantic colours */
  success: {
    DEFAULT: "#16A34A",
    light: "#DCFCE7",
    foreground: "#166534",
  },
  warning: {
    DEFAULT: "#CA8A04",
    light: "#FEF9C3",
    foreground: "#854D0E",
  },
  error: {
    DEFAULT: "#DC2626",
    light: "#FEE2E2",
    foreground: "#991B1B",
  },
  info: {
    DEFAULT: "#2563EB",
    light: "#DBEAFE",
    foreground: "#1E40AF",
  },

  /** Border radius scale */
  radius: {
    sm: "4px",
    md: "6px",
    lg: "8px",
    xl: "12px",
    "2xl": "16px",
    full: "9999px",
  },

  /** Shadows */
  shadow: {
    card: "0 1px 3px hsl(120 10% 12% / 0.05), 0 4px 16px hsl(120 10% 12% / 0.06)",
    hover: "0 6px 16px -2px hsl(120 10% 12% / 0.08), 0 12px 40px hsl(120 10% 12% / 0.1)",
  },

  /** Typography */
  fonts: {
    /** Primary interface font */
    sans: {
      name: "Manrope",
      import: "Manrope",
      weights: "200..800",
      variable: "--font-manrope",
    },
    /** Display / heading font for public pages */
    display: {
      name: "Manrope",
      import: "Manrope",
      weight: "700",
      variable: "--font-manrope",
    },
  },
} as const;
