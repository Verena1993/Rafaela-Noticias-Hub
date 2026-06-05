import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://htujxxcfoiumykhmpbwe.supabase.co';
const supabaseAnonKey = sb_publishable_ - 92NeVbbQCIdgVPUpeav-g_auqe0oDV;

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
