# Tofu gallery copy

This repository is Tofu's copy of **gymcoach-app/gymcoach** (licence: MIT), listed in Tofu's app gallery as **GymCoach**.

- `main` mirrors the upstream repository and is never committed to by Tofu.
- `tofu` carries Tofu's own changes; tags named `pin/<date>` mark the versions the gallery points to.
- A visitor who chooses this app gets a private snapshot of the pinned version in their own Tofu account. Their copy does not follow upstream updates.

Upstream: <https://github.com/gymcoach-app/gymcoach>, commit `91d70e44bcacdc6beea52c765ad1b3f52c5f8662` (2026-10-27, "fix(security): harden rate limits, body caps and response headers (#531)").

## What it is

A workout log made for phones. You log your sets in the gym (start the workout with signal: if the signal then drops, the sets you log while the workout screen stays open are kept on the phone and sent once the app is open with signal again, with the limits listed below), follow a training plan, see your history on a calendar, and watch your lifts, weekly volume and bodyweight in charts. It imports exports from Strong, Hevy and its own CSV, and TCX, GPX and FIT files from watches. It keeps progress photos, and has an AI coach and chat that work once the owner adds their own AI key. Each account sees only its own training.

## How Tofu runs it

- **Preset** `nextjs` (Next.js 15.5), **root folder** the repository root. The root `Dockerfile` is upstream's self-hosting image: Tofu's detector reads it as `container`, so the gallery sets `nextjs` itself.
- **Install** `npm ci` from `package-lock.json`; its `postinstall` runs `prisma generate`, which writes the database client and connects to nothing. **Build** `npm run build` (`next build`). `next.config.js` asks for `output: 'standalone'`, which Tofu's server hosting does not need and ignores.
- **Database**: the copy's own managed PostgreSQL. The app reads `DATABASE_URL` (the transaction pooler, port 6543, `?sslmode=require`) and `SUPABASE_CA_CERT`, both saved by Tofu. It sends no named prepared statements (Prisma's `@prisma/adapter-pg` names none), so the transaction pooler is fine.
- **Schema**: `supabase/migrations/`, 30 files, which Tofu applies before each build, one transaction per file, recording each one so it never runs twice. Nothing the app does at build or at start touches the schema, so the several starts Tofu makes of a new deployment cannot race over it.
- **Settings**: none are needed to start. Public settings the gallery saves or offers:
  - `DISABLE_SIGNUP` = `true` closes sign-up (below). Unset, sign-up is open.
  - `MCP_PUBLIC_URL`, the copy's own address, used in the connector link the app shows for ChatGPT and other remote MCP clients (Settings, personal access tokens). Unset, the app uses the address the request came to.
- **Owner secrets** (hidden values only the owner can add, on the app's Keys & settings page): `ANTHROPIC_API_KEY` or `OPENROUTER_API_KEY` turns on the AI coach, the chat, the AI program generator and "Parse with AI". Either one alone is enough (with `LLM_PROVIDER` unset, a copy that has only `OPENROUTER_API_KEY` uses OpenRouter). Optional public settings: `ANTHROPIC_MODEL` (default `claude-opus-4-7`), `OPENROUTER_MODEL`, `LLM_PROVIDER` (`anthropic`, `openrouter`, `codex-lb` or `demo`). Without a key, the coach, chat and AI program generator pages say which key the owner adds (the generator's goal box and button stay off), "Parse with AI" in a workout says the same, and everything else works.
- **Session key**: `JWT_SECRET` is not needed. When it is unset, the key that signs sign-in sessions is derived from `DATABASE_URL` (below). An owner who wants their own can save `JWT_SECRET` (32 characters or more) as a hidden value; everyone then signs in again.

## What Tofu changes

Every code file Tofu changes says so in a comment that starts with `Tofu:`. `package.json` cannot hold comments, so this list covers it.

