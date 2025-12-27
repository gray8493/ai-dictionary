-- Migration to add status column to vocabularies table
-- Run this SQL in your Supabase SQL Editor or using Supabase CLI

-- Add status column with default value 'learning' (only if it doesn't exist)
DO $
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'vocabularies' AND column_name = 'status') THEN
        ALTER TABLE vocabularies
        ADD COLUMN status TEXT DEFAULT 'learning' CHECK (status IN ('learning', 'mastered', 'review'));
    END IF;
END $;

-- Create a unique constraint on (user_id, word) to prevent duplicates (only if it doesn't exist)
DO $
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE table_name = 'vocabularies' AND constraint_name = 'unique_user_word') THEN
        ALTER TABLE vocabularies
        ADD CONSTRAINT unique_user_word UNIQUE (user_id, word);
    END IF;
END $;

-- Update existing records to have status 'learning' if they are NULL
UPDATE vocabularies SET status = 'learning' WHERE status IS NULL;