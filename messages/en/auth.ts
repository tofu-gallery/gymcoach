export const auth = {
  login: {
    title: 'Sign in',
    description: 'Access your training log.',
    submit: 'Sign in',
    submitting: 'Signing in...',
    demoTitle: 'Demo account',
    demoSubmit: 'Log in as demo',
    noAccount: 'No account yet?',
    createAccount: 'Create one',
    error: 'Login error.',
  },
  signup: {
    title: 'Create account',
    description: 'Start tracking your training.',
    submit: 'Create account',
    submitting: 'Creating account...',
    hasAccount: 'Already have an account?',
    signIn: 'Sign in',
    error: 'Registration error.',
    // Tofu: shown while DISABLE_SIGNUP is true (lib/signup.ts).
    closedTitle: 'Sign-up is closed',
    closed: 'Only people who already have an account on this GymCoach can sign in.',
  },
  logout: 'Log out',
  logoutFailed: 'Could not log out. You are still signed in; try again.',
  validation: {
    invalidEmail: 'Invalid email',
    nameRequired: 'Name required',
    passwordRequired: 'Password required',
    passwordMin: 'Password must contain at least 8 characters',
  },
};
