import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'

import { brand, mutedError, mutedWarning, neutral } from './palette'

/**
 * The cebete theme: calm teal, light only.
 *
 * Light only on purpose: dark mode is not supported, so the page declares a light colour
 * scheme and the dark variants of Chakra's tokens are never switched on. The browser's own
 * dark preference therefore does not change the look.
 */
const config = defineConfig({
  globalCss: {
    html: { colorPalette: 'brand', colorScheme: 'light' },
    body: { bg: 'bg.subtle', color: 'fg' },
  },
  theme: {
    tokens: {
      colors: {
        brand,
        // Replacing these scales mutes every default use of gray, red and orange.
        gray: neutral,
        red: mutedError,
        orange: mutedWarning,
      },
    },
    semanticTokens: {
      colors: {
        // Chakra's default text colour is pure black. Softer, but still strongly readable.
        fg: {
          DEFAULT: { value: '{colors.gray.900}' },
          muted: { value: '{colors.gray.700}' },
          subtle: { value: '{colors.gray.600}' },
          // The defaults sit below a readable contrast on white, so use a darker step.
          error: { value: '{colors.red.700}' },
          warning: { value: '{colors.orange.700}' },
        },
        brand: {
          contrast: { value: '{colors.white}' },
          fg: { value: '{colors.brand.800}' },
          subtle: { value: '{colors.brand.100}' },
          muted: { value: '{colors.brand.200}' },
          emphasized: { value: '{colors.brand.300}' },
          solid: { value: '{colors.brand.700}' },
          focusRing: { value: '{colors.brand.500}' },
          border: { value: '{colors.brand.500}' },
        },
      },
    },
  },
})

export const system = createSystem(defaultConfig, config)
