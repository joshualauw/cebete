import { screen } from '@testing-library/react'

import App from '@/App'
import { thoughtRecordPath } from '@/navigation/paths'

import { renderWithProviders } from './render'

/** Opens the app on one record's own screen, as if the user had loaded that address. */
export async function openRecordScreen(id: number): Promise<void> {
  renderWithProviders(<App />, thoughtRecordPath(id))
  await screen.findByRole('region', { name: 'The thought' })
}
