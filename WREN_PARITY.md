# Wren Pocket Studio — web desk parity

Every row is implemented against flowtrackai-crm APIs (no invented endpoints).

| Capability | Web source | Pocket screen / route | Notes |
|---|---|---|---|
| Auth login | `POST /api/auth/login` | `/sign-in` · `src/data/crm.tsx` `login` · `src/lib/api.ts` `authApi.login` | Email/password; routes to 2FA when `requires2FA`. |
| 2FA verify | `POST /api/auth/verify-2fa` | `/verify-2fa` · `src/data/crm.tsx` `verify2fa` · `src/lib/api.ts` `authApi.verify2fa` | Challenge token + code from login. |
| Session restore (me) | `GET /api/auth/me` | `src/data/crm.tsx` `refreshSession` · `src/lib/api.ts` `authApi.me` · boot via `src/app/index.tsx` / `(tabs)` | Restores user, finds Wren, loads desk + live. |
| API base setting | Hosted CRM base (default `https://flowtrackai-crm.vercel.app`) | `/sign-in` (custom base) · `/(tabs)/settings` · `src/lib/session.ts` `getApiBase` / `setApiBase` | Stored in AsyncStorage (`wren.api.base`). |
| Secure token storage | Session cookie / token on web | `src/lib/session.ts` (`SecureStore` + AsyncStorage fallback) | Bearer token key `wren.session.token`. |
| Find Wren (`website_architect`) | `GET /api/ai-employees` · role `website_architect` | `src/data/crm.tsx` `findWren` · `src/lib/wrenConstants.ts` `WREN_ROLE_ID` | Resolves Wren employee id for all desk calls. |
| Desk GET run-architect prospects+kpis | `GET /api/ai-employees/:id/run-architect` | `/(tabs)` desk index · `src/data/crm.tsx` `loadDesk` · `src/lib/api.ts` `deskApi.load` | Prospects list + KPI funnel counts. |
| Pipeline filters Scout/Analyse/Build/Outreach/Sent/Client | Desk funnel chips | `/(tabs)` · `src/lib/wrenConstants.ts` `WREN_FUNNEL` · `setStatusFilter` | Maps to `assigned` / `analyzed` / `queued_build` / `outreach_drafted` / `built` / `converted`. |
| Prospect search | Desk search field | `/(tabs)` search input | Client filter on company, contact, email, URL, status. |
| Open prospect | Prospect detail | `/prospect/[id]` | Analysis, outreach, actions, follow-up entry. |
| Mission control tasks (all 6) | Desk mission checkboxes | `/(tabs)` Mission control · `src/lib/wrenConstants.ts` `WREN_RUN_TASKS` | Internet scout, Buddy ingest, Analyse sites, Build one-pagers, Draft outreach, Pitch demo video. |
| POST run tasks | `POST /api/ai-employees/:id/run-architect` `{ tasks }` | `/(tabs)` “Run selected tasks” · `src/data/crm.tsx` `runTasks` · `deskApi.run` | Starts selected mission tasks. |
| Prospect actions analyze/build/outreach/skip/demo_video | `PATCH /api/ai-employees/:id/run-architect` `{ prospectId, action }` | `/prospect/[id]` · `src/data/crm.tsx` `prospectAction` · `deskApi.patch` | Analyse, Build, Outreach, Skip, Demo video. |
| Active builds list | Live builds board (list) | `/(tabs)/builds` (list mode) · desk “Active builds” preview on `/(tabs)` | Filters prospects with buildDelivery activity. |
| Active builds grid | Live builds board (grid) | `/(tabs)/builds` grid toggle | Same data, two-column layout. |
| Build status/stack/repo/PR/files/activity/errors | Build card / detail on web | `/build/[id]` · list cards on `/(tabs)/builds` | Status, `appKind` stack, repo/PR links, changed files, activity/current, error/expoError. |
| Live updates SSE or poll | `GET /api/ai-employees/:id/wren-live` (SSE) + desk refresh | `src/data/crm.tsx` `startLive` · `src/lib/api.ts` `liveUrl` | SSE on web runtime; 4s poll on native / SSE failure. |
| Expo Go QR | Live board Expo QR | `/(tabs)/builds` · `/build/[id]` | Shows `expoQrUrl` for RN/native builds. |
| Expo Go open link | Live board Expo Go link | `/(tabs)/builds` · `/build/[id]` | Opens `expoGoUrl` via Linking. |
| No Vercel deploy on RN builds | Web hides Vercel deploy for RN | `/(tabs)/builds` · `/build/[id]` | Note + no Vercel CTA when `appKind` is React Native; Vercel link only for non-native. |
| Follow-up add to this app | Follow-up / “add to this app” | `/follow-up-sheet` · entry from `/build/[id]`, `/prospect/[id]`, `/(tabs)/builds` · `crm.followUp` | `PATCH` action `follow_up`. |
| Follow-up with jobFiles upload via wren-prompt | Upload then attach to follow-up | `/follow-up-sheet` · `src/lib/upload.ts` · `POST …/wren-prompt` chunk/upload | Files uploaded first, then sent as `jobFiles`. |
| Store-ready follow_up prompt | Store-ready follow-up template | `/follow-up-sheet` (`storeReady=1`) · `src/lib/wrenConstants.ts` `storeReadyPrompt` | Prefills store-ready text; “Use store-ready prompt” button. |
| Prompts tab design direction | Prompts tab · `architectConfig.designDirection` | `/(tabs)/prompts` · `saveArchitectConfig` | Saves `designDirection` (+ `promptAssets`) via PUT employee. |
| Prompts upload references | Prompts reference uploads | `/(tabs)/prompts` · `src/lib/upload.ts` | Chunked `wren-prompt` upload; role `reference`. |
| Prompts send to build | Prompts “send to build” | `/(tabs)/prompts` · `wrenPrompt` action `send` | Sends direction + assets to in-progress build. |
| Desk options builder/cursorModel/jobKind/appKind PUT architectConfig | Desk options · `PUT /api/ai-employees/:id` `{ architectConfig }` | `/desk-options-sheet` · also from `/(tabs)` and `/(tabs)/settings` · `crm.saveArchitectConfig` | Builder, Cursor model, job kind, app kind. |
| Job chat talk | Job chat · `wren-prompt` action `talk` | `/(tabs)/job` · `wrenPrompt({ action: 'talk' })` | Chat with history, brief, stack, file excerpts. |
| Brief rewrite kept/changed accept | Talk reply kept/changed + accept | `/(tabs)/job` pending-brief UI | Shows kept/changed; Accept brief / Keep mine. |
| Attach files upload/chunk | Job attachments · `wren-prompt` `upload` / `chunk` | `/(tabs)/job` · `src/lib/upload.ts` | Chunked uploads (≤60 MB), progress via parts. |
| File roles | Attachment role picker | `/role-sheet` · Job attachment chips · `src/lib/wrenConstants.ts` `JOB_FILE_ROLES` | logo, app_icon, photo, screen_design, etc. |
| Import desks + import_desk | Import desk · `desks` / `import_desk` | `/(tabs)/job` · `wrenPrompt` actions `desks`, `import_desk` | Lists desks then imports brief + assets. |
| Stack picker | Job stack selector | `/(tabs)/job` · `src/lib/wrenConstants.ts` `WREN_STACKS` | auto / html / react / next / react-native. |
| Plan action + full plan fields | Plan · `wren-prompt` action `plan` | `/(tabs)/job` Plan section · `planText` helper | product, screens (purpose/contents/actions/states/data), flow, integrations, assumptions, suggested. |
| Accept suggestion | Plan suggested screens | `/(tabs)/job` · `acceptSuggestion` in `wrenConstants.ts` | Adds suggested screen into plan.screens. |
| Design board | Design board · `wren-prompt` action `board` | `/(tabs)/job` “Design board + icon” | Creates screen_design assets from plan screens. |
| Design redraw screen | Redraw · `wren-prompt` action `screen` | `/(tabs)/job` redraw fields | Replaces screen_design for named screen. |
| Design app icon | App icon · `wren-prompt` action `icon` | `/(tabs)/job` (native cook path) | Sets `app_icon` asset after board for RN. |
| Screen PDF designs_pdf | Screen PDF · `wren-prompt` action `designs_pdf` | `/pdf-sheet` (from Job) | Builds PDF from selected screen URLs/labels. |
| PDF copy | PDF copy · `wren-prompt` action `pdf_copy` | `/pdf-sheet` | Generates copy text for the PDF. |
| PDF uncheck/preview/share | PDF screen toggles + share | `/pdf-sheet` | On/Off per screen; preview copy; share/save via expo-sharing. |
| Store-ready checkbox on RN cook | Store-ready on cook | `/(tabs)/job` checkbox · `appendStoreReady` | Appends store-ready instructions when native + checked. |
| Cook add_website | Cook · `PATCH` action `add_website` | `/(tabs)/job` Cook · `crm.cookJob` | Sends websiteUrl, buildRequest, jobFiles, stack. |
| Show cooked build live | Navigate to live build after cook | `/(tabs)/job` → `/(tabs)/builds` · `/build/[id]` · live merge in `crm.tsx` | After cook, opens Builds; liveMap merges into delivery. |
