# Tasks

### Group 1: Coping data, storage and backup

Covers: AC 6 (and the older-backup and older-database edge cases). No screen yet; the app runs as before.

- [x] Add the `coping` types: the four item types as a string-literal union with their form labels (Do, Keep nearby, Tell myself, About me) and fixed group order, the item shape (type, text, optional detail), and the limits (text 100, detail 500)
- [x] Add validation for a new or edited item (type from the list, text required after trimming, limits, blank detail left out) and an `isCopingItem` check for rows read back, plus a typed "not found" error
- [x] Declare database version 5 with the `copingItems` table (keeping versions 1 to 4 as they are) and raise the schema version
- [x] Add the repository: add, update (never recreates a deleted item), delete, and list (grouped order is by type then id, damaged rows left out and reported once in the console)
- [x] Register `copingItems` in the backup registry (first existing in version 5, labels "coping item" and "coping items", no upgrade needed, rows checked by `isCopingItem`)
- [x] Tests: validation, repository (including damaged rows and a deleted item not recreated), a version 4 database upgrading to 5 with its data intact and an empty library, a backup round trip with items, an older backup restoring with an empty library, and a backup with a damaged item refused
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 2: The library screen, the route and the Home link

Covers: AC 1, AC 2. Items can only be seen here, not yet added, so tests seed them directly.

- [x] Add the `/coping` address, its route in the app, and a live-query hook for the items with loading, ready and error states (like the mood list)
- [x] Build the Coping library screen: heading, items in the four groups in fixed order, empty groups left out, a friendly empty state, a calm message when items cannot be loaded, and a link back to Home
- [x] Add the "My coping library" link on Home
- [x] Make Home the current item in the bottom bar on `/coping`: replace the section link's automatic current-page marking with a small, tested rule that also counts the coping address as Home, keeping the existing rules for the other sections
- [x] Tests: the empty state, the grouped list in fixed order, an unreadable list showing the calm message, the Home link opening the library, and the bar highlighting Home on `/coping` and the other sections as before
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 3: Add and edit items

Covers: AC 3, AC 4.

- [x] Build the item form: a type choice with the four labels, the text field with a visible counter, the optional detail field with a counter, Save and Cancel, problems explained in plain words, buttons off while saving, and a failed save keeping what was typed
- [x] Add "Add an item" to the screen, opening the form in place of the button, with focus returning to the button when it closes
- [x] Add Edit on each item, opening the same form in place, filled in, one form at a time (the other Edit actions and Add are switched off), with a polite "Item saved." or "Item updated." announcement
- [x] When an item is deleted while its form is open, say so and offer only Cancel, and never recreate it
- [x] Tests: adding an item under each type, a refused blank text, the limits, edit in place, a cleared detail removed, one form at a time, a failed save keeping the typed text, the deleted-meanwhile case, and focus returning on close
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 4: Delete items

Covers: AC 5.

- [x] Move the "ask first" removal control out of `src/thoughts/` into a shared folder, since a second module now uses it, and update its imports and its test location (no behaviour change)
- [x] Add Delete on each item with the inline question "Delete this item? This cannot be undone." (Keep focused first), a calm message and retry on failure, and, after a delete, a polite "Item deleted." announcement with focus on the list
- [x] Tests: confirm removes the item, Keep leaves it, a failed delete keeps the question open, announcement and focus after a delete, and Delete switched off while a form is open
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)
