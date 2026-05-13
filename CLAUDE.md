# CLAUDE.md

Project conventions for AI assistants working on this repo.

## Repo layout

```
/backend          Spring Boot 3 (Java 21) — REST API, PostgreSQL via Flyway/Hibernate
/frontend         Nx workspace, Angular 21 + design-system lib (signals, zoneless)
/render.yaml      Render deploy blueprint (web service + free Postgres)
/.github/workflows  CI pipelines
```

- Frontend deployed to **Vercel** (rewrites `/api/*` → Render backend)
- Backend deployed to **Render** free tier (sleeps after 15 min idle — cold start ~15-30s)

## Frontend — Angular best practices

The Angular app is **zoneless** (`provideZonelessChangeDetection()` in `app.config.ts`,
no `zone.js` in deps or polyfills). Keep it that way.

### TypeScript
- Strict mode is on. Don't relax it.
- Prefer type inference when the type is obvious.
- Never use `any`. Use `unknown` when uncertain and narrow.

### Components
- Standalone is the default in v21 — **do not write `standalone: true`** in `@Component`.
- Always set `changeDetection: ChangeDetectionStrategy.OnPush`.
- Keep components small and single-responsibility.
- Use `input()` and `output()` functions — **never** `@Input()` / `@Output()` decorators.
- **Never** use `@HostBinding` / `@HostListener` — put bindings in the `host: {}` object of the decorator instead.
- Use `inject()` — **never** constructor injection.
- Prefer inline templates for tiny components, external `templateUrl`/`styleUrl` for larger ones (use paths relative to the component TS file).
- Use `NgOptimizedImage` for static images (skip for base64 inline images).

### State
- Local state: `signal()`. Derived state: `computed()`. Side effects: `effect()`.
- **Never** call `mutate()` on signals — use `update()` or `set()`.
- Services with shared state: `@Injectable({ providedIn: 'root' })` + signals.
- Keep state transformations pure.

### Templates
- Native control flow only: `@if`, `@for`, `@switch` — **never** `*ngIf`, `*ngFor`, `*ngSwitch`.
- Class/style bindings: `[class.foo]="cond"` and `[style.color]="value"` — **never** `[ngClass]` or `[ngStyle]`.
- Use the `async` pipe for observables, don't subscribe in components.
- Avoid complex logic in templates — push it into `computed()`.
- Do not rely on globals like `new Date()` inside templates (no-zone reasons + testability).

### Forms
- Prefer Reactive Forms over Template-driven.

### Services
- One responsibility per service.
- `@Injectable({ providedIn: 'root' })` for singletons.
- Use `inject()` over constructor injection.

### Routing
- All feature routes are lazy-loaded (`loadComponent` / `loadChildren`). Keep it that way for new features.

### Accessibility — WCAG AA (non-negotiable)

The codebase aims to be **a model accessibility project**. Lint rules in
`apps/crm/eslint.config.mjs` make Angular template a11y violations fail the
build (alt-text, label-has-associated-control, no-positive-tabindex,
valid-aria, click-events-have-key-events, role-has-required-aria, …).
`apps/crm-e2e/src/a11y.spec.ts` runs `@axe-core/playwright` and fails on
any `critical` / `serious` violation across the public routes.

#### Required patterns

