import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  try {
    // Get authorization token from header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Create Supabase client with user's token (RLS will handle permissions)
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Set user to Pro (development mode) - expires in 1 month
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    const { error } = await supabase
      .from('user_profiles')
      .update({
        is_pro: true,
        subscription_expires_at: expiresAt.toISOString()
      })
      .eq('user_id', user.id);

    if (error) {
      console.error('Upgrade error:', error);
      return NextResponse.json({ error: 'Failed to upgrade' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Upgraded to Pro successfully!' });
  } catch (error) {
    console.error('Upgrade API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}