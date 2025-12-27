import { supabase } from './supabase';

export const checkIsPro = async (): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_pro')
    .eq('user_id', user.id)
    .single();

  return profile?.is_pro || false;
};

export const checkAICredits = async (): Promise<number> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('ai_credits')
    .eq('user_id', user.id)
    .single();

  return profile?.ai_credits || 0;
};

export const hasAIAccess = async (): Promise<boolean> => {
  const isPro = await checkIsPro();
  return isPro; // Chỉ cho phép nếu là Pro user
};

export const consumeAICredit = async (): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('ai_credits')
    .eq('user_id', user.id)
    .single();

  if (!profile || profile.ai_credits <= 0) return false;

  const { error } = await supabase
    .from('user_profiles')
    .update({ ai_credits: profile.ai_credits - 1 })
    .eq('user_id', user.id);

  return !error;
};