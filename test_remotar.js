const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  try {
    const r = await axios.get('https://remotar.com.br/search/jobs?q=desenvolvedor');
    const $ = cheerio.load(r.data);
    
    // Tentar achar os links das vagas
    $('.job-card, .vaga, a[href*="/job/"]').each((i, el) => {
        const href = $(el).attr('href') || $(el).find('a').attr('href');
        if (href) {
            console.log(href.trim(), $(el).text().trim().replace(/\s+/g, ' ').substring(0, 50));
        }
    });
    console.log("Feito", $('a[href*="/job/"]').length);
  } catch(e) {
    console.error(e.message);
  }
}
test();
