import fetch from 'node-fetch'; 
async function fetchMP() { 
  const token = 'APP_USR-3322444120483456-072316-c328d2ad7cb6de93a33a94812589756e-43153257'; 
  const url = 'https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=50'; 
  const res = await fetch(url, { headers: { 'Authorization': 'Bearer ' + token }}); 
  const data = await res.json(); 
  const fs = require('fs');
  fs.writeFileSync('mp_results.json', JSON.stringify(data.results, null, 2));
} 
fetchMP();
