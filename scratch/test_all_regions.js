import pg from 'pg';
const { Client } = pg;

const passwords = ['soygabrielsosa', 'password123', 'postgres', 'admin123', 'verena', 'vereg'];
const regions = [
  'sa-east-1',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-central-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-south-1',
  'ca-central-1'
];
const username = 'postgres.htujxxcfoiumykhmpbwe';

async function testAll() {
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    const password = passwords[0]; 
    const client = new Client({
      host,
      port: 6543,
      database: 'postgres',
      user: username,
      password,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 3000
    });

    try {
      await client.connect();
      console.log(`FOUND tenant in ${region}! Success with password ${password}`);
      await client.end();
      await tryPasswordsForRegion(host);
      return;
    } catch (err) {
      if (err.message.includes('password authentication failed')) {
        console.log(`FOUND tenant in ${region}! (Password authentication failed, but tenant exists)`);
        await client.end();
        await tryPasswordsForRegion(host);
        return;
      } else {
        console.log(`Region ${region}: ${err.message.trim()}`);
      }
      try {
        await client.end();
      } catch {}
    }
  }
}

async function tryPasswordsForRegion(host) {
  for (const password of passwords) {
    console.log(`Trying password ${password} on ${host}...`);
    const client = new Client({
      host,
      port: 6543,
      database: 'postgres',
      user: username,
      password,
      ssl: { rejectUnauthorized: false }
    });
    try {
      await client.connect();
      console.log(`SUCCESS! Connected with password: ${password}`);
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
      console.log(`Password ${password} failed:`, err.message.trim());
      try {
        await client.end();
      } catch {}
    }
  }
}

testAll();
