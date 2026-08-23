const { apiJson } = require('./apps/web/lib/api');
apiJson('/bookings/ENC-55F9CA50').then(console.log).catch(console.error);
