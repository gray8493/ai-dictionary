const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetCredits() {
  try {
    console.log('Resetting AI credits to 3 for all users...');

    // Update profiles with valid ids (gt 0)
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ ai_credits: 3 })
      .gt('id', 0); // id > 0 to avoid WHERE clause error

    if (error) {
      console.error('Error resetting credits:', error);
      return;
    }

    console.log('✅ Successfully reset AI credits for all users!');
    console.log('Each user now has 3 AI credits again.');
  } catch (error) {
    console.error('Reset credits failed:', error);
    console.log('💡 Tip: Make sure the ai_credits column exists by running migration first');
  }
}

resetCredits();