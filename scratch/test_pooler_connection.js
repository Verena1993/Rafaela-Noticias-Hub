import pg from 'pg';
const { Client } = pg;

const passwords = ['soygabrielsosa', 'password123', 'postgres', 'admin123', 'verena', 'vereg'];
const regions = ['sa-east-1', 'us-east-1'];
const username = 'postgres.htujxxcfoiumykhmpbwe';

async function testConnections() {
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    console.log(`--- Testing region: ${region} (${host}) ---`);
    for (const password of passwords) {
      console.log(`Connecting with password: ${password}...`);
      const client = new Client({
        host,
        port: 6543, // Transaction pooler port
        database: 'postgres',
        user: username,
        password,
        ssl: { rejectUnauthorized: false }
      });

      try {
        await client.connect();
        console.log(`SUCCESS! Connected to ${region} using password: ${password}`);
        
        // Let's run a query to check existing tables
        const res = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
          ORDER BY table_name;
        `);
        console.log('Tables in database:', res.rows.map(r => r.table_name));
        
        await client.end();
        return;
      } catch (err) {
        console.log(`Failed:`, err.message);
        try {
          await client.end();
        } catch {}
      }
    }
  }
}

testConnections();
