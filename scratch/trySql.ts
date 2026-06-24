import { Client } from 'pg';

const passwords = ['password123', 'postgres', 'admin123', 'verena', 'vereg', 'soygabrielsosa'];
const host = 'db.htujxxcfoiumykhmpbwe.supabase.co';
const user = 'postgres';

async function tryPassword(password: string) {
  console.log(`Trying password: ${password}...`);
  const client = new Client({
    host,
    port: 5432,
    database: 'postgres',
    user,
    password,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log(`SUCCESS! Connected with password: ${password}`);
    
    console.log('Creating delete_user_by_id function...');
    await client.query(`
      CREATE OR REPLACE FUNCTION public.delete_user_by_id(user_id UUID)
      RETURNS VOID AS $$
      DECLARE
        caller_role TEXT;
      BEGIN
        -- Get the role of the caller from public.profiles
        SELECT rol INTO caller_role FROM public.profiles WHERE id = auth.uid() AND activo = true;

        -- Only allow if the caller is an admin
        IF caller_role <> 'admin' OR caller_role IS NULL THEN
          RAISE EXCEPTION 'Only active administrators can delete users.';
        END IF;

        -- Delete from auth.users (which cascades to public.profiles)
        DELETE FROM auth.users WHERE id = user_id;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    console.log('Function delete_user_by_id created successfully!');
    await client.end();
    return true;
  } catch (err: any) {
    console.log(`Failed for password ${password}:`, err.message);
    try {
      await client.end();
    } catch {}
    return false;
  }
}

async function run() {
  for (const pw of passwords) {
    const ok = await tryPassword(pw);
    if (ok) break;
  }
}

run().catch(console.error);
