const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  try {
    const r = await axios.get('https://www.bauruempregos.com.br/home/vagas');
    const $ = cheerio.load(r.data);
    console.log($('title').text());
    
    // Tentar achar os links das vagas
    $('a').each((i, el) => {
        const href = $(el).attr('href');
        if (href && href.includes('vaga')) {
            console.log(href, $(el).text().trim().replace(/\s+/g, ' ').substring(0, 50));
        }
    });
  } catch(e) {
    console.error(e.message);
  }
}
test();
