import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';

// La raíz sólo enruta: onboarding si falta completarlo, si no al home.
export const dynamic = 'force-dynamic';

export default async function RootPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_done')
    .eq('id', user.id)
    .single();

  redirect(profile?.onboarding_done ? '/home' : '/onboarding');
}
