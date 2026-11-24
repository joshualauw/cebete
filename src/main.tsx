import { ChakraProvider } from '@chakra-ui/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'

import { initStorage } from '@/db/init'
import { system } from '@/theme/system'

import App from './App'

// The app works without storage, so a failure here is reported but never blocks rendering.
initStorage().catch((error: unknown) => {
  console.error('Local storage could not be initialised', error)
})

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element #root not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <ChakraProvider value={system}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ChakraProvider>
  </StrictMode>,
)
