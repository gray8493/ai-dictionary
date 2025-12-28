import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const next = searchParams.get('next') ?? '/';

  console.log('Auth callback:', { code: !!code, error, errorDescription, next, origin });

  for (const [key, value] of searchParams.entries()) {
    console.log(`Param: ${key} = ${value}`);
  }

  if (error) {
    console.error('OAuth error in callback:', error, errorDescription);
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || '')}`);
  }

  if (code) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      console.log('Exchange result:', { hasData: !!data, error: exchangeError?.message });

      if (!exchangeError && data?.session) {
        const forwardedHost = request.headers.get('x-forwarded-host');
        const isLocalEnv = process.env.NODE_ENV === 'development';

        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}${next}`);
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${next}`);
        } else {
          return NextResponse.redirect(`${origin}${next}`);
        }
      } else {
        console.error('OAuth exchange error:', exchangeError);
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=exchange_failed&description=${encodeURIComponent(exchangeError?.message || 'Exchange failed')}`);
      }
    } catch (err) {
      console.error('Auth callback error:', err);
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=callback_error&description=${encodeURIComponent((err as Error).message)}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}