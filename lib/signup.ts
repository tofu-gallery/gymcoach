// Tofu: this file is Tofu's addition (see TOFU.md).
//
// DISABLE_SIGNUP=true closes sign-up: the sign-up page says so, the login page
// no longer offers it, and POST /api/auth/register answers 403. Accounts that
// already exist keep signing in. It is read on the server at run time, never
// baked into the browser bundle. Unset (or anything else) keeps sign-up open,
// as upstream.
export function signupClosed(env: NodeJS.ProcessEnv = process.env): boolean {
  const value = env.DISABLE_SIGNUP?.trim().toLowerCase();
  return value === 'true' || value === '1' || value === 'yes';
}
