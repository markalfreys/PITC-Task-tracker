# Task Tracker

A simple to-do app built with **React**, **Next.js** and **TypeScript**. The
code is split into modules, the API is protected against common attacks, and
a test suite plus error pages act as a safety net.

You can:

- add tasks with a title, an optional description and a priority (low, medium, high)
- mark tasks as done or not done
- filter the list by All, Active or Completed
- delete tasks
- open a task on its own page (`/tasks/[id]`)
- see your progress as a progress bar

## Running the app

You need [Node.js](https://nodejs.org) 22.22+ or 24.15+.

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>. Keep the terminal open while you use the app.

| Command              | What it does                                                 |
| -------------------- | ------------------------------------------------------------ |
| `npm run dev`        | Starts the development server with hot reload                |
| `npm run build`      | Builds the app for production                                |
| `npm start`          | Runs the production build                                    |
| `npm test`           | Runs the automated tests once                                |
| `npm run test:watch` | Re-runs the tests whenever a file changes                    |
| `npm run typecheck`  | Checks the TypeScript types                                  |
| `npm run lint`       | Checks the code with ESLint                                  |
| `npm run check`      | Runs the type check, lint and tests: run this before handing in |

> Tasks are stored in server memory, so they reset to the three example
> tasks whenever the server restarts. No database is needed.

## Project structure

The code is grouped by **feature**. Everything about tasks lives in
`features/tasks`. Inside it, each layer has one job:

```
app/                        Routes only. Each file is short and uses the modules below.
  layout.tsx                Shared page frame (header, footer)
  page.tsx                  Home page: loads tasks, shows <TaskBoard>
  tasks/[id]/page.tsx       One task's page
  api/tasks/route.ts        GET, POST    → forwards to task handlers
  api/tasks/[id]/route.ts   GET, PATCH, DELETE
  error.tsx                 Error page for crashes inside a page
  global-error.tsx          Last-resort error page if the layout itself fails
  not-found.tsx             404 page

features/tasks/             The task feature
  types.ts                  Task, Priority, TaskFilter, ...
  constants.ts              Priorities, length limits, max tasks, id format
  validation.ts             Checks all input from clients
  task-filters.ts           Filtering and counting (pure functions)
  server/                   Runs only on the server ("server-only")
    task-repository.ts      Storage: an interface + in-memory version
    task-service.ts         Business rules (order, task limit, server-set fields)
    task-handlers.ts        HTTP layer: request → service → JSON response
    index.ts                Connects the pieces together
  client/                   Runs in the browser
    task-api.ts             Typed calls to /api/tasks
    use-tasks.ts            React hook: task list state + saving changes
  components/               React UI, each with its own CSS module
    TaskBoard, TaskForm, TaskList, TaskItem, FilterBar,
    TaskProgress, PriorityBadge, TaskDetails

components/                 Shared UI used across the app
  layout/                   SiteHeader, SiteFooter, PageHeader
  feedback/                 MessageCard, ErrorFallback

lib/                        Generic helpers, not tied to tasks
  api/                      ApiError and the apiHandler wrapper
  security/                 Security headers, request checks, rate limiter
  fetch-json.ts             fetch() with timeout, retries and clear errors
  global-singleton.ts       One shared instance per server process
  cx.ts                     Joins CSS class names
```

Why this helps:

- **Each part can be changed on its own.** To use a real database, write a new
  `TaskRepository`; the service, API and UI stay the same.
- **Each part can be tested on its own.** Handlers receive their dependencies
  (service, rate limiters) as arguments, so tests pass in their own.
- **Server code can't leak into the browser.** Files under `server/` import
  `server-only`, so the build fails if a client component imports them.
- **Styles can't clash.** Each component has its own `*.module.css`.
  `globals.css` only holds colours, base styles and the shared `.card` and
  `.button` classes.

## Where each technology is used

### React

- **Components:** small, reusable pieces (`TaskBoard`, `TaskForm`, `TaskList`,
  `TaskItem`, `FilterBar`, `TaskProgress`, `PriorityBadge`, `TaskDetails`).
- **Custom hook:** [`useTasks`](features/tasks/client/use-tasks.ts) holds the
  task list, the error message and which tasks are being saved, and saves
  changes through the API.
- **`useState` / `useMemo`:** form fields and the selected filter; the
  filtered list and counts are worked out with `useMemo`.
- **Props and callbacks** connect the components (`onAdd`, `onToggle`,
  `onDelete`, `onChange`).

### Next.js (App Router)

- **File-based routing:** `/` and the dynamic route `/tasks/[id]`.
- **Route handlers** in `app/api/tasks` provide a REST API.
- **Server and client components:** pages load data on the server;
  `TaskBoard` is a client component (`"use client"`).
- **Error handling:** `error.tsx`, `global-error.tsx`, `not-found.tsx` and
  `notFound()`.
- **Streaming with Suspense:** this project has Next.js 16
  [Cache Components](https://nextjs.org/docs/app/getting-started/caching) on.
  Static parts of each page are prerendered; task data is read per request
  (`await connection()`) inside `<Suspense>`.
- **Config:** security headers and `poweredByHeader: false` in
  [`next.config.ts`](next.config.ts).

### TypeScript

- One `Task` type shared by the API, the pages and the components.
- Union types (`Priority`, `TaskFilter`), utility types (`Pick`, `Partial`,
  `Record`), a typed `TaskRepository` interface, and generics
  (`fetchJson<T>`, `ParseResult<T>`).
- Type guards (`isPriority`, `isValidTaskId`) turn `unknown` input into
  checked types.
- Next.js route types: `PageProps<"/tasks/[id]">`, `LayoutProps<"/">`,
  `RouteContext<"/api/tasks/[id]">`.
- **Strict settings** in [`tsconfig.json`](tsconfig.json): `strict`,
  `noUncheckedIndexedAccess` (array and object lookups may be undefined),
  `noImplicitReturns`, `noFallthroughCasesInSwitch` and more.

## Security

| Threat | Protection | Where |
| --- | --- | --- |
| Cross-site scripting (XSS) | React escapes all text; Content Security Policy only allows this site's scripts, styles and connections | [`lib/security/headers.ts`](lib/security/headers.ts) |
| Clickjacking | `frame-ancestors 'none'` and `X-Frame-Options: DENY` | same |
| Other browser attacks | `nosniff`, HSTS, `Referrer-Policy`, `Permissions-Policy`, cross-origin isolation headers; no `X-Powered-By` | same, [`next.config.ts`](next.config.ts) |
| Cross-site request forgery (CSRF) | Requests that change data must come from this site (`Origin` / `Sec-Fetch-Site` checks), and bodies must be `application/json` | [`lib/security/request-guards.ts`](lib/security/request-guards.ts) |
| Spam and abuse | Per-client rate limit: 120 reads and 30 changes per minute (429 + `Retry-After`) | [`lib/security/rate-limit.ts`](lib/security/rate-limit.ts) |
| Memory exhaustion | Request bodies capped at 10 KB (413); at most 100 tasks stored (409) | request-guards, [`task-service.ts`](features/tasks/server/task-service.ts) |
| Bad or malicious input | Strict validation: unknown fields rejected (so `id`/`createdAt` can't be overwritten), types and lengths checked, control characters removed, ids must match a safe pattern | [`features/tasks/validation.ts`](features/tasks/validation.ts) |
| Leaking internal details | Unexpected errors are logged on the server; clients only get a generic message. API responses are `no-store` | [`lib/api/api-handler.ts`](lib/api/api-handler.ts) |

Known limitations (fine for a class project, worth knowing for production):

- **The CSP allows inline scripts.** Next.js streams pages using small inline
  scripts. A stricter nonce-based policy is possible, but it only works with
  partial prerendering turned off.
- **The rate limiter trusts `X-Forwarded-For`.** Run the app behind a reverse
  proxy (Vercel, nginx, ...) that sets this header. Without one, a client can
  fake the header to get around the limit. The limiter also keeps its counts in
  memory, so with several servers it needs a shared store such as Redis.
- **There is no login.** Anyone who can open the app can change the tasks.

## Safety net

- **Automated tests** ([Vitest](https://vitest.dev) and
  [React Testing Library](https://testing-library.com)): 97 tests in 10 files,
  next to the code they test (`*.test.ts(x)`). They cover:
  - validation rules and filters
  - the service's business rules
  - every API endpoint, including each security check (403, 413, 415, 429,
    error hiding)
  - the security helpers
  - the fetch helper (timeouts, retries, error messages)
  - the task board UI: adding, toggling, deleting and filtering, plus error
    handling
- **`npm run check`** runs the type check, lint and tests in one go.
- **Error pages:** if a page crashes, `error.tsx` shows a friendly message with
  **Try again** and an error reference that matches the server log.
  `global-error.tsx` covers crashes in the layout itself.
- **Resilient network calls:** every request times out after 10 seconds, reads
  are retried on network errors, and failures show a clear message.
  - The form keeps what you typed if saving fails.
  - If a task was already deleted elsewhere, the list reloads from the server.
- **Nothing unsaved is shown:** the screen only changes after the server
  accepts a change.

## API

All endpoints send and receive JSON. Requests that change data must use
`Content-Type: application/json`.

| Method   | URL               | Body                                                 | Response                         |
| -------- | ----------------- | ---------------------------------------------------- | -------------------------------- |
| `GET`    | `/api/tasks`      | none                                                 | `200` list of tasks, newest first |
| `POST`   | `/api/tasks`      | `{ title, description?, priority? }`                 | `201` the new task               |
| `GET`    | `/api/tasks/{id}` | none                                                 | `200` the task, or `404`         |
| `PATCH`  | `/api/tasks/{id}` | any of `{ title, description, priority, completed }` | `200` the updated task, or `404` |
| `DELETE` | `/api/tasks/{id}` | none                                                 | `204`, or `404`                  |

Errors return `{ "error": "message" }` with one of these status codes:

| Status | Meaning |
| --- | --- |
| `400` | Invalid input or a malformed id |
| `403` | The request came from another website |
| `409` | The task limit has been reached |
| `413` | The request body is too large |
| `415` | The request body isn't JSON |
| `429` | Too many requests (see the `Retry-After` header) |
| `500` | Unexpected server error (details are only in the server log) |

Example:

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Study for the exam", "priority": "high"}'
```
