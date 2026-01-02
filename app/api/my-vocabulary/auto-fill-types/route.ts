
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const token = authHeader.replace('Bearer ', '');

        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: `Bearer ${token}` } },
        });

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const supabaseAdmin = supabaseServiceKey
            ? createClient(supabaseUrl, supabaseServiceKey)
            : supabase;

        // Fetch words with no type or default type
        const { data: wordsToUpdate, error: fetchError } = await supabaseAdmin
            .from('vocabularies')
            .select('id, word, type')
            .eq('user_id', user.id)
            .or('type.is.null,type.eq.word');

        if (fetchError) throw fetchError;
        if (!wordsToUpdate || wordsToUpdate.length === 0) {
            return NextResponse.json({ success: true, message: 'No words need updating' });
        }

        let updatedCount = 0;
        for (const item of wordsToUpdate) {
            try {
                const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${item.word}`);
                if (dictRes.ok) {
                    const dictData = await dictRes.json();
                    const pos = dictData[0]?.meanings[0]?.partOfSpeech;
                    if (pos) {
                        await supabaseAdmin
                            .from('vocabularies')
                            .update({ type: pos })
                            .eq('id', item.id);
                        updatedCount++;
                    }
                }
            } catch (err) {
                console.error(`Failed to update word ${item.word}:`, err);
            }
        }

        return NextResponse.json({ success: true, updatedCount });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
