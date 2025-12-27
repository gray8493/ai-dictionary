import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');

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

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // If table doesn't exist or profile doesn't exist, return default profile
      if (error.code === 'PGRST116' || error.message?.includes('relation "user_profiles" does not exist')) {
        const defaultProfile = {
          id: null,
          user_id: user.id,
          xp: 0,
          level: 1,
          total_vocabularies: 0,
          mastered_vocabularies: 0,
          weekly_xp: 0,
          weekly_mastered: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        return NextResponse.json({ success: true, data: defaultProfile });
      }

      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch profile', details: error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error', details: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, xp, mastered_count, source, difficulty } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');

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

    // Get current profile first
    let { data: currentProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // If profile doesn't exist, create a default one
    if (fetchError && (fetchError.code === 'PGRST116' || fetchError.message?.includes('user_profiles') || fetchError.message?.includes('does not exist'))) {
      // Try to create profile using service role to bypass RLS
      const serviceSupabase = supabaseServiceKey
        ? createClient(supabaseUrl, supabaseServiceKey)
        : supabase;

      const { data: newProfile, error: createError } = await serviceSupabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          xp: 0,
          level: 1,
          total_vocabularies: 0,
          mastered_vocabularies: 0,
          weekly_xp: 0,
          weekly_mastered: 0
        })
        .select()
        .single();

      if (createError) {
        console.error('Failed to create profile:', createError);
        // Return default profile for now
        currentProfile = {
          id: null,
          user_id: user.id,
          xp: 0,
          level: 1,
          total_vocabularies: 0,
          mastered_vocabularies: 0,
          weekly_xp: 0,
          weekly_mastered: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      } else {
        currentProfile = newProfile;
      }
    } else if (fetchError) {
      console.error('Supabase error:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch current profile', details: fetchError }, { status: 500 });
    }

    let updateData: any = {};
    let awardedXP = 0;

    if (action === 'add_xp' && typeof xp === 'number') {
      // Apply difficulty multiplier
      let multiplier = 1;
      if (difficulty === 'medium') multiplier = 1.5;
      else if (difficulty === 'hard') multiplier = 2;

      awardedXP = Math.floor(xp * multiplier);
      updateData.xp = (currentProfile.xp || 0) + awardedXP;
      updateData.weekly_xp = (currentProfile.weekly_xp || 0) + awardedXP;
    } else if (action === 'update_mastered' && typeof mastered_count === 'number') {
      updateData.mastered_vocabularies = mastered_count;
      updateData.weekly_mastered = (currentProfile.weekly_mastered || 0) + mastered_count;
    } else if (action === 'vocabulary_extracted' && typeof xp === 'number') {
      // XP for extracting vocabulary from files (5 XP per word)
      awardedXP = xp;
      updateData.xp = (currentProfile.xp || 0) + awardedXP;
      updateData.weekly_xp = (currentProfile.weekly_xp || 0) + awardedXP;
      updateData.total_vocabularies = (currentProfile.total_vocabularies || 0) + 1;
    } else if (action === 'practice_correct' && typeof xp === 'number') {
      // XP for correct answers in practice (10 XP per correct answer with difficulty multiplier)
      let multiplier = 1;
      if (difficulty === 'medium') multiplier = 1.5;
      else if (difficulty === 'hard') multiplier = 2;

      awardedXP = Math.floor(xp * multiplier);
      updateData.xp = (currentProfile.xp || 0) + awardedXP;
      updateData.weekly_xp = (currentProfile.weekly_xp || 0) + awardedXP;
    } else {
      return NextResponse.json({ error: 'Invalid action or parameters' }, { status: 400 });
    }

    let data, error;

    // Always use service role for profile operations to bypass RLS
    const serviceSupabase = supabaseServiceKey
      ? createClient(supabaseUrl, supabaseServiceKey)
      : supabase;

    if (currentProfile.id) {
      // Profile exists, update it
      const result = await serviceSupabase
        .from('user_profiles')
        .update(updateData)
        .eq('user_id', user.id)
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else {
      // Profile doesn't exist, create it
      const result = await serviceSupabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          ...updateData
        })
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to update profile', details: error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      xpAwarded: awardedXP,
      source
    });
  } catch (err: any) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error', details: err.message }, { status: 500 });
  }
}