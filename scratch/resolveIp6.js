import dns from 'dns';

dns.resolve6('db.htujxxcfoiumykhmpbwe.supabase.co', (err, addresses) => {
  if (err) console.error('Error resolving db IPv6:', err);
  else console.log('db IPv6 addresses:', addresses);
});
