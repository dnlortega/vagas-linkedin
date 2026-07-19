const axios = require('axios');
axios.get('https://portal.api.gupy.io/api/v1/jobs?jobName=desenvolvedor&city=Bauru', {
  headers: {
    'User-Agent': 'Mozilla/5.0'
  }
}).then(r => console.log('OK', r.data)).catch(e => console.log('ERRO:', e.message));
