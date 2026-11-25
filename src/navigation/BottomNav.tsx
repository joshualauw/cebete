import { Box, chakra, Flex } from '@chakra-ui/react'
import type { ReactElement } from 'react'
import { Link, useLocation } from 'react-router'

import { isCurrentSection } from './current'
import { navItems } from './items'
import { bottomNavHeight } from './layout'

// The current item carries aria-current="page", which the style below also uses. It is set by
// hand, not by NavLink, because Home must also stay current on addresses it hosts.
const SectionLink = chakra(Link)

/** The bottom navigation bar: always visible, within thumb reach, and clear of the notch. */
export default function BottomNav(): ReactElement {
  const { pathname } = useLocation()

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
            aria-current={isCurrentSection(path, pathname) ? 'page' : undefined}
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
