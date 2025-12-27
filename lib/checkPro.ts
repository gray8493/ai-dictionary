import { supabase } from './supabase';

export const checkIsPro = async (user: any): Promise<boolean> => {
  console.log('checkIsPro: user =', user?.id);
  if (!user) return false;

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('is_pro')
    .eq('user_id', user.id)
    .single();

  console.log('checkIsPro: profile =', profile, 'error =', error);
  return profile?.is_pro || false;
};

export const checkAICredits = async (user: any): Promise<number> => {
  if (!user) return 0;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('ai_credits')
    .eq('user_id', user.id)
    .single();

  return profile?.ai_credits || 0;
};

export const hasAIAccess = async (user: any): Promise<boolean> => {
  const isPro = await checkIsPro(user);
  console.log('hasAIAccess: isPro =', isPro);
  return isPro; // Chỉ cho phép nếu là Pro user
};

export const consumeAICredit = async (user: any): Promise<boolean> => {
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