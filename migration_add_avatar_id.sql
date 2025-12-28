-- Migration to add avatar_id column to user_profiles table
-- Run this SQL in your Supabase SQL Editor

-- Add avatar_id column to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN avatar_id INTEGER DEFAULT 1 CHECK (avatar_id >= 1 AND avatar_id <= 12);

-- Update existing profiles to have default avatar
UPDATE user_profiles
SET avatar_id = 1
WHERE avatar_id IS NULL;