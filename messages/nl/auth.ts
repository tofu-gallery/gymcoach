import { auth as english } from '../en/auth';
import type { MessageShape } from '@/i18n/message-types';

export const auth = {
  login: {
    title: 'Inloggen',
    description: 'Open je trainingslogboek.',
    submit: 'Inloggen',
    submitting: 'Inloggen...',
    demoTitle: 'Demo-account',
    demoSubmit: 'Inloggen als demo',
    noAccount: 'Nog geen account?',
    createAccount: 'Maak er een aan',
    error: 'Fout bij inloggen.',
  },
  signup: {
    title: 'Account aanmaken',
    description: 'Begin met het bijhouden van je trainingen.',
    submit: 'Account aanmaken',
    submitting: 'Account aanmaken...',
    hasAccount: 'Heb je al een account?',
    signIn: 'Inloggen',
    error: 'Fout bij registreren.',
    // Tofu: shown while DISABLE_SIGNUP is true (lib/signup.ts).
    closedTitle: 'Registratie is gesloten',
    closed: 'Alleen mensen die al een account hebben bij deze GymCoach kunnen inloggen.',
  },
  logout: 'Uitloggen',
  logoutFailed: 'Uitloggen is niet gelukt. Je bent nog ingelogd; probeer het opnieuw.',
  validation: {
    invalidEmail: 'Ongeldig e-mailadres',
    nameRequired: 'Naam is verplicht',
    passwordRequired: 'Wachtwoord is verplicht',
    passwordMin: 'Het wachtwoord moet minstens 8 tekens bevatten',
  },
} satisfies MessageShape<typeof english>;
