// Tela de abertura animada — Criado por Daniel Ortega Pereira
// https://github.com/dnlortega/vagas-linkedin

'use client';

import { useEffect, useState } from 'react';

export default function SplashScreen() {
  const [phase, setPhase] = useState(null);

  useEffect(() => {
    if (typeof sessionStorage === 'undefined') return;
    if (sessionStorage.getItem('splashDone')) { setPhase('done'); return; }
    sessionStorage.setItem('splashDone', '1');
    setPhase('draw');
    const t1 = setTimeout(() => setPhase('text'),  950);
    const t2 = setTimeout(() => setPhase('exit'), 1850);
    const t3 = setTimeout(() => setPhase('done'), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  if (!phase || phase === 'done') return null;

  return (
    <div className={`splash-overlay${phase === 'exit' ? ' splash-exit' : ''}`} aria-hidden="true">
      <div className="splash-content">

        {/* Logo animado <V/> */}
        <svg className="splash-logo" width="104" height="104" viewBox="0 0 104 104" fill="none">
          {/* < */}
          <path pathLength="100" d="M25 34 L12 52 L25 70"
            stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"
            className="sp-s1"/>
          {/* V */}
          <path pathLength="100" d="M36 29 L52 75 L68 29"
            stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"
            className="sp-s2"/>
          {/* / */}
          <path pathLength="100" d="M75 75 L85 29"
            stroke="white" strokeWidth="4.5" strokeLinecap="round"
            className="sp-s3"/>
          {/* > */}
          <path pathLength="100" d="M79 34 L92 52 L79 70"
            stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"
            className="sp-s4"/>
        </svg>

        <div className={`splash-wordmark${phase !== 'draw' ? ' splash-wordmark-in' : ''}`}>
          <span className="splash-title">Vagas</span>
          <span className="splash-city">Bauru</span>
        </div>
      </div>
    </div>
  );
}
