import { Box, Button, Container, Heading, Stack } from '@chakra-ui/react'
import { type ReactElement, type ReactNode, useEffect, useRef } from 'react'
import { LuArrowLeft } from 'react-icons/lu'
import { Link, useParams } from 'react-router'

import { paths } from '@/navigation/paths'
import { backFromRecord } from '@/thoughts/listState'
import RecordDetail from '@/thoughts/RecordDetail'
import { type ThoughtRecordState, useThoughtRecord } from '@/thoughts/useThoughtRecord'

const NOT_FOUND = 'This thought record could not be found. It may have been deleted.'
const LOAD_FAILED =
  'This thought record could not be loaded right now. Please close the app and open it again.'

function parseId(value: string | undefined): number | null {
  if (value === undefined || !/^[1-9]\d*$/.test(value)) {
    return null
  }

  const id = Number(value)

  return Number.isSafeInteger(id) ? id : null
}

type FrameProps = {
  loading: boolean
  /** The record this screen is for, so that going back can return focus to its card. */
  recordId: number | null
  children: ReactNode
}

function Frame({ loading, recordId, children }: FrameProps): ReactElement {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!loading) {
      headingRef.current?.focus()
    }
  }, [loading])

  return (
    <Container maxW="lg" px="6" py="10">
      <Stack gap="6">
        <Button asChild variant="ghost" minH="12" alignSelf="flex-start">
          <Link
            to={paths.thoughts}
            state={recordId === null ? undefined : backFromRecord(recordId)}
          >
            <LuArrowLeft aria-hidden="true" />
            Back to thoughts
          </Link>
        </Button>
        {loading ? null : (
          <Heading
            as="h1"
            ref={headingRef}
            tabIndex={-1}
            size="2xl"
            color="colorPalette.fg"
            outline="none"
          >
            Thought record
          </Heading>
        )}
        {children}
      </Stack>
    </Container>
  )
}

type MessageProps = {
  children: string
  tone?: 'muted' | 'error'
}

function Message({ children, tone = 'muted' }: MessageProps): ReactElement {
  return (
    <Box
      role="status"
      bg={tone === 'error' ? 'bg.error' : 'bg.muted'}
      color={tone === 'error' ? 'fg.error' : undefined}
      borderRadius="xl"
      p="4"
    >
      {children}
    </Box>
  )
}

type BodyProps = {
  state: ThoughtRecordState
}

function Body({ state }: BodyProps): ReactElement | null {
  switch (state.status) {
    case 'loading':
      return null
    case 'missing':
      return <Message>{NOT_FOUND}</Message>
    case 'error':
      return <Message tone="error">{LOAD_FAILED}</Message>
    case 'ready':
      return <RecordDetail record={state.record} />
  }
}

type RecordContentProps = {
  id: number
}

function RecordContent({ id }: RecordContentProps): ReactElement {
  const state = useThoughtRecord(id)

  return (
    <Frame loading={state.status === 'loading'} recordId={id}>
      <Body state={state} />
    </Frame>
  )
}

/** One thought record on its own screen, opened from the Thoughts list. */
export default function ThoughtRecordScreen(): ReactElement {
  const id = parseId(useParams().id)

  if (id === null) {
    return (
      <Frame loading={false} recordId={null}>
        <Message>{NOT_FOUND}</Message>
      </Frame>
    )
  }

  return <RecordContent id={id} />
}
