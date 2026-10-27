import { auth as english } from '../en/auth';
import type { MessageShape } from '@/i18n/message-types';

export const auth = {
  login: {
    title: 'Iniciar sesión',
    description: 'Accede a tu registro de entrenamiento.',
    submit: 'Iniciar sesión',
    submitting: 'Iniciando sesión...',
    demoTitle: 'Cuenta de demostración',
    demoSubmit: 'Entrar con la demo',
    noAccount: '¿Aún no tienes cuenta?',
    createAccount: 'Crea una',
    error: 'Error al iniciar sesión.',
  },
  signup: {
    title: 'Crear cuenta',
    description: 'Empieza a registrar tus entrenamientos.',
    submit: 'Crear cuenta',
    submitting: 'Creando cuenta...',
    hasAccount: '¿Ya tienes una cuenta?',
    signIn: 'Iniciar sesión',
    error: 'Error al crear la cuenta.',
    // Tofu: shown while DISABLE_SIGNUP is true (lib/signup.ts).
    closedTitle: 'El registro está cerrado',
    closed: 'Solo pueden iniciar sesión quienes ya tienen una cuenta en este GymCoach.',
  },
  logout: 'Cerrar sesión',
  logoutFailed: 'No se pudo cerrar la sesión. Tu sesión sigue abierta; inténtalo de nuevo.',
  validation: {
    invalidEmail: 'Correo electrónico no válido',
    nameRequired: 'El nombre es obligatorio',
    passwordRequired: 'La contraseña es obligatoria',
    passwordMin: 'La contraseña debe tener al menos 8 caracteres',
  },
} satisfies MessageShape<typeof english>;
