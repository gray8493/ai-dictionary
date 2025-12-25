import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Request body:', body);
    const { word, ipa, definition } = body;

    if (!word || !definition) {
      return NextResponse.json({ error: 'Word and definition are required' }, { status: 400 });
    }

    // Get user from session
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');

    // Create supabase client with user's JWT token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role client for insert to bypass RLS if service key is available
    const insertClient = supabaseServiceKey
      ? createClient(supabaseUrl, supabaseServiceKey)
      : supabase;

    console.log('Inserting:', { word, ipa: ipa || '', meaning: definition, user_id: user.id });
    const { data, error } = await insertClient
      .from('vocabularies')
      .insert([{ word, ipa: ipa || '', meaning: definition, user_id: user.id }]);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to save word', details: error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error', details: err.message }, { status: 500 });
  }
}