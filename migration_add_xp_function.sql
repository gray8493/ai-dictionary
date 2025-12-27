-- Migration to add the increment_user_xp function for XP system

-- Function to increment user XP and update level
CREATE OR REPLACE FUNCTION increment_user_xp(user_id_param UUID, xp_amount INTEGER)
RETURNS VOID AS $
DECLARE
  new_xp INTEGER;
BEGIN
  -- Get current XP
  SELECT xp INTO new_xp FROM user_profiles WHERE user_id = user_id_param;

  IF new_xp IS NULL THEN
    RAISE EXCEPTION 'User profile not found for user %', user_id_param;
  END IF;

  -- Calculate new XP
  new_xp := new_xp + xp_amount;

  -- Update user profile (level will be automatically calculated by trigger)
  UPDATE user_profiles
  SET
    xp = new_xp,
    weekly_xp = weekly_xp + xp_amount,
    updated_at = NOW()
  WHERE user_id = user_id_param;

END;
$ LANGUAGE plpgsql SECURITY DEFINER;