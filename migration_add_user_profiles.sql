-- Migration to add user_profiles table for XP and ranking system
-- Run this SQL in your Supabase SQL Editor or using Supabase CLI

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  xp INTEGER DEFAULT 0 CHECK (xp >= 0),
  level INTEGER DEFAULT 1 CHECK (level >= 1),
  total_vocabularies INTEGER DEFAULT 0 CHECK (total_vocabularies >= 0),
  mastered_vocabularies INTEGER DEFAULT 0 CHECK (mastered_vocabularies >= 0),
  weekly_xp INTEGER DEFAULT 0 CHECK (weekly_xp >= 0),
  weekly_mastered INTEGER DEFAULT 0 CHECK (weekly_mastered >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow service role to manage profiles
CREATE POLICY "Service role can manage all profiles" ON user_profiles
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to calculate level from XP (based on rank thresholds)
CREATE OR REPLACE FUNCTION calculate_level_from_xp(xp_amount INTEGER)
RETURNS INTEGER AS $
BEGIN
  -- Level calculation based on XP thresholds:
  -- 0-500 XP: Level 1 (Newbie)
  -- 501-1500 XP: Level 2 (Learner)
  -- 1501-5000 XP: Level 3 (Scholar)
  -- 5000+ XP: Level 4 (Master)
  IF xp_amount <= 500 THEN
    RETURN 1;
  ELSIF xp_amount <= 1500 THEN
    RETURN 2;
  ELSIF xp_amount <= 5000 THEN
    RETURN 3;
  ELSE
    RETURN 4;
  END IF;
END;
$ LANGUAGE plpgsql IMMUTABLE;

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update level when XP changes
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.xp != NEW.xp THEN
    NEW.level = calculate_level_from_xp(NEW.xp);
    NEW.updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update level
DROP TRIGGER IF EXISTS on_xp_change ON user_profiles;
CREATE TRIGGER on_xp_change
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_user_level();

-- Function to reset weekly stats (run this on Monday)
CREATE OR REPLACE FUNCTION reset_weekly_stats()
RETURNS void AS $$
BEGIN
  UPDATE user_profiles
  SET weekly_xp = 0, weekly_mastered = 0, updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;