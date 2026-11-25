import { Box, chakra, Flex } from '@chakra-ui/react'
import type { ReactElement } from 'react'
import { NavLink } from 'react-router'

import { navItems } from './items'
import { bottomNavHeight } from './layout'
import { paths } from './paths'

// NavLink marks the active link with aria-current="page", which the style below also uses.
const SectionLink = chakra(NavLink)

/** The bottom navigation bar: always visible, within thumb reach, and clear of the notch. */
export default function BottomNav(): ReactElement {
  return (
    <Box
      as="nav"
      aria-label="Main"
      position="fixed"
      insetInline="0"
      bottom="0"
      zIndex="docked"
      bg="bg"
      borderTopWidth="1px"
      borderColor="border"
      // Keeps the bar clear of a phone's home indicator.
      paddingBottom="env(safe-area-inset-bottom)"
    >
      <Flex maxW="lg" mx="auto">
        {navItems.map(({ label, path, icon: Icon }) => (
          <SectionLink
            key={path}
            to={path}
            // Home must match exactly, or it would count as current on every section. The others
            // also stay current on the addresses below them, such as one thought record.
            end={path === paths.home}
            flex="1"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            gap="1"
            minH={bottomNavHeight}
            fontSize="sm"
            fontWeight="medium"
            color="fg.muted"
            textDecoration="none"
            _currentPage={{
              color: 'colorPalette.fg',
              bg: 'colorPalette.subtle',
              fontWeight: 'bold',
            }}
            _focusVisible={{
              outline: '2px solid',
              outlineColor: 'colorPalette.focusRing',
              outlineOffset: '-2px',
            }}
          >
            <Icon aria-hidden="true" focusable="false" size={22} />
            <span>{label}</span>
          </SectionLink>
        ))}
      </Flex>
    </Box>
  )
}
