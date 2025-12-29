import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'weekly'; // 'weekly' or 'all_time'
    const limit = parseInt(searchParams.get('limit') || '50');

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    let query;

    if (type === 'weekly') {
      // Get users by weekly XP and weekly mastered vocabularies
      query = supabase
        .from('user_profiles')
        .select(`
          id,
          user_id,
          xp,
          level,
          weekly_xp,
          weekly_mastered,
          mastered_vocabularies,
          total_vocabularies,
          is_pro,
          display_name
        `)
        .order('weekly_xp', { ascending: false })
        .order('weekly_mastered', { ascending: false })
        .limit(limit);
    } else {
      // Get users by total XP and total mastered vocabularies
      query = supabase
        .from('user_profiles')
        .select(`
          id,
          user_id,
          xp,
          level,
          weekly_xp,
          weekly_mastered,
          mastered_vocabularies,
          total_vocabularies,
          is_pro,
          display_name
        `)
        .order('xp', { ascending: false })
        .order('mastered_vocabularies', { ascending: false })
        .limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      // If table doesn't exist, return empty leaderboard
      if (error.message?.includes('user_profiles') || error.message?.includes('does not exist')) {
        return NextResponse.json({
          success: true,
          type,
          data: []
        });
      }
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch leaderboard', details: error }, { status: 500 });
    }

    // Get user metadata for full names
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const userIds = data.map(item => item.user_id);
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

    const userMap = new Map();
    if (users && !usersError) {
      users.users.forEach(user => {
        userMap.set(user.id, {
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || ''
        });
      });
    }

    // Format the data to hide sensitive information and add ranking
    const leaderboard = data.map((item: any, index: number) => {
      const userMeta = userMap.get(item.user_id) || {};
      const fullName = `${userMeta.first_name} ${userMeta.last_name}`.trim();
      const displayName = fullName || item.display_name || `User ${item.user_id.substring(0, 8)}`;

      return {
        rank: index + 1,
        user_id: item.user_id,
        display_name: displayName,
        xp: item.xp,
        level: item.level,
        weekly_xp: item.weekly_xp,
        weekly_mastered: item.weekly_mastered,
        total_mastered: item.mastered_vocabularies,
        total_vocabularies: item.total_vocabularies,
        is_pro: item.is_pro || false
      };
    });

    return NextResponse.json({
      success: true,
      type,
      data: leaderboard
    });
  } catch (err: any) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error', details: err.message }, { status: 500 });
  }
}