const http = require('http');
http.get('http://localhost:4000/api/shows/55555555-5555-4555-8555-555555555555/seats', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('DATA:', data));
}).on('error', (err) => console.log('ERROR:', err.message));
