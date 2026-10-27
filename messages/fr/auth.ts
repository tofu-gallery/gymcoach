import { auth as english } from '../en/auth';
import type { MessageShape } from '@/i18n/message-types';

export const auth = {
  login: {
    title: 'Connexion',
    description: 'Accédez à votre carnet d’entraînement.',
    submit: 'Se connecter',
    submitting: 'Connexion...',
    demoTitle: 'Compte démo',
    demoSubmit: 'Entrer en démo',
    noAccount: 'Pas encore de compte ?',
    createAccount: 'En créer un',
    error: 'Erreur de connexion.',
  },
  signup: {
    title: 'Créer un compte',
    description: 'Commencez à suivre vos entraînements.',
    submit: 'Créer le compte',
    submitting: 'Création du compte...',
    hasAccount: 'Déjà un compte ?',
    signIn: 'Se connecter',
    error: 'Erreur lors de l’inscription.',
    // Tofu: shown while DISABLE_SIGNUP is true (lib/signup.ts).
    closedTitle: 'Les inscriptions sont fermées',
    closed: 'Seules les personnes qui ont déjà un compte sur ce GymCoach peuvent se connecter.',
  },
  logout: 'Se déconnecter',
  logoutFailed: 'Déconnexion impossible. Vous êtes toujours connecté ; réessayez.',
  validation: {
    invalidEmail: 'Email invalide',
    nameRequired: 'Nom requis',
    passwordRequired: 'Mot de passe requis',
    passwordMin: 'Le mot de passe doit contenir au moins 8 caractères',
  },
} satisfies MessageShape<typeof english>;
