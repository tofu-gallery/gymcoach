import { LoginForm } from '@/components/auth/login-form';
import { signupClosed } from '@/lib/signup';
import { Dumbbell } from 'lucide-react';

// Tofu: DISABLE_SIGNUP is read on each request (lib/signup.ts, TOFU.md).
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="flex items-center gap-2">
        <Dumbbell className="size-7" />
        <span className="text-xl font-semibold">GymCoach</span>
      </div>
      <LoginForm signupOpen={!signupClosed()} />
    </main>
  );
}
