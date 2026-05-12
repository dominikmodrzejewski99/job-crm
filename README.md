# Job Application CRM

![Java](https://img.shields.io/badge/Java-21-007396?logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4-6DB33F?logo=springboot&logoColor=white)
![Angular](https://img.shields.io/badge/Angular-21-DD0031?logo=angular&logoColor=white)
![Nx](https://img.shields.io/badge/Nx-monorepo-143055?logo=nx&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-compose-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

[![backend-ci](https://github.com/dominikmodrzejewski99/job-crm/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/dominikmodrzejewski99/job-crm/actions/workflows/backend-ci.yml)
[![frontend-ci](https://github.com/dominikmodrzejewski99/job-crm/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/dominikmodrzejewski99/job-crm/actions/workflows/frontend-ci.yml)

Osobisty CRM do śledzenia aplikacji o pracę — zastępuje Google Sheets, dodaje automatyczne przypomnienia o follow-upach, integracje z job boardami i powiadomienia email.

Projekt portfolio: **Angular 21 + Java 21 / Spring Boot 3**, własny design system, multi-user z JWT, deployowany na Render/Vercel.

## 🌐 Live demo

- **Landing**: https://frontend-beige-omega-33.vercel.app/landing
- **Login / Register**: https://frontend-beige-omega-33.vercel.app/login
- **App (po zalogowaniu)**: https://frontend-beige-omega-33.vercel.app/dashboard
- **Backend (Render)**: https://job-crm-backend.onrender.com
- **Swagger UI**: https://frontend-beige-omega-33.vercel.app/swagger-ui.html

> ⚠️ Backend hostowany na Render free tier — usypia po 15 min bezruchu, więc **pierwsze zapytanie po przerwie może zająć 30-50 s** (cold start). Zarejestruj nowe konto na `/register` żeby przetestować pełny flow.

### Główne widoki

| Ścieżka | Strona | Status |
|---|---|---|
| `/` | przekierowuje na `/landing` | public |
| `/landing` | Marketing — hero z preview dashboardu, feature grid, pricing, testimonials | public |
| `/login`, `/register` | Auth split-screen (formularz + visual column z preview cards) | public |
| `/dashboard` | KPI z sparkline, kanban / lejek / lista, A/B CV, najbliższe wydarzenia, follow-upy, job boardy | authed |
| `/applications` | Pełna tabela aplikacji z filtrami | authed |
| `/job-board` | Crawler JJIT / NFJ + match score | authed |
| `/follow-up` | Skrzynka follow-upów do wysłania | authed |
| `/settings` | Ustawienia użytkownika (i18n, powiadomienia) | authed |

---

## Spis treści

1. [Motywacja](#motywacja)
2. [Stack technologiczny](#stack-technologiczny)
3. [Struktura repo](#struktura-repo)
4. [Model domeny](#model-domeny)
5. [REST API](#rest-api)
6. [Fazowanie](#fazowanie)
7. [Uruchomienie lokalnie](#uruchomienie-lokalnie)
8. [Deployment](#deployment)
9. [Konwencje](#konwencje)

---

## Motywacja

Trzymanie aplikacji w Google Sheets ma problemy:
- brak przypomnień o follow-upach → o aplikacjach się zapomina
- statusy się nie zgadzają, bo trzeba je ręcznie aktualizować
- brak integracji z mailami i ofertami pracy
- brak metryk (ile aplikacji / tydzień, response rate, średni czas do odpowiedzi)

CRM rozwiązuje to przez:
- centralizację w jednej aplikacji webowej (PWA-ready)
- scheduled jobs które przypominają o zaległych follow-upach
- auto-import ofert z JustJoinIT / NoFluffJobs (LinkedIn pomijamy — agresywnie blokuje scrapery i to ToS violation)
- email notifications (Spring Mail + SMTP)
- dashboard ze statystykami

---

## Stack technologiczny

### Backend (`/backend`)

| Komponent | Wybór | Uzasadnienie |
|---|---|---|
| Język | Java 21 (LTS) | Najnowszy LTS, pattern matching, records, virtual threads |
| Framework | Spring Boot 3.x | Standard branżowy, najwięcej ogłoszeń o pracę |
| Build | Maven | Częstsze w ogłoszeniach niż Gradle |
| ORM | Spring Data JPA + Hibernate | Standard Spring |
| Migracje | Flyway | Wersjonowanie schematu, baseline-friendly |
| Auth | Spring Security + JWT (jjwt) | Stateless, łatwy do skalowania |
| Validation | jakarta.validation | Wbudowane w Spring Boot 3 |
| API docs | springdoc-openapi | Auto-generowany Swagger UI z adnotacji |
| Mail | Spring Mail (JavaMailSender) | Dev: Mailtrap, prod: SMTP (Resend / SendGrid free tier) |
| Scheduling | Spring `@Scheduled` | Follow-up reminders, crawlery job boardów |
| HTTP client | Spring `WebClient` / `RestClient` | Wywołania API job boardów |
| Testy | JUnit 5, Mockito, AssertJ, Testcontainers | Postgres w Dockerze do testów integracyjnych |

### Frontend (`/frontend`)

| Komponent | Wybór | Uzasadnienie |
|---|---|---|
| Framework | Angular 21 | Najnowsza wersja, signals, standalone components, control flow |
| Monorepo | Nx | Apps + libs w jednym repo, świetnie do CV |
| Design system | Własny na `@angular/cdk` | A11y first, headless, reużywalny, portfolio piece |
| Komponenty UI | `libs/design-system` | Button, Input, Select, Modal, Table, Card, Toast, ... |
| State | Signals + RxJS | Nowy idiom Angulara, mniejszy boilerplate niż NgRx |
| HTTP client | Auto-generowany z OpenAPI (`@openapitools/openapi-generator-cli`) | Typowane DTO + serwisy z backendu |
| Forms | Reactive Forms | Standard Angulara |
| Testy unit | Jest | Szybsze niż Karma, lepsze DX |
| Testy e2e | Playwright | Nowoczesny standard, multi-browser |
| Storybook | tak | Podgląd komponentów design systemu |

### Infrastruktura

| Komponent | Wybór |
|---|---|
| DB | PostgreSQL 16 |
| Lokalnie | Docker Compose (postgres + backend + frontend) |
| CI/CD | GitHub Actions (build + test + lint na każdy PR) |
| Deploy backend | Render.com (free tier) |
| Deploy frontend | Vercel (free tier) |
| DB prod | Render Postgres (free tier) |
| Mail prod | Resend (free tier 3k/mc) |
| Monitoring | Spring Actuator + Render metrics (na razie wystarczy) |

---

## Struktura repo

```
crm/
├── backend/                          # Java 21 / Spring Boot 3 / Maven
│   ├── pom.xml
│   ├── src/main/java/pl/dmod/crm/
│   │   ├── CrmApplication.java
│   │   ├── application/              # Bounded context: aplikacje o pracę
│   │   │   ├── api/                  # REST controllers + DTO
│   │   │   ├── domain/               # Encje JPA, value objects
│   │   │   ├── service/              # Logika biznesowa
│   │   │   └── repository/           # Spring Data repos
│   │   ├── auth/                     # Bounded context: użytkownicy, JWT
│   │   ├── followup/                 # Bounded context: przypomnienia + scheduler
│   │   ├── jobboard/                 # Bounded context: integracje z JJIT/NFJ
│   │   ├── notification/             # Bounded context: email
│   │   └── shared/                   # Wspólne: ExceptionHandler, config, security
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   ├── application-dev.yml
│   │   ├── application-prod.yml
│   │   └── db/migration/             # Flyway: V1__init.sql, V2__...
│   └── src/test/...                  # JUnit + Testcontainers
│
├── frontend/                         # Nx workspace, Angular 21
│   ├── nx.json
│   ├── package.json
│   ├── apps/
│   │   └── crm/                      # Główna aplikacja
│   │       ├── src/app/
│   │       │   ├── features/         # applications/, auth/, dashboard/, settings/
│   │       │   ├── core/             # interceptors, guards, services
│   │       │   └── shared/           # małe helpery specyficzne dla app
│   │       └── src/styles/
│   ├── libs/
│   │   ├── design-system/            # ds-button, ds-input, ds-modal, ...
│   │   │   └── src/lib/components/
│   │   └── api-client/               # auto-generated z OpenAPI
│   └── .storybook/                   # Storybook dla design-system
│
├── docker-compose.yml                # postgres + backend + frontend (dev)
├── docker-compose.prod.yml           # bez baz danych, tylko aplikacja
├── .github/workflows/
│   ├── backend-ci.yml
│   ├── frontend-ci.yml
│   └── deploy.yml
└── README.md
```

---

## Model domeny

### Główne encje

```
User
├── id (UUID)
├── email (unique)
├── passwordHash
├── displayName
├── createdAt
└── settings (1:1 UserSettings)

UserSettings
├── userId
├── followUpDefaultDays (default 7)
├── emailNotificationsEnabled
├── preferredJobLocations (text[])
├── preferredTechnologies (text[])
└── timezone

Application                            # Aplikacja o pracę
├── id (UUID)
├── userId (FK)
├── companyName
├── position
├── jobUrl (nullable)
├── source (enum: LINKEDIN, JUSTJOIN, NOFLUFF, REFERRAL, COMPANY_SITE, OTHER)
├── salaryMin / salaryMax / currency  (nullable)
├── location / remote (enum)
├── appliedAt (timestamp)
├── currentStatus (enum)               # denormalizacja dla szybkiego query
├── nextFollowUpAt (nullable)
├── archived (boolean)
├── notes (text)
└── tags (text[])

ApplicationStatus (enum)
DRAFT, APPLIED, ACK_RECEIVED, INTERVIEW_SCHEDULED, INTERVIEW_DONE,
TASK_RECEIVED, TASK_SUBMITTED, OFFER, REJECTED, WITHDRAWN, GHOSTED

StatusChange                           # Historia zmian statusu (audit)
├── id
├── applicationId (FK)
├── fromStatus / toStatus
├── changedAt
└── note

FollowUp                               # Zaplanowane / wysłane follow-upy
├── id
├── applicationId (FK)
├── scheduledAt
├── sentAt (nullable)
├── kind (enum: REMINDER, EMAIL_DRAFT)
└── content

Contact                                # Rekruter / hiring manager
├── id
├── applicationId (FK)
├── name
├── email
├── linkedinUrl
└── role

JobOffer                               # Z crawlerów job boardów
├── id
├── externalId
├── source (enum)
├── title / company / location
├── salaryMin / salaryMax
├── url
├── description
├── fetchedAt
├── matchScore (calculated)
└── userApplied (boolean)
```

---

## REST API

Wszystko pod `/api/v1`. Auth: `Authorization: Bearer <jwt>`.

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
GET    /api/v1/auth/me

GET    /api/v1/applications              # list + filter (status, tag, search, dateRange)
POST   /api/v1/applications
GET    /api/v1/applications/{id}
PATCH  /api/v1/applications/{id}
DELETE /api/v1/applications/{id}
POST   /api/v1/applications/{id}/status  # zmiana statusu (tworzy StatusChange)
GET    /api/v1/applications/{id}/timeline

GET    /api/v1/followups/upcoming        # to do dziś / w najbliższych dniach
POST   /api/v1/followups/{id}/done
POST   /api/v1/followups/{id}/snooze

GET    /api/v1/joboffers                 # zacrawlowane oferty z JJIT/NFJ
POST   /api/v1/joboffers/{id}/save-as-application

GET    /api/v1/stats/dashboard           # liczby, response rate, średnie czasy
GET    /api/v1/stats/funnel              # lejek: applied → interview → offer

GET    /api/v1/settings
PATCH  /api/v1/settings
```

Swagger UI: `http://localhost:8080/swagger-ui.html`

---

## Fazowanie

Każda faza to osobny commit / PR. Po każdej fazie aplikacja jest w działającym stanie.

| # | Faza | Co | Spring/Angular learning |
|---|---|---|---|
| 1 | **Skeleton + Docker Compose** | Pusty Spring Boot z healthcheckiem, pusty Nx workspace, Postgres w compose | Spring Boot starter, application.yml, profile |
| 2 | **Design system v0** | Storybook + `ds-button`, `ds-input`, `ds-select`, `ds-card`, `ds-modal`, `ds-table` | Angular CDK, content projection, signals, a11y |
| 3 | **Backend CRUD Application** | Encja `Application`, repo, service, controller, DTO, Flyway migration, OpenAPI, testy | JPA, Spring Data, validation, MapStruct, Testcontainers |
| 4 | **Frontend CRUD Application** | Lista z filtrami, formularz, używa design system, OpenAPI-generated client | RxJS, Reactive Forms, Angular Router |
| 5 | **Auth multi-user** | Rejestracja, login, JWT, guard, `@PreAuthorize`, każdy user widzi swoje | Spring Security, JwtAuthenticationFilter, BCrypt |
| 6 | **Follow-up reminders + email** | `nextFollowUpAt`, `@Scheduled` co 5 min, JavaMailSender, dashboard "do zrobienia" | `@Scheduled`, Spring Mail, transakcje |
| 7 | **Job board integration** | Crawler JustJoinIT + NoFluffJobs, scheduled, "znalezione oferty" w UI | WebClient, retry, rate limiting, mapping |
| 8 | **Stats + dashboard** | Lejek, response rate, wykresy | Aggregation queries, JPQL/native |
| 9 | **CI/CD + deploy** | GitHub Actions, Render/Vercel, README z linkiem do live demo | DevOps, profile prod, secrets |
| 10 | **Polish** | i18n (PL/EN), PWA, dark mode, accessibility audit | Angular i18n, service worker |

---

## Uruchomienie lokalnie

```bash
# 1. Klonowanie
git clone <repo-url>
cd crm

# 2. Postgres + backend + frontend w Dockerze
docker compose up -d

# 3. Otwórz w przeglądarce
open http://localhost:4200          # frontend (Angular)
open http://localhost:8080/swagger-ui.html  # backend API docs

# 4. Backend osobno (do nauki Springa)
cd backend
./mvnw spring-boot:run

# 5. Frontend osobno
cd frontend
npm install
npx nx serve crm
```

Wymagania: Docker, Java 21, Node 20+, pnpm/npm.

---

## Deployment

| Komponent | Hosting | URL | Config |
|---|---|---|---|
| Backend | [Render](https://render.com) — free tier (sleeps po 15 min) | https://job-crm-backend.onrender.com | `render.yaml` |
| Frontend | [Vercel](https://vercel.com) — Hobby | https://frontend-beige-omega-33.vercel.app | `frontend/vercel.json` |
| Database | Render Postgres free (256 MB) | (internal) | declared w `render.yaml` |
| Mail | [Resend](https://resend.com) / [Mailtrap](https://mailtrap.io) (opcjonalne) | — | env vars `MAIL_*` |

### CI

| Workflow | Triggers | Co robi |
|---|---|---|
| `.github/workflows/backend-ci.yml` | push/PR z `backend/**` | `mvn verify` na Ubuntu, Java 21, Testcontainers (Docker w runnerze) |
| `.github/workflows/frontend-ci.yml` | push/PR z `frontend/**` | `npm ci`, `nx lint`, `nx test`, `nx build crm` na Node 22 |

### Pierwsze uruchomienie deploy (jednorazowe)

1. **Render** — `https://dashboard.render.com/blueprints` → New blueprint → wskaż na repo. Render czyta `render.yaml`, tworzy: web service `job-crm-backend` (Docker) + Postgres `job-crm-db`. Auto-deploy z `main` jest włączony.
2. **Render — wypełnij env vars** w UI dla `MAIL_HOST` / `MAIL_USERNAME` / `MAIL_PASSWORD` (zostały oznaczone `sync: false` żeby nie commitować sekretów). `JWT_SECRET` Render generuje sam (`generateValue: true`).
3. **Backend URL** — sprawdź adres w Render dashboard (np. `https://job-crm-backend.onrender.com`). Jeśli inny — zaktualizuj `rewrites` w `frontend/vercel.json` i pushnij.
4. **Vercel** — `vercel.com/new` → import repo. Root: `frontend/`. Framework: Other. Build/output/install jest w `vercel.json`, więc Vercel sam wykryje.
5. **Czekasz na pierwszy deploy**, podajesz adres w CV.

### Free-tier gotchas

- Render Web Service na free tier zasypia po 15 minutach bezruchu. Pierwsze zapytanie po przerwie = ~30 s wake-up.
- Postgres free tier wygasa po 90 dniach od utworzenia bazy — zrób backup przed deadline.
- Crawler JJIT/NFJ co 6h wywołuje outbound HTTP. Wyłącz przez `JOBBOARD_ENABLED=false` jeśli chcesz oszczędzać CPU.

---

## Konwencje

- **Code in English** (encje, zmienne, komentarze, commit messages, branch names)
- **UI in Polish** (planowane i18n PL/EN w fazie 10)
- **Commits**: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, ...)
- **Branche**: `feature/<short-name>`, `fix/<short-name>`
- **Jeden PR per faza** (małe, możliwe do review w 10 minut)
- **Testy obowiązkowe** dla service layer + controllerów (>70% coverage backendu)
- **A11y first** w design system: każdy komponent ma ARIA, keyboard nav, screen reader

---

## Status

- [x] Faza 1: Skeleton + Docker Compose
- [x] Faza 2: Design system v0 (21 komponentów Angular CDK, SASS abstracts, signal-based forms, ag-grid)
- [x] Faza 3: Backend CRUD Application (JPA, Flyway, OpenAPI, Testcontainers, ProblemDetail)
- [x] Faza 4: Auth multi-user + JWT (Spring Security stateless, BCrypt, per-user data isolation, login/register UI)
- [x] Faza 5: Follow-up reminders + email (@EnableScheduling, JavaMailSender → MailHog dev, /api/v1/follow-ups, dashboard widget)
- [x] Faza 6: Job board integration (Spring RestClient → JustJoinIT + NoFluffJobs, 6h crawler, dedup, save-as-application, ag-grid UI)
- [x] Faza 7: Stats + dashboard (`/api/v1/stats/dashboard` agregacje, custom SVG funnel + weekly chart + status bars)
- [x] Faza 8: CI/CD + deploy (GitHub Actions backend-ci + frontend-ci, render.yaml blueprint, vercel.json z /api rewrites, application-prod.yml)
- [x] Faza 9: Polish — i18n PL/EN (signal-based `I18nService` + `tr` pipe), PWA (manifest + service worker, cache-first dla assets / network-first dla `/api`), a11y audit (`@axe-core/playwright` e2e, fail na critical/serious)
- [x] Faza 10: **Brand refresh** — Claude Design "jobflow" handoff zaimplementowany 1:1 (paleta terracotta, Instrument Serif + Geist, sidebar/topbar redesign, dashboard z KPI sparkline / kanban / A/B CV / kalendarz wydarzeń, split-screen auth, public landing page na `/landing` z hero preview + feature grid + pricing). Pixel-diff ~3% (font sub-pixel rendering)

---

## Wszystkie 10 faz roadmapy zamknięte 🎉

Repo zawiera kompletny stack od pustego folderu do production-ready aplikacji:

- **Backend**: Spring Boot 3.4 / Java 21 — JPA + Flyway (6 migracji), Spring Security stateless + JWT, Spring Mail (`@Scheduled` reminders), Spring RestClient (crawler JJIT/NFJ), springdoc OpenAPI, ProblemDetail, Testcontainers, integration + service tests
- **Frontend**: Angular 21 zoneless / Nx monorepo — własny design system z 21 komponentami (SASS abstracts + signal forms + Angular CDK overlay), AG Grid dla data tables, signal-based state, custom SVG dashboard charts (KPI sparkline, kanban z drag&drop-ready strukturą, A/B CV bars), i18n PL/EN, PWA (offline). Pełny brand-refresh wg Claude Design "jobflow" (paleta terracotta, Instrument Serif + Geist + JetBrains Mono, split-screen auth, public landing z marketing copy)
- **DevOps**: Docker Compose (postgres + backend + frontend + mailhog), GitHub Actions CI (dwa workflowy), Render blueprint + Vercel rewrites = zero CORS w prod

### Co dalej (gdyby były kolejne fazy)

- **Faza 10**: rate limiting (`bucket4j`), refresh tokens, password reset flow
- **Faza 11**: Storybook dla `libs/design-system` + visual regression
- **Faza 12**: monitoring — Prometheus + Grafana + Sentry dla frontend errors
- **Faza 13**: AI integration — auto-summarize job offers, suggest follow-up timing
- **Faza 14**: mobile — Capacitor wrap albo Flutter rewrite
