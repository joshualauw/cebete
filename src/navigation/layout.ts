/** Height of the bottom bar itself, without the phone's bottom safe area. */
export const bottomNavHeight = '3.5rem'

/** Room the page must leave at the bottom so the fixed bar never covers content. */
export const bottomNavClearance = `calc(${bottomNavHeight} + env(safe-area-inset-bottom))`
