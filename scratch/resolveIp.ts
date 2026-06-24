import dns from 'dns';

dns.resolve4('htujxxcfoiumykhmpbwe.supabase.co', (err, addresses) => {
  if (err) {
    console.error('Error resolving:', err);
  } else {
    console.log('IP Addresses:', addresses);
  }
});
