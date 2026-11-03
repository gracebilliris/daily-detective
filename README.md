# Daily Detective

A quiet desk, a little intrigue, and three original, non-graphic village mysteries. Follow staged scene clues, interviews, and records; pin evidence and keep your own notes; then name the person, their reason, and the two clues that prove both.

**Play:** https://gracebilliris.github.io/daily-detective/

## Run

Requires Node.js 22 and npm.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5188. The port is exclusive: the server fails rather than silently switching ports.

## How to investigate

- Read open leads to unlock further testimony and records. Locked leads explain their prerequisites.
- Use initial statements, notes, pins, and optional progressive hints to build your theory.
- Select a suspect, motive, and exactly two discovered clues: one establishes the action, the other explains the reason.
- Unsupported accusations never win or immediately reveal the answer. A correct deduction unlocks the explanation and ending.
- The daily selection rotates through the three cases using your **local calendar date**; the archive always offers all cases. These are three handcrafted cases, not an endless feed.
- Notes, discoveries, pins, hints, attempts, and endings are saved per case in localStorage on this browser. No account or network service is involved. Reloading retains progress; clearing browser data removes it. Restart asks for confirmation and resets only the current case.

All people, places, and events are fictional. No external images, fonts, accounts, API keys, or runtime APIs are required. The interface supports keyboard controls, visible focus, reduced motion, narrow screens, and screen-reader labels.

## Validate

```sh
npm test
npm run build
npm run preview
```

The unit suite checks every case's reachability and solution, locked evidence, incorrect theories, progressive hints, local-date rotation, and defensive save loading. The browser check exercises a whole case, wrong accusation, notes/pins, archive, persistence, confirmed restart, keyboard entry, mobile layout, and local/published assets.

In this workspace Playwright is supplied by the neighboring installed test package; no files there are modified:

```sh
PLAYWRIGHT_MODULE=/Users/gracebilliris/Projects/brick-by-brick/node_modules/@playwright/test/index.mjs npm run test:browser
BASE_URL=https://gracebilliris.github.io/daily-detective/ PLAYWRIGHT_MODULE=/Users/gracebilliris/Projects/brick-by-brick/node_modules/@playwright/test/index.mjs npm run test:browser
```

Elsewhere, point `PLAYWRIGHT_MODULE` to an existing Playwright module with Chromium installed. Browser screenshots and reports stay in ignored `artifacts/`.

## Deploy

The public `main` branch deploys through `.github/workflows/pages.yml`. In GitHub **Settings → Pages**, choose **GitHub Actions** as the source (API equivalent: `gh api --method POST repos/gracebilliris/daily-detective/pages -f build_type=workflow`). The workflow uses Node 22, `npm ci`, unit tests, production build, and the official Pages configuration/upload/deploy actions. It needs contents-read, pages-write, and id-token-write permissions.

Vite's base is `./`, so built assets work beneath `/daily-detective/` and other static subdirectories. Dependencies, build output, local saves, environment files, and browser artifacts are not committed.
