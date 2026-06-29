import pg from 'pg';
const { Client } = pg;

const passwords = ['password123', 'postgres', 'admin123', 'verena', 'vereg', 'soygabrielsosa'];
const host = 'db.htujxxcfoiumykhmpbwe.supabase.co';
const user = 'postgres';

async function listTables() {
  for (const password of passwords) {
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
      console.log(`CONNECTED with password: ${password}`);
      const res = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `);
      console.log('Tables in public schema:');
      console.log(res.rows.map(r => r.table_name));
      await client.end();
      return;
    } catch (err) {
      console.log(`Failed for password ${password}:`, err.message);
      try {
        await client.end();
      } catch {}
    }
  }
}

listTables();
