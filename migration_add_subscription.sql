-- Migration to add subscription features: is_pro and ai_credits columns
-- Run this SQL in your Supabase SQL Editor or using Supabase CLI

-- Add columns to user_profiles table
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT FALSE;

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS ai_credits INTEGER DEFAULT 3 CHECK (ai_credits >= 0);

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS display_name TEXT;

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;