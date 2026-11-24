function twoDigits(value: number): string {
  return String(value).padStart(2, '0')
}

/** The name of a backup file made on the given day, in the user's own time zone. */
export function backupFileName(date: Date): string {
  const day = `${String(date.getFullYear())}-${twoDigits(date.getMonth() + 1)}-${twoDigits(date.getDate())}`

  return `cebete-backup-${day}.json`
}

/** Hands a text file to the browser as a download. It works offline: nothing is sent anywhere. */
export function downloadTextFile(fileName: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const link = document.createElement('a')

  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()

  // Let the browser start the download before the temporary address is released.
  window.setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 10_000)
}
