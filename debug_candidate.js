const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1]] = match[2];
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data, error } = await supabase
    .from('candidate_profiles')
    .select('*')
    .eq('id', '71354df2-4666-4fe1-8229-a4a5e784b8f2')
    .single();

  if (error) {
    console.error(error);
  } else {
    console.log("CANDIDATE NAME:", data.name);
    console.log("DOSSIER:", data.dossier);
  }
}

main();
