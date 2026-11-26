import { ChakraProvider } from '@chakra-ui/react'
import { render, type RenderResult } from '@testing-library/react'
import type { ReactElement } from 'react'
import { type InitialEntry, MemoryRouter } from 'react-router'

import { system } from '@/theme/system'

/**
 * Renders a component the way the running app does: inside the cebete theme and a router.
 * Pass `route` to open the app at a given address, as if the user had loaded that page. It can
 * also be an address with a history note, as when the user arrived by a link that carries one.
 */
export function renderWithProviders(ui: ReactElement, route: InitialEntry = '/'): RenderResult {
  return render(
    <ChakraProvider value={system}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </ChakraProvider>,
  )
}
