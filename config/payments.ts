/**
 * Payment gateway configuration.
 *
 * All values from environment variables so switching providers or
 * sandbox/production modes is a config-only operation.
 */

export const payments = {
  /** Velocity Payments API configuration */
  velocity: {
    apiUrl: process.env.VELOCITY_API_URL || "",
    apiKey: process.env.VELOCITY_API_KEY || "",
    isConfigured: !!(process.env.VELOCITY_API_URL && process.env.VELOCITY_API_KEY),
  },

  /** Default currency */
  currency: "USD",

  /** Monetary precision (decimal places) */
  precision: 2,

  /** Epsilon for floating-point comparisons */
  epsilon: 0.005,
} as const;
