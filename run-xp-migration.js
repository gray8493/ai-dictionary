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

async function runMigration() {
  try {
    // Read the migration file
    const migrationSQL = fs.readFileSync('migration_add_xp_function.sql', 'utf8');

    console.log('Running XP function migration...');
    console.log('SQL to execute:');
    console.log(migrationSQL);

    // Execute the SQL directly
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('Migration failed:', error);
      console.log('Please run the SQL manually in Supabase SQL Editor:');
      console.log(migrationSQL);
    } else {
      console.log('Migration completed successfully!');
    }
  } catch (error) {
    console.error('Migration failed:', error);
    console.log('Please run the SQL manually in Supabase SQL Editor.');
  }
}

runMigration();