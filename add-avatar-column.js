// Script to add avatar_id column to user_profiles table
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addAvatarColumn() {
  try {
    // Add avatar_id column if it doesn't exist
    const { error } = await supabase.rpc('add_avatar_column');

    if (error) {
      console.error('Error adding column:', error);
      // If RPC doesn't exist, try direct SQL
      console.log('Trying direct SQL...');
      const { error: sqlError } = await supabase
        .from('user_profiles')
        .select('avatar_id')
        .limit(1);

      if (sqlError && sqlError.message.includes('avatar_id')) {
        console.log('Column does not exist, creating...');
        // Since we can't run DDL directly, we need to run this in Supabase dashboard
        console.log('Please run this SQL in Supabase SQL Editor:');
        console.log('ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar_id INTEGER DEFAULT 1;');
      } else {
        console.log('Column already exists or no error');
      }
    } else {
      console.log('Column added successfully via RPC');
    }
  } catch (error) {
    console.error('Script error:', error);
  }
}

addAvatarColumn();