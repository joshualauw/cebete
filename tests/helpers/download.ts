import { vi } from 'vitest'

export type CapturedDownload = {
  readonly name: string
  readonly blob: Blob
}

/**
 * Stands in for the browser's download support, which jsdom does not have. It records each file
 * that would have been downloaded, so a test can read its name and contents. Call `stop` after.
 */
export function captureDownloads(): {
  files: CapturedDownload[]
  revoked: string[]
  stop: () => void
} {
  const files: CapturedDownload[] = []
  const revoked: string[] = []
  const blobs = new Map<string, Blob>()
  let counter = 0

  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    writable: true,
    value: (blob: Blob): string => {
      counter += 1
      const url = `blob:cebete-test-${String(counter)}`
      blobs.set(url, blob)
      return url
    },
  })
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    writable: true,
    value: (url: string): void => {
      revoked.push(url)
    },
  })

  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ): void {
    const blob = blobs.get(this.href)

    if (blob) {
      files.push({ name: this.download, blob })
    }
  })

  return {
    files,
    revoked,
    stop: () => {
      click.mockRestore()
      Reflect.deleteProperty(URL, 'createObjectURL')
      Reflect.deleteProperty(URL, 'revokeObjectURL')
    },
  }
}
