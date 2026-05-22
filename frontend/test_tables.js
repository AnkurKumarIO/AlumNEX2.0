import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ugwjnnfjukvxpvrlrseo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnd2pubmZqdWt2eHB2cmxyc2VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMzQ4NzAsImV4cCI6MjA5MzgxMDg3MH0.nDJmVAkWenizhCeWWZYrg2QXfmQc76rV7MrfGKapTPo';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  console.log('Fetching users...');
  const { data: users, error: uErr } = await supabase.from('User').select('*').limit(5);
  if (uErr) {
    console.error('Users error:', uErr.message);
  } else {
    console.log('Users count:', users?.length);
    console.log('First user:', users?.[0]);
  }
}

run();
