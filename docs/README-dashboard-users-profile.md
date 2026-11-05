# Dashboard, top bar, users and profile — notes for the team

Author: Piyapong Ausawarachan (branch `dashboard`).
This file explains what this part of the code does, where everything lives, and what changed in shared files,
so whoever works on it next does not have to read every commit.

## 1. What this part covers

| Feature | Page / API | Who can use it |
|---|---|---|
| Home dashboard (role-based work queues) | `/dashboard`, `GET /api/dashboard` | everyone signed in; extra sections depend on role |
| Top bar and navigation (desktop dropdowns, phone tab row, account menu) | every page, via `AppShell` | everyone |
| User management (search, filter, sort, paging, change role, deactivate) | `/users`, `GET/PATCH /api/users…` | `lab_manager` only |
| My profile (first-time setup, view, edit, picture, banner) | `/profile`, `/profile/setup`, `/profile/edit`, `/api/users/me…` | everyone |
| Other people's profiles | `/users/[id]`, `GET /api/users/:id` | everyone (private fields only for yourself and the Lab Manager) |
| Theme: Vase Lab logo, blue light mode, purple dark mode | `app/globals.css`, `components/icons.tsx`, `app/icon.svg` | — |

### Dashboard rules by role

`backend/services/dashboard/access.js` decides who sees what. The rules follow the existing routes, so the
dashboard never shows more than the page behind it would:

- **requests needing attention:** `ta`, `lecturer` and `lab_manager` (same as `utils/requestStatus.isStaff`)
- **lab sessions waiting for approval:** `lecturer` and `lab_manager` (same as `labSessionRoutes`)
- **new members without a role:** `lab_manager` only
- everything else (my requests and sessions, consumables low on stock / expiring, equipment status, the room
  timeline) is shown to everyone.

`GET /api/dashboard?from=&to=` takes an optional time window for the room timeline (both or neither, `to` after
`from`, at most 48 hours). The browser sends its own local midnight so "today" matches the user's clock.
The route uses `requireAuth` and `requireActiveUser`, so a changed role or a deactivated account applies at once.

## 2. Where the code lives

### Backend (`source/backend`)

```text
routes/
  dashboardRoutes.js         GET /api/dashboard (validates the window with zod, then buildDashboard)
  userRoutes.js              /api/users — only puts the parts below together, plus GET /:id
  myProfileRoutes.js         GET/PATCH /api/users/me
  myImageRoutes.js           PUT /me/avatar, PUT /me/banner, DELETE /me/banner
  userManagementRoutes.js    GET /, PATCH /:id/role, PATCH /:id/active (lab_manager, per-route middleware)
services/dashboard/
  index.js                   buildDashboard(prisma, user, options) — puts the sections together
  access.js                  role rules (above)
  myWork.js, mySessions.js   "my requests / my sessions"
  attention.js               needs attention → requestAttention.js, sessionQueue.js, new members
  inventory.js               re-exports consumables.js and equipment.js
  rooms.js                   room timeline
  helpers.js, stockHelpers.js  small pure helpers (status counts, stock levels)
services/users/
  fields.js                  ROLES, PUBLIC_FIELDS, ALL_FIELDS (never googleId)
  validation.js              httpError, parseUserId, text checks
  profileData.js             turns a PATCH /me body into Prisma data
  userList.js, userFilters.js  query string of GET /api/users → where / orderBy / paging
  routeHelpers.js            rawImage, requireImageBody, updateUser, requireUserExists
```

Important: `userRoutes.js` mounts the sub-routers in order — `/me` routes first, then management, then `GET /:id` —
so that `"me"` is never read as an id. The Lab Manager check is **per route** (`managerOnly`), not
`router.use(requireRole(...))`; a `router.use` inside a mounted sub-router would block `GET /:id` for everyone else.

### Frontend (`source/frontend`)

```text
app/dashboard/page.tsx       the Home page (uses hooks/useDashboard.ts)
app/users/page.tsx           gate: only the Lab Manager gets components/users/UserManagement
app/users/[id]/page.tsx      AppShell + components/profile/view/UserProfile
app/profile/…                view / setup / edit (components/ProfileView.tsx, ProfileForm.tsx are thin wrappers)
components/AppShell.tsx      the page frame (re-exports NAV_ITEMS)
components/shell/            top bar: navConfig (links, groups, isActive), navStyles, DesktopNav, NavDropdown(+Menu),
                             MobileNav, MobileTabLink, MobileSubRow, ProfileMenu(+Panel), SignOutIcon, TopBar,
                             ShellContent, useDismiss (click outside / Escape closes a menu)
components/dashboard/        one component per card; sectionOrder.ts decides the order per role,
                             mainRenderers.tsx maps a section name to its component
components/users/            list state: useUserQuery (search/filter/paging) + useSorting + useDebounced → useUserList;
                             actions: userChanges.ts (confirm text + request) → useUserActions (+ useNotice);
                             UI: UserFilters, FilterSelects, UserCards (phones), UserTable/UserRow/SortHeader (tablet+),
                             NameBlock, RoleSelect, ActiveButton, UserPager, ListMessage, ErrorAlert, Notice
components/profile/          form state: useProfileForm → useProfileSubmit (+ useSaving) and useProfileImages (+ useImagePick);
                             saving: saveImages.ts, saveProfile.ts (saveAll); UI: SetupLayout, EditLayout, EditSections,
                             FieldGroups, TextField, BioField, PhotoPicker, PhotoHints, BannerEditor, BannerButtons,
                             HiddenFileInput, SaveBar, ErrorBanner
components/profile/view/     the read-only profile: ProfileLayout, ProfileHeader, ProfileDetails → BasicInfo,
                             ContactInfo, AccountInfo; UserProfile + useUserById + BackLink for /users/[id]
lib/dashboard*.ts            types, fetch, time window, item builders, UI helpers for the dashboard
lib/ui.ts                    shared Tailwind class strings (buttons, inputs, cards)
```

