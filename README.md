# Job Application CRM

Osobisty CRM do śledzenia aplikacji o pracę — zastępuje Google Sheets, dodaje automatyczne przypomnienia o follow-upach, integracje z job boardami i powiadomienia email.

Projekt portfolio: **Angular 21 + Java 21 / Spring Boot 3**, własny design system, multi-user z JWT, deployowany na Render/Vercel.

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

| Komponent | Hosting | Free tier |
|---|---|---|
| Backend | [Render](https://render.com) | 750h/mc, sleeps after 15min |
| Frontend | [Vercel](https://vercel.com) | Hobby, unlimited |
| Database | Render Postgres | 256 MB / 1 GB storage |
| Mail | [Resend](https://resend.com) | 3000 emails/mc, 100/dzień |

Trigger: push do `main` → GitHub Actions → deploy.

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

- [ ] Faza 1: Skeleton + Docker Compose
- [ ] Faza 2: Design system v0
- [ ] Faza 3: Backend CRUD Application
- [ ] Faza 4: Frontend CRUD Application
- [ ] Faza 5: Auth multi-user
- [ ] Faza 6: Follow-up reminders + email
- [ ] Faza 7: Job board integration (JustJoinIT + NoFluffJobs)
- [ ] Faza 8: Stats + dashboard
- [ ] Faza 9: CI/CD + deploy
- [ ] Faza 10: Polish (i18n, PWA, dark mode, a11y audit)
