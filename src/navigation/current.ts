import { paths } from './paths'

/** Addresses without a bar item of their own, and the item that stays current on them. */
const hostedBy: readonly { readonly path: string; readonly item: string }[] = [
  { path: paths.coping, item: paths.home },
  { path: paths.settle, item: paths.home },
]

function lower(address: string): string {
  return address.toLowerCase().replace(/\/+$/, '') || '/'
}

function isAtOrBelow(address: string, path: string): boolean {
  const here = lower(address)
  const base = lower(path)

  return here === base || here.startsWith(`${base}/`)
}

/**
 * Whether the bar item for `itemPath` is the current one at `pathname`. A section is current on
 * its own address and on the addresses below it, such as one thought record. Home is current only
 * on itself, and on addresses that have no bar item and are entered from it.
 */
export function isCurrentSection(itemPath: string, pathname: string): boolean {
  if (lower(itemPath) === paths.home) {
    return (
      lower(pathname) === paths.home ||
      hostedBy.some((hosted) => hosted.item === itemPath && isAtOrBelow(pathname, hosted.path))
    )
  }

  return isAtOrBelow(pathname, itemPath)
}
