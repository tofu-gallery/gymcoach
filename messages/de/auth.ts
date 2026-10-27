import { auth as english } from '../en/auth';
import type { MessageShape } from '@/i18n/message-types';

export const auth = {
  login: {
    title: 'Anmelden',
    description: 'Greif auf dein Trainingsprotokoll zu.',
    submit: 'Anmelden',
    submitting: 'Anmeldung läuft...',
    demoTitle: 'Demo-Account',
    demoSubmit: 'Als Demo anmelden',
    noAccount: 'Noch kein Account?',
    createAccount: 'Erstellen',
    error: 'Anmeldefehler.',
  },
  signup: {
    title: 'Account erstellen',
    description: 'Beginne mit dem Tracking deines Trainings.',
    submit: 'Account erstellen',
    submitting: 'Account wird erstellt...',
    hasAccount: 'Bereits ein Account?',
    signIn: 'Anmelden',
    error: 'Registrierungsfehler.',
    // Tofu: shown while DISABLE_SIGNUP is true (lib/signup.ts).
    closedTitle: 'Die Registrierung ist geschlossen',
    closed: 'Nur wer bereits ein Konto bei diesem GymCoach hat, kann sich anmelden.',
  },
  logout: 'Abmelden',
  logoutFailed: 'Abmeldung fehlgeschlagen. Du bist weiterhin angemeldet; versuche es erneut, wenn du online bist.',
  validation: {
    invalidEmail: 'Ungültige E-Mail',
    nameRequired: 'Name erforderlich',
    passwordRequired: 'Passwort erforderlich',
    passwordMin: 'Passwort muss mindestens 8 Zeichen lang sein',
  },
} satisfies MessageShape<typeof english>;