- **Landmarks**: `<main id="main-content" tabindex="-1">` is the only `<main>`; sidebar/header/footer are also marked semantically. Skip link in `AppShell` jumps to it.
- **Route announcer**: `PageTitleService.setTitle()` updates both the in-app heading **and** `document.title`. `RouteAnnouncerComponent` mirrors it into a `aria-live="polite" role="status"` region so SR users hear page changes.
- **Modals**: every dialog (`role="dialog"`, `aria-modal="true"`) must have `aria-labelledby` pointing at its title element + `cdkTrapFocus [cdkTrapFocusAutoCapture]="true"` so focus stays inside and returns on close. Escape must close. The DS `DsModal` does this via host directive — inline modals must add the attributes manually.
- **Forms**: every input has `<label for>` (not `<span>`), `autocomplete`, `aria-invalid` on error, error message linked via `aria-describedby`, error wrapper has `role="alert"` so SR announces immediately. Required inputs carry both `required` and `aria-required="true"` (DS components do this automatically).
- **Buttons**: `DsButton` defaults to `type="button"`. Inside a `<form>`, only the submit action uses `[type]="'submit'"`. Icon-only buttons need `aria-label`. Toggle buttons (show/hide password, expand/collapse) carry `aria-pressed`.
- **Icons**: decorative SVGs are `aria-hidden="true" focusable="false"`. Meaningful icons need `<title>` or sibling `<span class="sr-only">`.
- **Live regions**: toasts use `role="status"` + dynamic `aria-live` (assertive for error/warning, polite otherwise). Long-running buttons set `[attr.aria-busy]="loading()"`.
- **Focus visible**: global ring lives in `libs/design-system/src/lib/styles/_base.scss` via `:focus-visible`. Don't override per-component without a reason.
- **Reduced motion**: a single global rule in `_base.scss` kills animations/transitions under `prefers-reduced-motion: reduce`. Component-level animations are short enough that this is sufficient; opt back in only for content that's essential (e.g. loading spinner readability).
- **Keyboard**: every interactive thing is a real `<button>` or `<a>` — never `<div (click)>`. Modal scrim is a `<button class="scrim">` with `aria-label`, not a `<div>`.
- **Color**: status must never be conveyed by color alone. Badges carry text labels alongside any color cue. Status icons accompany color in toasts and form validation.

#### Color contrast — known constraints

- Primary button is `var(--brand-600)` (not `--brand-500`) because `#fff` on `#D97757` is only 3.36:1. `#fff` on `#B85838` is 4.88:1 ✓.
- `--text-3` (`#8A857C` on cream) is **3.35:1** — below AA for body text. **Use only for large text (≥ 14pt bold / 18pt regular) or non-essential decoration.** For real content text use `--text-1` (primary) or `--text-2` (secondary, 7.9:1).

#### CI

- `npx nx lint crm` — strict template a11y rules
- `npx nx e2e crm-e2e` — runs axe against running app (CI starts dev server)

### Zoneless gotchas
- Signal updates auto-trigger CD. Plain `setTimeout` callbacks that don't update signals
  won't refresh the view — wrap state changes in a signal `set/update`.
- Third-party libs that rely on `NgZone` (e.g. some chart libs) require manual signaling.

## Backend — Spring Boot

- Java 21, Spring Boot 3.x, Gradle.
- Profiles: `dev` (local + Docker Compose), `prod` (Render).
- DB migrations: **Flyway only** (`src/main/resources/db/migration`). Never edit applied migrations.
- Don't introduce mail/SMTP dependencies in health checks for prod without SMTP creds configured — `management.health.mail.enabled: false` in `application-prod.yml` is intentional.
- `server.port` resolves `${PORT:${SERVER_PORT:8080}}`. **Never** set `SERVER_PORT` env var in Render — Spring's conventional env binding (`SERVER_PORT` → `server.port`) overrides the YAML default and bricks the deploy.

## Deployment

- Backend on Render Free: cold-start delay is real. The frontend has a wake-up overlay (`apps/crm/src/app/shared/wake-up.interceptor.ts`) that surfaces after 3s pending request.
- Render redeploys automatically on push to `main` (Blueprint via `render.yaml`).
- Vercel auto-deploys frontend on push to `main`.
- For Render API ops (logs, env vars, force-deploy) use `RENDER_API_KEY` env var (in `~/.bashrc`, never commit).

## CI

- `.github/workflows/` runs lint + Jest + build on every PR.
- Lint errors block merge. Accessibility violations from `eslint-plugin-jsx-a11y` (and Angular template a11y rules) are errors, not warnings.

## Commits

- Conventional commits style (`feat:`, `fix:`, `chore:`, `refactor:` + optional scope).
- Reference the affected area in the scope: `feat(frontend):`, `fix(backend):`, `fix(deploy):`.
- Body explains the **why**, not the **what**.

## Quick commands

```bash
# Frontend dev
cd frontend && npx nx serve crm

# Frontend build
cd frontend && npx nx build crm

# Backend dev (Docker Compose with Postgres + Mailhog)
docker compose up --build

# Lint frontend
cd frontend && npx nx lint crm

# Test
cd frontend && npx nx test crm
cd backend && ./gradlew test
```
