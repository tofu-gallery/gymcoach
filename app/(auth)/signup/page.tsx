import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { SignupForm } from '@/components/auth/signup-form';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { signupClosed } from '@/lib/signup';
import { Dumbbell } from 'lucide-react';

// Tofu: DISABLE_SIGNUP is read on each request (lib/signup.ts, TOFU.md).
export const dynamic = 'force-dynamic';

export default async function SignupPage() {
  const closed = signupClosed();
  const t = await getTranslations('auth');
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="flex items-center gap-2">
        <Dumbbell className="size-7" />
        <span className="text-xl font-semibold">GymCoach</span>
      </div>
      {closed ? (
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>{t('signup.closedTitle')}</CardTitle>
            <CardDescription>{t('signup.closed')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/login"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {t('signup.signIn')}
            </Link>
          </CardContent>
        </Card>
      ) : (
        <SignupForm />
      )}
    </main>
  );
}