Old import paths still work (for example `@/components/ProfileView`, `NAV_ITEMS` from `@/components/AppShell`,
`./StockWatch`, `@/lib/dashboardTime`), because the original files re-export what moved.

## 3. Theme colours (please use these in new code)

Colours are CSS variables in `app/globals.css`, available as Tailwind classes with the `vl-` prefix. Each one already
has a light value (blue tint) and a dark value (purple), so **you don't need a `dark:` class for these**.

| Token | Use for | Example class |
|---|---|---|
| `canvas` | page background | `bg-vl-canvas` |
| `surface`, `surface-2` | cards, menus, inputs | `bg-vl-surface` |
| `hover` | hover / soft grey fill | `bg-vl-hover` |
| `line` | borders and dividers | `border-vl-line` |
| `ink`, `ink-soft`, `muted` | main text, secondary text, hints | `text-vl-muted` |
| `accent`, `accent-hover` | links, primary buttons | `bg-vl-accent` |
| `on-accent` | text **on** an accent background | `text-vl-on-accent` |
| `accent-soft`, `accent-ink` | selected chips / tabs | `bg-vl-accent-soft text-vl-accent-ink` |
| `bar`, `on-bar`, `on-bar-muted`, `bar-hover`, `bar-active`, `on-bar-active` | the top bar | `bg-vl-bar` |

Status colours (red / amber / green) stay as fixed hex values. On an accent button, use `text-vl-on-accent`, not
`text-white`: the dark-mode accent is light purple, so white text on it is hard to read.

## 4. Changes in files owned by other people

I kept these to the minimum. Please keep them when you merge:

- `backend/index.js`: two lines — `require('./routes/dashboardRoutes')` and `app.use('/api/dashboard', dashboardRoutes)`.
- About 20 pages and components (equipment, consumables, rooms, lab sessions, login, RoomForm, EquipmentModal,
  EquipmentPhoto…): **only colour classes** were changed from hex values to the `vl-*` tokens, so they follow the new
  theme. No logic was changed. In the rooms and lab-session pages and `RoomForm`, the primary button text is now
  `text-vl-on-accent`. The equipment search box also got `dark:focus:bg-vl-surface`, so it no longer turns white
  in dark mode.
- `lib/ui.ts`: shared class strings now use the tokens.
- `lib/fonts.ts`: IBM Plex Sans Thai (Thai + Latin) and JetBrains Mono.
- `frontend/package.json`: `npm test` (Vitest + Testing Library + jsdom).

## 5. Tests

```bash
cd source/backend && node --test tests/*.test.js
cd source/frontend && npm test
```

- Backend: `userRoutes.test.js` (47 tests), `dashboardHelpers/Routes/Sections.test.js` (33), plus the auth, image and
  role tests. They use a fake Prisma (`tests/support`), so no database is needed.
- Frontend: 281 tests in 22 files (dashboard, users page, profile form/view, top bar, login, lib helpers).
- Known failures that are **not** from this part: 7 tests in `requestRoutes.test.js` fail because its fake Prisma has
  no `user` model (the routes now call `requireActiveUser`, which reads the user).

## 6. Maintainability Index (MI)

MI = 171 − 5.2·ln(Halstead volume) − 0.23·cyclomatic complexity − 16.2·ln(lines of code), measured per file
(tests not counted). The course target is **MI > 70 for every file**.

| Group | Files | Lowest MI | Average MI |
|---|---:|---:|---:|
| Dashboard frontend | 32 | 70.33 | 84.01 |
| Dashboard backend | 14 | 71.09 | 86.18 |
| Top bar (shell) | 15 | 70.02 | 83.50 |
| Users page | 23 | 70.46 | 87.50 |
| Profile | 41 | 71.15 | 88.24 |
| User API | 10 | 71.83 | 83.42 |

The same code before the refactor: `AppShell.tsx` 10.78, `ProfileForm.tsx` 6.86, `ProfileView.tsx` 37.94,
`app/users/page.tsx` 9.02, `app/users/[id]/page.tsx` 55.48, `routes/userRoutes.js` 22.48.
The behaviour did not change; all the tests above passed before and after every split.

**Keeping MI above 70:** a file has to stay small (about 35–45 lines of code). When a file grows, move a
sub-component, a hook or a pure helper into its own file instead of adding more to it.

## 7. Known issues found during review (other modules, not fixed here)

- `npm run build` fails: `app/requests/[id]/page.tsx` imports `API_URL` from `@/lib/requests`, but it is exported
  from `@/lib/api`. `tsc` also reports errors in `app/layout.tsx` and `app/requests/[id]`.
- ESLint errors in `app/labsessions/page.tsx` (setState directly in an effect) and `app/labsessions/new/page.tsx`
  (impure function during render).
- `requestRoutes.test.js` needs a `user` model in its fake Prisma (see Tests).
- Some routes don't use `requireActiveUser`, so a deactivated account can still call them until its token expires.
- Low MI in other modules: `ConsumablesPage.tsx`, `EquipmentModal.tsx`, `labsessions/new`, `equipment/page`,
  `rooms/page`, `requests/page`, `labSessionRoutes.js`, `equipmentRoutes.js`, `requestRoutes.js`.
