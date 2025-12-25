import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  console.log('Auth callback:', { code: !!code, next, origin });

  if (code) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      console.log('Exchange result:', { hasData: !!data, error: error?.message });

      if (!error && data?.session) {
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
        console.error('OAuth exchange error:', error);
      }
    } catch (err) {
      console.error('Auth callback error:', err);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}