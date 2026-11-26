import type { ReactElement } from 'react'
import { useLocation } from 'react-router'

/** Shows the current address and history note as text, so a test can see where the app is. */
export function LocationProbe(): ReactElement {
  const location = useLocation()
  const note: unknown = location.state

  return (
    <>
      <p data-testid="pathname">{location.pathname}</p>
      <p data-testid="history-note">{JSON.stringify(note ?? null)}</p>
    </>
  )
}
