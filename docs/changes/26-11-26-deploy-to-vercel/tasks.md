# Tasks

### Group 1: The hosting settings

Covers: the configuration behind AC 1 to AC 4. The app itself does not change and keeps running as before.

- [x] Add a `vercel.json` with the schema reference, the Vite framework, the normal build command and the `dist` output; a catch-all rewrite to `index.html` so every address works when opened or reloaded (real files such as the icons, the manifest and the service worker are served first, as themselves); and no redirects, clean-URL or trailing-slash rules that would change the addresses
- [x] Add headers so `sw.js` and `manifest.webmanifest` are always revalidated and never served stale, which is what lets a new version reach the installed app
- [x] Set the Node version the toolchain needs in `package.json` (`engines`), checked against what the installed Vite and Vitest require, so the host does not pick an older default
- [x] Add `.vercel` to `.gitignore`, keeping a final newline at the end of the file
- [x] Smoke-check the production build locally, on a port other than 4173 (that one is the owner's own preview): every section address, a record address and an unknown address answer with the app, and `sw.js`, `manifest.webmanifest` and the icons come back as real files, not as the app page
- [x] Tests (a Node-environment test like the PWA one): the catch-all rewrite exists and points at `index.html`; no redirect rules exist; the no-cache headers are set for the service worker and the manifest; the names those headers use are the ones the PWA plugin produces (its configuration does not rename them); the framework, build command and output folder match the project; the Node requirement is present
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 2: The page description and theme colour

Covers: AC 5.

- [x] Add a `description` meta tag and a `theme-color` meta tag to `index.html`, with the same text and colour the manifest already declares, so the page and the installed app agree
- [x] Tests: the description and the theme colour in `index.html` equal the manifest's; the existing head tags (viewport, colour scheme, title, icons) are unchanged
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 3: Hosting steps and the real-device checklist

Covers: AC 6, once the owner's checks are done. This group is words, not code.

- [x] Write the hosting steps and the device checklist for the owner as a short section at the end of this file, in the order the owner does them, for the bookkeeper to turn into the new `deployment` doc: how to create the Vercel project from the repository, why the first address must be the one kept, the install, offline, deep-link reload, backup-saving (iPhone especially) and update-after-a-deploy checks, and the rule that a different address means empty data
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

## For the owner: hosting steps and device checklist

Written for the bookkeeper to turn into the `deployment` doc. The checks below need the real hosted site, so only the owner can do them. Once they pass, tell the seafarer, who ticks the matching acceptance criteria.

### Hosting steps, once

1. Push the branch that Vercel will deploy. Production follows the repository's default branch, so merge `dev` into `main` when it should go live. Other branches get throwaway preview addresses.
2. On vercel.com, sign in with GitHub and choose Add New, then Project, and import the `cebete` repository. Vercel detects Vite, and `vercel.json` supplies the settings, so there is nothing to type. No environment variables are needed. Deploy.
3. **Choose the project name before the first deploy.** Vercel builds the production address from it (`<name>.vercel.app`). Renaming later, or adding a custom domain later, changes the address, and a new address starts with empty data. If you want a custom domain, add it now.
4. Do not turn on Vercel's analytics or speed insights, so "nothing leaves your device" stays simply true.
5. The free plan is for non-commercial use.

### The address rule

The browser keeps cebete's data per exact web address. A different address, such as another domain, a renamed project, a preview address, or `http` instead of `https`, shows empty data. Keep one production address. Before ever changing it, export a backup, and import it at the new address.

### Device checklist

Do these on your phone, and again in a desktop browser.

- [ ] **Open the address.** Home loads, with the logo beside the title.
- [ ] **Direct links.** Open `/mood`, `/thoughts`, `/coping` and `/settle` by typing the address or from a bookmark. Each shows its own screen, not a not-found page.
- [ ] **Reload on a record.** Create a thought record, open it, and reload the page. The same record screen returns. An unknown address such as `/nowhere` goes to Home.
- [ ] **Install.** On Android Chrome, choose Install app. On iPhone Safari, choose Share, then Add to Home Screen. The app opens on its own, without the browser bars, with the cebete icon.
- [ ] **Offline.** After one visit, switch on airplane mode and open the installed app. Every screen opens. Add a mood entry offline and see it saved.
- [ ] **Save a backup.** In Settings, choose Export backup. A file is saved or offered to you. Check where it ends up on iPhone, which handles downloads differently. Then import that file and confirm the entries come back.
- [ ] **Update.** Deploy a small visible change. Open the installed app, close it, and open it again. The new version appears on a later visit.
- [ ] **The address rule.** Open a preview address. The data is empty, which is expected and is why previews are throwaway.

On iPhone, Safari can clear a website's stored data after about a week without use, unless the site is installed to the Home Screen. Installing it, and keeping backups, is the safeguard.
