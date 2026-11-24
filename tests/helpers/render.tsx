import { ChakraProvider } from '@chakra-ui/react'
import { render, type RenderResult } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router'

import { system } from '@/theme/system'

/**
 * Renders a component the way the running app does: inside the cebete theme and a router.
 * Pass `route` to open the app at a given address, as if the user had loaded that page.
 */
export function renderWithProviders(ui: ReactElement, route = '/'): RenderResult {
  return render(
    <ChakraProvider value={system}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </ChakraProvider>,
  )
}
