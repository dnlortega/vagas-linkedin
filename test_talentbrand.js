const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  try {
    const r = await axios.get('https://www.talentbrand.com.br/vagas?q=bauru', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(r.data);
    console.log($('title').text());
    
    // Tentando achar links
    $('a').each((i, el) => {
        const href = $(el).attr('href');
        if (href && href.includes('vaga')) {
            console.log(href.trim(), $(el).text().trim().replace(/\s+/g, ' ').substring(0, 50));
        }
    });
    console.log("Feito!");
  } catch(e) {
    console.error("ERRO:", e.message);
  }
}
test();
