import pg from 'pg';
const { Client } = pg;

const passwords = ['soygabrielsosa', 'password123', 'postgres', 'admin123', 'verena', 'vereg'];
const host = '2600:1f1e:90b:a701:25dd:3125:e9ed:c6f1';
const username = 'postgres';

async function testDirect() {
  for (const password of passwords) {
    console.log(`Connecting to ${host} with password: ${password}...`);
    const client = new Client({
      host,
      port: 5432,
      database: 'postgres',
      user: username,
      password,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000
    });

    try {
      await client.connect();
      console.log(`SUCCESS! Connected directly using password: ${password}`);
      const res = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `);
      console.log('Tables:', res.rows.map(r => r.table_name));
      await client.end();
      return;
    } catch (err) {
      console.log(`Failed:`, err.message.trim());
      try {
        await client.end();
      } catch {}
    }
  }
}

testDirect();
