import { Box } from '@chakra-ui/react'
import type { ReactElement } from 'react'
import { Navigate, Route, Routes } from 'react-router'

import BottomNav from '@/navigation/BottomNav'
import { bottomNavClearance } from '@/navigation/layout'
import { paths } from '@/navigation/paths'
import HomeScreen from '@/screens/HomeScreen'
import MoodScreen from '@/screens/MoodScreen'
import SettingsScreen from '@/screens/SettingsScreen'
import ThoughtsScreen from '@/screens/ThoughtsScreen'

export default function App(): ReactElement {
  return (
    // The bottom padding stops the fixed bar from ever covering the end of a screen.
    <Box minH="100dvh" paddingBottom={bottomNavClearance}>
      <main>
        <Routes>
          <Route path={paths.home} element={<HomeScreen />} />
          <Route path={paths.mood} element={<MoodScreen />} />
          <Route path={paths.thoughts} element={<ThoughtsScreen />} />
          <Route path={paths.settings} element={<SettingsScreen />} />
          {/* A mistyped address never shows an empty page. */}
          <Route path="*" element={<Navigate to={paths.home} replace />} />
        </Routes>
      </main>
      <BottomNav />
    </Box>
  )
}
