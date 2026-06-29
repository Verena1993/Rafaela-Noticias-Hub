import dns from 'dns';

dns.resolve4('htujxxcfoiumykhmpbwe.supabase.co', (err, addresses) => {
  if (err) console.error('Error resolving htujxxcfoiumykhmpbwe.supabase.co:', err);
  else console.log('htujxxcfoiumykhmpbwe.supabase.co IP:', addresses);
});

dns.resolve4('db.htujxxcfoiumykhmpbwe.supabase.co', (err, addresses) => {
  if (err) console.error('Error resolving db.htujxxcfoiumykhmpbwe.supabase.co:', err);
  else console.log('db.htujxxcfoiumykhmpbwe.supabase.co IP:', addresses);
});
