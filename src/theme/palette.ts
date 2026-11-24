/**
 * Colour scales for the calm teal look. Each step is a Chakra colour token.
 * Kept apart from the theme definition so tests can read the real values.
 */

/** Main colour. Step 700 matches the app icon, and 50 matches the manifest background. */
export const brand = {
  50: { value: '#f0fdfa' },
  100: { value: '#ccfbf1' },
  200: { value: '#99f6e4' },
  300: { value: '#5eead4' },
  400: { value: '#2dd4bf' },
  500: { value: '#14b8a6' },
  600: { value: '#0d9488' },
  700: { value: '#0f766e' },
  800: { value: '#115e59' },
  900: { value: '#134e4a' },
  950: { value: '#042f2e' },
} as const

/** Neutral scale with a faint teal tint, so surfaces and text feel part of the same family. */
export const neutral = {
  50: { value: '#f6faf9' },
  100: { value: '#ebf2f1' },
  200: { value: '#d9e5e3' },
  300: { value: '#bdcdca' },
  400: { value: '#93a8a5' },
  500: { value: '#6c8582' },
  600: { value: '#536a67' },
  700: { value: '#3f5250' },
  800: { value: '#2b3a39' },
  900: { value: '#1c2b2a' },
  950: { value: '#0f1a19' },
} as const

/** Muted clay rose, used wherever Chakra reaches for red (errors). Never an alarming red. */
export const mutedError = {
  50: { value: '#faf3f2' },
  100: { value: '#f3e4e2' },
  200: { value: '#e8cbc7' },
  300: { value: '#d9a9a2' },
  400: { value: '#c98279' },
  500: { value: '#b66a60' },
  600: { value: '#9c554c' },
  700: { value: '#7f453e' },
  800: { value: '#653833' },
  900: { value: '#4f2e2a' },
  950: { value: '#2c1816' },
} as const

/** Muted sand, used wherever Chakra reaches for orange (warnings). */
export const mutedWarning = {
  50: { value: '#fbf6ee' },
  100: { value: '#f4ecdd' },
  200: { value: '#e9dcc3' },
  300: { value: '#dbc29b' },
  400: { value: '#c9a875' },
  500: { value: '#a68656' },
  600: { value: '#8a6d44' },
  700: { value: '#6f5a3a' },
  800: { value: '#564630' },
  900: { value: '#43372a' },
  950: { value: '#251e16' },
} as const
