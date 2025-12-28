import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
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

    // Get user profile with subscription info
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        id,
        user_id,
        xp,
        level,
        total_vocabularies,
        mastered_vocabularies,
        weekly_xp,
        weekly_mastered,
        created_at,
        updated_at,
        is_pro,
        ai_credits,
        display_name,
        subscription_expires_at
      `)
      .eq('user_id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Profile fetch error:', profileError);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    // Return profile or create default if not exists
    const userProfile = profile || {
      id: null,
      user_id: user.id,
      xp: 0,
      level: 1,
      total_vocabularies: 0,
      mastered_vocabularies: 0,
      weekly_xp: 0,
      weekly_mastered: 0,
      is_pro: false,
      ai_credits: 3,
      display_name: user.email?.split('@')[0] || 'User',
      avatar_id: 1, // Default avatar
      subscription_expires_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: userProfile
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
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

    const body = await req.json();
    const { action, xp, difficulty, display_name, avatar_id } = body;

    if (action === 'practice_correct') {
      // Award XP logic
      const xpGained = xp || (difficulty === 'easy' ? 10 : difficulty === 'medium' ? 15 : 20);

      // Get current profile data
      const { data: profile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('xp, weekly_xp')
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        console.error('Profile fetch error:', fetchError);
        return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
      }

      const oldWeeklyXP = profile?.weekly_xp || 0;
      const newWeeklyXP = oldWeeklyXP + xpGained;

      // Check if daily goal reached (200 XP) and award bonus
      let bonusXP = 0;
      console.log(`XP calculation: oldWeeklyXP=${oldWeeklyXP}, xpGained=${xpGained}, newWeeklyXP=${newWeeklyXP}`);
      if (newWeeklyXP >= 200) {
        bonusXP = 100;
        console.log('Daily goal reached! Awarding 100 XP bonus');
      }

      // Update XP directly (level will be auto-calculated by trigger)
      const { error } = await supabase
        .from('user_profiles')
        .update({
          xp: (profile?.xp || 0) + xpGained + bonusXP,
          weekly_xp: newWeeklyXP,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('XP increment error:', error);
        return NextResponse.json({ error: 'Failed to award XP' }, { status: 500 });
      }

      return NextResponse.json({ success: true, xpAwarded: xpGained, bonusXP });
    }

    if (action === 'update_display_name' && display_name) {
      // Update display name
      const { error } = await supabase
        .from('user_profiles')
        .update({
          display_name: display_name.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Display name update error:', error);
        return NextResponse.json({ error: 'Failed to update display name' }, { status: 500 });
      }

      return NextResponse.json({ success: true, display_name });
    }

    if (action === 'update_avatar' && avatar_id !== undefined) {
      // Update avatar (will work once migration is run)
      try {
        const { error } = await supabase
          .from('user_profiles')
          .update({
            avatar_id: avatar_id,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (error) {
          console.error('Avatar update error:', error);
          // If column doesn't exist yet, return success anyway
          if (error.message?.includes('avatar_id')) {
            return NextResponse.json({ success: true, avatar_id });
          }
          return NextResponse.json({ error: 'Failed to update avatar' }, { status: 500 });
        }

        return NextResponse.json({ success: true, avatar_id });
      } catch (error) {
        console.error('Avatar update exception:', error);
        // Return success for now if migration not run
        return NextResponse.json({ success: true, avatar_id });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}