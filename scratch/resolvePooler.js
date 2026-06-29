import dns from 'dns';

const poolers = [
  'aws-0-sa-east-1.pooler.supabase.com',
  'aws-0-us-east-1.pooler.supabase.com',
  'aws-0-us-west-1.pooler.supabase.com',
  'aws-0-us-west-2.pooler.supabase.com',
  'aws-0-eu-west-1.pooler.supabase.com',
  'aws-0-eu-central-1.pooler.supabase.com',
  'aws-0-ap-southeast-1.pooler.supabase.com',
  'aws-0-ap-northeast-1.pooler.supabase.com'
];

for (const p of poolers) {
  dns.resolve4(p, (err, addresses) => {
    if (err) {
      // Try resolving v6
      dns.resolve6(p, (err6, addresses6) => {
        if (!err6) console.log(`${p} resolved to IPv6:`, addresses6);
      });
    } else {
      console.log(`${p} resolved to IPv4:`, addresses);
    }
  });
}
