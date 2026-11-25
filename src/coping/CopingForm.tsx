import { Box, Button, chakra, Flex, Heading, Stack, Text } from '@chakra-ui/react'
import { type ReactElement, type SubmitEvent, useEffect, useId, useRef, useState } from 'react'

import CopingTypePicker from './CopingTypePicker'
import { CopingItemNotFoundError } from './errors'
import { addCopingItem, updateCopingItem } from './repository'
import { type CopingItem, type CopingType, DETAIL_MAX_LENGTH, TEXT_MAX_LENGTH } from './types'
import { InvalidCopingItemError } from './validation'

type CopingFormProps = {
  /** Called when the form should close, after a successful save or when the user cancels. */
  onDone: () => void
  /** Called after a save succeeds, just before the form closes. */
  onSaved?: () => void
  /** The item to change. Without it the form adds a new item. */
  item?: CopingItem
}

const SAVE_FAILED = 'Your item could not be saved right now. Please try again.'

const fieldStyles = {
  width: 'full',
  borderWidth: '1px',
  borderColor: 'border.emphasized',
  borderRadius: 'lg',
  bg: 'bg',
  _focusVisible: {
    outline: '2px solid',
    outlineColor: 'colorPalette.focusRing',
    outlineOffset: '2px',
  },
} as const

/**
 * The form for a coping item: its kind, a short text and an optional detail. Given an item it
 * edits that item instead, starting from its values.
 */
export default function CopingForm({ onDone, onSaved, item }: CopingFormProps): ReactElement {
  const id = useId()
  const titleId = `${id}-title`
  const textId = `${id}-text`
  const textCountId = `${id}-text-count`
  const detailId = `${id}-detail`
  const detailCountId = `${id}-detail-count`
  const saveHintId = `${id}-save-hint`

  const [type, setType] = useState<CopingType | null>(item?.type ?? null)
  const [text, setText] = useState(item?.text ?? '')
  const [detail, setDetail] = useState(item?.detail ?? '')
  const [saving, setSaving] = useState(false)
  const [gone, setGone] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)

  const incomplete = type === null || text.trim() === ''

  // Move focus into the form when it opens, so keyboard and screen reader users land in it.
  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  async function save(): Promise<void> {
    if (type === null || incomplete || saving) {
      return
    }

    setSaving(true)
    setErrorMessage(null)

    try {
      if (item) {
        await updateCopingItem(item.id, { type, text, detail })
      } else {
        await addCopingItem({ type, text, detail })
      }
      onSaved?.()
      onDone()
    } catch (error) {
      if (error instanceof CopingItemNotFoundError) {
        setGone(true)
        setErrorMessage(error.message)
      } else if (error instanceof InvalidCopingItemError) {
        setErrorMessage(error.message)
      } else {
        console.error('Coping item could not be saved', error)
        setErrorMessage(SAVE_FAILED)
      }
      // Everything the user chose and typed stays in the form, so they can simply try again.
      setSaving(false)
    }
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault()
    void save()
  }

  return (
    <Box
      as="section"
      bg="bg"
      borderWidth="1px"
      borderColor="border"
      borderRadius="xl"
      p="5"
      aria-labelledby={titleId}
    >
      <chakra.form onSubmit={handleSubmit}>
        <Stack gap="6">
          <Heading
            as="h2"
            id={titleId}
            ref={titleRef}
            tabIndex={-1}
            size="lg"
            color="colorPalette.fg"
            outline="none"
          >
            {item ? 'Edit item' : 'New item'}
          </Heading>

          <CopingTypePicker selected={type} onChange={setType} />

          <Box>
            <chakra.label htmlFor={textId} display="block" mb="2" fontWeight="semibold">
              Short text
            </chakra.label>
            <chakra.input
              id={textId}
              type="text"
              value={text}
              onChange={(event) => {
                setText(event.target.value)
              }}
              maxLength={TEXT_MAX_LENGTH}
              aria-describedby={textCountId}
              minH="12"
              px="3"
              {...fieldStyles}
            />
            <Text id={textCountId} mt="1" textAlign="end" fontSize="sm" color="fg.muted">
              {text.length}/{TEXT_MAX_LENGTH}
            </Text>
          </Box>

          <Box>
            <chakra.label htmlFor={detailId} display="block" mb="2" fontWeight="semibold">
              Detail (optional)
            </chakra.label>
            <chakra.textarea
              id={detailId}
              value={detail}
              onChange={(event) => {
                setDetail(event.target.value)
              }}
              maxLength={DETAIL_MAX_LENGTH}
              rows={3}
              aria-describedby={detailCountId}
              p="3"
              {...fieldStyles}
            />
            <Text id={detailCountId} mt="1" textAlign="end" fontSize="sm" color="fg.muted">
              {detail.length}/{DETAIL_MAX_LENGTH}
            </Text>
          </Box>

          {errorMessage ? (
            <Box role="alert" bg="bg.error" color="fg.error" borderRadius="lg" p="3">
              {errorMessage}
            </Box>
          ) : null}

          <Stack gap="2">
            <Flex gap="3">
              {gone ? null : (
                <Button
                  type="submit"
                  size="lg"
                  minH="12"
                  flex="1"
                  disabled={incomplete || saving}
                  aria-describedby={incomplete ? saveHintId : undefined}
                >
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="lg"
                minH="12"
                disabled={saving}
                onClick={onDone}
              >
                Cancel
              </Button>
            </Flex>
            {incomplete ? (
              <Text id={saveHintId} fontSize="sm" color="fg.muted">
                Choose a kind and write a short text to save your item.
              </Text>
            ) : null}
          </Stack>
        </Stack>
      </chakra.form>
    </Box>
  )
}
