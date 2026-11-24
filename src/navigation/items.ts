import type { IconType } from 'react-icons'
import { LuHouse, LuSettings, LuSmile } from 'react-icons/lu'

import { paths } from './paths'

export type NavItem = {
  readonly label: string
  readonly path: string
  readonly icon: IconType
}

/** The sections shown in the bottom bar, in order. At most five fit comfortably. */
export const navItems: readonly NavItem[] = [
  { label: 'Home', path: paths.home, icon: LuHouse },
  { label: 'Mood', path: paths.mood, icon: LuSmile },
  { label: 'Settings', path: paths.settings, icon: LuSettings },
]
