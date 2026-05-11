export type Locale = 'pl' | 'en';

export type TranslationKey =
  | 'common.save'
  | 'common.cancel'
  | 'common.delete'
  | 'common.edit'
  | 'common.search'
  | 'common.add'
  | 'common.loading'
  | 'common.error'
  | 'common.success'
  | 'common.confirm'

  | 'nav.dashboard'
  | 'nav.applications'
  | 'nav.addApplication'
  | 'nav.overlay'
  | 'nav.empty'
  | 'nav.jobOffers'

  | 'auth.login'
  | 'auth.logout'
  | 'auth.register'
  | 'auth.email'
  | 'auth.password'
  | 'auth.displayName'
  | 'auth.welcomeTitle'
  | 'auth.welcomeSubtitle'
  | 'auth.createAccount'
  | 'auth.createSubtitle'
  | 'auth.haveAccount'
  | 'auth.noAccount'

  | 'theme.light'
  | 'theme.dark'
  | 'language'

  | 'toast.crawler.success'
  | 'toast.crawler.error'
  | 'toast.jobOffer.savedAsApplication'
  | 'toast.jobOffer.saveFailed'
  | 'toast.followUp.done'
  | 'toast.followUp.doneFailed'
  | 'toast.followUp.snoozed'
  | 'toast.followUp.snoozeFailed'
  | 'toast.applications.loadFailed'
  | 'toast.applications.deleted'
  | 'toast.applications.deleteFailed'
  | 'toast.applications.deleteEmpty'
  | 'toast.application.saved'
  | 'toast.application.saveFailed'
  | 'toast.form.fixErrors'
  | 'toast.backend.ok';

const PL: Record<TranslationKey, string> = {
  'common.save': 'Zapisz',
  'common.cancel': 'Anuluj',
  'common.delete': 'Usuń',
  'common.edit': 'Edytuj',
  'common.search': 'Szukaj',
  'common.add': 'Dodaj',
  'common.loading': 'Ładowanie…',
  'common.error': 'Błąd',
  'common.success': 'Sukces',
  'common.confirm': 'Potwierdź',

  'nav.dashboard': 'Dashboard',
  'nav.applications': 'Aplikacje',
  'nav.addApplication': 'Dodaj aplikację',
  'nav.overlay': 'Overlay & feedback',
  'nav.empty': 'Empty state',
  'nav.jobOffers': 'Oferty pracy',

  'auth.login': 'Zaloguj się',
  'auth.logout': 'Wyloguj',
  'auth.register': 'Zarejestruj się',
  'auth.email': 'Email',
  'auth.password': 'Hasło',
  'auth.displayName': 'Nazwa (opcjonalna)',
  'auth.welcomeTitle': 'Zaloguj się',
  'auth.welcomeSubtitle': 'Twoje aplikacje o pracę w jednym miejscu.',
  'auth.createAccount': 'Stwórz konto',
  'auth.createSubtitle': 'Twoje dane są tylko dla ciebie.',
  'auth.haveAccount': 'Masz już konto?',
  'auth.noAccount': 'Nie masz konta?',

  'theme.light': 'Jasny',
  'theme.dark': 'Ciemny',
  'language': 'Język',

  'toast.crawler.success': 'Crawler zaktualizowany',
  'toast.crawler.error': 'Crawler się wywalił — sprawdź logi backendu',
  'toast.jobOffer.savedAsApplication': 'Oferta zapisana jako aplikacja',
  'toast.jobOffer.saveFailed': 'Nie udało się zapisać oferty',
  'toast.followUp.done': 'Follow-up odhaczony',
  'toast.followUp.doneFailed': 'Nie udało się zaktualizować',
  'toast.followUp.snoozed': 'Follow-up odłożony',
  'toast.followUp.snoozeFailed': 'Nie udało się odłożyć',
  'toast.applications.loadFailed': 'Nie udało się pobrać aplikacji',
  'toast.applications.deleted': 'Aplikacja usunięta',
  'toast.applications.deleteFailed': 'Nie udało się usunąć aplikacji',
  'toast.applications.deleteEmpty': 'Brak aplikacji do usunięcia — najpierw dodaj jedną',
  'toast.application.saved': 'Aplikacja zapisana',
  'toast.application.saveFailed': 'Backend odrzucił aplikację',
  'toast.form.fixErrors': 'Popraw błędy w formularzu',
  'toast.backend.ok': 'Backend odpowiedział',
};

const EN: Record<TranslationKey, string> = {
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.search': 'Search',
  'common.add': 'Add',
  'common.loading': 'Loading…',
  'common.error': 'Error',
  'common.success': 'Success',
  'common.confirm': 'Confirm',

  'nav.dashboard': 'Dashboard',
  'nav.applications': 'Applications',
  'nav.addApplication': 'Add application',
  'nav.overlay': 'Overlay & feedback',
  'nav.empty': 'Empty state',
  'nav.jobOffers': 'Job offers',

  'auth.login': 'Sign in',
  'auth.logout': 'Sign out',
  'auth.register': 'Sign up',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.displayName': 'Display name (optional)',
  'auth.welcomeTitle': 'Sign in',
  'auth.welcomeSubtitle': 'Your job applications in one place.',
  'auth.createAccount': 'Create account',
  'auth.createSubtitle': 'Your data stays yours.',
  'auth.haveAccount': 'Already have an account?',
  'auth.noAccount': "Don't have an account?",

  'theme.light': 'Light',
  'theme.dark': 'Dark',
  'language': 'Language',

  'toast.crawler.success': 'Crawler refreshed',
  'toast.crawler.error': "Crawler crashed — check backend logs",
  'toast.jobOffer.savedAsApplication': 'Offer saved as application',
  'toast.jobOffer.saveFailed': "Couldn't save offer",
  'toast.followUp.done': 'Follow-up marked done',
  'toast.followUp.doneFailed': "Couldn't update follow-up",
  'toast.followUp.snoozed': 'Follow-up snoozed',
  'toast.followUp.snoozeFailed': "Couldn't snooze follow-up",
  'toast.applications.loadFailed': "Couldn't load applications",
  'toast.applications.deleted': 'Application deleted',
  'toast.applications.deleteFailed': "Couldn't delete application",
  'toast.applications.deleteEmpty': 'Nothing to delete — add an application first',
  'toast.application.saved': 'Application saved',
  'toast.application.saveFailed': 'Backend rejected the application',
  'toast.form.fixErrors': 'Fix the errors in the form',
  'toast.backend.ok': 'Backend responded',
};

export const dictionaries: Record<Locale, Record<TranslationKey, string>> = {
  pl: PL,
  en: EN,
};

export const availableLocales: readonly Locale[] = ['pl', 'en'] as const;
