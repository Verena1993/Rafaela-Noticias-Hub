import dns from 'dns';

dns.resolveCname('db.htujxxcfoiumykhmpbwe.supabase.co', (err, addresses) => {
  if (err) console.error('CNAME error:', err.message);
  else console.log('CNAME addresses:', addresses);
});

// Let's resolve reverse DNS for the IPv6
dns.reverse('2600:1f1e:90b:a701:25dd:3125:e9ed:c6f1', (err, hostnames) => {
  if (err) console.error('Reverse DNS error:', err.message);
  else console.log('Reverse DNS hostnames:', hostnames);
});
