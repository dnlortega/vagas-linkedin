const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  try {
    const r = await axios.get('https://www.trabalhabrasil.com.br/vagas-empregos-em-bauru-sp/tecnologia-da-informacao');
    const $ = cheerio.load(r.data);
    
    $('.job-vacancy').each((i, el) => {
        const titulo = $(el).find('.job-vacancy-title, h2, h3').text().trim();
        const empresa = $(el).find('.job-vacancy-company, .company').text().trim() || 'N/A';
        const href = $(el).attr('href') || $(el).find('a').attr('href');
        
        if (titulo && href) {
            console.log(titulo, empresa, href);
        }
    });
    console.log("Vagas:", $('.job-vacancy').length);
    console.log("Vagas(a):", $('a[href*="/vagas-empregos"]').length);
  } catch(e) {
    console.error(e.message);
  }
}
test();
