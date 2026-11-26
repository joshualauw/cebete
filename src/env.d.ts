declare global {
  /** The app's own version, read from `package.json` when the app is built (see `vite.config.ts`). */
  const __APP_VERSION__: string
}

export {}