- `package.json`: `postinstall` is `if [ -f prisma/schema.prisma ]; then prisma generate; fi` (it was `node -e "…"` doing the same). Tofu reads an install or build that runs `node` as code it cannot read, and then leaves `supabase/migrations/` to the app, which would leave a new copy's database empty. The shell test keeps upstream's reason for the guard: the Docker image installs before it copies the schema.
- `supabase/migrations/` (new, 30 files): 29 are `prisma/migrations/<version>_<name>/migration.sql`, copied unchanged to `supabase/migrations/<version>_<name>.sql` with a header comment, and the 30th is Tofu's own (`20261027120000_tofu_progress_photo_in_database`, below). Every file that makes tables ends by turning row-level security on, with no policy, for each table it makes: 22 tables in all, the whole schema. A Tofu database opens the tables these files make to Supabase's Data API roles; with row-level security on, those roles read and change no row. The app is not limited: Tofu applies the files over the app's own connection, which then owns the tables, and the files do not force the policy. `prisma/migrations/` stays for Prisma's own tools, so a new Prisma migration has to be copied here too, with the same lines for any table it makes. Never edit a file here once a copy has run it: Tofu does not run an applied file again.
- `lib/tofu-database.ts` (new) and `lib/db.ts`: Tofu's `DATABASE_URL` carries `sslmode=require`, which node-postgres reads as full certificate verification, and the database's certificate chains to a root Node does not ship. When `SUPABASE_CA_CERT` is set, the URL's own TLS parameters are removed and the server is verified against that certificate plus Node's own roots. Verification is never turned off. Without `SUPABASE_CA_CERT` nothing changes.
- `lib/auth.ts`: with `JWT_SECRET` unset, the session signing key is HMAC-SHA-256 of a fixed label keyed with `DATABASE_URL`, computed with Web Crypto, which the middleware (Edge runtime) and the server (Node) share, so both get the same key. Upstream could sign nobody in without `JWT_SECRET`. If the database's address or password ever changes, the key changes with it and everyone signs in again; nothing else is lost.
- Sign-up switch, read on the server at each request (new): `lib/signup.ts`; `app/api/auth/register/route.ts` answers 403 while `DISABLE_SIGNUP` is `true`; `app/(auth)/signup/page.tsx` then says sign-up is closed; `app/(auth)/login/page.tsx` and `components/auth/login-form.tsx` stop offering it; `messages/*/auth.ts` hold the two new sentences in all seven languages. Accounts that already exist keep signing in.
- Progress photos, kept in the database: Tofu's hosting keeps no files between requests, and upstream wrote each photo to `UPLOADS_DIR` on the server's disk. `prisma/schema.prisma` gives `ProgressPhoto` an `imageData` column and lets `storagePath` be empty (`prisma/migrations/20261027120000_tofu_progress_photo_in_database` and its copy in `supabase/migrations/`). `app/api/progress-photos/route.ts` stores a new photo's bytes in the row; `…/[id]/image/route.ts` serves them (a photo stored as a file before is still read from its file); `…/[id]/route.ts` removes a file only when the photo has one. `components/progress/photos-card.tsx` shrinks each photo in the browser before sending it: at most 1600 pixels on its long side, as a JPEG, which also drops the camera's metadata, such as where the photo was taken. The server still checks the type by the file's own bytes and caps the size at 8 MiB. `tests/integration/progress-photos-route.test.ts` checks the new storage.
- `lib/llm/index.ts`: with `LLM_PROVIDER` unset and only `OPENROUTER_API_KEY` saved, the app uses OpenRouter. `messages/*/coach.ts`: the coach and chat pages say the owner adds the key to the app's settings as a hidden value (upstream said "in .env").
- AI features without a key, everywhere else (upstream let them fail with a bare variable name): `app/(app)/programs/generate/page.tsx` asks the active provider, as the coach page does, and `components/programs/program-generator.tsx` then shows the same note ("Anthropic key missing" and a sentence saying the owner adds the key to the app's settings, as a hidden value) and turns off the goal box and the Generate button (`messages/*/programs.ts`, `generator.keySetup`). `lib/llm/types.ts` (`missingKeyMessage`), `anthropic.ts`, `openrouter.ts` and `codex-lb.ts`: a request made without a key answers 503 with "The owner of this GymCoach turns on the AI features by adding <key> to the app's settings, as a hidden value." instead of "<key> is not configured.". `app/api/sets/parse/route.ts` answers 503 with the key's name once the exercise's ownership is checked, and `components/session/set-input.tsx` then says the owner turns on "Parse with AI" by adding that key, and that the shorthand works without it (`messages/*/session.ts`, `input.parseKeyMissing`); upstream answered "Could not parse that". Tests: `lib/llm/llm.test.ts`, `components/session/set-input.test.tsx`, `tests/integration/set-parse-route.test.ts`.
- Phone layout: on a 390-pixel-wide screen two rows ran past the right edge, so the page scrolled sideways. The programs page's title row (`app/(app)/programs/page.tsx`) and the import row in Settings (`components/settings/import-section.tsx`) now wrap.

Removed, because Tofu's safety check warned about them and every copy's deploy answer repeated the warnings, though a copy needs none of these files and the warnings do not apply to it:

- `.github/workflows/publish-image.yml`: upstream's workflow that builds its Docker image and pushes it to upstream's own registry (`ghcr.io/gymcoach-app/gymcoach`) once upstream's CI passes on `main`. Tofu's safety check read its `workflow_run` trigger, with its checkout of the commit that CI run tested, as "Workflow runs pull-request code with the repository's secrets". A copy is built by Tofu from its files and publishes no image, and the workflow never ran on this fork: its own guard limits it to `gymcoach-app/gymcoach`.
- `evals/maintainer/` (18 files, the whole of `evals/`): upstream's harness that grades the AI agent maintaining upstream's code on replayed coding tasks; its README says the app never imports it and the Docker image leaves it out. Its tests hold lines such as `eval(code);` as samples of what its tamper screen rejects, which Tofu's safety check read as "Code is executed from a value built at runtime". Nothing in the app, its build or its other tests uses the folder. `npx vitest run` no longer runs its 5 test files (164 tests); `vitest.config.ts` still lists `evals/**/*.test.ts`, which now matches nothing, and `next lint` skips a missing folder, so the `lint` script's `--dir evals` changes nothing. Upstream's own notes (`CHANGELOG.md`, `docs/loops/`, `automation/README.md`) still mention the folder, which stays in upstream's repository.

The rest of upstream's CI, Docker and agent files stays as it is (`.github/workflows/ci.yml` and `deploy-demo.yml`, `.github/actions/`, the issue and pull-request templates, `docker-compose*.yml`, `.claude/`, `automation/`): Tofu's safety check passes them and Tofu does not run them. GitHub has run none of upstream's workflows on this fork (on 2026-10-27 its list of this repository's workflows held only GitHub's own CodeQL scan), and none would do anything unwanted here: `ci.yml` runs only on pushes to `main` and on pull requests, never on a push to `tofu` or a tag, and it only tests and builds, with no secrets and nothing published; `deploy-demo.yml` runs only when started by hand, and this fork holds none of the four secrets it needs to reach upstream's demo server.

## What works differently on Tofu

- **Offline logging works only in part.** This is upstream's own code, which Tofu has not changed; what it does was measured in a real browser (below). What works: once a workout was started with signal, the sets you log after the signal drops are taken while the workout screen stays open, kept on the phone (the header says "Offline · 2 pending"), and sent when the app is open with signal again. What does not:
  - Starting a workout with no signal starts nothing and turns the page into a blank "Application error" message.
  - Reloading or reopening the workout with no signal, or closing the app, shows the phone's own "This site can't be reached" until the signal is back; the sets already logged stay on the phone. Other screens, such as History, do not open with no signal either.
  - Nothing is sent while the app is closed.
  - A set whose send is cut off, for example by a reload, can stay "syncing" for good: the app never sends it again, and it never reaches History or the chart.
  - Once sets are sent, opening the workout again lists each set twice, and the summary before you finish counts them twice, even when the signal never dropped. The saved workout, History and the chart count each set once.

  A copy that was just deployed again may need one reload before the newest version shows.
- **No email and no reminders.** GymCoach sends no email and no notifications, on Tofu or anywhere: there is no "forgot password". Someone who forgets their password cannot reset it in the app. The rest timer runs in the open page.
- **Photos** live in the copy's database and count toward its size. Shrunk in the browser, one is usually 150 to 500 KB.
- **Limits on sign-in attempts and imports** are kept in each server process's memory, and Tofu runs several processes, so they are looser than on a single server.
- **The AI features** wait for the owner's own key (above).
- **Backups**: Settings, Data, "Export all my data (JSON)" downloads the account's data (progress photos are not in it, as upstream).

## Who can open a copy, and who can sign up

A new copy is online at its own address before its owner opens it, and anyone who opens it can make an account until sign-up is closed. Accounts are separate: each sees only its own training, and none of them is an administrator, so nobody who signs up first can take the copy over. But anyone with an account can use the owner's AI key, once one is added. The owner should make their own account first, then save the public setting `DISABLE_SIGNUP` = `true` and deploy again. To let someone else in later, set it back to `false`, let them sign up, and close it again.

## Needs a real deploy to verify

- The first deploy applies the 30 files in `supabase/migrations/` before the build (the deploy's database note says so), and the database then holds the 22 tables, each with row-level security on; the deploy's answer carries no row-level security warning.
- The deploy's answer carries no warning from Tofu's safety check (its check of this branch found nothing, below).
- The build log shows `prisma generate` from `postinstall`, then `next build`, and no `prisma migrate`.
- The app reaches its database through the real pooler with `SUPABASE_CA_CERT` (no `SELF_SIGNED_CERT_IN_CHAIN`, no prepared-statement errors in the runtime logs).
- A session made by one request is accepted by the next, through the middleware and the API, across Tofu's processes, with `JWT_SECRET` unset.
- `bcrypt`'s native module loads in Tofu's server functions (sign-up and sign-in answer 200).
- A progress photo uploads (the request stays under the hosting's request size limit once shrunk), reads back and deletes.
- With `DISABLE_SIGNUP` = `true` saved and the copy deployed again, the sign-up page says sign-up is closed and the register request answers 403.
- With no AI key saved, the AI program generator page, the generate request and "Parse with AI" say which key the owner adds (the live check sends those two requests only while no key is saved).
- `live-check.py` (kept outside this repository) passes against the copy's address.

## Licence

MIT: `LICENSE` and every copyright line stay exactly as upstream wrote them. The exercise technique photos in `public/exercise-media/free-exercise-db/` come from [free-exercise-db](https://github.com/yuhonas/free-exercise-db), released under the Unlicense (`public/exercise-media/free-exercise-db/LICENSE.md`); they show real people demonstrating exercises. The app uses the system's own fonts and bundles none. "GymCoach" and its logo are upstream's; Strong and Hevy are other apps' names, used only to say which exports it reads. MIT asks for no source offer, so a copy shows no source link.

## Verification (2026-10-27)

On macOS arm64 with Node 22.22.3 and npm 10.9.8, against 127.0.0.1 only, nothing deployed.

- `npm ci`, then `npx tsc --noEmit` (clean), `npx vitest run` (168 files, 1918 tests passed) and `npm run build` (passed; its one lint warning, an unused `extractBlocks` in `lib/import/`, is upstream's).
- A scratch PostgreSQL 14 database owned by a role that is not a superuser, with each file in `supabase/migrations/` applied in its own transaction over that role, as Tofu applies them: 22 tables in `public`, all with row-level security on, none forced, all owned by the app's role. Upstream's integration tests (`npx vitest run --config vitest.integration.config.ts`) against a database made that way, with that role: 47 files, 417 tests passed, the progress-photo routes among them.
- File modes: `git archive tofu`, unpacked with every file's execute bit removed, then `npm ci`, `npm run build` and `next start` from that tree: the build passed, `/login` answered 200 and a sign-up 200. Nothing in the build runs a repository file directly.
- `next start` against it with `JWT_SECRET` unset: the live check (a script kept outside this repository) passed 25 checks: the sign-in page and PWA manifest; a visitor with no session sent to `/login` and refused by the API; the first account made and signed in; its starter catalog of 55 exercises; a program made, a workout started, a set logged, the workout finished and read back through the API and the history page; a progress photo stored, read back byte for byte and deleted; the coach page naming the key the owner adds; signing out, a wrong password refused, signing back in.
- A second server with `DISABLE_SIGNUP=true`: the sign-up page said sign-up is closed and showed no form, the sign-in page offered no sign-up link, the register request answered 403 and made no account, and an existing account still signed in.
- Five servers started at the same moment against a new database the migration files had just made: all five answered `/login` with 200, five sign-ups sent at once (one to each) all answered 200 and seeded 275 exercises, and the schema (`pg_dump --schema-only`) was the same before and after.
- A scratch PostgreSQL that only takes TLS, with a certificate from a certificate authority Node does not ship, `DATABASE_URL` ending in `?sslmode=require` and `HOME` an unreadable folder: with that authority in `SUPABASE_CA_CERT`, sign-up and reading the profile answered 200; without it, the connection was refused (`unable to verify the first certificate`). The app runs as one Node process that connects through node-postgres, not libpq, so the libpq certificate files under `HOME` play no part.
- Headless Chromium at 390×844 (a phone) and 1200×750: 19 pages each, the program, exercise, history and print pages among them, all answered 200 with no page or console errors, nothing wider than the screen and nothing under a bar fixed to the bottom.
- Tofu's own check (its GitHub import, the static lane's predicates and the safety check): on upstream's `main`, safety ok with 25 findings and none blocking; on `tofu` before this section was written, safety ok with 3 findings and none blocking, and not a site the Free plan's static hosting takes (server code; 922 files to publish, past its 500). The check on the pin itself is in the gallery's records.

### After review (2026-10-27): the AI features without a key

Same machine and versions, against 127.0.0.1 only, nothing deployed.

- `npm ci`, `npx tsc --noEmit` (clean), `npx vitest run` (168 files, 1920 tests passed: the earlier 1918 and the two added) and `npm run build` (passed, the same one upstream lint warning).
- A new scratch database made by the 30 files in `supabase/migrations/`, each in its own transaction over a role that is not a superuser: 22 tables, all with row-level security on, none forced. Against a second one made the same way, with no AI key and `LLM_PROVIDER` unset: `tests/integration/set-parse-route.test.ts`, `route-ownership.test.ts` and `route-ownership-coverage.test.ts`, 3 files, 75 tests passed. "Parse with AI" without a key answers 503 naming `ANTHROPIC_API_KEY`, and a stranger's exercise still answers 404 first.
- `next start` with no AI key and `JWT_SECRET` unset: the live check passed 28 checks, the earlier ones and three more: the AI program generator page tells the owner to add `ANTHROPIC_API_KEY`; generating a program answers 503 with "The owner of this GymCoach turns on the AI features by adding ANTHROPIC_API_KEY to the app's settings, as a hidden value."; "Parse with AI" answers 503 and names the key. A second server with a placeholder `ANTHROPIC_API_KEY`: the coach and generator pages asked for no key, and the check sent no AI request.
- Headless Chromium at 390×844 (a phone) and 1200×750: the generator page shows "Anthropic key missing" with the owner's sentence, and its goal box and Generate button are off; in a live workout, "Parse with AI" shows the owner's sentence. The generator, programs, coach, progress, history and workout pages answered 200 with no page error and nothing wider than the screen.

### After a deploy (2026-10-27): the safety check's three warnings

A deploy of `pin/2026-10-27.1` on Tofu went through, but its answer carried three warnings from Tofu's safety check, for the person's agent to read out: two in `evals/maintainer/runner.test.ts` and one in `.github/workflows/publish-image.yml`. The workflow and the whole of `evals/maintainer/` were removed (above). Same machine and versions, against 127.0.0.1 only, nothing deployed. Only files that the app, its build and its other tests do not use were removed, so the database certificate, file mode and simultaneous start checks were not run again.

- `npm ci`, `npx tsc --noEmit` (clean), `npx vitest run` (163 files, 1756 tests passed: the earlier 168 files and 1920 tests, less the 5 files and 164 tests of `evals/maintainer/`; every other file ran as many tests as before), `npm run lint` and `npm run build` (both passed, with the same one upstream lint warning).
- The build did not change: `pin/2026-10-27.1` and this branch, built one after the other in the same folder, give the same route table and the same 257 JavaScript files (chunks, pages, routes, the service worker) byte for byte once the build's random id is set aside. The only other differences are in 85 of Next.js's manifests, which hold the same data with their keys in another order; a second build of this branch differs from the first in the same way, and in the service worker.
- A new scratch database made by the 30 files in `supabase/migrations/`, each in its own transaction over a role that is not a superuser: 22 tables, all with row-level security on, none forced. `next start` against it with no AI key and `JWT_SECRET` unset: the live check passed its 28 checks, as before.
- Tofu's own check on `tofu` with the two removals (`2742d54`): safety ok with 0 findings, so a copy's deploy answer carries no note from it; 999 files, and still not a site the Free plan's static hosting takes (server code; 905 files to publish, past its 500).

### Offline test (2026-10-27): what works without a signal

A test in a real browser of `pin/2026-10-27.2`, against 127.0.0.1 only, nothing deployed: `npm ci` and `npm run build`, which writes the service worker (`public/sw.js`, which downloads 294 files, about 13 MB, on the first visit), then `next start` with `NODE_ENV=production` and `JWT_SECRET` unset, against a scratch PostgreSQL 14 that only takes TLS, with the 30 files in `supabase/migrations/` applied. Headless Chromium at a desktop size, the connection cut with the browser's own offline switch, an account made on the sign-up page, two runs (a test script kept outside this repository).

- Starting a workout with no signal: nothing started, and the page became a blank "Application error: a client-side exception has occurred". With signal, the workout opened.
- With the workout open and the service worker in control, two sets logged with no signal were both shown, the header said "Offline · 2 pending", and the server had received none.
- A reload with no signal failed (the browser's own error page), and History did not open: the workout page had been opened from inside the app, and the service worker keeps only pages that were loaded in full.
- Back online, the sets reached the server within 2 seconds while the app was open; with the app closed, nothing was sent until it was opened again with signal.
- In the second run, the reload cut one set's send off: that set stayed "syncing", was never sent again, and was missing from History and the chart.
- Opening the workout again showed every sent set twice (4 rows for 2 sets), also for a set logged with no drop at all. History and the chart counted each set once.
