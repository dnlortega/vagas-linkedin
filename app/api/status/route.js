import { NextResponse } from 'next/server';

export async function GET() {
  const start = Date.now();
  try {
    const url = 'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=teste&location=SP&start=0&count=1';
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9',
        'Accept': 'text/html,*/*;q=0.8'
      },
      next: { revalidate: 0 }
    });

    const ms = Date.now() - start;

    if (resp.status === 200) {
      return NextResponse.json({ status: 'ON', tempo: ms, statusCode: 200 });
    } else {
      return NextResponse.json({ status: 'OFF', tempo: ms, erro: `Status HTTP ${resp.status}`, statusCode: resp.status });
    }
  } catch (error) {
    const ms = Date.now() - start;
    return NextResponse.json({ status: 'OFF', tempo: ms, erro: error.message, statusCode: 500 });
  }
}
