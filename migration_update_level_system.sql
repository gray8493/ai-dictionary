-- Migration to update level system to use text levels (Learner, Scholar, Master)
-- Run this SQL in your Supabase SQL Editor after running the initial migration

-- First, update the level column type
ALTER TABLE user_profiles ALTER COLUMN level TYPE TEXT;
ALTER TABLE user_profiles ALTER COLUMN level SET DEFAULT 'Learner';

-- Update existing levels to text
UPDATE user_profiles SET level =
  CASE
    WHEN xp <= 1500 THEN 'Learner'
    WHEN xp <= 5000 THEN 'Scholar'
    ELSE 'Master'
  END;

-- Update the function to return TEXT instead of INTEGER
CREATE OR REPLACE FUNCTION calculate_level_from_xp(xp_amount INTEGER)
RETURNS TEXT AS $$
BEGIN
  -- Level calculation based on XP thresholds:
  -- 0-1500 XP: Learner
  -- 1501-5000 XP: Scholar
  -- 5000+ XP: Master
  IF xp_amount <= 1500 THEN
    RETURN 'Learner';
  ELSIF xp_amount <= 5000 THEN
    RETURN 'Scholar';
  ELSE
    RETURN 'Master';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;