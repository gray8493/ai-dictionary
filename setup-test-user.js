// Setup script for test user
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupTestUser() {
  console.log('Setting up test user profile...');

  try {
    // First check if we're already authenticated
    const { data: currentUser } = await supabase.auth.getUser();
    if (currentUser.user) {
      console.log('Already authenticated as:', currentUser.user.email);
    } else {
      console.log('Not authenticated, signing in...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'test123456'
      });

      if (error) {
        console.log('Test user not found, creating one...');
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
          email: 'test@example.com',
          password: 'test123456'
        });

        if (signupError) {
          console.error('Failed to create test user:', signupError.message);
          return;
        }

        console.log('Test user created. Please check email and confirm account.');
        console.log('For now, let\'s try using service role to set up the profile...');

        // Use service role to create profile
        const serviceSupabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);

        // Get the user we just created
        const { data: users } = await serviceSupabase.auth.admin.listUsers();
        const testUser = users.users.find(u => u.email === 'test@example.com');

        if (testUser) {
          console.log('Creating profile for test user...');
          const { error: insertError } = await serviceSupabase
            .from('user_profiles')
            .insert({
              user_id: testUser.id,
              is_pro: true,
              ai_credits_remaining: 10
            });

          if (insertError) {
            console.error('Failed to create profile:', insertError.message);
          } else {
            console.log('Profile created with Pro status');
          }
        }

        return;
      }

      console.log('Signed in as test user');
    }

    const userId = currentUser.user?.id || (await supabase.auth.getUser()).data.user.id;

    // Check if user profile exists
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError && profileError.code === 'PGRST116') {
      console.log('Creating user profile...');
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          is_pro: true,
          ai_credits_remaining: 10
        });

      if (insertError) {
        console.error('Failed to create profile:', insertError.message);
      } else {
        console.log('Profile created with Pro status');
      }
    } else if (profile) {
      console.log('Profile exists:', profile);
      if (!profile.is_pro) {
        console.log('Updating to Pro...');
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ is_pro: true, ai_credits_remaining: 10 })
          .eq('user_id', userId);

        if (updateError) {
          console.error('Failed to update profile:', updateError.message);
        } else {
          console.log('Profile updated to Pro');
        }
      }
    }

    console.log('Test user setup complete!');

  } catch (error) {
    console.error('Setup error:', error.message);
  }
}

setupTestUser();