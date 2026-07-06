const https = require('https');
require('dotenv').config({ path: '.env.local' });
const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
https.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const models = JSON.parse(data).models;
    if (models) {
      console.log(models.filter(m => m.name.includes('flash')).map(m => m.name).join(', '));
    } else {
      console.log(data);
    }
  });
});
